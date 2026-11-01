import type { StatusTone } from "@/components/dashboard/ui";

/**
 * Persian labels for every enumerated value in the admin panel. The panel
 * is an internal, Persian-only tool, so its copy lives here instead of in
 * the public site's bilingual message files.
 */

type Labelled = Record<string, { label: string; tone?: StatusTone }>;

export const DEAL_STAGES: Labelled = {
  new: { label: "سرنخ جدید", tone: "info" },
  contacted: { label: "تماس گرفته شد", tone: "info" },
  demo: { label: "دمو / جلسه", tone: "info" },
  proposal: { label: "پیش‌فاکتور ارسال شد", tone: "warning" },
  negotiation: { label: "مذاکره", tone: "warning" },
  won: { label: "برنده شد", tone: "success" },
  lost: { label: "از دست رفت", tone: "neutral" },
};
export const OPEN_STAGES = ["new", "contacted", "demo", "proposal", "negotiation"] as const;

export const DEAL_SOURCES: Labelled = {
  demo: { label: "دموی سایت" },
  expert: { label: "درخواست جلسه" },
  contact: { label: "فرم تماس" },
  manual: { label: "ثبت دستی" },
  referral: { label: "معرفی" },
  social: { label: "شبکه‌های اجتماعی" },
  event: { label: "نمایشگاه / رویداد" },
  phone: { label: "تماس ورودی" },
  other: { label: "سایر" },
};

export const ACTIVITY_KINDS: Labelled = {
  note: { label: "یادداشت" },
  call: { label: "تماس تلفنی" },
  meeting: { label: "جلسه" },
  email: { label: "ایمیل" },
  whatsapp: { label: "پیام‌رسان" },
  system: { label: "سیستم" },
};

export const PRIORITIES: Labelled = {
  low: { label: "کم", tone: "neutral" },
  normal: { label: "عادی", tone: "info" },
  high: { label: "زیاد", tone: "warning" },
  urgent: { label: "فوری", tone: "error" },
};

export const CATALOG_KINDS: Labelled = {
  implementation: { label: "پیاده‌سازی" },
  support: { label: "پشتیبانی سالانه" },
  license: { label: "لایسنس / ماژول" },
  training: { label: "آموزش" },
  custom: { label: "سفارشی‌سازی" },
};

export const QUOTE_STATUSES: Labelled = {
  draft: { label: "پیش‌نویس", tone: "neutral" },
  sent: { label: "ارسال‌شده", tone: "info" },
  accepted: { label: "پذیرفته شد", tone: "success" },
  rejected: { label: "رد شد", tone: "error" },
};

export const CONTRACT_KINDS: Labelled = {
  implementation: { label: "پیاده‌سازی" },
  support: { label: "پشتیبانی سالانه" },
  license: { label: "لایسنس" },
  other: { label: "سایر" },
};

export const CONTRACT_STATUSES: Labelled = {
  draft: { label: "پیش‌نویس", tone: "neutral" },
  active: { label: "فعال", tone: "success" },
  completed: { label: "پایان‌یافته", tone: "neutral" },
  expired: { label: "منقضی", tone: "warning" },
  cancelled: { label: "لغو شده", tone: "error" },
};

export const INVOICE_STATUSES: Labelled = {
  draft: { label: "پیش‌نویس", tone: "neutral" },
  issued: { label: "صادرشده", tone: "info" },
  partial: { label: "علی‌الحساب", tone: "warning" },
  paid: { label: "تسویه‌شده", tone: "success" },
  cancelled: { label: "باطل‌شده", tone: "neutral" },
  overdue: { label: "سررسیدگذشته", tone: "error" },
};

export const PAYMENT_METHODS: Labelled = {
  transfer: { label: "واریز / پایا / ساتنا" },
  card: { label: "کارت‌به‌کارت" },
  pos: { label: "کارتخوان" },
  cash: { label: "نقد" },
  cheque: { label: "چک" },
};

export const EXPENSE_CATEGORIES: Labelled = {
  salary: { label: "حقوق و دستمزد" },
  rent: { label: "اجاره و شارژ" },
  hosting: { label: "سرور و هاستینگ" },
  software: { label: "نرم‌افزار و اشتراک" },
  marketing: { label: "تبلیغات و بازاریابی" },
  tax: { label: "مالیات و عوارض" },
  insurance: { label: "بیمه" },
  equipment: { label: "تجهیزات" },
  transport: { label: "ایاب‌وذهاب" },
  other: { label: "سایر" },
};

