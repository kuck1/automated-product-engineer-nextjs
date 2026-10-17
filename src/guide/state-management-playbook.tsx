"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronDown,
  CircleDot,
  Cloud,
  Code2,
  Database,
  ExternalLink,
  KeyRound,
  Layers3,
  MonitorUp,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { LiveStateDemo } from "./live-state-demos";

type ScenarioId = "points" | "release" | "windows" | "chat" | "document" | "auth";
type LabId = "points" | "race" | "windows";

const owners = [
  { name: "Component", scope: "One interaction", examples: "Open menu, draft input, hover, unsaved step", tool: "useState / useReducer", tone: "violet" },
  { name: "URL", scope: "Shareable navigation", examples: "Selected account, filters, tab, pagination", tool: "searchParams", tone: "blue" },
  { name: "Context", scope: "One React subtree", examples: "Theme, current workspace, compound workflow dispatch", tool: "context + reducer", tone: "amber" },
  { name: "Server cache", scope: "Remote snapshots", examples: "Points, releases, messages, document metadata", tool: "TanStack Query", tone: "mint" },
  { name: "Domain service", scope: "Durable truth", examples: "Authorization, revisions, policy, canonical writes", tool: "API + Supabase", tone: "coral" },
] as const;

const scenarios = [
  {
    id: "points",
    number: "01",
    title: "Points update everywhere",
    product: "Shared account balance",
    summary: "A reward earned on one page must update the top bar, account page, and open dialogs without copying the balance into three stores.",
    surfaces: ["Top bar", "Rewards page", "Checkout dialog"],
    owner: "TanStack Query cache",
    transport: "Optimistic mutation → API → canonical response",
    protection: "Cancel, snapshot, rollback, invalidate",
    pattern: "Every surface reads the same ['account', id] query. The mutation patches that cache once and replaces the optimistic value with the server response.",
    antiPattern: "Keeping a points useState in the top bar, another in the page, and a context copy. They drift as soon as one mutation fails or refetches.",
    code: `onMutate: async (delta) => {
  await queryClient.cancelQueries({ queryKey: accountKey });
  const previous = queryClient.getQueryData(accountKey);
  queryClient.setQueryData(accountKey, account => ({
    ...account,
    points: account.points + delta,
  }));
  return { previous };
},
onError: (_error, _delta, context) =>
  queryClient.setQueryData(accountKey, context?.previous),
onSettled: () =>
  queryClient.invalidateQueries({ queryKey: accountKey })`,
    skill: "frontend-api-db",
  },
  {
    id: "release",
    number: "02",
    title: "Out-of-order responses",
    product: "Release readiness",
    summary: "A slower request for an old release finishes after the newest request and tries to paint stale data into the inspector.",
    surfaces: ["Release list", "Inspector", "Readiness summary"],
    owner: "Query key + request signal",
    transport: "Selection → keyed query → AbortSignal",
    protection: "Cancel obsolete work; verify entity and revision",
    pattern: "Put the entity identity in the query key and pass TanStack Query's AbortSignal into fetch. The server still rejects stale writes by expectedRevision.",
    antiPattern: "A useEffect fetch with no cancellation that writes into one shared result state, regardless of which entity is selected when it resolves.",
    code: `useQuery({
  queryKey: ["release", releaseId],
  queryFn: ({ signal }) =>
    fetch(\`/api/releases/\${releaseId}\`, { signal })
      .then(assertOk)
      .then(response => response.json()),
});

// Every mutation also sends expectedRevision.
// A 409 means refetch and reconcile; never overwrite.`,
    skill: "frontend-api-db",
  },
  {
    id: "windows",
    number: "03",
    title: "Two windows save one record",
    product: "Onboarding operations",
    summary: "Two tabs begin with revision 12. The first saves revision 13; the second must not silently overwrite it.",
    surfaces: ["Journey board", "Account drawer", "Second browser tab"],
    owner: "Server revision",
    transport: "PATCH(expectedRevision) + BroadcastChannel invalidation",
    protection: "409 conflict, refetch, explicit merge or retry",
    pattern: "The database row version is authoritative. BroadcastChannel tells sibling tabs to invalidate, while the API rejects a stale expectedRevision.",
    antiPattern: "Treating BroadcastChannel or a Web Lock as the database authority. Another device can still write, and locks disappear when the browser closes.",
    code: `const response = await fetch(\`/api/onboardings/\${id}\`, {
  method: "PATCH",
  body: JSON.stringify({ patch, expectedRevision }),
});

if (response.status === 409) {
  await queryClient.invalidateQueries({ queryKey: ["onboarding", id] });
  openConflictReview();
}

channel.postMessage({ type: "entity-saved", id });`,
    skill: "architecture-building",
  },
  {
    id: "chat",
    number: "04",
    title: "Chat, unread counts, and presence",
    product: "Support workspace",
    summary: "Messages arrive live, optimistic sends reconcile with server IDs, unread counts update globally, and typing indicators stay ephemeral.",
    surfaces: ["Conversation", "Inbox badge", "Agent presence"],
    owner: "Query cache + Realtime channels",
    transport: "Mutation for writes; Broadcast for events; Presence for occupancy",
    protection: "Client nonce dedupe, ordered server timestamp, reconnect backfill",
    pattern: "Persist messages through an authenticated mutation. Use Broadcast for transient typing/cursor events and Presence for who is online. Reconcile by client nonce.",
    antiPattern: "Writing chat messages only through realtime events, or using Presence for high-frequency cursor movement. Neither gives a durable, ordered record.",
    code: `const optimisticId = crypto.randomUUID();
sendMessage.mutate({ body, clientNonce: optimisticId });

channel.on("broadcast", { event: "typing" }, showTyping);
channel.on("presence", { event: "sync" }, syncOnlineAgents);

// Realtime insert or mutation response replaces the optimistic
// message with the canonical row matching clientNonce.`,
    skill: "frontend-api-db",
  },
  {
    id: "document",
    number: "05",
    title: "Collaborative document editor",
    product: "Implementation brief",
    summary: "Several people edit content, move cursors, reconnect after sleep, and occasionally collide on the same paragraph.",
    surfaces: ["Editor", "Outline", "Presence rail", "Revision history"],
    owner: "Collaboration engine + durable snapshots",
    transport: "Local operation → realtime operation log → checkpoint",
    protection: "Operation IDs, idempotency, reconnect replay, version checkpoints",
    pattern: "Keep the active draft local, exchange operations through a collaboration protocol, broadcast cursors separately, and checkpoint durable versions through the server.",
    antiPattern: "PATCHing the entire document on each keystroke with last-write-wins. Concurrent edits erase each other and reconnect cannot be reconciled safely.",
    code: `applyLocal(operation);
await collaboration.send({
  documentId,
  operationId: crypto.randomUUID(),
  baseVersion,
  operation,
});

// Cursors use an ephemeral Broadcast channel.
// Versioned snapshots use an authenticated server write.`,
    skill: "architecture-building",
  },
  {
    id: "auth",
    number: "06",
    title: "Cookie auth without random logouts",
    product: "Every authenticated surface",
    summary: "Browser and server agree on one cookie-backed session while publishable keys, user tokens, RLS, and server secrets keep distinct jobs.",
    surfaces: ["Browser client", "Server Component", "Route handler", "Supabase RLS"],
    owner: "Supabase Auth + server verification",
    transport: "Cookie session → claims/user verification → scoped query",
    protection: "PKCE, refresh rotation, secure cookie flow, RLS",
    pattern: "Use separate browser and server clients with cookie storage. Verify claims or the user on the server before data access; keep secret keys server-only.",
    antiPattern: "Trusting getSession user data for authorization, exposing a secret key, or mixing localStorage sessions with SSR cookies and redirects.",
    code: `const supabase = await createServerClient();
const { data, error } = await supabase.auth.getClaims();
if (error || !data?.claims.sub) redirect("/sign-in");

// Publishable key: browser-safe, always protected by RLS.
// Secret key: server-only, bypasses RLS, never user-controlled.
// getSession(): token access, not an authorization decision.`,
    skill: "security-review",
  },
] as const;

