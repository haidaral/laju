import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(["/", "/api/entries(.*)", "/api/export(.*)"]);

const hasClerkEnv = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim()) && Boolean(process.env.CLERK_SECRET_KEY?.trim());

const protectedMiddleware = clerkMiddleware(async (auth, req) => {
  const hasLocalApiUserHeader = Boolean(req.headers.get("x-laju-user-id")?.trim());
  if (process.env.NODE_ENV !== "production" && hasLocalApiUserHeader && req.nextUrl.pathname.startsWith("/api/")) {
    return;
  }
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

const passthroughMiddleware = () => NextResponse.next();

export default hasClerkEnv ? protectedMiddleware : passthroughMiddleware;

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"]
};
