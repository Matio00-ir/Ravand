import { cache } from "react";
import type { PoolClient } from "pg";
import { ensureSchema, getPool } from "@/lib/db";
import { seedCatalog } from "@/lib/sandbox/seed-data";

/**
 * The sandbox behind every private demo: a small, real business dataset
 * (customers, products, invoices, payments, stock moves) owned by one
 * demo lead. Every query here takes the lead id and scopes to it — that
 * scoping is the whole isolation model, so nothing in this module ever
 * reads or writes a row without `lead_id = $1`.
 *
 * Money is stored as whole Toman in BIGINT columns; pg returns those as
 * strings, so every read goes through `n()`.
 */

export const VAT_RATE = 0.1;

/** Caps per sandbox so one demo can't grow without bound. */
export const LIMITS = { customers: 300, products: 300, invoices: 1000, lines: 20 } as const;

export type InvoiceStatus = "issued" | "partial" | "paid" | "cancelled";
export type PaymentMethod = "cash" | "card" | "transfer" | "cheque";
export type StockMoveKind = "opening" | "sale" | "receipt" | "adjust" | "cancel";

export type Customer = {
  id: number;
  name: string;
  phone: string | null;
  city: string | null;
  createdAt: Date;
};

export type Product = {
  id: number;
  sku: string;
  name: string;
  unit: string;
  price: number;
  trackStock: boolean;
  stock: number;
  reorderPoint: number;
};

export type Invoice = {
  id: number;
  number: number;
  customerId: number;
  customerName: string;
  status: InvoiceStatus;
  issuedAt: Date;
  dueAt: Date;
  subtotal: number;
  tax: number;
  total: number;
  paid: number;
  note: string | null;
};

export type InvoiceLine = {
  id: number;
  productId: number;
  productName: string;
  unit: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
};

export type Payment = {
  id: number;
  invoiceId: number;
  invoiceNumber: number;
  customerName: string;
  amount: number;
  method: PaymentMethod;
  paidAt: Date;
};

export type StockMove = {
  id: number;
  productId: number;
  productName: string;
  unit: string;
  qty: number;
  kind: StockMoveKind;
  ref: string | null;
  createdAt: Date;
};

const n = (v: string | number | null | undefined) => Number(v ?? 0);

export function balanceOf(inv: Pick<Invoice, "status" | "total" | "paid">): number {
  return inv.status === "cancelled" ? 0 : Math.max(0, inv.total - inv.paid);
}

export function isOverdue(inv: Pick<Invoice, "status" | "dueAt">, now = Date.now()): boolean {
  return (inv.status === "issued" || inv.status === "partial") && inv.dueAt.getTime() < now;
}

/* ------------------------------------------------------------------ */
/* transactions                                                        */
/* ------------------------------------------------------------------ */

/**
 * Runs `fn` in a transaction holding a row lock on the lead, so writes to
 * one sandbox are serialized (invoice numbering, stock checks) while
 * different sandboxes never wait on each other.
 */
export async function withLeadTx<T>(leadId: string, fn: (db: PoolClient) => Promise<T>): Promise<T> {
  await ensureSchema();
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT id FROM demo_leads WHERE id = $1 FOR UPDATE", [leadId]);
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
}

/* ------------------------------------------------------------------ */
/* seeding                                                             */
/* ------------------------------------------------------------------ */

