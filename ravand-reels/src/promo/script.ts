/**
 * ALL copy and timing for the ERP promo. Change text/durations here only.
 * Durations are in seconds; scenes run back to back.
 */
import type { IconName } from "./kit";

export type Pain = { text: string; icon: IconName; dur: number };
export type Feature = {
  clip: string; // public/footage/erp/<clip>.mp4
  window: string; // window title
  kicker: string;
  title: string;
  hot?: string[]; // words to underline in the title
  bullets: string[];
  dur: number;
  /** length of the recorded clip (s); it is slowed down to fill the scene */
  clipDur: number;
  /** focus zooms, times in CLIP seconds; x/y in % of the footage frame */
  zoom?: { at: number; until?: number; x: number; y: number; scale: number }[];
};

export const PAINS: Pain[] = [
  { icon: "message", dur: 4.45, text: "سفارش‌ها لای دفتر و پیام‌های واتس‌اپ گم می‌شوند؟" },
  { icon: "inventory", dur: 5.2, text: "نمی‌دانی چقدر مواد اولیه و اقلام بسته‌بندی در انبار مانده؟" },
  { icon: "calc", dur: 7.08, text: "مواد لازم هر نوبت تولید را با ماشین‌حساب درمی‌آوری و آخرش اشتباه می‌شود؟" },
  { icon: "tag", dur: 7.13, text: "قیمت مواد هر هفته عوض می‌شود و نمی‌دانی هر واحد محصولت واقعاً چند تمام می‌شود؟" },
  { icon: "bucket", dur: 7.57, text: "نمی‌دانی با همین موجودی انبار، از هر محصول چقدر می‌توانی تولید کنی؟" },
  { icon: "invoice", dur: 5.53, text: "فاکتورها دیر صادر می‌شوند و طلب مشتری‌ها از دستت در می‌رود؟" },
  { icon: "sales", dur: 6.25, text: "و هیچ تصویر روشنی از فروش و وضعیت کسب‌وکارت نداری؟" },
];

export const FEATURES: Feature[] = [
  {
    clip: "orders", window: "سفارش‌ها", kicker: "سفارش‌ها", dur: 10.4, clipDur: 7,
    title: "همه‌ی سفارش‌ها، یک‌جا و با وضعیت روشن", hot: ["یک‌جا"],
    bullets: ["ثبت سفارش در چند ثانیه", "در انتظار، در حال تولید، ارسال‌شده", "خروج خودکار کالا از انبار هنگام ارسال"],
  },
  {
    clip: "stock", window: "انبار و قیمت‌ها", kicker: "انبار", dur: 9.75, clipDur: 7,
    title: "انبارِ زنده، نه حدسی", hot: ["زنده،"],
    bullets: ["موجودی لحظه‌ای مواد، بسته‌بندی و محصول", "هشدار کمبود، قبل از اینکه تولید بخوابد", "فرمول محرمانه: مواد فقط با کد"],
  },
  {
    clip: "production", window: "محاسبه تولید", kicker: "ابزار محاسبه‌ی تولید", dur: 14.88, clipDur: 10,
    title: "قبل از تولید، بدان چقدر خرج دارد", hot: ["قبل", "تولید،"],
    bullets: ["مواد لازم هر نوبت تولید، فقط با وارد کردن مقدار", "بهای تمام‌شده‌ی هر واحد با قیمت روز", "دستمزد، سربار و ضایعات هم حساب می‌شود", "هشدار کمبود، پیش از شروع تولید"],
    zoom: [{ at: 6.9, x: 28, y: 52, scale: 1.6 }],
  },
  {
    clip: "producible", window: "انبار و قیمت‌ها", kicker: "حداکثر تولید ممکن", dur: 11.22, clipDur: 9,
    title: "با همین انبار، چقدر می‌شود تولید کرد؟", hot: ["چقدر"],
    bullets: ["یک محصول انتخاب کن، جواب را ببین", "ماده‌ای که تولید را محدود می‌کند معلوم است", "کافی‌بودن اقلام بسته‌بندی هم چک می‌شود"],
    zoom: [{ at: 2.6, until: 6.6, x: 72, y: 40, scale: 1.45 }],
  },
  {
    clip: "invoices", window: "فاکتورها", kicker: "فاکتور", dur: 5.59, clipDur: 7,
    title: "پیش‌فاکتور و فاکتور، بدون دوباره‌کاری", hot: ["بدون"],
    bullets: ["تبدیل سفارش به فاکتور رسمی", "محاسبه‌ی خودکار مالیات", "شماره‌گذاری خودکار اسناد"],
  },
  {
    clip: "finance", window: "مدیریت مالی", kicker: "حساب مشتری‌ها", dur: 7.6, clipDur: 7,
    title: "طلب هر مشتری، همیشه جلوی چشمت", hot: ["طلب"],
    bullets: ["ثبت دریافت نقدی، کارت، حواله و چک", "مانده‌ی حساب هر مشتری", "صندوق و حساب‌های بانکی"],
    zoom: [{ at: 3.6, x: 62, y: 84, scale: 1.35 }],
  },
  {
    clip: "dashboard", window: "داشبورد", kicker: "داشبورد مدیریت", dur: 6.69, clipDur: 8,
    title: "کل کسب‌وکار در یک نگاه", hot: ["یک", "نگاه"],
    bullets: ["فروش فصل و ارزش ریالی انبار", "سفارش‌های در انتظار", "اقلامی که رو به اتمام‌اند"],
  },
];

const HOOK = 5.75;
const painsDur = PAINS.reduce((a, x) => a + x.dur, 0);
const TURN = 5.31;
const featuresDur = FEATURES.reduce((a, x) => a + x.dur, 0);
const CLOSE = 8.2;

export const TIMELINE = {
  hook: { from: 0, dur: HOOK },
  pains: { from: HOOK, dur: painsDur },
  turn: { from: HOOK + painsDur, dur: TURN },
  features: { from: HOOK + painsDur + TURN, dur: featuresDur },
  close: { from: HOOK + painsDur + TURN + featuresDur, dur: CLOSE },
};
