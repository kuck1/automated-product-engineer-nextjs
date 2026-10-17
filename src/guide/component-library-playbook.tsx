"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Box,
  Check,
  CheckCircle2,
  Component,
  FileInput,
  Layers3,
  MousePointerClick,
  Palette,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Badge, Button } from "@/src/ui/components";

type LibraryItemId = "button" | "badge" | "field" | "notice" | "review-panel";
type Density = "comfortable" | "compact";

type LibraryItem = {
  readonly id: LibraryItemId;
  readonly level: string;
  readonly name: string;
  readonly summary: string;
  readonly states: readonly string[];
  readonly props: string;
  readonly tokens: string;
  readonly owns: string;
  readonly callerOwns: string;
  readonly useWhen: string;
  readonly avoid: string;
  readonly example: string;
};

const hierarchy = [
  ["01", "Foundations", "Tokens name the visual decisions."],
  ["02", "Primitives", "Accessible controls expose typed variants."],
  ["03", "Compositions", "Small parts form one reusable thought."],
  ["04", "Patterns", "Components, state, and guidance solve a recurring job."],
] as const;

const libraryItems: readonly LibraryItem[] = [
  {
    id: "button",
    level: "PRIMITIVE · ACTION",
    name: "Button",
    summary: "Expresses action hierarchy while preserving keyboard, disabled, and pending behavior.",
    states: ["Default", "Secondary", "Loading", "Disabled"],
    props: "tone, disabled, type, onClick, children",
    tokens: "Primary action, focus ring, control height, radius",
    owns: "Visual hierarchy, focus treatment, disabled appearance, hit area.",
    callerOwns: "Permission, mutation, loading truth, confirmation, analytics.",
    useWhen: "A person can initiate an action in the current context.",
    avoid: "Navigation to another page. Use a link with link semantics instead.",
    example: '<Button tone="primary" disabled={saving}>\n  {saving ? "Saving…" : "Save changes"}\n</Button>',
  },
  {
    id: "badge",
    level: "PRIMITIVE · STATUS",
    name: "Badge",
    summary: "Turns a domain state into a short, scannable label that never relies on color alone.",
    states: ["Neutral", "In review", "Complete", "At risk"],
    props: "tone, icon, children",
    tokens: "Status foreground, status surface, compact spacing, label type",
    owns: "State emphasis, icon alignment, color-plus-language treatment.",
    callerOwns: "The actual status and the rules that produce it.",
    useWhen: "A durable state must be recognized while scanning dense UI.",
    avoid: "Long explanations or interactive filtering without button semantics.",
    example: '<Badge tone="success">\n  <CheckCircle2 /> Complete\n</Badge>',
  },
  {
    id: "field",
    level: "PRIMITIVE · INPUT",
    name: "Text field",
    summary: "Packages label, input, help, error, and disabled behavior into one predictable contract.",
    states: ["Empty", "Filled", "Error", "Disabled"],
    props: "label, value, hint, error, disabled, onChange",
    tokens: "Input surface, border, focus ring, danger text, control spacing",
    owns: "Label association, message placement, focus and error presentation.",
    callerOwns: "Value, validation policy, persistence, sensitive-data rules.",
    useWhen: "A person needs to enter or edit a short value.",
    avoid: "Selecting from a constrained set; use the matching choice component.",
    example: '<TextField\n  label="Project name"\n  value={name}\n  error={errors.name}\n  onChange={setName}\n/>',
  },
  {
    id: "notice",
    level: "COMPOSITION · FEEDBACK",
    name: "Notice",
    summary: "Combines icon, title, explanation, and an optional recovery action into one message.",
    states: ["Information", "Success", "Warning", "Danger"],
    props: "tone, title, description, action",
    tokens: "Semantic status colors, panel surface, section spacing, body type",
    owns: "Message hierarchy, responsive layout, status semantics.",
    callerOwns: "The event, recovery action, retry behavior, and dismissal policy.",
    useWhen: "A result or condition changes what the person should understand or do next.",
    avoid: "Passive decoration, routine metadata, or errors that belong beside one field.",
    example: '<Notice\n  tone="warning"\n  title="One check remains"\n  action={<Button>Open check</Button>}\n/>',
  },
  {
    id: "review-panel",
    level: "PATTERN · DECISION",
    name: "Review panel",
    summary: "Places status, evidence, context, and the guarded decision in one repeatable workflow.",
    states: ["Draft", "Ready", "Approving", "Blocked"],
    props: "status, title, evidence, action, onApprove",
    tokens: "Panel hierarchy plus Button, Badge, Notice, and evidence slots",
    owns: "Composition, responsive priority, focus order, empty evidence behavior.",
    callerOwns: "Authorization, readiness policy, server mutation, audit trail.",
    useWhen: "A consequential decision needs its proof and remaining risk nearby.",
    avoid: "Generic content cards without an actual review decision.",
    example: '<ReviewPanel\n  status={release.status}\n  evidence={checks}\n  onApprove={() => approve(release.id)}\n/>',
  },
] as const;

