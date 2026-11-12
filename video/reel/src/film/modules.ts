import { COL_X, ROW_Y, NODE_H, NODE_W, SIDEBAR } from "./layout";

export type ModuleKey = "erp" | "finance" | "crm" | "sales" | "inventory" | "workflow" | "hr" | "analytics";

export type ModuleDef = {
  key: ModuleKey;
  code: string;
  /** Names are the product's own nav labels (messages/en.json → product.nav). */
  name: string;
  /** First capability from messages/en.json → platform.modules, so nothing here is invented. */
  cap: string;
  icon: string[];
  iconFill?: string;
  slot: [number, number];
  nav: number;
  reg: number;
  appear: number;
  /** Scatter state: start position, total drift by the end of the fragmentation, skew, depth scale. */
  s: { x: number; y: number; dx: number; dy: number; skew: number; z: number };
  /** The node this module's dangling, unfinished connector points toward. */
  partner: ModuleKey;
};

export const MODULES: ModuleDef[] = [
  {
    key: "crm", code: "CRM", name: "Customers", cap: "Customer records",
    icon: ["M2.5 2.5h6.5v6.5H2.5z", "M11 11h6.5v6.5H11z", "M9 5.75h4.75V11"],
    slot: [0, 0], nav: 2, reg: 0, appear: 1.0, partner: "inventory",
    s: { x: 400, y: 300, dx: -80, dy: -24, skew: 0.07, z: 1.0 },
  },
  {
    key: "workflow", code: "WFL", name: "Workflow", cap: "Approval chains",
    icon: ["M2.5 2.5h6v5h-6z", "M11.5 12.5h6v5h-6z", "M5.5 7.5v7.5h6"],
    slot: [1, 1], nav: 5, reg: 1, appear: 1.9, partner: "erp",
    s: { x: 700, y: 490, dx: 60, dy: 36, skew: -0.06, z: 0.92 },
  },
  {
    key: "inventory", code: "INV", name: "Inventory", cap: "Stock tracking",
    icon: ["M2.5 5.5h15v12h-15z", "M2.5 10h15", "M10 10v7.5", "M6.5 2.5h7v3h-7z"],
    slot: [1, 0], nav: 4, reg: 2, appear: 2.8, partner: "sales",
    s: { x: 1040, y: 270, dx: -40, dy: -44, skew: 0.05, z: 1.04 },
  },
  {
    key: "hr", code: "HR", name: "People", cap: "Attendance",
    icon: ["M2.5 2.5h6.5v6.5H2.5z", "M11 2.5h6.5v6.5H11z", "M2.5 11h6.5v6.5H2.5z"],
    iconFill: "M11 11h6.5v6.5H11z",
    slot: [0, 1], nav: 6, reg: 3, appear: 3.5, partner: "workflow",
    s: { x: 330, y: 650, dx: -30, dy: 40, skew: -0.08, z: 0.88 },
  },
  {
    key: "sales", code: "SLS", name: "Sales", cap: "Orders & invoices",
    icon: ["M2.5 17.5h4.5V13h4.5V8.5h4.5V4", "M2.5 17.5h15"],
    slot: [2, 0], nav: 3, reg: 4, appear: 4.3, partner: "finance",
    s: { x: 1420, y: 460, dx: 50, dy: 10, skew: 0.06, z: 1.0 },
  },
  {
    key: "erp", code: "ERP", name: "Resources", cap: "Org structure",
    icon: ["M10 2.5 17.5 6.5 10 10.5 2.5 6.5Z", "M2.5 10.5 10 14.5 17.5 10.5", "M2.5 14 10 18 17.5 14"],
    slot: [2, 1], nav: 0, reg: 5, appear: 5.0, partner: "finance",
    s: { x: 1010, y: 690, dx: 44, dy: 52, skew: -0.05, z: 0.96 },
  },
  {
    key: "finance", code: "FIN", name: "Finance", cap: "General ledger",
    icon: ["M2.5 2.5v15h15", "M5.5 13.5 9 9.5l3 2.5 4.5-6.5"],
    slot: [3, 1], nav: 1, reg: 6, appear: 5.7, partner: "analytics",
    s: { x: 1640, y: 700, dx: 60, dy: -30, skew: 0.08, z: 0.9 },
  },
  {
    key: "analytics", code: "ANL", name: "Analytics", cap: "Indicators",
    icon: ["M3.5 17.5V11", "M10 17.5V4", "M16.5 17.5V8", "M2.5 17.5h15"],
    slot: [3, 0], nav: 7, reg: 7, appear: 6.4, partner: "sales",
    s: { x: 1700, y: 240, dx: 20, dy: -10, skew: -0.07, z: 1.06 },
  },
];

export const byKey = Object.fromEntries(MODULES.map((m) => [m.key, m])) as Record<ModuleKey, ModuleDef>;

export type Rect = { cx: number; cy: number; w: number; h: number };

export const slotRect = (m: ModuleDef): Rect => ({ cx: COL_X[m.slot[0]], cy: ROW_Y[m.slot[1]], w: NODE_W, h: NODE_H });

export const rowRect = (m: ModuleDef): Rect => ({
  cx: SIDEBAR.x + SIDEBAR.w / 2,
  cy: SIDEBAR.y0 + m.nav * SIDEBAR.pitch + SIDEBAR.h / 2,
  w: SIDEBAR.w,
  h: SIDEBAR.h,
});
