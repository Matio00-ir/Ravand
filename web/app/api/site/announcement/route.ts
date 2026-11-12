import { NextResponse } from "next/server";
import { getSetting, type Announcement } from "@/lib/admin/settings";

/**
 * The site-wide announcement set in /admin/site. The public pages are
 * statically generated, so the bar fetches this at runtime instead of
 * forcing every page to render per request. Cached briefly at the edge.
 */
export async function GET() {
  try {
    const a = await getSetting<Announcement>("announcement", {});
    const body = a.active && a.text ? { active: true, text: a.text, text_en: a.text_en, link_url: a.link_url, link_label: a.link_label } : { active: false };
    return NextResponse.json(body, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
  } catch {
    // No database (e.g. a preview without DATABASE_URL) → simply no bar.
    return NextResponse.json({ active: false });
  }
}
