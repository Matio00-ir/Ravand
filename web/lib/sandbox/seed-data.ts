/**
 * Starting dataset for a new sandbox, per business type and language.
 * Prices are in Toman at roughly 1405 market levels — believable to an
 * Iranian buyer, not exact quotes. A sandbox is seeded once in the
 * language of its first visit; the customer then owns and edits it.
 */

export type SeedProduct = {
  sku: string;
  name: string;
  unit: string;
  price: number;
  stock: number;
  reorder: number;
  trackStock?: boolean;
};

export type SeedCustomer = { name: string; phone: string; city: string };

type Catalog = { products: SeedProduct[]; customers: SeedCustomer[] };

const FA_CUSTOMERS: SeedCustomer[] = [
  { name: "بازرگانی پارسیان", phone: "021-88451230", city: "تهران" },
  { name: "صنایع آرمان سپاهان", phone: "031-36254410", city: "اصفهان" },
  { name: "فروشگاه‌های زنجیره‌ای نگین", phone: "051-38412290", city: "مشهد" },
  { name: "البرز سازه", phone: "026-32517744", city: "کرج" },
  { name: "پخش مرکزی سپهر", phone: "071-36478812", city: "شیراز" },
  { name: "تعاونی مصرف کارکنان آذر", phone: "041-35562201", city: "تبریز" },
  { name: "گروه صنعتی کاوه", phone: "021-44105566", city: "تهران" },
  { name: "هتل پارس", phone: "061-33380090", city: "اهواز" },
];

const EN_CUSTOMERS: SeedCustomer[] = [
  { name: "Parsian Trading", phone: "021-88451230", city: "Tehran" },
  { name: "Arman Sepahan Industries", phone: "031-36254410", city: "Isfahan" },
  { name: "Negin Retail Chain", phone: "051-38412290", city: "Mashhad" },
  { name: "Alborz Sazeh", phone: "026-32517744", city: "Karaj" },
  { name: "Sepehr Central Distribution", phone: "071-36478812", city: "Shiraz" },
  { name: "Azar Staff Cooperative", phone: "041-35562201", city: "Tabriz" },
  { name: "Kaveh Industrial Group", phone: "021-44105566", city: "Tehran" },
  { name: "Pars Hotel", phone: "061-33380090", city: "Ahvaz" },
];

