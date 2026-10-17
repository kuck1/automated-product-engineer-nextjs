import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const cli = path.join(process.cwd(), "packages", "automated-product-engineer", "bin", "automated-product-engineer.mjs");

function run(args: string[], cwd = process.cwd()) {
  return spawnSync(process.execPath, [cli, ...args], { cwd, encoding: "utf8" });
}

function countSkills(directory: string) {
  return readdirSync(directory, { withFileTypes: true }).filter((entry) => entry.isDirectory()).length;
}

test("zero-flag install adds the universal skills and complete reference kit", () => {
  const project = mkdtempSync(path.join(tmpdir(), "ape-cli-default-"));
  const result = run([], project);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(countSkills(path.join(project, ".agents", "skills")), 13);
  assert.equal(countSkills(path.join(project, ".claude", "skills")), 13);
  assert.equal(countSkills(path.join(project, ".ai", "skills")), 13);
  assert.ok(existsSync(path.join(project, ".automated-product-engineer", "docs", "architecture.md")));
  assert.ok(existsSync(path.join(project, ".automated-product-engineer", "templates", "ci", "github-actions.yml")));
  assert.ok(existsSync(path.join(project, ".automated-product-engineer", "src", "examples", "service.ts")));
  assert.ok(existsSync(path.join(project, ".automated-product-engineer", "src", "guide", "state-management-playbook.tsx")));
  assert.ok(existsSync(path.join(project, ".automated-product-engineer", "src", "system", "design-system-explorer.tsx")));
  assert.ok(existsSync(path.join(project, ".agents", "skills", "frontend-api-db", "references", "state-management-scenarios.md")));
  assert.ok(existsSync(path.join(project, ".agents", "skills", "security-review", "references", "supabase-auth-sessions.md")));
  assert.ok(existsSync(path.join(project, ".cursor", "rules", "automated-product-engineer.mdc")));
  assert.ok(existsSync(path.join(project, ".github", "prompts", "automated-product-engineer.prompt.md")));
});

test("advanced flags can install only skills for one agent", () => {
  const project = mkdtempSync(path.join(tmpdir(), "ape-cli-focused-"));
  const result = run(["--target", "codex", "--only", "skills"], project);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(countSkills(path.join(project, ".agents", "skills")), 13);
  assert.equal(existsSync(path.join(project, ".claude")), false);
  assert.equal(existsSync(path.join(project, ".automated-product-engineer", "docs")), false);
  assert.deepEqual(
    JSON.parse(readFileSync(path.join(project, ".automated-product-engineer", "installation.json"), "utf8")),
    { package: "automated-product-engineer", target: "codex", parts: ["skills"] },
  );
});

test("installer protects locally changed files unless force is explicit", () => {
  const project = mkdtempSync(path.join(tmpdir(), "ape-cli-conflict-"));
  assert.equal(run(["--target", "codex", "--only", "skills"], project).status, 0);

  const skill = path.join(project, ".agents", "skills", "automated-product-engineer", "SKILL.md");
  writeFileSync(skill, "local edit\n");
  const protectedResult = run(["--target", "codex", "--only", "skills"], project);
  assert.notEqual(protectedResult.status, 0);
  assert.match(protectedResult.stderr, /Refusing to overwrite existing file/);

  const forcedResult = run(["--target", "codex", "--only", "skills", "--force"], project);
  assert.equal(forcedResult.status, 0, forcedResult.stderr);
  assert.notEqual(readFileSync(skill, "utf8"), "local edit\n");
});
