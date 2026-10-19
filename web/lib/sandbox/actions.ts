"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { getLocale } from "next-intl/server";
import { getLeadByToken, isBlocked, isExpired, type DemoLead } from "@/lib/demo-leads";
import {
  LIMITS,
  SandboxError,
  cancelInvoice,
  createCustomer,
  createInvoice,
  createProduct,
  deleteCustomer,
  deleteProduct,
  logEvent,
  moveStock,
  recordPayment,
  resetSandbox,
  updateCustomer,
  updateProduct,
  type PaymentMethod,
} from "@/lib/sandbox/store";

/**
 * Every mutation a customer can make in their private demo. Server
 * Actions are reachable by direct POST, so each one re-resolves the token
 * to its lead and refuses expired/disabled demos itself — the layout's
 * gate only protects rendering, not these endpoints. The lead id is never
 * taken from the form; it always comes from the token.
 */

export type ActionState = {
  status: "idle" | "success" | "error";
  /** A key under sandbox.errors — resolved to copy by the form. */
  error?: string;
  /** Extra value interpolated into the error, e.g. a product name. */
  detail?: string;
  fields?: Record<string, string>;
};

const FAIL = (error: string, detail?: string): ActionState => ({ status: "error", error, detail });

async function requireLead(token: string): Promise<DemoLead> {
  const lead = await getLeadByToken(token);
  if (!lead || isBlocked(lead) || isExpired(lead)) throw new SandboxError("expired");
  return lead;
}

async function basePath(token: string) {
  const locale = await getLocale();
  return locale === "en" ? `/en/demo/${token}` : `/demo/${token}`;
}

/** Maps a thrown error to form state; rethrows Next's redirect signal. */
function toState(err: unknown): ActionState {
  if (err instanceof SandboxError) {
    const [code, detail] = err.code.split(":");
    return FAIL(code, detail);
  }
  console.error("[sandbox] action failed", err);
  return FAIL("server");
}

/* ---------------- field parsing ---------------- */

const PERSIAN = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC = "٠١٢٣٤٥٦٧٨٩";

/** Accepts Persian/Arabic digits and thousands separators, as people type them. */
function toLatinDigits(s: string): string {
  return s
    .replace(/[۰-۹]/g, (d) => String(PERSIAN.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(ARABIC.indexOf(d)))
    .replace(/[,٬،\s]/g, "");
}

function text(fd: FormData, key: string, max: number): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "";
}

function int(fd: FormData, key: string): number | null {
  const v = fd.get(key);
  if (typeof v !== "string") return null;
  const s = toLatinDigits(v.trim());
  if (!/^-?\d{1,13}$/.test(s)) return null;
  return Number(s);
}

/* ---------------- customers ---------------- */

function readCustomer(fd: FormData) {
  const fields: Record<string, string> = {};
  const name = text(fd, "name", 120);
  const phone = toLatinDigits(text(fd, "phone", 30)).replace(/[^0-9+\-]/g, "");
  const city = text(fd, "city", 60);
  if (!name) fields.name = "required";
  return { input: { name, phone, city }, fields };
}

export async function createCustomerAction(token: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const lead = await requireLead(token);
    const { input, fields } = readCustomer(fd);
    if (Object.keys(fields).length) return { status: "error", error: "fields", fields };
    await createCustomer(lead.id, input);
    await logEvent(lead.id, "customer.create");
    refresh();
    return { status: "success" };
  } catch (err) {
    return toState(err);
  }
}

export async function updateCustomerAction(
  token: string,
  id: number,
  _prev: ActionState,
  fd: FormData
): Promise<ActionState> {
  try {
    const lead = await requireLead(token);
    const { input, fields } = readCustomer(fd);
    if (Object.keys(fields).length) return { status: "error", error: "fields", fields };
    await updateCustomer(lead.id, id, input);
    await logEvent(lead.id, "customer.update");
    refresh();
    return { status: "success" };
  } catch (err) {
    return toState(err);
  }
}

export async function deleteCustomerAction(token: string, id: number): Promise<ActionState> {
  let target: string;
  try {
    const lead = await requireLead(token);
    await deleteCustomer(lead.id, id);
    await logEvent(lead.id, "customer.delete");
    target = `${await basePath(token)}/crm`;
  } catch (err) {
    return toState(err);
  }
  redirect(target);
}

/* ---------------- products & stock ---------------- */

function readProduct(fd: FormData) {
  const fields: Record<string, string> = {};
  const sku = text(fd, "sku", 30).toUpperCase();
  const name = text(fd, "name", 120);
  const unit = text(fd, "unit", 30);
  const price = int(fd, "price");
  const reorderPoint = int(fd, "reorderPoint") ?? 0;
  const trackStock = fd.get("trackStock") === "on";
  if (!sku) fields.sku = "required";
  if (!name) fields.name = "required";
  if (!unit) fields.unit = "required";
  if (price === null || price < 0 || price > 100_000_000_000) fields.price = "invalid";
  if (reorderPoint < 0 || reorderPoint > 1_000_000) fields.reorderPoint = "invalid";
  return { input: { sku, name, unit, price: price ?? 0, trackStock, reorderPoint }, fields };
}