const authCases = [
  {
    id: "refresh",
    symptom: "Random logout after the tab sleeps",
    cause: "The refresh token was not persisted back to the shared cookie, or concurrent refreshes rotated the same token.",
    inspect: ["Set-Cookie on refresh responses", "One SSR client per request", "Clock skew and token expiry", "Duplicate refresh calls across tabs"],
    fix: "Use the SSR cookie adapter end to end, let one request refresh, then invalidate auth-aware queries when the session changes.",
  },
  {
    id: "redirect",
    symptom: "Signed in, then redirected back to sign-in",
    cause: "Navigation raced ahead of the browser saving the PKCE session, or server and browser clients read different storage.",
    inspect: ["Callback exchanges code before redirect", "Cookie is present on destination request", "Link prefetch before session write", "SameSite and domain attributes"],
    fix: "Complete the code exchange and cookie write before navigation. Avoid prefetching protected routes until the session is stored.",
  },
  {
    id: "rls",
    symptom: "Auth succeeds but queries return no rows",
    cause: "RLS has no matching policy, the request lacks the user JWT, or a policy compares the wrong tenant claim.",
    inspect: ["JWT reaches the data client", "auth.uid() and tenant membership", "SELECT and mutation policies", "Service-role use accidentally hides the defect"],
    fix: "Reproduce with the publishable key and the real user token, inspect the policy predicate, and keep application authorization above RLS.",
  },
] as const;

