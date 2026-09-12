import { Manrope, Vazirmatn } from "next/font/google";

// English / Latin typeface — RAVAND brand system.
export const manrope = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
});

// Persian typeface — RAVAND brand system. Also carries Latin fallback
// glyphs so mixed fa/en strings (product names, numerals) stay on-brand.
export const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-vazirmatn",
  display: "swap",
});