export async function createProductAction(token: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const lead = await requireLead(token);
    const { input, fields } = readProduct(fd);
    const opening = int(fd, "openingStock") ?? 0;
    if (opening < 0 || opening > 1_000_000) fields.openingStock = "invalid";
    if (Object.keys(fields).length) return { status: "error", error: "fields", fields };
    await createProduct(lead.id, input, opening);
    await logEvent(lead.id, "product.create");
    refresh();
    return { status: "success" };
  } catch (err) {
    return toState(err);
  }
}

export async function updateProductAction(
  token: string,
  id: number,
  _prev: ActionState,
  fd: FormData
): Promise<ActionState> {
  try {
    const lead = await requireLead(token);
    const { input, fields } = readProduct(fd);
    if (Object.keys(fields).length) return { status: "error", error: "fields", fields };
    await updateProduct(lead.id, id, input);
    await logEvent(lead.id, "product.update");
    refresh();
    return { status: "success" };
  } catch (err) {
    return toState(err);
  }
}

export async function deleteProductAction(token: string, id: number): Promise<ActionState> {
  let target: string;
  try {
    const lead = await requireLead(token);
    await deleteProduct(lead.id, id);
    await logEvent(lead.id, "product.delete");
    target = `${await basePath(token)}/inventory`;
  } catch (err) {
    return toState(err);
  }
  redirect(target);
}

export async function moveStockAction(
  token: string,
  productId: number,
  _prev: ActionState,
  fd: FormData
): Promise<ActionState> {
  try {
    const lead = await requireLead(token);
    const kind = fd.get("kind") === "adjust" ? "adjust" : "receipt";
    const qty = int(fd, "qty");
    if (qty === null || qty === 0 || Math.abs(qty) > 1_000_000 || (kind === "receipt" && qty < 0)) {
      return { status: "error", error: "fields", fields: { qty: "invalid" } };
    }
    await moveStock(lead.id, productId, kind, qty, text(fd, "ref", 60));
    await logEvent(lead.id, `stock.${kind}`);
    refresh();
    return { status: "success" };
  } catch (err) {
    return toState(err);
  }
}

/* ---------------- invoices & payments ---------------- */

const DUE_DAYS = [0, 7, 15, 30, 45, 60];
const METHODS: PaymentMethod[] = ["cash", "card", "transfer", "cheque"];

export async function createInvoiceAction(token: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  let target: string;
  try {
    const lead = await requireLead(token);
    const fields: Record<string, string> = {};

    const customerId = int(fd, "customerId");
    if (!customerId) fields.customerId = "required";
    const dueDays = int(fd, "dueDays") ?? 30;
    if (!DUE_DAYS.includes(dueDays)) fields.dueDays = "invalid";

    let lines: { productId: number; qty: number; unitPrice: number }[] = [];
    try {
      const raw = JSON.parse(String(fd.get("lines") ?? "[]"));
      if (!Array.isArray(raw)) throw new Error();
      lines = raw.map((l) => ({
        productId: Number(l.productId),
        qty: Number(l.qty),
        unitPrice: Number(l.unitPrice),
      }));
      const ok =
        lines.length > 0 &&
        lines.length <= LIMITS.lines &&
        lines.every(
          (l) =>
            Number.isSafeInteger(l.productId) &&
            Number.isSafeInteger(l.qty) &&
            l.qty > 0 &&
            l.qty <= 100_000 &&
            Number.isSafeInteger(l.unitPrice) &&
            l.unitPrice >= 0 &&
            l.unitPrice <= 100_000_000_000
        );
      if (!ok) throw new Error();
    } catch {
      fields.lines = "invalid";
    }

    if (Object.keys(fields).length) return { status: "error", error: "fields", fields };

    const id = await createInvoice(lead.id, {
      customerId: customerId!,
      dueDays,
      vat: fd.get("vat") === "on",
      note: text(fd, "note", 300),
      lines,
    });
    await logEvent(lead.id, "invoice.create");
    target = `${await basePath(token)}/sales/${id}`;
  } catch (err) {
    return toState(err);
  }
  redirect(target);
}

export async function recordPaymentAction(
  token: string,
  invoiceId: number,
  _prev: ActionState,
  fd: FormData
): Promise<ActionState> {
  try {
    const lead = await requireLead(token);
    const amount = int(fd, "amount");
    const method = String(fd.get("method") ?? "") as PaymentMethod;
    if (amount === null || amount <= 0) return { status: "error", error: "fields", fields: { amount: "invalid" } };
    if (!METHODS.includes(method)) return { status: "error", error: "fields", fields: { method: "invalid" } };
    await recordPayment(lead.id, invoiceId, amount, method);
    await logEvent(lead.id, "payment.create");
    refresh();
    return { status: "success" };
  } catch (err) {
    return toState(err);
  }
}

export async function cancelInvoiceAction(token: string, invoiceId: number): Promise<ActionState> {
  try {
    const lead = await requireLead(token);
    await cancelInvoice(lead.id, invoiceId);
    await logEvent(lead.id, "invoice.cancel");
    refresh();
    return { status: "success" };
  } catch (err) {
    return toState(err);
  }
}

/* ---------------- sandbox ---------------- */

export async function resetSandboxAction(token: string): Promise<ActionState> {
  let target: string;
  try {
    const lead = await requireLead(token);
    await resetSandbox(lead.id, lead.businessType, await getLocale());
    await logEvent(lead.id, "sandbox.reset");
    target = await basePath(token);
  } catch (err) {
    return toState(err);
  }
  redirect(target);
}
