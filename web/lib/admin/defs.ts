import type { FieldDef } from "@/lib/admin/fields";
import {
  ACTIVITY_KINDS,
  CAMPAIGN_CHANNELS,
  CATALOG_KINDS,
  COMPANY_SIZES,
  CONTRACT_KINDS,
  CONTRACT_STATUSES,
  CUSTOMER_STATUSES,
  DEAL_SOURCES,
  DEAL_STAGES,
  EXPENSE_CATEGORIES,
  INDUSTRIES,
  PAYMENT_METHODS,
  PRIORITIES,
  PROJECT_STATUSES,
  ROLE_LABELS,
  TICKET_CATEGORIES,
  TICKET_CHANNELS,
  options,
} from "@/lib/admin/labels";

/**
 * Field definitions for every admin form. Static ones are constants;
 * ones that need live choices (customers, users…) are functions taking
 * those options, so the server action can rebuild the exact same list to
 * validate against.
 */

type Opt = { value: string; label: string }[];

const PRIORITY_OPTS = options(PRIORITIES);

export const dealFields = (users: Opt): FieldDef[] => [
  { name: "title", label: "عنوان فرصت", type: "text", required: true, max: 160, span: 2 },
  { name: "company", label: "شرکت / سازمان", type: "text", max: 160 },
  { name: "contact_name", label: "نام رابط", type: "text", max: 120 },
  { name: "mobile", label: "موبایل", type: "tel", max: 20 },
  { name: "email", label: "ایمیل", type: "email", max: 160 },
  { name: "source", label: "منبع", type: "select", required: true, options: options(DEAL_SOURCES), span: 1 },
  { name: "stage", label: "مرحله", type: "select", required: true, options: options(DEAL_STAGES), span: 1 },
  { name: "value", label: "ارزش تخمینی (تومان)", type: "money" },
  { name: "expected_close", label: "تاریخ تخمینی بستن", type: "date", span: 1 },
  { name: "owner_id", label: "مسئول", type: "select", options: users, span: 1 },
  { name: "lost_reason", label: "دلیل از دست رفتن", type: "text", max: 200, hint: "فقط اگر مرحله «از دست رفت» است" },
  { name: "notes", label: "توضیحات", type: "textarea", max: 4000 },
];

export const activityFields: FieldDef[] = [
  {
    name: "kind",
    label: "نوع",
    type: "select",
    required: true,
    options: options(ACTIVITY_KINDS).filter((o) => o.value !== "system"),
    span: 1,
  },
  { name: "body", label: "شرح", type: "textarea", required: true, max: 4000, span: 3 },
];

export const taskFields = (users: Opt): FieldDef[] => [
  { name: "title", label: "کار", type: "text", required: true, max: 200, span: 2 },
  { name: "due_date", label: "سررسید", type: "date", span: 1 },
  { name: "priority", label: "اولویت", type: "select", required: true, options: PRIORITY_OPTS.filter((o) => o.value !== "urgent"), span: 1 },
  { name: "assignee_id", label: "مسئول", type: "select", options: users, span: 2 },
  { name: "notes", label: "توضیح", type: "text", max: 400, span: 2 },
];

export const customerFields: FieldDef[] = [
  { name: "name", label: "نام شرکت / مشتری", type: "text", required: true, max: 160, span: 2 },
  { name: "industry", label: "حوزه فعالیت", type: "select", options: options(INDUSTRIES), span: 1 },
  { name: "size", label: "اندازه", type: "select", options: options(COMPANY_SIZES), span: 1 },
  { name: "phone", label: "تلفن", type: "tel", max: 30, span: 1 },
  { name: "email", label: "ایمیل", type: "email", max: 160, span: 1 },
  { name: "city", label: "شهر", type: "text", max: 60, span: 1 },
  { name: "postal_code", label: "کد پستی", type: "text", max: 20, span: 1 },
  { name: "address", label: "نشانی", type: "text", max: 300, span: 4 },
  { name: "national_id", label: "شناسه ملی", type: "text", max: 20, span: 1 },
  { name: "economic_code", label: "کد اقتصادی", type: "text", max: 20, span: 1 },
  { name: "status", label: "وضعیت", type: "select", required: true, options: options(CUSTOMER_STATUSES), span: 1 },
  { name: "source", label: "منبع جذب", type: "select", options: options(DEAL_SOURCES), span: 1 },
  { name: "notes", label: "یادداشت", type: "textarea", max: 4000 },
];

export const contactFields: FieldDef[] = [
  { name: "name", label: "نام", type: "text", required: true, max: 120, span: 1 },
  { name: "role", label: "سمت", type: "text", max: 80, span: 1 },
  { name: "mobile", label: "موبایل", type: "tel", max: 20, span: 1 },
  { name: "email", label: "ایمیل", type: "email", max: 160, span: 1 },
];

