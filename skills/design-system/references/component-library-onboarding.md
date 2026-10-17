# Component library onboarding

A component library is the shared interface contract between design and product code. It packages recurring visual, interaction, responsive, and accessibility decisions into named, inspectable parts. Its value is not the number of components. Its value is that a product team can make a decision once, exercise its meaningful states, and improve every consumer through a small stable API.

## Explain the hierarchy

Introduce the library from the bottom up so people know where a change belongs:

1. **Foundations** name decisions such as semantic color, typography, spacing, radius, shadow, motion, and responsive behavior.
2. **Primitives** provide small accessible controls such as buttons, fields, badges, and links with explicit variants and states.
3. **Compositions** combine primitives into one reusable thought, such as a notice with an icon, message, and recovery action.
4. **Patterns** combine components, state, and guidance to solve a recurring product job, such as a review panel or guarded approval flow.

Do not treat a visually similar product feature as a library component until its behavior and ownership contract are stable across real consumers.

## Keep ownership explicit

For every component, document two boundaries:

- **The component owns** presentation hierarchy, semantic tokens, accessibility mechanics, responsive layout, focus treatment, and the visual expression of supported states.
- **The product caller owns** domain data, authorization, business policy, persistence, navigation, analytics, and the truth behind loading, success, failure, or permission states.

This boundary lets a component stay reusable without becoming a second application layer.

## Show and tell the contract

Onboarding should render the production component and explain it beside the specimen. For each component or pattern, show:

- its purpose and hierarchy level;
- its public props and semantic token roles;
- default, hover, focus, pressed, disabled, loading, empty, error, success, and content-pressure states when they apply;
- comfortable and compact density when supported;
- representative narrow and wide layouts;
- what the component owns and what the caller owns;
- when to use it and when another semantic element is more appropriate;
- a short code example using the real public API;
- links to production consumers, source, tests, and the design-system catalog.

The specimen must use the production implementation. A visually similar demonstration can hide drift and teaches the wrong API.

## Adopt from real screens

1. Inventory repeated actions, fields, statuses, feedback messages, panels, and workflows in production screens. Capture every meaningful state before extracting a shared part.
2. Map raw values to semantic roles. Prefer names such as `primary action`, `supporting text`, `panel`, `success`, and `danger` over color or pixel names.
3. Replace from the leaves up: foundations, primitives, compositions, then patterns. Keep product policy and data flow in the caller.
4. Prove the contract with keyboard and screen-reader behavior, loading and failure states, long content, localization pressure, representative mobile widths, and real consumers.
5. Migrate incrementally. Record the old and new consumer, resolve gaps in the shared contract, and remove superseded code only when all consumers are accounted for.

## Audit an existing setup

Ask:

- Can a new teammate find the canonical component and understand its purpose without reading feature code?
- Do design and engineering use the same token, component, variant, and state names?
- Are component states part of the API and catalog, or rediscovered during QA?
- Does the catalog render the production component with realistic content?
- Can callers keep business rules and persistence outside the component?
- Do token or component fixes reach real consumers without one-off overrides?
- Are accessibility, responsive behavior, and content pressure tested at the component and consumer levels?
- Is there a documented path for adding, changing, deprecating, and migrating a component?

If several answers are no, prioritize clearer contracts and representative examples before expanding the component count.
