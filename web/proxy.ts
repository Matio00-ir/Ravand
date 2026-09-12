import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

/**
 * Next.js 16 renamed the `middleware` file convention to `proxy`.
 * next-intl's request handler has the same (NextRequest) => NextResponse
 * signature either way, so we just re-export it under the new name.
 */
export const proxy = createMiddleware(routing);

export const config = {
  // Skip API routes, Next internals, and static/asset files.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
