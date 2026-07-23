# Devsigner

A simplified git + GitHub workflow for designers. Make front-end changes on a
safe branch and open a reviewable pull request — without touching the terminal —
with an AI-assisted PR description so developers can review quickly.

Devsigner is a local macOS desktop app. It has **no accounts and no backend**: it
drives your own `git` and the GitHub CLI (`gh`) on your machine and stores
nothing of its own.

## How it works

1. **Connect GitHub** — a one-time `gh` sign-in, guided in-app.
2. **Select a repository** — any local git repo.
3. **New branch** — describe your change in plain language; Devsigner branches off
   the latest default branch so you get a safe copy to work in.
4. **Edit** — open the repo in Cursor or Claude Code and make your changes.
5. **Save** — commit ("saves") and stash from the branch view.
6. **Create PR** — Devsigner pushes and opens a pull request with a generated
   description of what changed, which components/tokens were reused, and what to
   review.

The activity list tracks work as one lifecycle: in-progress branches → in-review
(open PRs) → done (merged) / cancelled (closed).

## Requirements

- macOS (Apple Silicon)
- `git`
- [GitHub CLI](https://cli.github.com) (`gh`) — for opening and reading pull requests
- _(optional)_ `ANTHROPIC_API_KEY` for AI-written PR descriptions

## Develop

```bash
npm install
npm start        # run the app from source
```

## Build

```bash
npm run pack     # unpacked app  ->  dist/mac-arm64/Devsigner.app
npm run dist     # installable   ->  dist/Devsigner-<version>-arm64.dmg
```

The DMG is currently **unsigned** (`build.mac.identity: null`) — fine locally,
but a downloaded copy will trip Gatekeeper until it's signed and notarized with
an Apple Developer ID. See [Distribution](#distribution-signing).

## GitHub connection

Devsigner uses the `gh` CLI for pull requests and never handles your credentials —
`gh` and the browser do the sign-in. Connect, switch accounts, or re-check from
the account chip at the top-right of the app.

## AI-assisted descriptions

PR descriptions are **deterministic by default** — Devsigner parses the diff for
reused components, design tokens, and assumption markers. If `ANTHROPIC_API_KEY`
is set in the environment, the prose is written by Claude (`DEVSIGNER_MODEL`
overrides the model; default `claude-sonnet-5`). LLM failures fall back to the
deterministic text, so creating a PR is never blocked.

> A Finder-launched app doesn't inherit your shell environment, so the AI path
> only runs when the app is launched from a terminal that has `ANTHROPIC_API_KEY`
> set (e.g. `npm start`). The packaged app uses the deterministic description.

## Editable zone

Devsigner protects backend/infra from accidental edits. The first time you start a
branch in a repo it writes a `.devsignerrc.json` and installs a pre-commit guard
that blocks commits touching files outside the editable zone (the front end).
Tune the globs per repo:

```json
{
  "editablePaths": ["**/*.css", "**/components/**", "apps/web/**"],
  "restrictedPaths": ["**/auth/**", "**/api/**", "**/*.sql"]
}
```

Files outside the zone are flagged (a lighthouse warning) rather than silently
committed; `restrictedPaths` always wins.

## Architecture

The engine in `src/engine` is UI-agnostic and drives both the CLI
(`bin/devsigner.mjs`) and the Electron app (`src/main`, `src/renderer`). No
bundler and no framework — plain ES modules with a small, sandboxed preload
bridge; the renderer never touches Node directly.

## Distribution (signing)

For a public download, sign and notarize with an Apple Developer ID:

1. Set `build.mac.identity` in `package.json` to your Developer ID Application cert.
2. Provide notarization credentials via env — `APPLE_ID`,
   `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID` — and electron-builder notarizes
   automatically.
3. `npm run dist`.

## License

MIT — see [LICENSE](LICENSE).
