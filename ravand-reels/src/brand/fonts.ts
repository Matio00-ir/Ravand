/**
 * Brand fonts, loaded from Google Fonts (both SIL Open Font License):
 *   Vazirmatn — Persian (RAVAND's Persian face, web/lib/fonts.ts)
 *   Manrope   — Latin (tagline, product codes)
 * loadFont() blocks rendering until the faces are ready.
 */
import { loadFont as loadVazirmatn } from "@remotion/google-fonts/Vazirmatn";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";

export const fa = loadVazirmatn("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["arabic", "latin"],
}).fontFamily;

export const latin = loadManrope("normal", {
  weights: ["500", "700", "800"],
  subsets: ["latin"],
}).fontFamily;
