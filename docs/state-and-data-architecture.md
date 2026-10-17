# State and Data Architecture

Good UI architecture begins by assigning every piece of state to one authority.

## State ownership table

| State kind | Owner | Examples |
| --- | --- | --- |
| Ephemeral UI | Component | menu open, active draft tab |
| Shareable navigation | URL | search, filter, sort, selected tab |
| Server data | Query cache | records, facets, counts, pagination |
| Optimistic projection | Mutation controller | favorite, assignment, reordering |
| Durable user preference | Database | saved view, default filter, dismissal |
| Security and eligibility | Server service | permissions, ownership, feature access |

Do not duplicate the same authority across URL, local state, local storage, and database. Define precedence when more than one input can initialize a state. A common order is explicit URL, durable user default, product default.

## Controller contracts

Controller hooks should own one coherent workflow and return:

- current observable state;
- derived values needed by the view;
- explicit commands;
- normalized pending and error information.

Inject adapters when it improves testability. Avoid exposing raw query-library internals to every view. Rapid actions must settle to the latest valid intent, and stale responses must not overwrite newer state.

## API boundaries

Client code calls typed adapters. Route handlers authenticate, validate, delegate, and serialize. Services own domain rules, authorization, transactions, idempotency, and query shape. Repositories or database helpers own persistence details.

Mutation responses should return enough information to reconcile the UI, including records requested, records changed, records skipped, the new canonical value, and stable error codes.

## Cache and optimistic updates

For each optimistic action, define:

1. eligible cached surfaces;
2. optimistic patch;
3. rollback snapshot;
4. authoritative server reconciliation;
5. invalidation or refetch scope;
6. behavior for duplicate, no-op, and partial success;
7. ordering under rapid repeated actions.

Avoid broad invalidation when a narrow patch is reliable. Prefer invalidation when derived aggregates or authorization rules are complex enough that client reconstruction could drift.

## Multi-step flows

Keep draft progress, intermediate persistence, and final completion distinct. An intermediate save should not make the current flow ineligible and unmount it before the final screen. Replay should be presentation-only unless the product contract explicitly allows mutation.

Define back, reset, close, refresh, retry, and resume behavior. Preserve recoverable input after network failure. Use idempotency keys or unique constraints for operations that may be retried.

## Server authority

The browser may improve usability, but it does not enforce security. The server validates identity, ownership, role, data shape, eligibility, and sensitive transitions on every mutation. Feature flags do not replace authorization.

## Complex scenarios

Use the installable [state-management scenario playbook](../skills/frontend-api-db/references/state-management-scenarios.md) for shared counters, out-of-order requests, multi-window saves, chat, collaborative documents, Realtime, and failure testing. Use the [Supabase auth and session guide](../skills/security-review/references/supabase-auth-sessions.md) for cookie-backed SSR, API-key boundaries, RLS, redirect loops, and random logout diagnosis.
