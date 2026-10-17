# Supabase Auth And Session Debugging

Use this reference when reviewing a Next.js application that uses Supabase Auth, cookie sessions, Server Components, route handlers, or Realtime authorization.

## Separate the boundaries

- A publishable key identifies the application and is safe to ship to the browser. It does not authorize a user; protect exposed tables with RLS.
- A user access token identifies the signed-in user and carries claims used by Supabase and application policy.
- A secret or service-role key is server-only and bypasses RLS. Never expose it to the browser or combine it with user-controlled authorization decisions.
- The application service enforces tenant, object, and action policy. RLS repeats the data boundary as defense in depth.

Use separate browser and server Supabase clients. For SSR, use the cookie-backed client flow and PKCE. Create server clients per request so cookie and request context cannot leak across users.

## Server verification

Use verified claims for normal protected routing and data access when supported by the chosen Supabase client. Use a fresh user lookup when the application specifically needs the latest user record. Treat `getSession()` as token/session access, not a trusted authorization decision about the returned user object.

## Random logout diagnostic order

1. Confirm the browser received and stored the access and refresh cookie updates.
2. Confirm the next Server Component or route request sends those cookies.
3. Confirm refresh-token rotation is not being performed concurrently by several tabs or clients.
4. Confirm one request does not reuse a stale server client.
5. Check cookie domain, path, `SameSite`, `Secure`, and proxy rewriting.
6. Check device and server clock skew against token expiry.
7. Invalidate identity-scoped query caches when the authenticated user changes.

## Sign-in redirect loop

Complete the PKCE code exchange and persist the cookie before navigating to a protected route. Route prefetch can reach the server before the browser has stored the new session; delay protected prefetch or redirect only after the exchange succeeds. Confirm the callback and destination use the same cookie domain and storage strategy.

## Authenticated but no rows

Reproduce with the publishable key and the real user token. Confirm the token reaches the Supabase data client, then inspect `auth.uid()`, tenant membership, and separate `SELECT`, `INSERT`, `UPDATE`, and `DELETE` policies. A secret-key query can hide a broken RLS policy because it bypasses RLS.

## Realtime authorization

Use private channels when events or presence are tenant-scoped. Authorize access through policies on `realtime.messages` and refresh channel authorization when a new JWT is issued. Persist durable records through authenticated writes; treat realtime messages as delivery, notification, or collaboration signals.

## Review evidence

Retain tests or traces for signed out, expired access token with valid refresh token, revoked session, wrong tenant, second tab refresh, callback redirect, protected Server Component render, route handler mutation, RLS rejection, and Realtime reconnect. Never record a real token, cookie, secret key, or customer payload in screenshots or logs.
