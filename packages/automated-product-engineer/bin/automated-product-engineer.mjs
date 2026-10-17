#!/usr/bin/env node

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = path.resolve(packageRoot, "..", "..");
const sourceRoot = existsSync(path.join(packageRoot, "payload", "skills"))
  ? path.join(packageRoot, "payload")
  : repositoryRoot;
const targets = ["universal", "codex", "claude", "cursor", "windsurf", "copilot", "orca", "generic"];
const components = ["skills", "docs", "templates", "examples"];

const adapters = {
  cursorRule: `---
description: Apply the automated product engineering workflow for substantial features, redesigns, and design-to-app work.
globs:
alwaysApply: false
---

Read @.ai/skills/automated-product-engineer/SKILL.md and load only the specialist skills it routes to for the current task. Use @.automated-product-engineer/INSTALLATION.md to find the installed architecture guides, working examples, templates, checklists, and test/CI patterns. Inspect available context before asking questions; when a material input is still missing, ask only for that decision and generate a tailored handoff request when another tool or teammate must provide it.
`,
  cursorCommand: `Use the workflow in \`.ai/skills/automated-product-engineer/SKILL.md\` to complete the requested feature from intake through a review-ready draft pull request. Consult \`.automated-product-engineer/INSTALLATION.md\` for local reference implementations, architecture guides, templates, checklists, and CI examples. Load only relevant specialist skills. Inspect available context before asking questions and generate a tailored request only when a material input must come from another tool or teammate. Preserve repository instructions and do not merge.
`,
  windsurfRule: `# Automated Product Engineer

For substantial feature, redesign, or design-to-app work, read \`.ai/skills/automated-product-engineer/SKILL.md\` and load only the specialist skills it routes to. Use \`.automated-product-engineer/INSTALLATION.md\` to find the installed architecture guides, examples, templates, checklists, and test/CI patterns. Inspect available context before asking questions; ask only for material missing decisions and generate a tailored handoff request when another tool or teammate must supply them. Preserve repository instructions, produce current QA and screenshot evidence, run retrospective fix-back, and stop at a review-ready draft pull request unless the user explicitly authorizes more.
`,
  copilotPrompt: `Use the \`automated-product-engineer\` agent skill to complete the requested feature from intake through a review-ready draft pull request. Consult \`.automated-product-engineer/INSTALLATION.md\` for local architecture guides, working examples, templates, checklists, and test/CI patterns. Load only relevant specialist skills, inspect available context before asking questions, and generate a tailored request only when a material input must come from another tool or teammate. Preserve repository instructions, capture current desktop and mobile evidence, run retrospective fix-back, and do not merge.
`,
  genericWorkflow: `# Automated Product Engineer

For substantial feature, redesign, or design-to-app work, begin with \`.ai/skills/automated-product-engineer/SKILL.md\`. Use \`.automated-product-engineer/INSTALLATION.md\` to find the installed architecture guides, working examples, templates, checklists, and test/CI patterns. Load only the specialist skills the conductor routes to. Inspect available context before asking questions; ask only for material missing decisions and generate a tailored handoff request when another tool or teammate must supply them. Follow the target repository's instructions and preserve human authority over merge and release.
`,
};

const toolkitEntries = {
  docs: ["README.md", "AGENTS.md", "LICENSE", "docs", "checklists"],
  templates: ["templates"],
  examples: [
    "app/api/examples",
    "app/examples/page.tsx",
    "app/guide/page.tsx",
    "app/system/page.tsx",
    "src/examples",
    "src/guide",
    "src/system",
    "src/ui",
    "supabase/migrations",
    "e2e/reference-app.spec.ts",
  ],
};