const sources = [
  ["React: sharing state", "https://react.dev/learn/sharing-state-between-components"],
  ["TanStack Query: optimistic updates", "https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates"],
  ["TanStack Query: cancellation", "https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation"],
  ["Supabase: server-side auth", "https://supabase.com/docs/guides/auth/server-side"],
  ["Supabase: API keys", "https://supabase.com/docs/guides/api/api-keys"],
  ["Supabase Realtime", "https://supabase.com/docs/guides/realtime"],
  ["Browser: BroadcastChannel", "https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel"],
] as const;

function PointsLab() {
  const queryClient = useQueryClient();
  const accountKey = ["state-playbook", "account"] as const;
  const account = useQuery({ queryKey: accountKey, queryFn: async () => ({ points: 740 }), initialData: { points: 740 }, staleTime: Infinity });
  const [event, setEvent] = useState("Both surfaces read the same cached account.");
  const mutation = useMutation({
    mutationFn: async ({ fail }: { delta: number; fail?: boolean }) => {
      await new Promise((resolve) => setTimeout(resolve, 260));
      if (fail) throw new Error("Server rejected duplicate award");
      const current = queryClient.getQueryData<{ points: number }>(accountKey) ?? { points: 740 };
      return { points: current.points };
    },
    onMutate: async ({ delta }) => {
      await queryClient.cancelQueries({ queryKey: accountKey });
      const previous = queryClient.getQueryData<{ points: number }>(accountKey) ?? { points: 740 };
      queryClient.setQueryData(accountKey, { points: previous.points + delta });
      setEvent(`Optimistic cache patch: +${delta} points`);
      return { previous };
    },
    onError: (error, _variables, context) => {
      queryClient.setQueryData(accountKey, context?.previous);
      setEvent(`${error.message}. Both surfaces rolled back.`);
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(accountKey, saved);
      setEvent("Canonical response reconciled both surfaces.");
    },
  });

  return <div className="points-lab">
    <div className="points-browser"><header><span><CircleDot size={13} /> Acme workspace</span><strong aria-label="Top bar points">{account.data.points} pts</strong></header><main><small>REWARDS PAGE</small><h5>Available points</h5><strong aria-label="Page points">{account.data.points}</strong><p>The top bar and page are two observers of one server snapshot.</p></main></div>
    <div className="lab-controls"><button disabled={mutation.isPending} onClick={() => mutation.mutate({ delta: 25 })}><Sparkles size={14} /> Award 25</button><button disabled={mutation.isPending} onClick={() => mutation.mutate({ delta: 25, fail: true })}><X size={14} /> Simulate rejection</button><button disabled={mutation.isPending} onClick={() => { queryClient.setQueryData(accountKey, { points: 740 }); setEvent("Lab reset to the server snapshot."); }}><RefreshCw size={14} /> Reset</button></div>
    <p className="lab-event" role="status"><Zap size={13} />{mutation.isPending ? "Mutation in flight; both surfaces already show optimistic state." : event}</p>
  </div>;
}

