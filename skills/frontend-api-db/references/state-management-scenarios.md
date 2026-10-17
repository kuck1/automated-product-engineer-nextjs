# State Management Scenario Playbook

Use this reference when state crosses components, routes, tabs, users, or network boundaries. Start by naming one canonical owner. A synchronization tool moves or projects state; it does not become the authority merely because many components can read it.

## Ownership decision

| State | Canonical owner | Typical tool | Avoid |
| --- | --- | --- | --- |
| transient interaction | nearest component | `useState` or local reducer | globalizing hover, open, or unsaved input |
| shareable navigation | URL | route params and search params | duplicating selected IDs in local state |
| stable subtree coordination | provider boundary | Context plus reducer | copying fetched records into Context |
| remote snapshot | query cache | TanStack Query | one fetch and `useState` copy per surface |
| durable domain truth | service and database | typed API, repository, Supabase | client-enforced policy or last-write-wins |
| identity and authorization | verified server session | cookie auth, service policy, RLS | treating browser state as permission proof |

Use props or composition before Context when the relationship is local. Context is appropriate for stable cross-tree values such as the current workspace, theme, or a reducer dispatch. Memoize provider values when object identity would otherwise rerender every consumer.

## Scenario matrix

| Scenario | Read model | Write path | Concurrency and recovery |
| --- | --- | --- | --- |
| top-bar points update | every surface observes `['account', id]` | optimistic cache patch, API mutation, canonical response | cancel reads, snapshot, rollback, invalidate derived totals |
| release inspector race | entity ID belongs in query key | no write required | consume `AbortSignal`; ignore or abort obsolete requests |
| two windows edit one record | query cache per tab | `PATCH` with `expectedRevision` | reject stale revision with `409`, refetch, review merge, retry |
| chat and unread counts | paginated message queries plus inbox aggregate | authenticated mutation with client nonce | optimistic dedupe, server timestamp ordering, reconnect backfill |
| multiplayer document | local working operation log plus durable checkpoints | collaboration protocol and versioned snapshot write | operation IDs, idempotency, replay after reconnect, merge protocol |
| auth-aware data | query keys include the authorized resource boundary | server-verified user and scoped mutation | clear or invalidate sensitive caches when identity changes |

## Shared points or counters

Do not keep separate values in the top bar, page, and dialog. Each surface observes the same query key. For an optimistic mutation:

1. cancel matching reads;
2. snapshot the previous cache entry;
3. apply one optimistic cache patch;
4. roll back the snapshot on failure;
5. replace the projection with the canonical response;
6. invalidate aggregates that cannot be reconstructed safely.

Use `useMutationState` when a component outside the mutation owner must render concurrent optimistic operations. Give submitted items stable client IDs so multiple pending writes do not collapse into one row.

## Out-of-order reads

Put every parameter that changes the result into the query key. Pass the query function's `AbortSignal` into `fetch`. A late response for entity A must never paint into the inspector after the user selected entity B.

Request cancellation protects the browser projection. It does not protect durable writes. Every sensitive mutation still needs a server concurrency contract such as an expected revision, ETag, idempotency key, or transaction constraint.

## Multiple tabs and windows

Use `BroadcastChannel` for same-origin notifications such as “entity saved; invalidate this key.” The sender does not receive its own message, so update its cache directly. Treat broadcast messages as hints, validate their shape, and refetch canonical data.

Use a database revision or compare-and-swap rule to prevent lost updates. Browser coordination cannot defend against another device or a write that occurs while every tab is closed. Web Locks can serialize origin-local jobs such as selecting one tab to refresh a token, but they are not a database lock.

## Chat and presence

Persist messages through an authenticated mutation. Add a client nonce so the optimistic message, mutation response, and realtime insert can be reconciled into one row. Order by a canonical server value, and backfill missed rows after reconnect.

Use realtime Broadcast for transient typing indicators, cursor movement, notifications, and custom events. Use Presence for slower occupancy state such as who is online or which page they are viewing. Do not use Presence as a high-frequency cursor stream or as durable history.

## Collaborative documents

Do not `PATCH` the entire document on every keystroke with last-write-wins. Keep the working draft responsive locally, exchange idempotent operations through a collaboration protocol, broadcast cursor state separately, and persist versioned checkpoints through an authenticated server boundary. Define reconnect replay, duplicate-operation handling, offline limits, and an explicit merge or conflict experience.

## Failure tests

For every shared-state feature, test:

- slow old response after a fast new response;
- duplicate click while a mutation is pending;
- optimistic rejection and exact rollback;
- canonical response differing from the optimistic projection;
- two tabs saving from the same revision;
- offline, reconnect, and missed realtime events;
- session expiry during a read and during a write;
- wrong tenant, wrong object, and signed-out access;
- a hard refresh after success and after failure.

Keep the public demo deterministic with synthetic data or a memory repository. Ship the same service and repository contracts against authenticated Supabase clients in a real application.

## Living scenario demos

When a reference app demonstrates these patterns, drive automated actors and human controls through the same typed command boundary. Keep playback timing, cursor positions, and fixture selection in a separate adapter. The rendered application should know only that it received a valid command from an actor.

- Start playback when the example enters the viewport and pause it when it leaves so background tabs do not keep mutating invisible fixtures.
- Give each actor a labeled cursor and reflect typing in the real controlled input before submitting the command.
- Run a complete loop for at least one minute so success, contention, rejection, recovery, and reconciliation all appear.
- Keep pause and replay controls available. A human edit should update the same reducer or query cache and remain visible to the next simulated action.
- Respect reduced-motion preferences by removing cursor interpolation while preserving the state transitions and readable activity log.
- Test the command contract directly, then use a focused browser test to prove viewport activation, human input, responsive containment, and one multi-actor conflict.