function usage() {
  return [
    "Install the Automated Product Engineer toolkit into an existing project.",
    "",
    "Usage:",
    "  pnpm dlx automated-product-engineer",
    "  pnpm dlx automated-product-engineer [install] [--target <target>] [--project <path>] [--only <parts>] [--force]",
    "",
    `Targets: ${targets.join(", ")}`,
    `Parts:   ${components.join(", ")} (default: all)`,
    "",
    "Examples:",
    "  pnpm dlx automated-product-engineer",
    "  pnpm dlx automated-product-engineer install --target claude --project ../my-app",
    "  pnpm dlx automated-product-engineer install --target cursor --only skills,docs",
  ].join("\n");
}

function parseOptions(args) {
  const remaining = [...args];
  const command = remaining[0] && !remaining[0].startsWith("-") ? remaining.shift() : "install";
  if (command !== "install") throw new Error(`Unknown command: ${command}\n\n${usage()}`);

  let target = "universal";
  let project = ".";
  let only = [...components];
  let force = false;

  for (let index = 0; index < remaining.length; index += 1) {
    const argument = remaining[index];
    if (argument === "--help" || argument === "-h") {
      console.log(usage());
      process.exit(0);
    }
    if (argument === "--force") {
      force = true;
      continue;
    }
    if (["--target", "--project", "--only"].includes(argument)) {
      const value = remaining[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${argument}.\n\n${usage()}`);
      if (argument === "--target") target = value;
      if (argument === "--project") project = value;
      if (argument === "--only") only = value.split(",").map((part) => part.trim()).filter(Boolean);
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${argument}\n\n${usage()}`);
  }

  if (!targets.includes(target)) throw new Error(`Choose a target: ${targets.join(", ")}.\n\n${usage()}`);
  const unknownParts = only.filter((part) => !components.includes(part));
  if (!only.length || unknownParts.length) {
    throw new Error(`Choose --only values from: ${components.join(", ")}.\n\n${usage()}`);
  }
  return { target, project, only: [...new Set(only)], force };
}

function resolveProject(input) {
  const expanded = input === "~" ? homedir() : input.startsWith("~/") ? path.join(homedir(), input.slice(2)) : input;
  const project = path.resolve(expanded);
  if (!existsSync(project) || !statSync(project).isDirectory()) {
    throw new Error(`Project directory does not exist: ${project}`);
  }
  return project;
}

function writeManagedFile(destination, content, force) {
  const next = Buffer.isBuffer(content) ? content : Buffer.from(content);
  if (existsSync(destination)) {
    const current = readFileSync(destination);
    if (current.equals(next)) return false;
    if (!force) throw new Error(`Refusing to overwrite existing file: ${destination}\nRe-run with --force after reviewing the local changes.`);
  }
  mkdirSync(path.dirname(destination), { recursive: true });
  writeFileSync(destination, next);
  return true;
}

function copyEntry(source, destination, force, installedFiles) {
  const sourceStat = statSync(source);
  if (sourceStat.isDirectory()) {
    for (const entry of readdirSync(source, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      copyEntry(path.join(source, entry.name), path.join(destination, entry.name), force, installedFiles);
    }
    return;
  }
  if (sourceStat.isFile()) {
    writeManagedFile(destination, readFileSync(source), force);
    installedFiles.push(destination);
  }
}

function copyPackageEntry(entry, toolkitRoot, force, installedFiles) {
  const source = path.join(sourceRoot, entry);
  if (!existsSync(source)) throw new Error(`Package is missing required toolkit content: ${entry}`);
  copyEntry(source, path.join(toolkitRoot, entry), force, installedFiles);
}

function copySkills(project, target, force, installedFiles) {
  const skillsDirectory = path.join(sourceRoot, "skills");
  const destinations = [];
  if (target === "universal") {
    destinations.push(path.join(project, ".agents", "skills"));
    destinations.push(path.join(project, ".claude", "skills"));
    destinations.push(path.join(project, ".ai", "skills"));
  } else if (["codex", "copilot"].includes(target)) destinations.push(path.join(project, ".agents", "skills"));
  else if (target === "claude") destinations.push(path.join(project, ".claude", "skills"));
  else if (target === "orca") {
    destinations.push(path.join(project, ".agents", "skills"));
    destinations.push(path.join(project, ".claude", "skills"));
  } else destinations.push(path.join(project, ".ai", "skills"));

  for (const destination of destinations) copyEntry(skillsDirectory, destination, force, installedFiles);

  if (["universal", "cursor"].includes(target)) {
    writeManagedFile(path.join(project, ".cursor", "rules", "automated-product-engineer.mdc"), adapters.cursorRule, force);
    writeManagedFile(path.join(project, ".cursor", "commands", "automated-product-engineer.md"), adapters.cursorCommand, force);
  }
  if (["universal", "windsurf"].includes(target)) {
    writeManagedFile(path.join(project, ".windsurf", "rules", "automated-product-engineer.md"), adapters.windsurfRule, force);
  }
  if (["universal", "copilot"].includes(target)) {
    writeManagedFile(path.join(project, ".github", "prompts", "automated-product-engineer.prompt.md"), adapters.copilotPrompt, force);
  }
  if (["universal", "generic"].includes(target)) {
    writeManagedFile(path.join(project, "AI_WORKFLOW.md"), adapters.genericWorkflow, force);
  }
}

function installationGuide(target, selected) {
  const included = selected.map((part) => `- **${part}**`).join("\n");
  return `# Automated Product Engineer — Local Toolkit

This directory is an installed, read-only reference kit for the host application. Adapt examples to the host repository; do not import this directory as application runtime code.

## Installed parts

${included}

## Where to start

- \`docs/how-to-use.md\`: end-to-end workflow.
- \`docs/knowledge-coverage.md\`: source-library coverage and deliberate exclusions.
- \`docs/architecture.md\`: application boundaries and ownership.
- \`docs/reference-app-architecture.md\`: the complete reference implementation map.
- \`docs/design-system-blueprint.md\`: semantic tokens and component hierarchy.
- \`docs/testing-and-ci.md\`: focused tests, E2E, visual CI, and sharding.
- \`docs/automated-delivery.md\`: screenshots, retrospective fix-back, and draft PR automation.
- \`checklists/integration.md\`: implementation and review gates.
- \`templates/\`: copyable contracts, components, tests, CI, automation, and retrospective files.
- \`src/examples/\` and \`app/api/examples/\`: working vertical-slice examples.
- \`src/guide/\` and \`app/guide/page.tsx\`: interactive architecture, component-library onboarding, and state-management playbooks.
- \`src/system/\` and \`src/ui/\`: the interactive token and component system implementation.

The selected agent adapter is **${target}**. Invoke \`automated-product-engineer\` for a complete feature or a specialist skill for focused work. The agent should inspect the host repository first, consult this kit for proven patterns, and adapt rather than copy blindly.

Re-run the installer to update identical files. Use \`--force\` only after reviewing changes to locally modified toolkit files.
`;
}

function install(options) {
  const project = resolveProject(options.project);
  const toolkitRoot = path.join(project, ".automated-product-engineer");
  const installedFiles = [];

  if (options.only.includes("skills")) copySkills(project, options.target, options.force, installedFiles);
  for (const component of ["docs", "templates", "examples"]) {
    if (!options.only.includes(component)) continue;
    for (const entry of toolkitEntries[component]) copyPackageEntry(entry, toolkitRoot, options.force, installedFiles);
  }

  writeManagedFile(path.join(toolkitRoot, "INSTALLATION.md"), installationGuide(options.target, options.only), options.force);
  writeManagedFile(
    path.join(toolkitRoot, "installation.json"),
    `${JSON.stringify({ package: "automated-product-engineer", target: options.target, parts: options.only }, null, 2)}\n`,
    options.force,
  );

  console.log(`Installed Automated Product Engineer into ${project}`);
  console.log(`Target: ${options.target}`);
  console.log(`Parts: ${options.only.join(", ")}`);
  console.log(`Toolkit: ${toolkitRoot}`);
  console.log("Next: ask your agent to use the automated-product-engineer skill for your feature.");
}

try {
  install(parseOptions(process.argv.slice(2)));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
