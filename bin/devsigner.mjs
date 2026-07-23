#!/usr/bin/env node
// Devsigner CLI — a thin formatter over src/engine/graft-core.mjs.
import * as graft from "../src/engine/graft-core.mjs";

const C = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
};
const die = (m) => { console.error(`${C.red("✗ graft:")} ${m}`); process.exit(1); };

const cwd = process.cwd();

function usage() {
  console.log(`${C.bold("graft")} — designer-friendly git/GitHub workflow

  ${C.bold("graft start")} <name>         create + checkout a branch from latest default branch
  ${C.bold("graft status")}               plain-language summary of changes vs default branch
  ${C.bold("graft ship")} [--dry-run]     stage, commit, push, open an annotated PR
                               --title "..."   override generated title`);
}

async function main() {
  const [, , cmd, ...rest] = process.argv;
  if (!graft.isRepo(cwd) && cmd !== "help" && cmd !== undefined) die("not inside a git repository");

  switch (cmd) {
    case "start": {
      const name = rest.join(" ").trim();
      if (!name) die('usage: graft start <branch name>');
      const r = graft.start({ cwd, name });
      console.log(`${C.green("✓")} on new branch ${C.bold(r.branch)} (from ${r.base}).`);
      if (r.zoneCreated) console.log(`  ${C.dim("· wrote .devsignerrc.json (editable zone = front end)")}`);
      console.log(`  ${C.dim("· installed pre-commit guard: commits outside the editable zone are blocked")}`);
      if (r.hooksBackedUp) console.log(`  ${C.yellow("· backed up your existing pre-commit hook → pre-commit.pre-graft")}`);
      break;
    }
    case "status": {
      const s = graft.status({ cwd });
      console.log(`\n${C.bold("Branch:")} ${s.branch}   ${C.dim(`(vs origin/${s.defaultBranch})`)}`);
      console.log(`${C.bold("Diff:")}   ${s.stat || "no committed changes vs base"}\n`);
      if (!s.files.length) { console.log(C.dim("No changes yet.")); break; }
      console.log(C.bold(`Changed files (${s.files.length}):`));
      for (const f of s.files) {
        const mark = f.sensitive ? C.yellow("⚠") : C.green("●");
        const note = f.sensitive ? C.dim(`— ${f.status} (sensitive)`) : C.dim(`— ${f.status}`);
        console.log(`  ${mark} ${f.file} ${note}`);
      }
      if (s.signal.components.length) console.log(`\n${C.bold("Reuses components:")} ${s.signal.components.join(", ")}`);
      if (s.signal.tokens.length) console.log(`${C.bold("Reuses tokens:")} ${s.signal.tokens.join(", ")}`);
      if (s.signal.assumptions.length) console.log(C.yellow(`${s.signal.assumptions.length} assumption marker(s)`));
      console.log("");
      break;
    }
    case "ship": {
      const dryRun = rest.includes("--dry-run");
      const ti = rest.indexOf("--title");
      const title = ti >= 0 ? rest[ti + 1] : undefined;
      const githubToken = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
      const r = await graft.ship({ cwd, dryRun, title, githubToken, anthropicKey: process.env.ANTHROPIC_API_KEY });
      if (dryRun) {
        console.log(`\n${C.bold("── DRY RUN ──")}  (${r.annotation.source})`);
        console.log(`${C.bold("Title:")} ${r.annotation.title}\n`);
        console.log(r.annotation.body);
        console.log(`\n${C.dim("(nothing committed, pushed, or opened.)")}`);
      } else {
        console.log(`${C.green("✓")} committed=${r.committed} pushed=${r.pushed}`);
        console.log(`${C.green("✓")} PR opened (${r.via}): ${r.prUrl}`);
      }
      break;
    }
    case "help": case "--help": case "-h": case undefined:
      usage(); break;
    default:
      die(`unknown command "${cmd}"`);
  }
}

main().catch((e) => die(e.message || String(e)));
