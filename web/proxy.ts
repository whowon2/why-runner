import { type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { PATHNAME_HEADER } from "./lib/auth/redirect-path";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  // Expose the requested path to server components so auth guards can send
  // the user back here after sign-in / onboarding.
  request.headers.set(
    PATHNAME_HEADER,
    request.nextUrl.pathname + request.nextUrl.search,
  );
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
