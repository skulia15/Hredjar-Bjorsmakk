import { clerkMiddleware } from '@clerk/nextjs/server'

// Makes the Clerk session available to auth() everywhere. Routes stay publicly reachable;
// each mutation route enforces its own role via the require* guards in src/lib/auth.ts
export default clerkMiddleware()

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|mp3)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