export const catalogFields: FieldDef[] = [
  { name: "name", label: "عنوان خدمت", type: "text", required: true, max: 160, span: 2 },
  { name: "kind", label: "نوع", type: "select", required: true, options: options(CATALOG_KINDS), span: 1 },
  { name: "unit", label: "واحد", type: "text", required: true, max: 30, span: 1, placeholder: "پروژه، سال، ساعت…" },
  { name: "price", label: "قیمت پایه (تومان)", type: "money" },
  { name: "active", label: "فعال (در پیش‌فاکتور و فاکتور پیشنهاد شود)", type: "checkbox" },
  { name: "description", label: "توضیح", type: "textarea", max: 1000 },
];

export const contractFields = (customers: Opt): FieldDef[] => [
  { name: "customer_id", label: "مشتری", type: "select", required: true, options: customers, span: 2 },
  { name: "kind", label: "نوع قرارداد", type: "select", required: true, options: options(CONTRACT_KINDS), span: 1 },
  { name: "status", label: "وضعیت", type: "select", required: true, options: options(CONTRACT_STATUSES), span: 1 },
  { name: "title", label: "عنوان", type: "text", required: true, max: 200, span: 2 },
  { name: "amount", label: "مبلغ قرارداد بدون مالیات (تومان)", type: "money", span: 2, hint: "مالیات بر ارزش افزوده روی هر فاکتور اضافه می‌شود" },
  { name: "start_date", label: "تاریخ شروع", type: "date", required: true, span: 1 },
  { name: "end_date", label: "تاریخ پایان", type: "date", span: 1, hint: "برای پشتیبانی سالانه، معمولاً یک سال بعد" },
  { name: "auto_renew", label: "تمدید خودکار در یادآورها", type: "checkbox" },
  { name: "notes", label: "شرایط و توضیحات", type: "textarea", max: 4000 },
];

/** Header fields of an invoice; its lines come from the lines editor. */
export const invoiceFields = (customers: Opt, contracts: Opt): FieldDef[] => [
  { name: "customer_id", label: "مشتری", type: "select", required: true, options: customers, span: 2 },
  { name: "contract_id", label: "قرارداد مرتبط", type: "select", options: contracts, span: 2 },
  { name: "issued_at", label: "تاریخ صدور", type: "date", required: true, span: 1 },
  { name: "due_at", label: "سررسید پرداخت", type: "date", required: true, span: 1 },
  { name: "notes", label: "توضیحات فاکتور", type: "textarea", max: 1000 },
];

export const quoteFields: FieldDef[] = [
  { name: "title", label: "عنوان پیش‌فاکتور", type: "text", required: true, max: 200, span: 2 },
  { name: "issued_at", label: "تاریخ", type: "date", required: true, span: 1 },
  { name: "valid_until", label: "اعتبار تا", type: "date", required: true, span: 1 },
  { name: "notes", label: "شرایط و توضیحات", type: "textarea", max: 2000 },
];

export const paymentFields: FieldDef[] = [
  { name: "amount", label: "مبلغ (تومان)", type: "money", required: true, span: 2 },
  { name: "method", label: "روش", type: "select", required: true, options: options(PAYMENT_METHODS), span: 2 },
  { name: "paid_at", label: "تاریخ دریافت", type: "date", required: true, span: 2 },
  { name: "reference", label: "شماره پیگیری / چک", type: "text", max: 80, span: 2 },
];

export const expenseFields: FieldDef[] = [
  { name: "spent_at", label: "تاریخ", type: "date", required: true, span: 1 },
  { name: "category", label: "دسته", type: "select", required: true, options: options(EXPENSE_CATEGORIES), span: 1 },
  { name: "amount", label: "مبلغ (تومان)", type: "money", required: true, span: 2 },
  { name: "vendor", label: "طرف حساب", type: "text", max: 120, span: 2 },
  { name: "note", label: "شرح", type: "text", max: 300, span: 2 },
];

export const projectFields = (customers: Opt, contracts: Opt, users: Opt): FieldDef[] => [
  { name: "title", label: "عنوان پروژه", type: "text", required: true, max: 200, span: 2 },
  { name: "customer_id", label: "مشتری", type: "select", required: true, options: customers, span: 2 },
  { name: "contract_id", label: "قرارداد", type: "select", options: contracts, span: 2 },
  { name: "status", label: "وضعیت", type: "select", required: true, options: options(PROJECT_STATUSES), span: 1 },
  { name: "manager_id", label: "مدیر پروژه", type: "select", options: users, span: 1 },
  { name: "start_date", label: "شروع", type: "date", span: 1 },
  { name: "due_date", label: "موعد تحویل", type: "date", span: 1 },
  { name: "golive_date", label: "تاریخ راه‌اندازی واقعی", type: "date", span: 2 },
  { name: "notes", label: "توضیحات", type: "textarea", max: 4000 },
];