function RaceLab() {
  const [mode, setMode] = useState<"idle" | "broken" | "fixed">("idle");
  const [selection, setSelection] = useState("Mobile checkout");
  const [painted, setPainted] = useState("Mobile checkout · revision 8");
  const [events, setEvents] = useState<string[]>(["Ready to run the same two requests."]);
  const generation = useRef(0);

  const run = async (fixed: boolean) => {
    const runId = generation.current + 1;
    generation.current = runId;
    setMode(fixed ? "fixed" : "broken");
    setSelection("Mobile checkout");
    setPainted("Loading…");
    setEvents(["Request A: Mobile checkout (700ms)"]);
    setTimeout(() => {
      if (generation.current !== runId) return;
      setSelection("Team permissions");
      setEvents((current) => [...current, "Request B: Team permissions (180ms)"]);
      setTimeout(() => {
        if (generation.current !== runId) return;
        setPainted("Team permissions · revision 14");
        setEvents((current) => [...current, "B resolved and painted revision 14"]);
      }, 180);
    }, 70);
    setTimeout(() => {
      if (generation.current !== runId) return;
      if (fixed) {
        setEvents((current) => [...current, "A aborted: selection and query key changed"]);
      } else {
        setPainted("Mobile checkout · revision 8");
        setEvents((current) => [...current, "A resolved late and overwrote the current inspector"]);
      }
    }, 700);
  };

  return <div className="race-lab">
    <div className="race-stage"><div><small>CURRENT SELECTION</small><strong>{selection}</strong></div><ArrowRight size={17} /><div className={mode === "broken" && painted.startsWith("Mobile") ? "is-stale" : ""}><small>INSPECTOR PAINTED</small><strong>{painted}</strong></div></div>
    <div className="lab-controls"><button onClick={() => run(false)}><AlertTriangle size={14} /> Run broken race</button><button onClick={() => run(true)}><ShieldCheck size={14} /> Run fixed race</button></div>
    <ol className="race-events" aria-live="polite">{events.map((entry, index) => <li key={`${entry}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span>{entry}</li>)}</ol>
  </div>;
}

function WindowsLab() {
  const [server, setServer] = useState({ value: "Launch: Oct 27", revision: 12 });
  const [windows, setWindows] = useState({ a: { value: "Launch: Oct 27", revision: 12 }, b: { value: "Launch: Oct 27", revision: 12 } });
  const [notice, setNotice] = useState("Both windows loaded revision 12.");
  const save = (key: "a" | "b") => {
    const windowState = windows[key];
    if (windowState.revision !== server.revision) {
      setNotice(`Window ${key.toUpperCase()} received 409. Server is revision ${server.revision}; review before retrying.`);
      return;
    }
    const saved = { value: windowState.value, revision: server.revision + 1 };
    setServer(saved);
    setWindows((current) => ({ ...current, [key]: saved }));
    setNotice(`Window ${key.toUpperCase()} saved revision ${saved.revision}. Broadcast invalidates sibling tabs.`);
  };
  const refresh = (key: "a" | "b") => {
    setWindows((current) => ({ ...current, [key]: server }));
    setNotice(`Window ${key.toUpperCase()} refreshed to revision ${server.revision}.`);
  };
  return <div className="windows-lab">
    <header><Database size={15} /><span>Canonical row</span><strong>{server.value}</strong><code>rev {server.revision}</code></header>
    <div className="window-grid">{(["a", "b"] as const).map((key) => <section key={key}><div><MonitorUp size={15} /><strong>Window {key.toUpperCase()}</strong><code>loaded rev {windows[key].revision}</code></div><input aria-label={`Window ${key.toUpperCase()} value`} value={windows[key].value} onChange={(event) => setWindows((current) => ({ ...current, [key]: { ...current[key], value: event.target.value } }))} /><div><button onClick={() => save(key)}>Save expected rev {windows[key].revision}</button><button onClick={() => refresh(key)}>Refresh</button></div></section>)}</div>
    <p className="lab-event" role="status"><Cloud size={13} />{notice}</p>
  </div>;
}

export function StateManagementPlaybook() {
  const [activeScenarioId, setActiveScenarioId] = useState<ScenarioId>("points");
  const [activeLab, setActiveLab] = useState<LabId>("points");
  const [activeAuthId, setActiveAuthId] = useState("refresh");
  const activeScenario = scenarios.find((scenario) => scenario.id === activeScenarioId) ?? scenarios[0];
  const activeAuth = authCases.find((item) => item.id === activeAuthId) ?? authCases[0];

  return <section className="guide-section state-playbook" id="guide-state">
    <div className="guide-heading"><span>04 / STATE MANAGEMENT</span><div><h3>Put each kind of state where it can stay correct.</h3><p>Use component state for transient interaction, the URL for shareable navigation, Context for stable subtree coordination, TanStack Query for server snapshots, and the service plus database for durable truth.</p></div></div>

    <div className="owner-map" aria-label="State ownership decision model">{owners.map((owner, index) => <article className={`owner-${owner.tone}`} key={owner.name}><span>{String(index + 1).padStart(2, "0")}</span><strong>{owner.name}</strong><small>{owner.scope}</small><p>{owner.examples}</p><code>{owner.tool}</code></article>)}</div>

    <aside className="state-rule"><Layers3 size={21} /><div><strong>Context coordinates. Query caches synchronize.</strong><p>Context is ideal for stable values and reducer dispatch inside one tree. Remote records stay in the query cache, so every observer shares freshness, loading, rollback, and invalidation behavior.</p></div></aside>

    <div className="playbook-heading"><div><span>SCENARIO MATRIX</span><h4>Six hard cases, traced across real product surfaces.</h4></div><p>Select a scenario to see its owner, synchronization path, failure contract, pattern, antipattern, and implementation sketch.</p></div>

    <div className="scenario-workbench">
      <div className="scenario-list" role="tablist" aria-label="State management scenarios">{scenarios.map((scenario) => <button role="tab" aria-selected={activeScenario.id === scenario.id} aria-controls="scenario-detail" className={activeScenario.id === scenario.id ? "active" : ""} key={scenario.id} onClick={() => setActiveScenarioId(scenario.id)}><span>{scenario.number}</span><div><small>{scenario.product}</small><strong>{scenario.title}</strong></div><ChevronDown size={14} /></button>)}</div>
      <article className="scenario-detail" id="scenario-detail" role="tabpanel"><header><div><span>{activeScenario.product}</span><h4>{activeScenario.title}</h4><p>{activeScenario.summary}</p></div><Link href={`/library?skill=${activeScenario.skill}#skills`} target="_blank">Relevant skill <ExternalLink size={13} /></Link></header>
        <LiveStateDemo key={activeScenario.id} scenarioId={activeScenario.id} />
        <div className="scenario-surfaces"><span>SURFACES</span>{activeScenario.surfaces.map((surface) => <strong key={surface}>{surface}</strong>)}</div>
        <dl className="scenario-contract"><div><dt>Canonical owner</dt><dd>{activeScenario.owner}</dd></div><div><dt>Synchronization</dt><dd>{activeScenario.transport}</dd></div><div><dt>Failure protection</dt><dd>{activeScenario.protection}</dd></div></dl>
        <div className="pattern-compare"><section><span><Check size={13} /> PATTERN</span><p>{activeScenario.pattern}</p></section><section><span><AlertTriangle size={13} /> ANTIPATTERN</span><p>{activeScenario.antiPattern}</p></section></div>
        <pre><code>{activeScenario.code}</code></pre>
      </article>
    </div>

    <div className="playbook-heading lab-heading"><div><span>INTERACTIVE FAILURE LAB</span><h4>Trigger the bug. Then inspect the recovery.</h4></div><p>These deterministic labs expose behavior that is usually invisible until production: optimistic rollback, out-of-order responses, and stale multi-window writes.</p></div>
    <div className="state-lab-shell"><div className="state-lab-tabs" role="tablist" aria-label="Interactive state labs">{([ ["points", "Shared points"], ["race", "Request race"], ["windows", "Two-window save"] ] as const).map(([id, label]) => <button role="tab" aria-selected={activeLab === id} key={id} onClick={() => setActiveLab(id)}>{label}</button>)}</div><div className="state-lab-panel" role="tabpanel">{activeLab === "points" ? <PointsLab /> : activeLab === "race" ? <RaceLab /> : <WindowsLab />}</div></div>

    <div className="auth-unit">
      <header><div><span>AUTHENTICATION UNIT</span><h4>Trace the session before blaming the UI.</h4><p>Authentication, API keys, authorization, and data policy are separate layers. Debug them in order.</p></div><KeyRound size={30} /></header>
      <div className="auth-flow" aria-label="Supabase authentication flow"><div><span>01</span><strong>Browser client</strong><small>Publishable key + cookie session</small></div><ArrowRight size={15} /><div><span>02</span><strong>Server verification</strong><small>Claims or fresh user lookup</small></div><ArrowRight size={15} /><div><span>03</span><strong>Domain policy</strong><small>Tenant and action authorization</small></div><ArrowRight size={15} /><div><span>04</span><strong>Supabase RLS</strong><small>Database defense in depth</small></div></div>
      <div className="auth-debugger"><nav aria-label="Authentication symptoms">{authCases.map((item) => <button className={activeAuth.id === item.id ? "active" : ""} key={item.id} onClick={() => setActiveAuthId(item.id)}><AlertTriangle size={14} />{item.symptom}</button>)}</nav><article><small>LIKELY FAILURE</small><h5>{activeAuth.cause}</h5><span>Inspect in this order</span><ol>{activeAuth.inspect.map((step) => <li key={step}>{step}</li>)}</ol><div><ShieldCheck size={15} /><p>{activeAuth.fix}</p></div></article></div>
      <div className="key-boundary"><section><strong>Publishable key</strong><p>Safe to include in browser code. It identifies the application; a user token identifies the user. RLS must protect every exposed table.</p></section><section><strong>Secret key</strong><p>Server only. It bypasses RLS and must never be sent to the browser or used with untrusted user-controlled authorization.</p></section></div>
    </div>

    <div className="audit-path"><header><Code2 size={18} /><div><strong>Audit and upgrade an existing app</strong><p>Move one state class at a time; preserve behavior while changing ownership.</p></div></header><ol><li><span>01</span><div><strong>Inventory every value</strong><p>Name its source, readers, writers, lifetime, and recovery path.</p></div></li><li><span>02</span><div><strong>Remove duplicate truth</strong><p>Keep drafts local; replace copied server data with shared query keys.</p></div></li><li><span>03</span><div><strong>Harden writes</strong><p>Add expected revisions, idempotency keys, rollback, and canonical reconciliation.</p></div></li><li><span>04</span><div><strong>Trace auth end to end</strong><p>Verify cookie storage, server identity, domain authorization, and RLS separately.</p></div></li><li><span>05</span><div><strong>Test the failure order</strong><p>Delay, reject, duplicate, reconnect, open a second tab, and expire the session.</p></div></li></ol></div>

    <footer className="state-sources"><span>PRIMARY REFERENCES</span><div>{sources.map(([label, href]) => <a href={href} target="_blank" rel="noreferrer" key={href}>{label}<ExternalLink size={11} /></a>)}</div></footer>
  </section>;
}
