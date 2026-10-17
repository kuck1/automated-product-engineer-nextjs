---
name: security-review
description: Perform a security-focused review of pending branch or pull-request changes. Use for authentication, authorization, untrusted input, secrets, uploads, serialization, external integrations, or sensitive-data exposure, and report only high-confidence newly introduced vulnerabilities.
---

# Security Review

Review only the security impact introduced by the scoped diff. This is not a general correctness or hardening audit.

Read [references/threat-tracing.md](references/threat-tracing.md) for trust-boundary mapping, source-to-sink tracing, exploitability filters, and the required finding format.

Read [references/supabase-auth-sessions.md](references/supabase-auth-sessions.md) when the scoped change uses Supabase Auth, cookie sessions, SSR clients, API keys, RLS, Realtime authorization, or reports intermittent logout and redirect failures.


## Intake and pushback

Resolve the exact diff, actors, protected resources, trust boundaries, deployment context, and existing controls from code and repository guidance first. Ask only when missing identity, tenancy, data-sensitivity, or integration assumptions prevent a confident exploitability decision. If a system owner must clarify the contract, provide a concise request naming the entry point, protected action or data, observed enforcement, and exact assumption that needs confirmation.

## Pin the threat surface

- Establish the exact base, head, changed files, and repository security guidance.
- Identify trust boundaries, actors, protected resources, sensitive data, and privileged operations touched by the change.
- Trace untrusted data from entry points through validation and authorization to storage, rendering, network, filesystem, process, or code-execution sinks.
- Compare new code with established secure patterns in the repository.

## Examine

- authentication bypass, session mistakes, and confused identity
- missing object-, tenant-, or operation-level authorization
- SQL, command, template, path, XML, and code injection
- unsafe deserialization, upload handling, archive extraction, and content-type trust
- reflected, stored, or DOM script injection where framework escaping is bypassed
- credential disclosure, weak cryptography or randomness, and certificate-validation bypass
- sensitive-data leakage through responses, logs, analytics, caches, or cross-user state
- server-side request forgery with meaningful access to protected resources
- webhook, replay, signature, idempotency, and external-writer weaknesses

## Filter false positives

Report only high or medium severity issues with a concrete exploit path and strong confidence. Exclude style concerns, generic hardening, dependency age without an exploitable path, resource exhaustion, rate-limit requests, test-only code, and pre-existing problems. Verify whether framework protections or a downstream authorization check already closes the path.

Use an independent verification pass when practical. Drop any proposed finding whose exploit conditions cannot be demonstrated by code reasoning.

## Output

Return findings ordered by severity. Each finding must include `file:line`, category, affected actor or data, exploit prerequisites, end-to-end exploit scenario, confidence, and the smallest robust fix. If none qualify, state that no high-confidence security vulnerabilities were found in the scoped change.

Do not publish comments, change code, or disclose sensitive proof material unless the user authorized it.
