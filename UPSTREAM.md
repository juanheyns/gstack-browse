# Upstream Sync Guide

`gstack-browse` is extracted from [garrytan/gstack](https://github.com/garrytan/gstack).
This document explains how to pull future upstream changes into this repo.

---

## Overview

This repo uses a **vendor branch** pattern:

```
vendor branch  ──── raw upstream files (no patches)
                          │
                  git rebase onto
                          │
main branch    ──── our patches on top
```

- **`vendor`** holds exact copies of upstream files — no substitutions, no additions.
- **`main`** holds our patches as commits on top of `vendor`.

When upstream changes, we update `vendor` with the new raw content, then rebase
`main` onto it. Conflicts surface only in files we actually patched, nowhere else.

---

## One-Time Setup

Add the upstream repo as a remote (do this once, in your local clone):

```bash
git remote add upstream https://github.com/garrytan/gstack.git
git fetch upstream
```

Verify the vendor branch is tracking the expected SHA:

```bash
cat UPSTREAM_REF      # should print a commit hash
git log vendor --oneline -1
```

---

## Routine Sync Procedure

### 1. Check what changed upstream

```bash
scripts/sync-upstream.sh --check
```

This fetches `garrytan/gstack`, compares each mapped file against the current
`vendor` content, and prints a summary of changed files. Files with surgical
patches are flagged so you know to review the diffs carefully.

### 2. Apply the update

```bash
scripts/sync-upstream.sh --apply <UPSTREAM_SHA>
```

`<UPSTREAM_SHA>` is the upstream commit you want to sync to (from `git log upstream/main`).
The script will:

1. Switch to the `vendor` branch.
2. Copy the raw upstream files (no substitutions).
3. Commit with the new SHA recorded in `UPSTREAM_REF`.
4. Switch back to `main`.
5. Print the rebase command to run.

### 3. Rebase main

```bash
git rebase vendor
```

Most files merge cleanly (mechanical changes are consistent). Surgical patches
(listed below) may need manual resolution.

### 4. Fix conflicts and finish

```bash
# For each conflicted file:
git diff <file>        # review
# Edit to re-apply our patch on top of upstream's new version
git add <file>
git rebase --continue
```

### 5. Verify

```bash
bunx tsc --noEmit
bun test
```

---

## File Mapping (upstream → this repo)

| Upstream path (in `garrytan/gstack`) | This repo path | Notes |
|--------------------------------------|----------------|-------|
| `browse/src/*.ts` | `src/*.ts` | All TypeScript source |
| `browse/src/bun-polyfill.cjs` | `src/bun-polyfill.cjs` | |
| `browse/test/` | `test/` | All test files |
| `browse/scripts/build-node-server.sh` | `scripts/build-node-server.sh` | |
| `browse/bin/find-browse` | `scripts/find-browse` | Moved from scripts/ to bin/ upstream |
| `browse/bin/remote-slug` | `scripts/remote-slug` | Moved from scripts/ to bin/ upstream |
| `browse/SKILL.md` | `SKILL.md` | Upstream format; our version is rewritten |
| `extension/` (repo root) | `extension/` | Chromium extension |
| `lib/worktree.ts` (repo root) | `lib/worktree.ts` | Shared library |
| `LICENSE` (repo root) | `LICENSE` | |

### Files NOT in vendor (only in `main`)

These exist only in this repo and are never rebased against upstream:

| File | Purpose |
|------|---------|
| `.github/workflows/ci.yml` | CI pipeline |
| `.github/workflows/release.yml` | Release automation |
| `Formula/browse.rb` | Homebrew formula |
| `Formula/browse-agent.rb` | Homebrew formula (agent add-on) |
| `README.md` | Standalone readme |
| `setup` | Smart rebuild + Playwright install script |
| `src/config-store.ts` | `~/.config/browse/config.json` read/write |
| `src/sidebar-agent-main.ts` | `browse-agent` entry point |
| `package.json` | Standalone package manifest |
| `tsconfig.json` | TypeScript config |
| `.gitignore` | |
| `UPSTREAM_REF` | Records current upstream SHA |
| `UPSTREAM.md` | This file |
| `scripts/sync-upstream.sh` | Sync automation |

---

## Mechanical Substitutions (applied to all patched src/ files)

These are systematic find-and-replace changes. When rebasing, they re-apply
automatically via the existing commits and are very unlikely to conflict.

| Original (upstream) | Replacement (this repo) |
|---------------------|------------------------|
| `.gstack/browse.json` | `.browse/browse.json` |
| `.gstack/` (state dir) | `.browse/` |
| `gstack-ctrl` | `browse-ctrl` |
| `gstack-shimmer` | `browse-shimmer` |
| `gstack browse —` (help text) | `browse —` |
| `.claude/skills/gstack/browse/dist/browse` | `.config/browse/dist/browse` |

---

## Surgical Patches (need manual review on rebase conflict)

These files received logic changes that cannot be automated. If upstream touches
any of these, review the diff carefully when rebasing.

### `src/cli.ts`

- **`findAgentBin()` helper** (new function, after imports): replaces the
  inline agent-spawn block. Checks `BROWSE_AGENT_PATH` env → adjacent binary →
  `which browse-agent`. Returns `null` if not found, making the sidebar agent optional.
- **`--version`/`-v` flag**: added before `--help`.
- **`config` subcommand**: reads/writes `~/.config/browse/config.json` via `getConfigValue`/`setConfig`.
- **`setup-chromium` subcommand**: runs `playwright install chromium`.
- **Agent spawn block**: uses `findAgentBin()` result; skips silently if null.

### `src/server.ts`

- **`import type { ChildProcess }`**: added to child_process imports.
- **`import { getConfigValue }`**: added from `./config-store`.
- **`IDLE_TIMEOUT_MS` expansion**: reads `BROWSE_IDLE_TIMEOUT` from config-store
  with fallback to `process.env.BROWSE_IDLE_TIMEOUT` and default `3_600_000`.
- **`findBrowseBin()`**: replaced with Homebrew paths + `which browse` +
  `~/.config/browse/dist/browse` fallback (matches `locateBinary()` in find-browse.ts).
- **`shortenPath()`**: removed one gstack-specific replace call.
- **`headed` check**: extended to also read `BROWSE_HEADED` from config-store.
- **`ChatEntry` interface**: added `tabId?: number` field.
- **Help text first line**: changed to `browse — persistent headless browser for AI agents`.

### `src/browser-manager.ts`

- **`findExtensionPath()`**: entire function replaced. Upstream walks Claude skill
  directory hierarchy; replacement walks relative to `import.meta.dir` then
  falls back to adjacent-to-binary `../extension`.
- **Null assertions**: two `this.browser!` calls where `this.browser` is possibly
  null (TypeScript strictness).

### `src/find-browse.ts`

- **`locateBinary()`**: entire function replaced. Upstream searches gstack skill
  install paths; replacement checks Homebrew prefixes, `which browse`,
  `~/.config/browse/dist/browse`.
- **`import.meta.main` guard**: `if (import.meta.main) main()` at module end
  (prevents `main()` running on import during tests).

### `src/sidebar-agent.ts`

- **`BROWSE_BIN` fallback**: changed from `.claude/skills/gstack/browse/dist/browse`
  to `.config/browse/dist/browse`.
- **`shortenPath` replace call**: removed gstack-specific path substitution.

---

## Test File Notes

Some test files required patches beyond mechanical substitutions:

| Test file | Change | Reason |
|-----------|--------|--------|
| `test/adversarial-security.test.ts` | Removed freeze-hook test | References `../../freeze/bin/check-freeze.sh` (gstack-only utility) |
| `test/compare-board.test.ts` | Replaced with `describe.skip` stub | Imports `../../design/src/compare` (separate gstack skill, not in this repo) |
| `test/sidebar-ux.test.ts` | `path.join(ROOT, '..', 'extension')` → `path.join(ROOT, 'extension')` | Extension is at repo root here, not one level up |

### Known pre-existing test failures

These failures also exist in the upstream gstack repo:

1. **`test/sidebar-integration.test.ts`** — pre-existing race condition in upstream.
2. **`test/snapshot.test.ts` `closeTab`** — `page.on('close')` fires during `await page.close()`,
   resetting `activeTabId` before the guard check. Pre-existing in upstream.

---

## Quick Reference

```bash
# Check what changed
scripts/sync-upstream.sh --check

# Apply a specific upstream commit
scripts/sync-upstream.sh --apply <SHA>

# Rebase our patches
git rebase vendor

# Verify
bunx tsc --noEmit && bun test
```