function LiveSpecimen({ item, state, density }: { item: LibraryItem; state: string; density: Density }) {
  const [name, setName] = useState(state === "Empty" ? "" : "Mobile checkout");
  const [feedback, setFeedback] = useState("Ready for human input.");
  const compact = density === "compact";

  if (item.id === "button") {
    const loading = state === "Loading";
    const disabled = state === "Disabled" || loading;
    return <div className={`cl-preview-center ${compact ? "compact" : ""}`}><Button tone={state === "Secondary" ? "secondary" : "primary"} disabled={disabled} onClick={() => setFeedback("The caller received the action. The component did not decide what happens next.")}>{loading ? "Saving…" : disabled ? "Unavailable" : "Save changes"}</Button><p>{feedback}</p></div>;
  }
  if (item.id === "badge") {
    const tone = state === "Complete" ? "success" : state === "At risk" ? "warning" : state === "In review" ? "info" : "neutral";
    return <div className={`cl-preview-center ${compact ? "compact" : ""}`}><Badge tone={tone}>{state === "Complete" && <CheckCircle2 size={12} />}{state === "At risk" && <AlertTriangle size={12} />}{state}</Badge><p>Status remains readable without its color.</p></div>;
  }
  if (item.id === "field") {
    const error = state === "Error";
    const disabled = state === "Disabled";
    return <div className={`cl-field-preview ${error ? "has-error" : ""} ${compact ? "compact" : ""}`}><label htmlFor="component-library-name">Project name</label><input id="component-library-name" value={name} disabled={disabled} placeholder="Name this project" onChange={(event) => setName(event.target.value)} /><small>{error ? "Use at least three characters." : disabled ? "Only workspace owners can edit this." : "Use a name teammates will recognize."}</small></div>;
  }
  if (item.id === "notice") {
    const icon = state === "Success" ? <CheckCircle2 size={19} /> : state === "Information" ? <Sparkles size={19} /> : <AlertTriangle size={19} />;
    const message = feedback === "Ready for human input."
      ? state === "Danger" ? "Your work is preserved. Review the error and try again." : "The message explains what changed and the next useful action."
      : feedback;
    return <article className={`cl-notice-preview tone-${state.toLowerCase()} ${compact ? "compact" : ""}`}><span>{icon}</span><div><strong>{state === "Success" ? "Ready to share" : state === "Information" ? "Preview generated" : state === "Danger" ? "Publish failed" : "One check remains"}</strong><p>{message}</p></div><Button tone="quiet" onClick={() => setFeedback("The recovery action stayed with the product caller.")}>{state === "Success" ? "View proof" : "Open details"}</Button></article>;
  }
  const blocked = state === "Blocked";
  const approving = state === "Approving";
  return <article className={`cl-panel-preview ${compact ? "compact" : ""}`}><header><div><Badge tone={blocked ? "danger" : state === "Ready" ? "success" : "info"}>{state}</Badge><h5>Release approval</h5></div><span>REV 18</span></header><p>Checkout refresh is ready for a decision. Evidence and remaining risk stay beside the action.</p><ul><li><Check size={13} /> Design QA</li><li><Check size={13} /> Browser tests</li><li className={blocked ? "blocked" : ""}>{blocked ? <AlertTriangle size={13} /> : <Check size={13} />} Security review</li></ul><footer><small>{blocked ? "Resolve the security review before approval." : feedback === "Ready for human input." ? "3 checks attached to this revision." : feedback}</small><Button disabled={blocked || approving} onClick={() => setFeedback("Approval intent reached the product caller.")}>{approving ? "Approving…" : "Approve release"}</Button></footer></article>;
}

