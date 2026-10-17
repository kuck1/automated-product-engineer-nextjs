# Live demo manual QA and attention pass

- **Tested commit:** `5d82a8575dade3795efc83b6dbefe50fc3208f3a`
- **Surface:** `/guide#guide-state`
- **Environment:** local Next.js development server in the Codex in-app Chromium browser
- **Viewports:** 1280 × 720 desktop and 390 × 844 mobile
- **Date:** 2026-10-17

## Coverage

The six state-management scenarios were exercised as real, visible browser interfaces: shared points, out-of-order release requests, two-window saves, chat, collaborative editing, and cookie auth. Each scenario was allowed to run through its full 3.3-second loop. Pause and Replay were checked, and the chat form was edited and submitted by hand.

The phone pass checked the scenario rail, playback header, chat message surface, first-person composer, activity trail, state contract, and pattern/antipattern content without horizontal clipping.

## Human quality and taste review

- **Attention:** Twenty-times playback removes the long inactive gaps. Cursor movement, state changes, and the progress bar now read as one deliberate sequence.
- **Meaning:** Every motion changes a named piece of product state. The current and recent activity trail explains what the viewer just saw.
- **First-person chat:** “You” appears in presence, moves a distinct cursor, types a local draft, and sends a right-aligned message before a remote participant responds.
- **Control:** The first real click or keystroke pauses automation, labels the activity as human control, and preserves the resulting state. Replay restarts the fixture.
- **Responsive hierarchy:** The documentation frame remains visually separate from each sample product. Controls, messages, and state evidence remain legible at the tested desktop and phone widths.

The fast loop is intentionally a scan-first preview. Pause, Replay, the retained activity trail, and the surrounding implementation explanation support closer study without slowing the automatic sequence.

## Defects closed in this pass

- Replaced the 66-second presentation with the same complete sequence at 20× speed.
- Reduced cursor and progress interpolation so the visuals keep pace with the state transitions.
- Added a first-person automated participant to chat.
- Prevented automation from overwriting human input by pausing playback when the viewer interacts.

## Automated evidence

`pnpm verify` passed content validation, 10 focused tests, TypeScript, ESLint, and the production build. The browser scenario test now asserts the 3.3-second duration, accelerated label, first cursor timing, first-person chat message, and manual input path.
