"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ArrowUpRight, Check, ChevronDown, Code2, Database, LockKeyhole, Server, ShieldCheck, Sparkles, Workflow } from "lucide-react";
import { architectureLayers, extensionRules, requestLifecycle, verificationLayers } from "@/src/examples/architecture-reference";
import { ComponentLibraryPlaybook } from "./component-library-playbook";
import { StateManagementPlaybook } from "./state-management-playbook";

type SourceFile = {
  readonly id: string;
  readonly label: string;
  readonly path: string;
  readonly startLine: number;
  readonly endLine: number;
  readonly summary: string;
  readonly code: string;
};

function NumberedCode({ file }: { file: SourceFile }) {
  return <pre className="source-code" aria-label={`${file.label} code excerpt`}><code>{file.code.split("\n").map((line, index) => <span className="source-code-line" key={`${file.id}-${index}`}><i>{index + 1}</i><b>{line || " "}</b></span>)}</code></pre>;
}

export function DeveloperGuide() {
  const [activeId, setActiveId] = useState<(typeof architectureLayers)[number]["id"]>("interaction");
  const [activeFileId, setActiveFileId] = useState("interaction-contract");
  const [activeLifecycleId, setActiveLifecycleId] = useState<(typeof requestLifecycle)[number]["id"]>("intent");
  const [activeVerificationId, setActiveVerificationId] = useState<(typeof verificationLayers)[number]["id"]>("domain");
  const active = architectureLayers.find((layer) => layer.id === activeId) ?? architectureLayers[0];
  const activeFiles = active.files as readonly SourceFile[];
  const activeFile = activeFiles.find((file) => file.id === activeFileId) ?? activeFiles[0];
  const activeLifecycle = requestLifecycle.find((step) => step.id === activeLifecycleId) ?? requestLifecycle[0];
  const activeVerification = verificationLayers.find((layer) => layer.id === activeVerificationId) ?? verificationLayers[0];
  const selectLayer = (layer: (typeof architectureLayers)[number]) => {
    setActiveId(layer.id);
    setActiveFileId(layer.files[0].id);
  };
  return <article id="architecture" className="developer-guide">
    <header className="guide-intro"><div><span>COMPLETE IMPLEMENTATION GUIDE</span><h1>One action. Every boundary. No missing middle.</h1><p>This page contains the architecture decision, real source excerpts, state model, extension rules, and verification contract. Follow the same path when adding a vertical slice.</p></div><dl><div><dt>5</dt><dd>explicit boundaries</dd></div><div><dt>2</dt><dd>replaceable adapters</dd></div><div><dt>1</dt><dd>policy authority</dd></div></dl></header>
    <nav className="guide-nav" aria-label="Developer guide sections"><a href="#guide-layers">Layers</a><a href="#guide-lifecycle">Request lifecycle</a><a href="#guide-components">Component library</a><a href="#guide-state">State playbook</a><a href="#guide-extension">Extension</a><a href="#guide-verification">Verification</a></nav>

    <section className="guide-section" id="guide-layers"><div className="guide-heading"><span>01 / LAYERS</span><div><h3>Explore the source by responsibility.</h3><p>Select a layer to see what it owns, why the boundary exists, and the code that implements it.</p></div></div>
      <div className="layer-explorer"><div className="layer-stack">{architectureLayers.map((layer, index) => <button className={active.id === layer.id ? "active" : ""} key={layer.id} onClick={() => selectLayer(layer)} aria-pressed={active.id === layer.id}><span>{String(index + 1).padStart(2, "0")}</span><div><small>{layer.label}</small><strong>{layer.title}</strong><p>{layer.detail}</p></div><ArrowRight size={16} /></button>)}</div>
        <div className="source-reader"><header><div><span>{active.label}</span><strong>{active.title}</strong></div><div className="source-reader-actions"><label><span>Source file</span><select aria-label={`${active.title} source file`} value={activeFile.id} onChange={(event) => setActiveFileId(event.target.value)}>{activeFiles.map((file) => <option value={file.id} key={file.id}>{file.label}</option>)}</select></label><a href={`https://github.com/kuck1/automated-product-engineer-nextjs/blob/main/${activeFile.path}#L${activeFile.startLine}-L${activeFile.endLine}`} target="_blank" rel="noreferrer">View full source <ArrowUpRight size={13} /></a></div></header><p>{active.why}</p><div className="source-file-meta"><div><code>{activeFile.path}</code><span>Source area · L{activeFile.startLine}–L{activeFile.endLine}</span></div><strong>{activeFile.summary}</strong></div><NumberedCode file={activeFile} /><footer><LockKeyhole size={14} /> Readable implementation pattern based on the linked source. Open the file for the exact code.</footer></div>
      </div>
    </section>

    <section className="guide-section" id="guide-lifecycle"><div className="guide-heading"><span>02 / REQUEST LIFECYCLE</span><div><h3>Trace a mutation end to end.</h3><p>The happy path and failure path use the same six steps. Select a step to inspect its owner, recovery contract, source, and reusable guidance.</p></div></div>
      <ol className="lifecycle-grid">{requestLifecycle.map((step, index) => <li className={activeLifecycle.id === step.id ? "active" : ""} key={step.id}><button type="button" onClick={() => setActiveLifecycleId(step.id)} aria-expanded={activeLifecycle.id === step.id} aria-controls="lifecycle-detail"><span>{String(index + 1).padStart(2, "0")}</span><Workflow size={18} /><strong>{step.title}</strong><p>{step.detail}</p><small>{activeLifecycle.id === step.id ? "Showing details" : "View details"}<ChevronDown size={13} /></small></button></li>)}</ol>
      <article className="lifecycle-detail" id="lifecycle-detail" aria-live="polite"><header><div><span>{activeLifecycle.owner}</span><h4>{activeLifecycle.title}</h4></div><code>{activeLifecycle.source.label}</code></header><div className="lifecycle-detail-grid"><section><small>RESPONSIBILITY</small><p>{activeLifecycle.behavior}</p></section><section><small>FAILURE CONTRACT</small><p>{activeLifecycle.failure}</p></section></div><footer><a href={`https://github.com/kuck1/automated-product-engineer-nextjs/blob/main/${activeLifecycle.source.path}#L${activeLifecycle.source.startLine}-L${activeLifecycle.source.endLine}`} target="_blank" rel="noreferrer">View implementation <ArrowUpRight size={13} /></a><Link href={`/library?skill=${activeLifecycle.skill.slug}#skills`} target="_blank">Open {activeLifecycle.skill.label} skill <ArrowUpRight size={13} /></Link></footer></article>
    </section>

    <ComponentLibraryPlaybook />

    <StateManagementPlaybook />

    <section className="guide-section guide-split" id="guide-extension"><div><div className="guide-heading"><span>05 / EXTENSION</span><div><h3>Extend contracts, not conditionals.</h3><p>New capability enters through one stable seam. Existing layers remain closed to unrelated details.</p></div></div><div className="extension-list">{extensionRules.map(([change, rule]) => <div key={change}><Sparkles size={16} /><span><strong>{change}</strong><p>{rule}</p></span></div>)}</div></div><aside className="production-rules"><h3>Boundary rules</h3><ul><li><Check size={14} /> Pages compose; they do not query databases.</li><li><Check size={14} /> Routes authenticate, validate, delegate, normalize.</li><li><Check size={14} /> Services own authorization and business policy.</li><li><Check size={14} /> Repositories expose domain-shaped capabilities.</li><li><Check size={14} /> Adapters translate vendor records at the edge.</li></ul><div><Server size={18} /><span><strong>Auth before policy</strong><p>The server resolves an actor. The service verifies actor-to-workspace ownership for every record.</p></span></div><div><Database size={18} /><span><strong>RLS as defense in depth</strong><p>Supabase policies repeat tenant isolation below the application service.</p></span></div></aside></section>

    <section className="guide-section" id="guide-verification"><div className="guide-heading"><span>06 / VERIFICATION</span><div><h3>Evidence follows the architecture.</h3><p>Test each responsibility at the narrowest useful layer. Select a card to see what it proves, what evidence to retain, and where the working example lives.</p></div></div><div className="verification-grid">{verificationLayers.map((layer, index) => <article className={activeVerification.id === layer.id ? "active" : ""} key={layer.id}><button type="button" onClick={() => setActiveVerificationId(layer.id)} aria-expanded={activeVerification.id === layer.id} aria-controls="verification-detail"><span>{String(index + 1).padStart(2, "0")}</span><ShieldCheck size={20} /><h4>{layer.title}</h4><p>{layer.detail}</p><small>{activeVerification.id === layer.id ? "Showing evidence" : "View evidence"}<ChevronDown size={13} /></small></button></article>)}</div>
      <article className="lifecycle-detail verification-detail" id="verification-detail" aria-live="polite"><header><div><span>VERIFICATION LAYER</span><h4>{activeVerification.title}</h4></div><code>{activeVerification.source.label}</code></header><div className="lifecycle-detail-grid"><section><small>WHAT THIS PROVES</small><p>{activeVerification.goal}</p></section><section><small>EVIDENCE TO KEEP</small><p>{activeVerification.evidence}</p></section></div><footer><a href={`https://github.com/kuck1/automated-product-engineer-nextjs/blob/main/${activeVerification.source.path}#L${activeVerification.source.startLine}-L${activeVerification.source.endLine}`} target="_blank" rel="noreferrer">View verification source <ArrowUpRight size={13} /></a><Link href={`/library?skill=${activeVerification.skill.slug}#skills`} target="_blank">Open {activeVerification.skill.label} skill <ArrowUpRight size={13} /></Link></footer></article>
      <div className="guide-finish"><Code2 size={20} /><div><strong>Definition of done</strong><p>A typed contract, thin route, policy service, adapter-backed repository, explicit client state, failure UX, focused tests, reviewed screenshots, green CI, and a reviewable pull request.</p></div></div></section>
  </article>;
}

