---
name: design-system
description: Extend or maintain design-system infrastructure including semantic tokens, primitives, variants, editable variables, catalog metadata, interactive previews, inspector support, and visual-regression coverage.
---

# Design System

Use this skill when a visual rule should become shared infrastructure. Keep feature-specific data and orchestration in feature code.

Read [references/system-extension.md](references/system-extension.md) for the token-to-component pipeline, catalog and inspector contracts, migration sequencing, and visual-baseline discipline. Read [references/component-library-onboarding.md](references/component-library-onboarding.md) when introducing the library to a team, documenting why it matters, or planning adoption from existing product screens.


## Intake and pushback

Inspect existing tokens, primitives, variants, consumers, documentation, and visual baselines before proposing a parallel system. Establish the target consumers, semantic role, themes, accessibility requirements, supported states, extension axis, and ownership or migration expectations.

Ask one to three focused questions only when a missing decision would change the public token or component contract. If design source or governance input is missing, generate a tailored request that lists the observed foundations, the conflicting or absent decisions, and the exact token, component, state, or approval artifact required.

## Establish the source of truth

- Inspect existing tokens, variables, primitives, component variants, metadata, previews, and tests before adding a parallel mechanism.
- Confirm reuse across real surfaces or a strong near-term need. Do not promote every one-off element.
- Map design values to semantic intent rather than copying raw color, spacing, or typography values into consumers.
- Preserve the project's theme, accessibility, and naming conventions.

## Build by layer

- **Foundations:** semantic color, type, spacing, radius, shadow, motion, and responsive values.
- **Primitives:** small accessible elements with explicit states and variants.
- **Patterns:** repeatable combinations whose layout and interaction contract is stable.
- **Composites:** production components that accept domain-neutral inputs while leaving business behavior to callers.

If the repository supports editable variables or an inspector, keep code tokens, editor controls, metadata, and preview rendering synchronized. Metadata describes the production API; it must not invent a second component model.

## Preview real behavior

- Render the production component in catalogs and workbenches rather than a preview-only imitation.
- Use deterministic fixtures for default, interactive, disabled, loading, error, dense, and responsive states that materially affect the contract.
- Keep preview controls, labels, and inspectable values derived from the same metadata when possible.
- Avoid preview wrappers that alter the production component's layout participation or measurement.

## Validate

- Test variant selection, keyboard and screen-reader behavior, token resolution, and any metadata-to-preview mapping.
- Add targeted visual coverage at stable dimensions and inspect diffs before approving baselines.
- Exercise production consumers at representative widths; a catalog-only pass is insufficient.
- Document migration guidance and remove superseded tokens or variants only when all consumers are accounted for.

Use `design-polish` for one product surface and `responsive-design` when the primary problem is fluid layout behavior.
