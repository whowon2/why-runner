import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";
import { cookies } from "next/headers";

// 1. Specify protected and public routes
const protectedRoutes = ["/problems"];
const publicRoutes = ["/auth", "/"];

export async function middleware(req: NextRequest) {
  // console.log("middleware");
  // // 2. Check if the current route is protected or public
  // const path = req.nextUrl.pathname;
  // const isProtectedRoute = protectedRoutes.includes(path);
  // const isPublicRoute = publicRoutes.includes(path);
  // // 3. Decrypt the session from the cookie
  // const cookie = (await cookies()).get("session")?.value;
  // const session = await decrypt(cookie);
  // // 4. Redirect to /login if the user is not authenticated
  // if (isProtectedRoute && !session?.userId) {
  //   // return NextResponse.redirect(new URL("/login", req.nextUrl));
  // }
  // // 5. Redirect to /dashboard if the user is authenticated
  // if (
  //   isPublicRoute &&
  //   session?.userId &&
  //   !req.nextUrl.pathname.startsWith("/dashboard")
  // ) {
  //   return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  // }
  // return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
