import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// On définit les routes à protéger
const isProtectedRoute = createRouteMatcher(['/cv(.*)', '/radar-talents(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect();
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};