export function ComponentLibraryPlaybook() {
  const [activeId, setActiveId] = useState<LibraryItemId>("button");
  const [activeState, setActiveState] = useState("Default");
  const [density, setDensity] = useState<Density>("comfortable");
  const active = libraryItems.find((item) => item.id === activeId) ?? libraryItems[0];
  const selectItem = (item: LibraryItem) => {
    setActiveId(item.id);
    setActiveState(item.states[0]);
  };

  return <section className="guide-section cl-playbook" id="guide-components">
    <div className="guide-heading"><span>03 / COMPONENT LIBRARY</span><div><h3>Understand the system before you assemble the screen.</h3><p>A component library is the shared interface contract between design and product code. It turns recurring visual, interaction, responsive, and accessibility decisions into named parts that teams can inspect, reuse, and improve once.</p></div></div>

    <div className="cl-value-grid">
      <article><Palette size={18} /><strong>Change decisions once</strong><p>Semantic tokens update every participating component without rewriting each feature.</p></article>
      <article><ShieldCheck size={18} /><strong>Ship complete states</strong><p>Focus, disabled, loading, error, and responsive behavior travel with the component contract.</p></article>
      <article><Component size={18} /><strong>Speak one language</strong><p>Design, engineering, QA, and agents refer to the same component, variant, and state names.</p></article>
      <article><Layers3 size={18} /><strong>Compose without coupling</strong><p>Components own presentation. Product callers retain data, policy, navigation, and mutations.</p></article>
    </div>

    <div className="cl-hierarchy" aria-label="Component library hierarchy">{hierarchy.map(([number, title, detail], index) => <div key={title}><span>{number}</span><strong>{title}</strong><small>{detail}</small>{index < hierarchy.length - 1 && <ArrowRight size={15} />}</div>)}</div>

    <div className="playbook-heading cl-show-heading"><span>SHOW + TELL</span><div><h4>See the component. Then inspect the contract.</h4><p>Select a library item and a meaningful state. The stage renders shared primitives and representative compositions; the contract explains what belongs in the library, what remains with the product, and when the abstraction earns its place.</p></div></div>

    <div className="cl-workbench">
      <nav aria-label="Component library examples">{libraryItems.map((item, index) => <button type="button" className={active.id === item.id ? "active" : ""} aria-pressed={active.id === item.id} onClick={() => selectItem(item)} key={item.id}><span>{String(index + 1).padStart(2, "0")}</span><div><small>{item.level}</small><strong>{item.name}</strong><p>{item.summary}</p></div><ArrowRight size={15} /></button>)}</nav>
      <article className="cl-inspector" aria-live="polite">
        <header><div><span>{active.level}</span><h4>{active.name}</h4><p>{active.summary}</p></div><Link href="/system#primitives">Open full catalog <ArrowUpRight size={13} /></Link></header>
        <div className="cl-state-controls"><fieldset><legend>Meaningful state</legend>{active.states.map((state) => <button type="button" key={state} aria-pressed={activeState === state} onClick={() => setActiveState(state)}>{state}</button>)}</fieldset><fieldset><legend>Density</legend>{(["comfortable", "compact"] as const).map((option) => <button type="button" key={option} aria-pressed={density === option} onClick={() => setDensity(option)}>{option}</button>)}</fieldset></div>
        <div className="cl-stage"><div><span>LIVE PRODUCTION SPECIMEN</span><small>{activeState} · {density}</small></div><LiveSpecimen key={`${active.id}-${activeState}`} item={active} state={activeState} density={density} /></div>
        <dl className="cl-contract"><div><dt>PUBLIC API</dt><dd><code>{active.props}</code></dd></div><div><dt>SEMANTIC TOKENS</dt><dd>{active.tokens}</dd></div><div><dt>COMPONENT OWNS</dt><dd>{active.owns}</dd></div><div><dt>PRODUCT OWNS</dt><dd>{active.callerOwns}</dd></div><div><dt>USE WHEN</dt><dd>{active.useWhen}</dd></div><div><dt>AVOID WHEN</dt><dd>{active.avoid}</dd></div></dl>
        <pre className="cl-code"><code>{active.example}</code></pre>
      </article>
    </div>

    <div className="playbook-heading cl-onboard-heading"><span>ONBOARDING PATH</span><div><h4>Adopt the library without stopping product work.</h4><p>Start with the pieces already repeated in real screens. Move from leaves to patterns, and keep product behavior outside the visual contract.</p></div></div>
    <ol className="cl-adoption">
      <li><span>01</span><FileInput size={17} /><div><strong>Inventory real screens</strong><p>Find repeated actions, fields, status treatments, and panels. Capture every meaningful state before extracting anything.</p></div></li>
      <li><span>02</span><Palette size={17} /><div><strong>Map intent to tokens</strong><p>Replace raw values with semantic roles such as primary action, supporting text, panel, success, and danger.</p></div></li>
      <li><span>03</span><MousePointerClick size={17} /><div><strong>Replace from the leaves up</strong><p>Adopt primitives first, then compositions. Keep API calls, domain policy, permissions, and routing in the caller.</p></div></li>
      <li><span>04</span><ShieldCheck size={17} /><div><strong>Prove the contract</strong><p>Exercise keyboard behavior, loading and failure states, content pressure, mobile widths, and representative production consumers.</p></div></li>
    </ol>

    <div className="cl-gamechanger"><div><span>WHY THIS CHANGES DELIVERY</span><h4>Every new screen starts from tested decisions.</h4><p>The team spends review time on the product problem instead of rediscovering button hierarchy, focus behavior, error placement, spacing, and responsive rules. Improvements flow back to every consumer through a small, typed API.</p></div><div><strong>Before the library</strong><ul><li>Visual rules are copied into features</li><li>States appear late during QA</li><li>Design and code use different names</li><li>Fixes stop at one screen</li></ul></div><div><strong>With the library</strong><ul><li>Intent selects a known component</li><li>States are part of the contract</li><li>Tokens connect design and code</li><li>Fixes improve every consumer</li></ul></div></div>
    <div className="cl-next"><Box size={18} /><div><strong>Tour every token, component, and product pattern.</strong><p>The full catalog lets you swap semantic tokens and inspect the hierarchy. The installable Design System skill explains how to extend it safely.</p></div><Link href="/system#primitives">Open component catalog <ArrowRight size={14} /></Link><Link href="/library?skill=design-system#skills">Open Design System skill <ArrowRight size={14} /></Link></div>
  </section>;
}