export const phaseFields: FieldDef[] = [
  { name: "title", label: "مرحله جدید", type: "text", required: true, max: 160, span: 3 },
  { name: "due_date", label: "موعد", type: "date", span: 1 },
];

export const ticketFields = (customers: Opt, users: Opt): FieldDef[] => [
  { name: "subject", label: "موضوع", type: "text", required: true, max: 200, span: 2 },
  { name: "customer_id", label: "مشتری", type: "select", options: customers, span: 2 },
  { name: "priority", label: "اولویت", type: "select", required: true, options: PRIORITY_OPTS, span: 1 },
  { name: "category", label: "دسته", type: "select", required: true, options: options(TICKET_CATEGORIES), span: 1 },
  { name: "channel", label: "کانال دریافت", type: "select", required: true, options: options(TICKET_CHANNELS), span: 1 },
  { name: "assignee_id", label: "مسئول", type: "select", options: users, span: 1 },
  { name: "body", label: "شرح مشکل یا درخواست", type: "textarea", max: 4000 },
];

export const campaignFields: FieldDef[] = [
  { name: "name", label: "نام کمپین", type: "text", required: true, max: 160, span: 2 },
  { name: "channel", label: "کانال", type: "select", required: true, options: options(CAMPAIGN_CHANNELS), span: 1 },
  {
    name: "utm_campaign",
    label: "utm_campaign",
    type: "text",
    max: 80,
    span: 1,
    hint: "همان مقداری که در لینک تبلیغ می‌گذارید",
  },
  { name: "budget", label: "بودجه (تومان)", type: "money" },
  { name: "spent", label: "هزینه‌شده (تومان)", type: "money" },
  { name: "start_date", label: "شروع", type: "date", span: 1 },
  { name: "end_date", label: "پایان", type: "date", span: 1 },
  { name: "notes", label: "توضیحات", type: "textarea", max: 2000 },
];

export const companyFields: FieldDef[] = [
  { name: "legal_name", label: "نام حقوقی فروشنده", type: "text", max: 160, span: 2, placeholder: "شرکت …" },
  { name: "brand", label: "نام تجاری", type: "text", max: 80, span: 2 },
  { name: "national_id", label: "شناسه ملی", type: "text", max: 20, span: 1 },
  { name: "economic_code", label: "کد اقتصادی", type: "text", max: 20, span: 1 },
  { name: "registration_no", label: "شماره ثبت", type: "text", max: 20, span: 1 },
  { name: "postal_code", label: "کد پستی", type: "text", max: 20, span: 1 },
  { name: "address", label: "نشانی", type: "text", max: 300, span: 4 },
  { name: "phone", label: "تلفن", type: "tel", max: 30, span: 1 },
  { name: "email", label: "ایمیل", type: "email", max: 160, span: 1 },
  { name: "website", label: "وب‌سایت", type: "text", max: 120, span: 2 },
  { name: "bank", label: "اطلاعات پرداخت (شبا / کارت)", type: "text", max: 200, span: 3 },
  { name: "vat_rate", label: "نرخ مالیات بر ارزش افزوده (٪)", type: "int", required: true, span: 1 },
  { name: "invoice_note", label: "متن پایین فاکتور", type: "textarea", max: 1000 },
];

export const announcementFields: FieldDef[] = [
  { name: "active", label: "نمایش اعلان در سایت", type: "checkbox", span: 4 },
  { name: "text", label: "متن اعلان (فارسی)", type: "text", max: 200, span: 4 },
  { name: "text_en", label: "متن اعلان (انگلیسی)", type: "text", max: 200, span: 4 },
  { name: "link_url", label: "لینک (اختیاری)", type: "text", max: 300, span: 2, placeholder: "/درخواست-دمو" },
  { name: "link_label", label: "متن لینک", type: "text", max: 40, span: 2 },
];

export const userFields: FieldDef[] = [
  { name: "name", label: "نام", type: "text", required: true, max: 80, span: 1 },
  { name: "username", label: "نام کاربری", type: "text", required: true, max: 40, span: 1 },
  { name: "role", label: "نقش", type: "select", required: true, options: options(ROLE_LABELS), span: 1 },
  { name: "password", label: "رمز اولیه", type: "password", required: true, max: 100, span: 1, hint: "حداقل ۸ کاراکتر" },
];

export const passwordFields: FieldDef[] = [
  { name: "current", label: "رمز فعلی", type: "password", required: true, max: 100 },
  { name: "next", label: "رمز جدید", type: "password", required: true, max: 100, hint: "حداقل ۸ کاراکتر" },
];
