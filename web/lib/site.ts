/**
 * The canonical origin for this deployment.
 *
 * Every absolute URL the app emits — metadataBase, canonicals, hreflang,
 * sitemap entries, robots.txt, JSON-LD @id/url — resolves from here, so
 * it is defined once rather than re-read in four places.
 *
 * Resolution is deliberately forgiving: a malformed value must never take
 * the build down. `metadataBase: new URL(...)` throws on anything that
 * isn't a valid URL, which previously meant a single typo in an
 * environment variable failed the whole deployment.
 */

/** Last resort, only reached in local development. */
const LOCAL_FALLBACK = "http://localhost:3000";

/**
 * Accepts a bare host ("ravand.co") or a full origin, tolerates trailing
 * slashes and whitespace, and rejects anything that isn't a real host —
 * including unreplaced placeholders like "<project>.vercel.app".
 */
function normalizeOrigin(raw: string | undefined | null): string | null {
  if (!raw) return null;

  const trimmed = raw.trim().replace(/\/+$/, "");
  if (!trimmed) return null;

  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }

  // A hostname may only contain letters, digits, dots and hyphens. This is
  // what catches copy-pasted placeholders and stray punctuation.
  if (!/^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/i.test(url.hostname)) return null;

  return url.origin;
}

/**
 * Preference order:
 *  1. NEXT_PUBLIC_SITE_URL      — what you set once you have a domain
 *  2. VERCEL_PROJECT_PRODUCTION_URL — the project's production domain
 *  3. VERCEL_URL                — this specific deployment
 *  4. localhost
 *
 * Steps 2 and 3 are set automatically by Vercel, so a deployment produces
 * correct absolute URLs even if nobody configures anything.
 */
export const SITE_URL: string =
  normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL) ??
  normalizeOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
  normalizeOrigin(process.env.VERCEL_URL) ??
  LOCAL_FALLBACK;

/** `metadataBase` needs a URL instance; this one is guaranteed to parse. */
export const SITE_ORIGIN: URL = new URL(SITE_URL);