export const PROJECT_STATUSES: Labelled = {
  planning: { label: "برنامه‌ریزی", tone: "neutral" },
  active: { label: "در حال اجرا", tone: "info" },
  on_hold: { label: "متوقف", tone: "warning" },
  done: { label: "تحویل شد", tone: "success" },
  cancelled: { label: "لغو شد", tone: "error" },
};

export const PHASE_STATUSES: Labelled = {
  todo: { label: "شروع نشده", tone: "neutral" },
  doing: { label: "در حال انجام", tone: "info" },
  done: { label: "انجام شد", tone: "success" },
};

/** The phases every implementation project starts with. */
export const DEFAULT_PHASES = [
  "نیازسنجی و تحلیل فرآیندها",
  "پیکربندی سیستم",
  "انتقال داده",
  "آموزش کاربران",
  "راه‌اندازی (Go-live)",
  "پشتیبانی پس از راه‌اندازی",
];

export const TICKET_STATUSES: Labelled = {
  open: { label: "باز", tone: "warning" },
  in_progress: { label: "در حال بررسی", tone: "info" },
  waiting: { label: "منتظر پاسخ مشتری", tone: "neutral" },
  resolved: { label: "حل شد", tone: "success" },
  closed: { label: "بسته شد", tone: "neutral" },
};
export const OPEN_TICKET_STATUSES = ["open", "in_progress", "waiting"];

export const TICKET_CATEGORIES: Labelled = {
  bug: { label: "خطا / باگ" },
  question: { label: "سؤال" },
  request: { label: "درخواست تغییر" },
  training: { label: "آموزش" },
  other: { label: "سایر" },
};

export const TICKET_CHANNELS: Labelled = {
  phone: { label: "تلفن" },
  whatsapp: { label: "پیام‌رسان" },
  email: { label: "ایمیل" },
  visit: { label: "حضوری" },
  other: { label: "سایر" },
};

/** Hours to first resolution by priority — the ticket's due time. */
export const SLA_HOURS: Record<string, number> = { urgent: 4, high: 24, normal: 72, low: 168 };

export const CAMPAIGN_CHANNELS: Labelled = {
  instagram: { label: "اینستاگرام" },
  google: { label: "گوگل / سئو" },
  telegram: { label: "تلگرام" },
  linkedin: { label: "لینکدین" },
  sms: { label: "پیامک" },
  event: { label: "نمایشگاه / رویداد" },
  referral: { label: "معرفی" },
  other: { label: "سایر" },
};

export const CUSTOMER_STATUSES: Labelled = {
  active: { label: "فعال", tone: "success" },
  onboarding: { label: "در حال راه‌اندازی", tone: "info" },
  inactive: { label: "غیرفعال", tone: "neutral" },
};

export const INDUSTRIES: Labelled = {
  manufacturing: { label: "تولیدی" },
  trading: { label: "بازرگانی و پخش" },
  retail: { label: "فروشگاهی" },
  services: { label: "خدماتی" },
  healthcare: { label: "درمانی" },
  fitness: { label: "باشگاه" },
  other: { label: "سایر" },
};

export const COMPANY_SIZES: Labelled = {
  "1-10": { label: "۱ تا ۱۰ نفر" },
  "11-50": { label: "۱۱ تا ۵۰ نفر" },
  "51-200": { label: "۵۱ تا ۲۰۰ نفر" },
  "200+": { label: "بیش از ۲۰۰ نفر" },
};

export const ROLE_LABELS: Labelled = {
  owner: { label: "مدیر کل" },
  manager: { label: "مدیر" },
  sales: { label: "فروش" },
  finance: { label: "مالی" },
  support: { label: "پشتیبانی" },
};

export const MESSAGE_STATUSES: Labelled = {
  new: { label: "جدید", tone: "warning" },
  read: { label: "خوانده شد", tone: "neutral" },
  archived: { label: "بایگانی", tone: "neutral" },
};

export function options(map: Labelled): { value: string; label: string }[] {
  return Object.entries(map).map(([value, v]) => ({ value, label: v.label }));
}

export function labelOf(map: Labelled, key: string | null | undefined): string {
  return (key && map[key]?.label) || key || "—";
}

export function toneOf(map: Labelled, key: string | null | undefined): StatusTone {
  return (key && map[key]?.tone) || "neutral";
}
