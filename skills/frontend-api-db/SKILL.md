---
name: frontend-api-db
description: Plan and implement frontend features that require durable API, database, authorization, and client-cache support. Use for persisted preferences, saved state, row or bulk actions, filters, counters, and mutations that must survive refreshes.
---

# Frontend API And Database

Use this skill when the UI presents state as durable or shared. Optimistic state may improve feedback, but the database-backed API remains authoritative.

Read [references/full-stack-vertical-slice.md](references/full-stack-vertical-slice.md) for a concrete contract, race-handling sequence, migration questions, and focused test matrix.

Read [references/state-management-scenarios.md](references/state-management-scenarios.md) when state crosses components, pages, tabs, windows, realtime channels, or users. It includes ownership decisions, points and aggregate updates, request races, multi-window writes, chat, collaborative editing, and a focused failure matrix.

Read [references/analytics-instrumentation.md](references/analytics-instrumentation.md) when the feature adds or changes product analytics, experiments, impressions, mutation outcomes, or failure telemetry.


## Intake and pushback

Inspect current types, routes, services, schema, policies, query keys, and callers first. Establish the user-visible mutation, authoritative data owner, actors and tenant boundary, persistence lifetime, validation, concurrency and idempotency rules, migration compatibility, and failure recovery. Ask only when a missing decision changes durable behavior, authorization, schema safety, or reconciliation. If a product or platform owner must answer, provide a concise request containing the observed contract, exact unresolved rule, and required decision or sample payload.

## Classify state first

- **Local UI:** open surfaces, draft input, hover, selection, and animation.
- **Navigation:** shareable search, filters, sort, tabs, and result-affecting view state.
- **Client server-cache:** fetched responses, pagination, optimistic snapshots, rollback, and invalidation.
- **Database:** preferences, saved configurations, assignments, and anything that survives refresh or drives server-owned counts.
- **External authority:** data owned by another service, synchronized through an explicit contract.

Define precedence when multiple sources participate. Browser storage is a hydration-safe convenience, never an undeclared authority over an explicit URL or durable default.

Define user actions precisely when defaults participate. Clearing working filters or search must not immediately reapply a saved default in the same mounted session; resetting should intentionally restore that default. Keep the distinction explicit in hook state, URL writes, copy, and tests.

## Backend contract

- Keep endpoints thin: authenticate, validate, delegate, and return typed responses.
- Put ownership policy, query shape, transactions, idempotency, reconciliation, and DTO construction in services.
- Separate read visibility from write authority and add negative cross-owner or cross-tenant tests.
- Model durable invariants with uniqueness, foreign keys, constraints, and indexes that match real read paths.
- Version flexible persisted configuration before its shape evolves.
- Define migration compatibility, optional-read fallback, rollback, and behavior with older application versions.
- Avoid shared caching for authenticated mutable responses unless the cache key and invalidation contract prove isolation and freshness.

## Mutation and cache contract

- Return the canonical changed state or actual changed identifiers, not merely success.
- Cancel conflicting reads, snapshot affected cache entries, apply one optimistic intent, roll back on failure, and reconcile from the response.
- Pass cancellation signals through the HTTP layer and prevent older responses from overwriting newer intent.
- Update every affected surface: visible rows, paginated pages, aggregates, facets, details, and selection state.
- Centralize query-key and invalidation logic instead of scattering string keys through components.
- Never silently fall back to local-only success when a durable write fails.
- Test rapid repeated actions, navigation while in flight, retry, partial bulk success, stale reads, and hard-refresh persistence.

## Delivery

Document state ownership, API shapes, authorization, schema, cache transitions, concurrency behavior, failure recovery, and rollout in the living feature guide. Test services and endpoints, migration behavior, negative authorization, client hooks, optimistic success and rollback, and at least one integrated user flow. Use `architecture-building` for broader boundaries and `manual-ui-qa` to verify the complete persistence loop in a real browser.

Trace the release and onboarding slices in [`../../docs/case-studies.md`](../../docs/case-studies.md) for working examples of these boundaries.