/** Small deterministic PRNG so a sandbox's seed is stable per lead. */
function rng(seedText: string) {
  let h = 2166136261;
  for (let i = 0; i < seedText.length; i++) {
    h ^= seedText.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let state = h >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DAY = 24 * 60 * 60 * 1000;

/** Rounds to the nearest 10,000 Toman, the way real invoices are priced. */
const roundToman = (v: number) => Math.round(v / 10_000) * 10_000;

async function seedInto(db: PoolClient, leadId: string, businessType: string, locale: string) {
  const { products, customers } = seedCatalog(businessType, locale);
  const random = rng(leadId);
  const pick = <T,>(arr: T[]) => arr[Math.floor(random() * arr.length)];
  const now = Date.now();

  const customerIds: number[] = [];
  for (const c of customers) {
    const res = await db.query<{ id: string }>(
      `INSERT INTO sb_customers (lead_id, name, phone, city, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [leadId, c.name, c.phone, c.city, new Date(now - 200 * DAY)]
    );
    customerIds.push(n(res.rows[0].id));
  }

  const productRows: { id: number; price: number; track: boolean; sold: number; seed: (typeof products)[number] }[] = [];
  for (const p of products) {
    const res = await db.query<{ id: string }>(
      `INSERT INTO sb_products (lead_id, sku, name, unit, price, track_stock, stock, reorder_point, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [leadId, p.sku, p.name, p.unit, p.price, p.trackStock !== false, p.stock, p.reorder, new Date(now - 200 * DAY)]
    );
    productRows.push({ id: n(res.rows[0].id), price: p.price, track: p.trackStock !== false, sold: 0, seed: p });
  }

  // ~22 invoices spread over the last six months, older ones mostly
  // settled, recent ones mostly open — the shape of a real ledger.
  const COUNT = 22;
  const invoices: { daysAgo: number; lines: { product: (typeof productRows)[number]; qty: number }[] }[] = [];
  for (let i = 0; i < COUNT; i++) {
    const daysAgo = Math.max(1, Math.round(175 * (1 - i / (COUNT - 1)) + (random() * 6 - 3)));
    const lineCount = 1 + Math.floor(random() * 3);
    const chosen = new Set<number>();
    const lines: (typeof invoices)[number]["lines"] = [];
    for (let l = 0; l < lineCount; l++) {
      const product = pick(productRows);
      if (chosen.has(product.id)) continue;
      chosen.add(product.id);
      const scale = product.price > 10_000_000 ? 3 : product.price > 3_000_000 ? 12 : 40;
      const qty = 1 + Math.floor(random() * scale);
      lines.push({ product, qty });
      product.sold += product.track ? qty : 0;
    }
    invoices.push({ daysAgo, lines });
  }

  // Opening stock = today's stock + everything the seeded invoices sold,
  // so the move history adds up exactly to the stock on hand.
  for (const p of productRows) {
    if (!p.track) continue;
    await db.query(
      `INSERT INTO sb_stock_moves (lead_id, product_id, qty, kind, ref, created_at) VALUES ($1, $2, $3, 'opening', NULL, $4)`,
      [leadId, p.id, p.seed.stock + p.sold, new Date(now - 190 * DAY)]
    );
  }

  let number = 1000;
  for (const inv of invoices) {
    number += 1;
    const issuedAt = new Date(now - inv.daysAgo * DAY);
    const dueAt = new Date(issuedAt.getTime() + 30 * DAY);
    const subtotal = inv.lines.reduce((s, l) => s + l.qty * l.product.price, 0);
    const tax = roundToman(subtotal * VAT_RATE);
    const total = subtotal + tax;

    const r = random();
    let paid = 0;
    if (inv.daysAgo > 45) paid = r < 0.85 ? total : roundToman(total * 0.5);
    else if (inv.daysAgo > 15) paid = r < 0.5 ? total : r < 0.75 ? roundToman(total * 0.4) : 0;
    else paid = r < 0.25 ? total : 0;
    const status: InvoiceStatus = paid >= total ? "paid" : paid > 0 ? "partial" : "issued";

    const res = await db.query<{ id: string }>(
      `INSERT INTO sb_invoices (lead_id, number, customer_id, status, issued_at, due_at, subtotal, tax, total, paid, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $5) RETURNING id`,
      [leadId, number, pick(customerIds), status, issuedAt, dueAt, subtotal, tax, total, paid]
    );
    const invoiceId = n(res.rows[0].id);

    for (const line of inv.lines) {
      await db.query(
        `INSERT INTO sb_invoice_lines (invoice_id, product_id, qty, unit_price, line_total) VALUES ($1, $2, $3, $4, $5)`,
        [invoiceId, line.product.id, line.qty, line.product.price, line.qty * line.product.price]
      );
      if (line.product.track) {
        await db.query(
          `INSERT INTO sb_stock_moves (lead_id, product_id, qty, kind, ref, created_at) VALUES ($1, $2, $3, 'sale', $4, $5)`,
          [leadId, line.product.id, -line.qty, String(number), issuedAt]
        );
      }
    }

    if (paid > 0) {
      const paidAt = new Date(Math.min(now - DAY / 2, issuedAt.getTime() + (3 + Math.floor(random() * 25)) * DAY));
      await db.query(
        `INSERT INTO sb_payments (lead_id, invoice_id, amount, method, paid_at) VALUES ($1, $2, $3, $4, $5)`,
        [leadId, invoiceId, paid, pick(["transfer", "transfer", "card", "cheque", "cash"]), paidAt]
      );
    }
  }

  await db.query(`UPDATE demo_leads SET seeded_at = now() WHERE id = $1`, [leadId]);
}

/** Seeds the sandbox on first visit. Safe to call on every request. */
export async function ensureSeeded(leadId: string, businessType: string, locale: string): Promise<void> {
  await ensureSchema();
  const check = await getPool().query<{ seeded_at: Date | null }>(
    `SELECT seeded_at FROM demo_leads WHERE id = $1`,
    [leadId]
  );
  if (check.rows[0]?.seeded_at) return;

  await withLeadTx(leadId, async (db) => {
    // Re-check under the lock: two first requests can race here.
    const again = await db.query<{ seeded_at: Date | null }>(`SELECT seeded_at FROM demo_leads WHERE id = $1`, [leadId]);
    if (again.rows[0]?.seeded_at) return;
    await seedInto(db, leadId, businessType, locale);
  });
}

/** Wipes the sandbox back to a fresh seed — the "start over" button. */
export async function resetSandbox(leadId: string, businessType: string, locale: string): Promise<void> {
  await withLeadTx(leadId, async (db) => {
    await db.query(`DELETE FROM sb_invoices WHERE lead_id = $1`, [leadId]);
    await db.query(`DELETE FROM sb_stock_moves WHERE lead_id = $1`, [leadId]);
    await db.query(`DELETE FROM sb_products WHERE lead_id = $1`, [leadId]);
    await db.query(`DELETE FROM sb_customers WHERE lead_id = $1`, [leadId]);
    await seedInto(db, leadId, businessType, locale);
  });
}

export async function logEvent(leadId: string, kind: string): Promise<void> {
  try {
    await getPool().query(`INSERT INTO demo_events (lead_id, kind) VALUES ($1, $2)`, [leadId, kind]);
  } catch (err) {
    console.error("[sandbox] logEvent failed", err);
  }
}

/* ------------------------------------------------------------------ */
/* reads                                                               */
/* ------------------------------------------------------------------ */

type InvoiceRow = {
  id: string;
  number: number;
  customer_id: string;
  customer_name: string;
  status: InvoiceStatus;
  issued_at: Date;
  due_at: Date;
  subtotal: string;
  tax: string;
  total: string;
  paid: string;
  note: string | null;
};

const invoiceFromRow = (r: InvoiceRow): Invoice => ({
  id: n(r.id),
  number: r.number,
  customerId: n(r.customer_id),
  customerName: r.customer_name,
  status: r.status,
  issuedAt: r.issued_at,
  dueAt: r.due_at,
  subtotal: n(r.subtotal),
  tax: n(r.tax),
  total: n(r.total),
  paid: n(r.paid),
  note: r.note,
});

type ProductRow = {
  id: string;
  sku: string;
  name: string;
  unit: string;
  price: string;
  track_stock: boolean;
  stock: number;
  reorder_point: number;
};

const productFromRow = (r: ProductRow): Product => ({
  id: n(r.id),
  sku: r.sku,
  name: r.name,
  unit: r.unit,
  price: n(r.price),
  trackStock: r.track_stock,
  stock: r.stock,
  reorderPoint: r.reorder_point,
});

export type Snapshot = {
  customers: Customer[];
  products: Product[];
  invoices: Invoice[];
  payments: Payment[];
};

/**
 * The whole sandbox in four queries. A sandbox is capped at a few hundred
 * rows (see LIMITS), so every dashboard figure is derived from this in
 * memory instead of a bespoke aggregate query per tile. Cached per
 * request so the shell and the page share one load.
 */
export const loadSnapshot = cache(async (leadId: string): Promise<Snapshot> => {
  await ensureSchema();
  const pool = getPool();
  const [customers, products, invoices, payments] = await Promise.all([
    pool.query<{ id: string; name: string; phone: string | null; city: string | null; created_at: Date }>(
      `SELECT id, name, phone, city, created_at FROM sb_customers WHERE lead_id = $1 ORDER BY name`,
      [leadId]
    ),
    pool.query<ProductRow>(`SELECT * FROM sb_products WHERE lead_id = $1 ORDER BY sku`, [leadId]),
    pool.query<InvoiceRow>(
      `SELECT i.*, c.name AS customer_name FROM sb_invoices i
       JOIN sb_customers c ON c.id = i.customer_id
       WHERE i.lead_id = $1 ORDER BY i.issued_at DESC, i.number DESC`,
      [leadId]
    ),
    pool.query<{
      id: string;
      invoice_id: string;
      number: number;
      customer_name: string;
      amount: string;
      method: PaymentMethod;
      paid_at: Date;
    }>(
      `SELECT p.id, p.invoice_id, i.number, c.name AS customer_name, p.amount, p.method, p.paid_at
       FROM sb_payments p
       JOIN sb_invoices i ON i.id = p.invoice_id
       JOIN sb_customers c ON c.id = i.customer_id
       WHERE p.lead_id = $1 ORDER BY p.paid_at DESC, p.id DESC`,
      [leadId]
    ),
  ]);

  return {
    customers: customers.rows.map((r) => ({
      id: n(r.id),
      name: r.name,
      phone: r.phone,
      city: r.city,
      createdAt: r.created_at,
    })),
    products: products.rows.map(productFromRow),
    invoices: invoices.rows.map(invoiceFromRow),
    payments: payments.rows.map((r) => ({
      id: n(r.id),
      invoiceId: n(r.invoice_id),
      invoiceNumber: r.number,
      customerName: r.customer_name,
      amount: n(r.amount),
      method: r.method,
      paidAt: r.paid_at,
    })),
  };
});

export async function getInvoiceDetail(
  leadId: string,
  invoiceId: number
): Promise<{ invoice: Invoice; lines: InvoiceLine[]; payments: Payment[]; customer: Customer } | null> {
  await ensureSchema();
  const pool = getPool();
  const inv = await pool.query<InvoiceRow>(
    `SELECT i.*, c.name AS customer_name FROM sb_invoices i
     JOIN sb_customers c ON c.id = i.customer_id
     WHERE i.lead_id = $1 AND i.id = $2`,
    [leadId, invoiceId]
  );
  if (inv.rows.length === 0) return null;
  const invoice = invoiceFromRow(inv.rows[0]);

  const [lines, payments, customer] = await Promise.all([
    pool.query<{ id: string; product_id: string; name: string; unit: string; qty: number; unit_price: string; line_total: string }>(
      `SELECT l.id, l.product_id, p.name, p.unit, l.qty, l.unit_price, l.line_total
       FROM sb_invoice_lines l JOIN sb_products p ON p.id = l.product_id
       WHERE l.invoice_id = $1 ORDER BY l.id`,
      [invoiceId]
    ),
    pool.query<{ id: string; amount: string; method: PaymentMethod; paid_at: Date }>(
      `SELECT id, amount, method, paid_at FROM sb_payments WHERE lead_id = $1 AND invoice_id = $2 ORDER BY paid_at, id`,
      [leadId, invoiceId]
    ),
    pool.query<{ id: string; name: string; phone: string | null; city: string | null; created_at: Date }>(
      `SELECT id, name, phone, city, created_at FROM sb_customers WHERE lead_id = $1 AND id = $2`,
      [leadId, invoice.customerId]
    ),
  ]);

  return {
    invoice,
    lines: lines.rows.map((r) => ({
      id: n(r.id),
      productId: n(r.product_id),
      productName: r.name,
      unit: r.unit,
      qty: r.qty,
      unitPrice: n(r.unit_price),
      lineTotal: n(r.line_total),
    })),
    payments: payments.rows.map((r) => ({
      id: n(r.id),
      invoiceId,
      invoiceNumber: invoice.number,
      customerName: invoice.customerName,
      amount: n(r.amount),
      method: r.method,
      paidAt: r.paid_at,
    })),
    customer: {
      id: n(customer.rows[0].id),
      name: customer.rows[0].name,
      phone: customer.rows[0].phone,
      city: customer.rows[0].city,
      createdAt: customer.rows[0].created_at,
    },
  };
}

export async function listStockMoves(leadId: string, productId?: number, limit = 30): Promise<StockMove[]> {
  await ensureSchema();
  const params: (string | number)[] = [leadId, limit];
  let filter = "";
  if (productId !== undefined) {
    params.push(productId);
    filter = "AND m.product_id = $3";
  }
  const res = await getPool().query<{
    id: string;
    product_id: string;
    name: string;
    unit: string;
    qty: number;
    kind: StockMoveKind;
    ref: string | null;
    created_at: Date;
  }>(
    `SELECT m.id, m.product_id, p.name, p.unit, m.qty, m.kind, m.ref, m.created_at
     FROM sb_stock_moves m JOIN sb_products p ON p.id = m.product_id
     WHERE m.lead_id = $1 ${filter}
     ORDER BY m.created_at DESC, m.id DESC LIMIT $2`,
    params
  );
  return res.rows.map((r) => ({
    id: n(r.id),
    productId: n(r.product_id),
    productName: r.name,
    unit: r.unit,
    qty: r.qty,
    kind: r.kind,
    ref: r.ref,
    createdAt: r.created_at,
  }));
}

/* ------------------------------------------------------------------ */
/* writes                                                              */
/* ------------------------------------------------------------------ */

/** A business-rule failure the UI shows as a message, not a crash. */
export class SandboxError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

async function countRows(db: PoolClient, table: string, leadId: string): Promise<number> {
  const res = await db.query<{ c: string }>(`SELECT count(*) AS c FROM ${table} WHERE lead_id = $1`, [leadId]);
  return n(res.rows[0].c);
}

export type CustomerInput = { name: string; phone: string; city: string };

export async function createCustomer(leadId: string, input: CustomerInput): Promise<number> {
  return withLeadTx(leadId, async (db) => {
    if ((await countRows(db, "sb_customers", leadId)) >= LIMITS.customers) throw new SandboxError("limit");
    const res = await db.query<{ id: string }>(
      `INSERT INTO sb_customers (lead_id, name, phone, city) VALUES ($1, $2, $3, $4) RETURNING id`,
      [leadId, input.name, input.phone || null, input.city || null]
    );
    return n(res.rows[0].id);
  });
}

export async function updateCustomer(leadId: string, id: number, input: CustomerInput): Promise<void> {
  const res = await getPool().query(
    `UPDATE sb_customers SET name = $3, phone = $4, city = $5 WHERE lead_id = $1 AND id = $2`,
    [leadId, id, input.name, input.phone || null, input.city || null]
  );
  if (res.rowCount === 0) throw new SandboxError("notFound");
}

export async function deleteCustomer(leadId: string, id: number): Promise<void> {
  await withLeadTx(leadId, async (db) => {
    const used = await db.query(`SELECT 1 FROM sb_invoices WHERE lead_id = $1 AND customer_id = $2 LIMIT 1`, [leadId, id]);
    if (used.rows.length > 0) throw new SandboxError("customerHasInvoices");
    const res = await db.query(`DELETE FROM sb_customers WHERE lead_id = $1 AND id = $2`, [leadId, id]);
    if (res.rowCount === 0) throw new SandboxError("notFound");
  });
}

export type ProductInput = {
  sku: string;
  name: string;
  unit: string;
  price: number;
  trackStock: boolean;
  reorderPoint: number;
};

export async function createProduct(leadId: string, input: ProductInput, openingStock: number): Promise<number> {
  return withLeadTx(leadId, async (db) => {
    if ((await countRows(db, "sb_products", leadId)) >= LIMITS.products) throw new SandboxError("limit");
    const dup = await db.query(`SELECT 1 FROM sb_products WHERE lead_id = $1 AND sku = $2`, [leadId, input.sku]);
    if (dup.rows.length > 0) throw new SandboxError("duplicateSku");
    const stock = input.trackStock ? openingStock : 0;
    const res = await db.query<{ id: string }>(
      `INSERT INTO sb_products (lead_id, sku, name, unit, price, track_stock, stock, reorder_point)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [leadId, input.sku, input.name, input.unit, input.price, input.trackStock, stock, input.reorderPoint]
    );
    const id = n(res.rows[0].id);
    if (input.trackStock && stock > 0) {
      await db.query(
        `INSERT INTO sb_stock_moves (lead_id, product_id, qty, kind) VALUES ($1, $2, $3, 'opening')`,
        [leadId, id, stock]
      );
    }
    return id;
  });
}

export async function updateProduct(leadId: string, id: number, input: ProductInput): Promise<void> {
  await withLeadTx(leadId, async (db) => {
    const dup = await db.query(`SELECT 1 FROM sb_products WHERE lead_id = $1 AND sku = $2 AND id <> $3`, [
      leadId,
      input.sku,
      id,
    ]);
    if (dup.rows.length > 0) throw new SandboxError("duplicateSku");
    const res = await db.query(
      `UPDATE sb_products SET sku = $3, name = $4, unit = $5, price = $6, reorder_point = $7 WHERE lead_id = $1 AND id = $2`,
      [leadId, id, input.sku, input.name, input.unit, input.price, input.reorderPoint]
    );
    if (res.rowCount === 0) throw new SandboxError("notFound");
  });
}

export async function deleteProduct(leadId: string, id: number): Promise<void> {
  await withLeadTx(leadId, async (db) => {
    const used = await db.query(
      `SELECT 1 FROM sb_invoice_lines l JOIN sb_invoices i ON i.id = l.invoice_id
       WHERE i.lead_id = $1 AND l.product_id = $2 LIMIT 1`,
      [leadId, id]
    );
    if (used.rows.length > 0) throw new SandboxError("productHasInvoices");
    const res = await db.query(`DELETE FROM sb_products WHERE lead_id = $1 AND id = $2`, [leadId, id]);
    if (res.rowCount === 0) throw new SandboxError("notFound");
  });
}

/**
 * Receipt (goods in, qty > 0) or adjustment (a count correction, either
 * sign). Stock can never go below zero.
 */
export async function moveStock(
  leadId: string,
  productId: number,
  kind: "receipt" | "adjust",
  qty: number,
  ref: string
): Promise<void> {
  await withLeadTx(leadId, async (db) => {
    const res = await db.query<{ stock: number; track_stock: boolean }>(
      `SELECT stock, track_stock FROM sb_products WHERE lead_id = $1 AND id = $2`,
      [leadId, productId]
    );
    const row = res.rows[0];
    if (!row) throw new SandboxError("notFound");
    if (!row.track_stock) throw new SandboxError("notStocked");
    if (row.stock + qty < 0) throw new SandboxError("negativeStock");
    await db.query(`UPDATE sb_products SET stock = stock + $3 WHERE lead_id = $1 AND id = $2`, [leadId, productId, qty]);
    await db.query(
      `INSERT INTO sb_stock_moves (lead_id, product_id, qty, kind, ref) VALUES ($1, $2, $3, $4, $5)`,
      [leadId, productId, qty, kind, ref || null]
    );
  });
}

export type InvoiceInput = {
  customerId: number;
  dueDays: number;
  vat: boolean;
  note: string;
  lines: { productId: number; qty: number; unitPrice: number }[];
};

/**
 * Issues an invoice the way a real ERP does: numbered in sequence,
 * priced, VAT added, and stock deducted for every stocked item — refused
 * outright if any line would take stock below zero.
 */
export async function createInvoice(leadId: string, input: InvoiceInput): Promise<number> {
  return withLeadTx(leadId, async (db) => {
    if ((await countRows(db, "sb_invoices", leadId)) >= LIMITS.invoices) throw new SandboxError("limit");

    const customer = await db.query(`SELECT 1 FROM sb_customers WHERE lead_id = $1 AND id = $2`, [leadId, input.customerId]);
    if (customer.rows.length === 0) throw new SandboxError("notFound");

    const ids = input.lines.map((l) => l.productId);
    const prodRes = await db.query<ProductRow>(`SELECT * FROM sb_products WHERE lead_id = $1 AND id = ANY($2::bigint[])`, [
      leadId,
      ids,
    ]);
    const products = new Map(prodRes.rows.map((r) => [n(r.id), productFromRow(r)]));

    const needed = new Map<number, number>();
    for (const line of input.lines) {
      const p = products.get(line.productId);
      if (!p) throw new SandboxError("notFound");
      if (p.trackStock) needed.set(p.id, (needed.get(p.id) ?? 0) + line.qty);
    }
    for (const [pid, qty] of needed) {
      if (products.get(pid)!.stock < qty) throw new SandboxError(`insufficientStock:${products.get(pid)!.name}`);
    }

    const subtotal = input.lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
    const tax = input.vat ? roundToman(subtotal * VAT_RATE) : 0;
    const total = subtotal + tax;

    const numRes = await db.query<{ next: number }>(
      `SELECT COALESCE(MAX(number), 1000) + 1 AS next FROM sb_invoices WHERE lead_id = $1`,
      [leadId]
    );
    const number = numRes.rows[0].next;
    const issuedAt = new Date();
    const dueAt = new Date(issuedAt.getTime() + input.dueDays * DAY);

    const inv = await db.query<{ id: string }>(
      `INSERT INTO sb_invoices (lead_id, number, customer_id, status, issued_at, due_at, subtotal, tax, total, paid, note)
       VALUES ($1, $2, $3, 'issued', $4, $5, $6, $7, $8, 0, $9) RETURNING id`,
      [leadId, number, input.customerId, issuedAt, dueAt, subtotal, tax, total, input.note || null]
    );
    const invoiceId = n(inv.rows[0].id);

    for (const line of input.lines) {
      await db.query(
        `INSERT INTO sb_invoice_lines (invoice_id, product_id, qty, unit_price, line_total) VALUES ($1, $2, $3, $4, $5)`,
        [invoiceId, line.productId, line.qty, line.unitPrice, line.qty * line.unitPrice]
      );
      if (products.get(line.productId)!.trackStock) {
        await db.query(`UPDATE sb_products SET stock = stock - $3 WHERE lead_id = $1 AND id = $2`, [
          leadId,
          line.productId,
          line.qty,
        ]);
        await db.query(
          `INSERT INTO sb_stock_moves (lead_id, product_id, qty, kind, ref) VALUES ($1, $2, $3, 'sale', $4)`,
          [leadId, line.productId, -line.qty, String(number)]
        );
      }
    }
    return invoiceId;
  });
}

export async function recordPayment(
  leadId: string,
  invoiceId: number,
  amount: number,
  method: PaymentMethod
): Promise<void> {
  await withLeadTx(leadId, async (db) => {
    const res = await db.query<{ status: InvoiceStatus; total: string; paid: string }>(
      `SELECT status, total, paid FROM sb_invoices WHERE lead_id = $1 AND id = $2`,
      [leadId, invoiceId]
    );
    const inv = res.rows[0];
    if (!inv) throw new SandboxError("notFound");
    if (inv.status === "cancelled" || inv.status === "paid") throw new SandboxError("notPayable");
    const remaining = n(inv.total) - n(inv.paid);
    if (amount > remaining) throw new SandboxError("overpay");

    const paid = n(inv.paid) + amount;
    const status: InvoiceStatus = paid >= n(inv.total) ? "paid" : "partial";
    await db.query(`UPDATE sb_invoices SET paid = $3, status = $4 WHERE lead_id = $1 AND id = $2`, [
      leadId,
      invoiceId,
      paid,
      status,
    ]);
    await db.query(
      `INSERT INTO sb_payments (lead_id, invoice_id, amount, method, paid_at) VALUES ($1, $2, $3, $4, now())`,
      [leadId, invoiceId, amount, method]
    );
  });
}

/** Cancels an unpaid invoice and returns its items to stock. */
export async function cancelInvoice(leadId: string, invoiceId: number): Promise<void> {
  await withLeadTx(leadId, async (db) => {
    const res = await db.query<{ status: InvoiceStatus; number: number; paid: string }>(
      `SELECT status, number, paid FROM sb_invoices WHERE lead_id = $1 AND id = $2`,
      [leadId, invoiceId]
    );
    const inv = res.rows[0];
    if (!inv) throw new SandboxError("notFound");
    if (inv.status === "cancelled") return;
    if (n(inv.paid) > 0) throw new SandboxError("hasPayments");

    const lines = await db.query<{ product_id: string; qty: number; track_stock: boolean }>(
      `SELECT l.product_id, l.qty, p.track_stock FROM sb_invoice_lines l
       JOIN sb_products p ON p.id = l.product_id WHERE l.invoice_id = $1`,
      [invoiceId]
    );
    for (const line of lines.rows) {
      if (!line.track_stock) continue;
      await db.query(`UPDATE sb_products SET stock = stock + $3 WHERE lead_id = $1 AND id = $2`, [
        leadId,
        line.product_id,
        line.qty,
      ]);
      await db.query(
        `INSERT INTO sb_stock_moves (lead_id, product_id, qty, kind, ref) VALUES ($1, $2, $3, 'cancel', $4)`,
        [leadId, line.product_id, line.qty, String(inv.number)]
      );
    }
    await db.query(`UPDATE sb_invoices SET status = 'cancelled' WHERE lead_id = $1 AND id = $2`, [leadId, invoiceId]);
  });
}
