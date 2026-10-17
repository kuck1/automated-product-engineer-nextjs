import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = path.resolve(packageRoot, "..", "..");
const payloadRoot = path.join(packageRoot, "payload");

const entries = [
  "README.md",
  "AGENTS.md",
  "LICENSE",
  "skills",
  "docs",
  "checklists",
  "templates",
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
];

rmSync(payloadRoot, { recursive: true, force: true });
mkdirSync(payloadRoot, { recursive: true });

for (const entry of entries) {
  const source = path.join(repositoryRoot, entry);
  if (!existsSync(source)) throw new Error(`Cannot package missing toolkit content: ${entry}`);
  cpSync(source, path.join(payloadRoot, entry), { recursive: true });
}

console.log(`Prepared ${entries.length} toolkit entries in ${payloadRoot}`);