const CATALOGS: Record<string, { fa: SeedProduct[]; en: SeedProduct[] }> = {
  manufacturing: {
    fa: [
      { sku: "MT-101", name: "ورق گالوانیزه ۰٫۵ میلی‌متر", unit: "برگ", price: 3_850_000, stock: 140, reorder: 40 },
      { sku: "MT-102", name: "لوله فولادی ۲ اینچ", unit: "شاخه", price: 2_400_000, stock: 220, reorder: 60 },
      { sku: "MT-103", name: "پروفیل ۴۰×۴۰", unit: "شاخه", price: 1_650_000, stock: 18, reorder: 50 },
      { sku: "MT-104", name: "پیچ و مهره M10", unit: "بسته", price: 420_000, stock: 600, reorder: 150 },
      { sku: "MT-105", name: "رنگ الکترواستاتیک", unit: "کیلوگرم", price: 690_000, stock: 85, reorder: 30 },
      { sku: "FG-201", name: "قفسه فلزی ۵ طبقه", unit: "عدد", price: 12_500_000, stock: 36, reorder: 10 },
      { sku: "FG-202", name: "میز کار صنعتی", unit: "عدد", price: 18_900_000, stock: 9, reorder: 8 },
      { sku: "FG-203", name: "کابینت ابزار ۷ کشو", unit: "عدد", price: 24_300_000, stock: 14, reorder: 5 },
    ],
    en: [
      { sku: "MT-101", name: "Galvanized sheet 0.5mm", unit: "sheet", price: 3_850_000, stock: 140, reorder: 40 },
      { sku: "MT-102", name: "Steel pipe 2-inch", unit: "length", price: 2_400_000, stock: 220, reorder: 60 },
      { sku: "MT-103", name: "Profile 40×40", unit: "length", price: 1_650_000, stock: 18, reorder: 50 },
      { sku: "MT-104", name: "M10 bolts & nuts", unit: "pack", price: 420_000, stock: 600, reorder: 150 },
      { sku: "MT-105", name: "Powder coating paint", unit: "kg", price: 690_000, stock: 85, reorder: 30 },
      { sku: "FG-201", name: "Steel shelving, 5 tiers", unit: "unit", price: 12_500_000, stock: 36, reorder: 10 },
      { sku: "FG-202", name: "Industrial workbench", unit: "unit", price: 18_900_000, stock: 9, reorder: 8 },
      { sku: "FG-203", name: "Tool cabinet, 7 drawers", unit: "unit", price: 24_300_000, stock: 14, reorder: 5 },
    ],
  },
  trading: {
    fa: [
      { sku: "TR-101", name: "برنج هندی ۱۰ کیلویی", unit: "کیسه", price: 1_950_000, stock: 420, reorder: 100 },
      { sku: "TR-102", name: "روغن آفتابگردان ۱۸ لیتری", unit: "حلب", price: 3_400_000, stock: 160, reorder: 50 },
      { sku: "TR-103", name: "شکر ۵۰ کیلویی", unit: "کیسه", price: 4_100_000, stock: 35, reorder: 60 },
      { sku: "TR-104", name: "چای سیلان ۵۰۰ گرمی", unit: "کارتن", price: 5_600_000, stock: 90, reorder: 25 },
      { sku: "TR-105", name: "رب گوجه ۸۰۰ گرمی", unit: "کارتن", price: 1_480_000, stock: 310, reorder: 80 },
      { sku: "TR-106", name: "ماکارونی ۷۰۰ گرمی", unit: "کارتن", price: 980_000, stock: 12, reorder: 70 },
      { sku: "TR-107", name: "لوبیا قرمز ۹۰۰ گرمی", unit: "کارتن", price: 2_250_000, stock: 140, reorder: 40 },
    ],
    en: [
      { sku: "TR-101", name: "Indian rice, 10kg", unit: "bag", price: 1_950_000, stock: 420, reorder: 100 },
      { sku: "TR-102", name: "Sunflower oil, 18L", unit: "tin", price: 3_400_000, stock: 160, reorder: 50 },
      { sku: "TR-103", name: "Sugar, 50kg", unit: "bag", price: 4_100_000, stock: 35, reorder: 60 },
      { sku: "TR-104", name: "Ceylon tea, 500g", unit: "carton", price: 5_600_000, stock: 90, reorder: 25 },
      { sku: "TR-105", name: "Tomato paste, 800g", unit: "carton", price: 1_480_000, stock: 310, reorder: 80 },
      { sku: "TR-106", name: "Pasta, 700g", unit: "carton", price: 980_000, stock: 12, reorder: 70 },
      { sku: "TR-107", name: "Red beans, 900g", unit: "carton", price: 2_250_000, stock: 140, reorder: 40 },
    ],
  },
  retail: {
    fa: [
      { sku: "RT-101", name: "شیر کم‌چرب ۱ لیتری", unit: "بسته ۱۲تایی", price: 780_000, stock: 260, reorder: 80 },
      { sku: "RT-102", name: "پنیر سفید ۴۰۰ گرمی", unit: "کارتن", price: 1_920_000, stock: 75, reorder: 30 },
      { sku: "RT-103", name: "دستمال کاغذی ۱۰۰ برگ", unit: "بسته ۱۰تایی", price: 640_000, stock: 410, reorder: 100 },
      { sku: "RT-104", name: "مایع ظرفشویی ۱ لیتری", unit: "کارتن", price: 1_150_000, stock: 22, reorder: 40 },
      { sku: "RT-105", name: "آب معدنی ۱٫۵ لیتری", unit: "شیرینگ", price: 290_000, stock: 980, reorder: 200 },
      { sku: "RT-106", name: "بیسکویت ساقه‌طلایی", unit: "کارتن", price: 1_340_000, stock: 130, reorder: 40 },
      { sku: "RT-107", name: "قهوه فوری ۲۰۰ گرمی", unit: "کارتن", price: 3_900_000, stock: 8, reorder: 15 },
    ],
    en: [
      { sku: "RT-101", name: "Low-fat milk, 1L", unit: "12-pack", price: 780_000, stock: 260, reorder: 80 },
      { sku: "RT-102", name: "White cheese, 400g", unit: "carton", price: 1_920_000, stock: 75, reorder: 30 },
      { sku: "RT-103", name: "Tissues, 100 sheets", unit: "10-pack", price: 640_000, stock: 410, reorder: 100 },
      { sku: "RT-104", name: "Dish soap, 1L", unit: "carton", price: 1_150_000, stock: 22, reorder: 40 },
      { sku: "RT-105", name: "Mineral water, 1.5L", unit: "shrink", price: 290_000, stock: 980, reorder: 200 },
      { sku: "RT-106", name: "Wholewheat biscuits", unit: "carton", price: 1_340_000, stock: 130, reorder: 40 },
      { sku: "RT-107", name: "Instant coffee, 200g", unit: "carton", price: 3_900_000, stock: 8, reorder: 15 },
    ],
  },
  services: {
    fa: [
      { sku: "SV-101", name: "پشتیبانی ماهانه شبکه", unit: "ماه", price: 18_000_000, stock: 0, reorder: 0, trackStock: false },
      { sku: "SV-102", name: "نصب و راه‌اندازی", unit: "ساعت", price: 1_200_000, stock: 0, reorder: 0, trackStock: false },
      { sku: "SV-103", name: "مشاوره فنی", unit: "ساعت", price: 2_500_000, stock: 0, reorder: 0, trackStock: false },
      { sku: "SV-104", name: "آموزش کاربران", unit: "جلسه", price: 6_500_000, stock: 0, reorder: 0, trackStock: false },
      { sku: "HW-201", name: "روتر شبکه", unit: "عدد", price: 14_800_000, stock: 16, reorder: 5 },
      { sku: "HW-202", name: "سوئیچ ۲۴ پورت", unit: "عدد", price: 21_500_000, stock: 4, reorder: 5 },
      { sku: "HW-203", name: "کابل شبکه Cat6", unit: "حلقه", price: 5_900_000, stock: 30, reorder: 10 },
    ],
    en: [
      { sku: "SV-101", name: "Monthly network support", unit: "month", price: 18_000_000, stock: 0, reorder: 0, trackStock: false },
      { sku: "SV-102", name: "Installation & setup", unit: "hour", price: 1_200_000, stock: 0, reorder: 0, trackStock: false },
      { sku: "SV-103", name: "Technical consulting", unit: "hour", price: 2_500_000, stock: 0, reorder: 0, trackStock: false },
      { sku: "SV-104", name: "User training", unit: "session", price: 6_500_000, stock: 0, reorder: 0, trackStock: false },
      { sku: "HW-201", name: "Network router", unit: "unit", price: 14_800_000, stock: 16, reorder: 5 },
      { sku: "HW-202", name: "24-port switch", unit: "unit", price: 21_500_000, stock: 4, reorder: 5 },
      { sku: "HW-203", name: "Cat6 network cable", unit: "roll", price: 5_900_000, stock: 30, reorder: 10 },
    ],
  },
};

export function seedCatalog(businessType: string, locale: string): Catalog {
  const lang = locale === "en" ? "en" : "fa";
  const catalog = CATALOGS[businessType] ?? CATALOGS.trading;
  return {
    products: catalog[lang],
    customers: lang === "en" ? EN_CUSTOMERS : FA_CUSTOMERS,
  };
}
