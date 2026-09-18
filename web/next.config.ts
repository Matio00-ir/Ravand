import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/**
 * Security headers, applied to every route.
 *
 * `script-src`/`style-src` keep `'unsafe-inline'` deliberately: every page
 * in this app is statically generated (`generateStaticParams` on every
 * route), and Next's App Router streams inline flight-data `<script>`
 * tags plus this app's own JSON-LD `<script>` tags on every page. A
 * nonce-based strict CSP requires per-request dynamic rendering, which
 * would force the whole site off static generation to close a risk that
 * doesn't exist today — every inline script/style here is build-time,
 * internal content, never user input (see lib/structured-data.ts). If the
 * app ever renders user-controlled content into an inline script or adds
 * dynamic rendering for other reasons, switch this to a per-request nonce.
 *
 * No HSTS `preload` directive: submitting to the browser preload list is
 * a hard-to-reverse public commitment and shouldn't be made unilaterally.
 */
// `next dev` (Turbopack + React's dev-mode error overlay) uses eval() for
// component stack traces; without 'unsafe-eval' every render throws a
// console error in dev. React never uses eval() in production, so this
// is scoped to development only — the deployed policy stays strict.
const isDev = process.env.NODE_ENV !== "production";

const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws://localhost:* http://localhost:*" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const PERMISSIONS_POLICY = [
  "camera=()",
  "microphone=()",
  "geolocation=()",
  "payment=()",
  "usb=()",
  "interest-cohort=()",
  "browsing-topics=()",
].join(", ");

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: PERMISSIONS_POLICY },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Content-Security-Policy", value: CSP },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
