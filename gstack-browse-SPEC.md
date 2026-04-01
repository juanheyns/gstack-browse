---

# SPEC.md — Extract `browse` into `juanheyns/gstack-browse`

## Overview

This document is the complete implementation specification for extracting the `browse` headless browser CLI from `juanheyns/gstack` (fork of `garrytan/gstack`) into a new standalone repository `juanheyns/gstack-browse`. Every section is actionable. The implementer should work through the [Implementation Order](#implementation-order) section sequentially.

---

## Table of Contents

1. [Repository Bootstrap](#1-repository-bootstrap)
2. [File Mapping](#2-file-mapping)
3. [Path and String Substitutions](#3-path-and-string-substitutions)
4. [New Files to Create](#4-new-files-to-create)
5. [Config Store Replacement](#5-config-store-replacement)
6. [Telemetry Removal](#6-telemetry-removal)
7. [Update Check Removal](#7-update-check-removal)
8. [Test File Changes](#8-test-file-changes)
9. [Conditional Sidebar-Agent Loading](#9-conditional-sidebar-agent-loading)
10. [build-node-server.sh Changes](#10-build-node-serversh-changes)
11. [find-browse.ts Changes](#11-find-browserts-changes)
12. [browser-manager.ts Changes](#12-browser-managerts-changes)
13. [server.ts Changes](#13-serverts-changes)
14. [cli.ts Changes](#14-clits-changes)
15. [package.json](#15-packagejson)
16. [setup Script](#16-setup-script)
17. [tsconfig.json](#17-tsconfigjson)
18. [CI Workflow: ci.yml](#18-ci-workflow-ciyml)
19. [CI Workflow: release.yml](#19-ci-workflow-releaseyml)
20. [Homebrew Formulae](#20-homebrew-formulae)
21. [Tap Repository: juanheyns/homebrew-gstack-browse](#21-tap-repository-juanheynsHomebrew-gstack-browse)
22. [SKILL.md](#22-skillmd)
23. [README.md](#23-readmemd)
24. [.gitignore](#24-gitignore)
25. [Implementation Order](#25-implementation-order)
26. [Verification Checklist](#26-verification-checklist)

---

## 1. Repository Bootstrap

```bash
# Create the new repo on GitHub (public, MIT license, no auto-init)
gh repo create juanheyns/gstack-browse --public --description "Persistent headless browser CLI for AI agents"

# Clone it locally
git clone git@github.com:juanheyns/gstack-browse.git
cd gstack-browse
```

The repo starts empty. All files described in subsequent sections are either copied from gstack or created fresh.

---

## 2. File Mapping

Copy the following files from `garrytan/gstack` (or `juanheyns/gstack`) into the new repo root. Do not use git history transfer — a clean initial commit is fine.

| Source path in gstack | Destination in gstack-browse | Action |
|---|---|---|
| `browse/src/activity.ts` | `src/activity.ts` | Copy as-is |
| `browse/src/browser-manager.ts` | `src/browser-manager.ts` | Copy, then patch (§12) |
| `browse/src/buffers.ts` | `src/buffers.ts` | Copy as-is |
| `browse/src/bun-polyfill.cjs` | `src/bun-polyfill.cjs` | Copy as-is |
| `browse/src/cdp-inspector.ts` | `src/cdp-inspector.ts` | Copy as-is |
| `browse/src/cli.ts` | `src/cli.ts` | Copy, then patch (§14) |
| `browse/src/commands.ts` | `src/commands.ts` | Copy as-is |
| `browse/src/config.ts` | `src/config.ts` | Copy, then patch (§3) |
| `browse/src/cookie-import-browser.ts` | `src/cookie-import-browser.ts` | Copy as-is |
| `browse/src/cookie-picker-routes.ts` | `src/cookie-picker-routes.ts` | Copy as-is |
| `browse/src/cookie-picker-ui.ts` | `src/cookie-picker-ui.ts` | Copy as-is |
| `browse/src/find-browse.ts` | `src/find-browse.ts` | Copy, then patch (§11) |
| `browse/src/meta-commands.ts` | `src/meta-commands.ts` | Copy as-is |
| `browse/src/platform.ts` | `src/platform.ts` | Copy as-is |
| `browse/src/read-commands.ts` | `src/read-commands.ts` | Copy as-is |
| `browse/src/server.ts` | `src/server.ts` | Copy, then patch (§13) |
| `browse/src/sidebar-agent.ts` | `src/sidebar-agent.ts` | Copy, then patch (§9) |
| `browse/src/sidebar-utils.ts` | `src/sidebar-utils.ts` | Copy as-is |
| `browse/src/snapshot.ts` | `src/snapshot.ts` | Copy as-is |
| `browse/src/url-validation.ts` | `src/url-validation.ts` | Copy as-is |
| `browse/src/write-commands.ts` | `src/write-commands.ts` | Copy as-is |
| `browse/test/activity.test.ts` | `test/activity.test.ts` | Copy as-is |
| `browse/test/adversarial-security.test.ts` | `test/adversarial-security.test.ts` | Copy as-is |
| `browse/test/browser-manager-unit.test.ts` | `test/browser-manager-unit.test.ts` | Copy as-is |
| `browse/test/bun-polyfill.test.ts` | `test/bun-polyfill.test.ts` | Copy as-is |
| `browse/test/commands.test.ts` | `test/commands.test.ts` | Copy as-is |
| `browse/test/compare-board.test.ts` | `test/compare-board.test.ts` | Copy as-is |
| `browse/test/config.test.ts` | `test/config.test.ts` | Copy as-is (no gstack binary calls) |
| `browse/test/cookie-import-browser.test.ts` | `test/cookie-import-browser.test.ts` | Copy as-is |
| `browse/test/cookie-picker-routes.test.ts` | `test/cookie-picker-routes.test.ts` | Copy as-is |
| `browse/test/file-drop.test.ts` | `test/file-drop.test.ts` | Copy as-is |
| `browse/test/find-browse.test.ts` | `test/find-browse.test.ts` | Copy, then patch (§8) |
| `browse/test/findport.test.ts` | `test/findport.test.ts` | Copy as-is |
| `browse/test/handoff.test.ts` | `test/handoff.test.ts` | Copy as-is |
| `browse/test/path-validation.test.ts` | `test/path-validation.test.ts` | Copy as-is |
| `browse/test/platform.test.ts` | `test/platform.test.ts` | Copy as-is |
| `browse/test/server-auth.test.ts` | `test/server-auth.test.ts` | Copy as-is |
| `browse/test/sidebar-agent-roundtrip.test.ts` | `test/sidebar-agent-roundtrip.test.ts` | Copy as-is |
| `browse/test/sidebar-agent.test.ts` | `test/sidebar-agent.test.ts` | Copy as-is |
| `browse/test/sidebar-integration.test.ts` | `test/sidebar-integration.test.ts` | Copy as-is |
| `browse/test/sidebar-security.test.ts` | `test/sidebar-security.test.ts` | Copy as-is |
| `browse/test/sidebar-unit.test.ts` | `test/sidebar-unit.test.ts` | Copy as-is |
| `browse/test/sidebar-ux.test.ts` | `test/sidebar-ux.test.ts` | Copy as-is |
| `browse/test/snapshot.test.ts` | `test/snapshot.test.ts` | Copy as-is |
| `browse/test/state-ttl.test.ts` | `test/state-ttl.test.ts` | Copy as-is |
| `browse/test/test-server.ts` | `test/test-server.ts` | Copy as-is |
| `browse/test/url-validation.test.ts` | `test/url-validation.test.ts` | Copy as-is |
| `browse/test/watch.test.ts` | `test/watch.test.ts` | Copy as-is |
| `browse/test/fixtures/` | `test/fixtures/` | Copy entire directory as-is |
| `browse/scripts/build-node-server.sh` | `scripts/build-node-server.sh` | Copy, then patch (§10) |
| `browse/scripts/find-browse` | `scripts/find-browse` | Copy as-is |
| `browse/scripts/remote-slug` | `scripts/remote-slug` | Copy as-is |
| `extension/` | `extension/` | Copy entire directory as-is |
| `lib/worktree.ts` | `lib/worktree.ts` | Copy as-is |
| `LICENSE` | `LICENSE` | Copy as-is (MIT) |

**Do not copy:**
- `browse/test/gstack-config.test.ts` — delete entirely (tests a gstack binary we are removing)
- `browse/test/gstack-update-check.test.ts` — delete entirely (tests a gstack binary we are removing)
- `browse/SKILL.md` — write a new one from scratch (§22)
- `browse/SKILL.md.tmpl` — not needed, no templating system

---

## 3. Path and String Substitutions

After copying, apply these mechanical substitutions throughout all copied TypeScript files. Use a global search-and-replace tool — every occurrence matters.

### 3.1 `.gstack/` state directory rename

The per-project state directory changes from `.gstack/` to `.browse/`. This keeps browse's state separate when running standalone alongside gstack.

Files affected: `src/config.ts`, `src/cli.ts`, `src/server.ts`, `src/sidebar-agent.ts`, `src/browser-manager.ts`, and any test files referencing `.gstack`.

Substitutions:

| Find | Replace |
|---|---|
| `'.gstack'` | `'.browse'` |
| `".gstack"` | `".browse"` |
| `/.gstack/` (in strings/comments) | `/.browse/` |
| `.gstack/browse.json` (in comments) | `.browse/browse.json` |
| `path.join(projectDir, '.gstack')` | `path.join(projectDir, '.browse')` |
| `path.join(process.env.HOME \|\| '/tmp', '.gstack', ...)` | `path.join(process.env.HOME \|\| '/tmp', '.browse', ...)` |
| `path.join(process.env.HOME \|\| '', '.gstack', ...)` | `path.join(process.env.HOME \|\| '', '.browse', ...)` |

Specifically, in `src/config.ts` line ~62:
```typescript
stateDir = path.join(projectDir, '.gstack');
```
becomes:
```typescript
stateDir = path.join(projectDir, '.browse');
```

And the `.gitignore` check at line ~97:
```typescript
if (!content.match(/^\.gstack\/?$/m)) {
  const separator = content.endsWith('\n') ? '' : '\n';
  fs.appendFileSync(gitignorePath, `${separator}.gstack/\n`);
}
```
becomes:
```typescript
if (!content.match(/^\.browse\/?$/m)) {
  const separator = content.endsWith('\n') ? '' : '\n';
  fs.appendFileSync(gitignorePath, `${separator}.browse/\n`);
}
```

In `src/config.ts`, the comment at line ~77:
```
 * Create the .gstack/ state directory if it doesn't exist.
```
becomes:
```
 * Create the .browse/ state directory if it doesn't exist.
```

### 3.2 Global gstack skill path substitutions

These paths appear in `src/browser-manager.ts`, `src/server.ts`, `src/cli.ts`, and `src/find-browse.ts` as fallback binary discovery paths.

| Find | Replace |
|---|---|
| `'.claude', 'skills', 'gstack', 'browse', 'dist', 'browse'` | `'.config', 'browse', 'dist', 'browse'` |
| `'.claude', 'skills', 'gstack', 'browse', 'dist'` | `'.config', 'browse', 'dist'` |
| `'.claude', 'skills', 'gstack', 'extension'` | `'.config', 'browse-extension'` |
| `'.codex', 'skills', 'gstack', 'browse', 'dist', 'browse'` | (remove this candidate entirely from the list) |
| `'.agents', 'skills', 'gstack', 'browse', 'dist', 'browse'` | (remove this candidate entirely from the list) |

### 3.3 String literals and comments

| Find | Replace |
|---|---|
| `'gstack browse'` (in help text) | `'browse'` |
| `gstack browse —` (in help/log strings) | `browse —` |
| `gstack browse server` (in comments) | `browse server` |
| `\.claude\/skills\/gstack\/` (regex in `shortenPath`) | remove this replacement entirely |
| `browse/dist/browse` (in `shortenPath`) | keep as-is |

In `src/server.ts` the `generateHelpText()` function at line ~65 produces:
```
'gstack browse — headless browser for AI agents'
```
Change to:
```
'browse — persistent headless browser for AI agents'
```

### 3.4 Sidebar session directory

In `src/server.ts` line ~121:
```typescript
const SESSIONS_DIR = path.join(process.env.HOME || '/tmp', '.gstack', 'sidebar-sessions');
```
After the `.gstack` → `.browse` substitution this becomes:
```typescript
const SESSIONS_DIR = path.join(process.env.HOME || '/tmp', '.browse', 'sidebar-sessions');
```
This is handled by the mechanical substitution in §3.1 — no separate action required.

---

## 4. New Files to Create

### 4.1 `src/config-store.ts`

Create this file. Full content:

```typescript
/**
 * Persistent user configuration for browse.
 *
 * Stored at ~/.config/browse/config.json.
 * Replaces gstack-config get/set in the standalone package.
 *
 * Keys:
 *   headed          boolean  launch in headed mode by default
 *   idle_timeout    number   seconds before server auto-shuts down (default 1800)
 *   chromium_profile string  path override for Chromium user-data directory
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { dirname, join } from 'path';

const CONFIG_DIR = join(homedir(), '.config', 'browse');
const CONFIG_PATH = join(CONFIG_DIR, 'config.json');

export function getConfig(): Record<string, unknown> {
  try {
    if (!existsSync(CONFIG_PATH)) return {};
    const raw = readFileSync(CONFIG_PATH, 'utf-8');
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function getConfigValue(key: string): unknown {
  return getConfig()[key];
}

export function setConfig(key: string, value: unknown): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  const current = getConfig();
  current[key] = value;
  writeFileSync(CONFIG_PATH, JSON.stringify(current, null, 2) + '\n', { mode: 0o600 });
}
```

### 4.2 `src/sidebar-agent-main.ts`

This is the entry point for the `browse-agent` compiled binary. Create this file:

```typescript
/**
 * browse-agent — entry point for the standalone AI add-on binary.
 *
 * This thin wrapper starts the sidebar agent process.
 * Installed as a separate binary by the browse-agent Homebrew formula.
 *
 * Requirements:
 *   - browse server must be running (browse connect)
 *   - claude CLI must be in PATH
 *   - BROWSE_BIN, BROWSE_STATE_FILE, BROWSE_SERVER_PORT must be set
 *     (set automatically when launched by `browse connect`)
 */

// sidebar-agent.ts contains all logic; this file is just the compiled entry point.
// Because compiled Bun binaries cannot posix_spawn, we do NOT compile sidebar-agent.ts
// directly. Instead this main runs under plain `bun run` as a side-process.
// The browse-agent binary is therefore a launcher that re-executes itself via bun.

import { spawnSync } from 'child_process';
import { existsSync } from 'fs';
import { dirname, resolve } from 'path';

const agentSrc = resolve(dirname(process.execPath), '..', 'src', 'sidebar-agent.ts');

if (!existsSync(agentSrc)) {
  process.stderr.write(`[browse-agent] Cannot find sidebar-agent.ts at ${agentSrc}\n`);
  process.exit(1);
}

const result = spawnSync('bun', ['run', agentSrc], {
  stdio: 'inherit',
  env: process.env,
});

process.exit(result.status ?? 1);
```

---

## 5. Config Store Replacement

The original code calls `gstack-config get/set` via shell subprocesses. In gstack-browse there are **zero** such calls in the TypeScript source — the audit in §3 confirmed that `gstack-config` is only called from the templated `SKILL.md` preamble and the two now-deleted test files. The `src/config-store.ts` module (§4.1) is created for future use by `browse config get/set` subcommands (optional, not part of v1.0.0).

However, `src/server.ts` reads `BROWSE_IDLE_TIMEOUT` and `BROWSE_HEADED` from environment variables directly, not from a config file. To honour the `idle_timeout` and `headed` config keys, update the server startup block in `src/server.ts` to read from config-store if the env var is not set. Find the two lines near the top of the server:

```typescript
const IDLE_TIMEOUT_MS = parseInt(process.env.BROWSE_IDLE_TIMEOUT || '1800000', 10);
```

Replace with:

```typescript
import { getConfigValue } from './config-store';

const _idleConfigSeconds = getConfigValue('idle_timeout');
const IDLE_TIMEOUT_MS = parseInt(
  process.env.BROWSE_IDLE_TIMEOUT ||
  (_idleConfigSeconds != null ? String(Number(_idleConfigSeconds) * 1000) : '1800000'),
  10
);
```

And in the `main()` function of `src/server.ts`, the headed mode launch:

```typescript
const headed = process.env.BROWSE_HEADED === '1';
```

Replace with:

```typescript
const headed = process.env.BROWSE_HEADED === '1' || getConfigValue('headed') === true;
```

Add the `browse config` subcommand to `src/cli.ts` in the `main()` function, before the `ensureServer()` call:

```typescript
// ─── Config subcommand ──────────────────────────────────────────
if (command === 'config') {
  const { getConfig, getConfigValue, setConfig } = await import('./config-store');
  const sub = commandArgs[0];
  if (sub === 'get' && commandArgs[1]) {
    const val = getConfigValue(commandArgs[1]);
    if (val !== undefined) console.log(String(val));
    process.exit(0);
  } else if (sub === 'set' && commandArgs[1] && commandArgs[2] !== undefined) {
    const key = commandArgs[1];
    const raw = commandArgs[2];
    const value = raw === 'true' ? true : raw === 'false' ? false : isNaN(Number(raw)) ? raw : Number(raw);
    setConfig(key, value);
    process.exit(0);
  } else if (sub === 'list' || !sub) {
    const all = getConfig();
    console.log(JSON.stringify(all, null, 2));
    process.exit(0);
  } else {
    console.error('Usage: browse config [get <key>] [set <key> <value>] [list]');
    process.exit(1);
  }
}
```

Add `browse setup-chromium` subcommand to `src/cli.ts` (required by Homebrew `post_install` hook), immediately after the `browse config` block above:

```typescript
// ─── setup-chromium subcommand ──────────────────────────────────
if (command === 'setup-chromium') {
  const { spawnSync } = require('child_process') as typeof import('child_process');
  const result = spawnSync('bunx', ['playwright', 'install', 'chromium'], {
    stdio: 'inherit',
    env: process.env,
  });
  process.exit(result.status ?? 1);
}
```

---

## 6. Telemetry Removal

The TypeScript source files (`src/`) contain **zero** calls to `gstack-telemetry-log` or `gstack-telemetry-sync`. These calls exist only in the gstack `SKILL.md` preamble and the now-deleted test files. No source code changes are required for telemetry removal beyond discarding the two test files listed in §8.

---

## 7. Update Check Removal

Similarly, `gstack-update-check` is called only from the `SKILL.md` preamble. There are no calls to it in the TypeScript source. The standalone `SKILL.md` (§22) contains no preamble block and no update check. No source code changes required beyond discarding `test/gstack-update-check.test.ts`.

---

## 8. Test File Changes

### 8.1 Delete these test files entirely (do not copy them)

- `browse/test/gstack-config.test.ts` — tests `bin/gstack-config` shell script which is not in gstack-browse
- `browse/test/gstack-update-check.test.ts` — tests `bin/gstack-update-check` shell script which is not in gstack-browse

### 8.2 Patch `test/find-browse.test.ts`

The test file imports `locateBinary` from `../src/find-browse` and likely references gstack skill paths. After applying the path substitutions from §3.2 to `src/find-browse.ts`, verify the test expectations still match. Specifically, the test may assert paths containing `.claude/skills/gstack/browse/dist/browse` — update those assertions to match the new discovery logic (§11).

### 8.3 Patch `test/config.test.ts`

This file uses `.gstack` in path constructions in its test data. After the mechanical substitution in §3.1, all `.gstack` occurrences in this file must also become `.browse`. Example:

```typescript
// Before
const stateFile = '/tmp/test-config/.gstack/browse.json';
expect(config.stateDir).toBe('/tmp/test-config/.gstack');
// After
const stateFile = '/tmp/test-config/.browse/browse.json';
expect(config.stateDir).toBe('/tmp/test-config/.browse');
```

Apply this globally across the file — there are approximately 12 occurrences.

---

## 9. Conditional Sidebar-Agent Loading

The `connect` command in `src/cli.ts` currently launches `sidebar-agent.ts` directly as a bun subprocess. In gstack-browse, the sidebar agent is optional (shipped as `browse-agent`). The connect command must check for its presence before attempting to start it.

### 9.1 Changes to `src/cli.ts` in the `connect` handler

Find the section starting at approximately line 569 (`// Auto-start sidebar agent`). Replace the entire block that launches the agent (from `// Auto-start sidebar agent` through `agentProc.unref()` and the catch) with:

```typescript
// Auto-start sidebar agent (requires browse-agent add-on or BROWSE_AGENT_PATH env)
const agentPath = process.env.BROWSE_AGENT_PATH || findAgentBin();
if (agentPath) {
  try {
    // Clear old agent queue
    const agentQueue = path.join(process.env.HOME || '/tmp', '.browse', 'sidebar-agent-queue.jsonl');
    try { fs.writeFileSync(agentQueue, ''); } catch {}

    let browseBin = path.resolve(path.dirname(process.execPath), 'browse');
    if (!fs.existsSync(browseBin)) {
      browseBin = process.execPath;
    }

    try {
      const { spawnSync } = require('child_process');
      spawnSync('pkill', ['-f', 'sidebar-agent'], { stdio: 'ignore', timeout: 3000 });
    } catch {}

    const agentProc = Bun.spawn([agentPath], {
      cwd: config.projectDir,
      env: {
        ...process.env,
        BROWSE_BIN: browseBin,
        BROWSE_STATE_FILE: config.stateFile,
        BROWSE_SERVER_PORT: String(newState.port),
      },
      stdio: ['ignore', 'ignore', 'ignore'],
    });
    agentProc.unref();
    console.log(`[browse] Sidebar agent started (PID: ${agentProc.pid})`);
  } catch (err: any) {
    console.error(`[browse] Sidebar agent failed to start: ${err.message}`);
  }
} else {
  console.log('[browse] Sidebar agent not installed. Install browse-agent for Claude integration.');
  console.log('[browse]   brew install juanheyns/gstack-browse/browse-agent');
}
```

Add the `findAgentBin()` helper function near the top of `src/cli.ts` (after the imports):

```typescript
function findAgentBin(): string | null {
  // 1. BROWSE_AGENT_PATH env var (explicit override)
  if (process.env.BROWSE_AGENT_PATH) return process.env.BROWSE_AGENT_PATH;

  // 2. browse-agent binary adjacent to the browse binary
  const adjacent = path.resolve(path.dirname(process.execPath), 'browse-agent');
  if (fs.existsSync(adjacent)) return adjacent;

  // 3. browse-agent in PATH
  try {
    const result = Bun.spawnSync(['which', 'browse-agent'], { stdout: 'pipe', stderr: 'pipe', timeout: 2000 });
    if (result.exitCode === 0) {
      const p = result.stdout.toString().trim();
      if (p) return p;
    }
  } catch {}

  return null;
}
```

### 9.2 Add error message for `connect` when agent unavailable

When the user runs `browse connect` and `findAgentBin()` returns null, the sidebar panel in Chrome will be present but no agent will respond to messages. The message printed above is sufficient. No behavioral changes needed in the server.

---

## 10. build-node-server.sh Changes

File: `scripts/build-node-server.sh`

The script hardcodes `$GSTACK_DIR` pointing to the monorepo root. Replace the directory resolution block at the top of the file:

**Before:**
```bash
GSTACK_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
SRC_DIR="$GSTACK_DIR/browse/src"
DIST_DIR="$GSTACK_DIR/browse/dist"
```

**After:**
```bash
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SRC_DIR="$REPO_DIR/src"
DIST_DIR="$REPO_DIR/dist"
```

All subsequent references to `$SRC_DIR` and `$DIST_DIR` in the script already use those variables, so no further changes are needed.

---

## 11. find-browse.ts Changes

`src/find-browse.ts` currently looks for the browse binary under `.codex/skills/gstack`, `.agents/skills/gstack`, and `.claude/skills/gstack` markers. In gstack-browse, the canonical install location is the Homebrew prefix or the system PATH. Replace the `locateBinary()` function:

```typescript
export function locateBinary(): string | null {
  const home = homedir();

  // 1. Homebrew install locations (ARM and Intel macOS)
  const brewPaths = [
    '/opt/homebrew/bin/browse',
    '/usr/local/bin/browse',
    '/home/linuxbrew/.linuxbrew/bin/browse',
  ];
  for (const p of brewPaths) {
    if (existsSync(p)) return p;
  }

  // 2. PATH lookup
  try {
    const { spawnSync } = require('child_process') as typeof import('child_process');
    const result = spawnSync('which', ['browse'], { encoding: 'utf-8', stdio: 'pipe', timeout: 2000 });
    if (result.status === 0 && result.stdout.trim()) return result.stdout.trim();
  } catch {}

  // 3. ~/.config/browse/dist/browse (source build fallback)
  const configBuild = join(home, '.config', 'browse', 'dist', 'browse');
  if (existsSync(configBuild)) return configBuild;

  return null;
}
```

Also update the error message in `main()`:
```typescript
process.stderr.write('ERROR: browse binary not found. Install with: brew install juanheyns/gstack-browse/browse\n');
```

---

## 12. browser-manager.ts Changes

### 12.1 `findExtensionPath()` candidates

The current candidates list in `findExtensionPath()` includes gstack global install paths. Replace the candidates array:

```typescript
const candidates = [
  // Relative to this source file in dev mode (gstack-browse/src/ -> ../extension)
  path.resolve(__dirname, '..', 'extension'),
  // BROWSE_EXTENSIONS_DIR env override
  process.env.BROWSE_EXTENSIONS_DIR || '',
  // Homebrew data dir (populated by formula post_install)
  path.join(process.env.HOME || '', '.config', 'browse', 'extension'),
].filter(Boolean);
```

Note: The `BROWSE_EXTENSIONS_DIR` env var is already handled separately earlier in `launch()`. Keep it in the `launch()` block as-is and remove the duplicate from `findExtensionPath()` candidates.

The corrected `findExtensionPath()` candidates:

```typescript
const candidates = [
  // Dev mode: source tree (gstack-browse/src/ -> ../extension)
  path.resolve(__dirname, '..', 'extension'),
  // Homebrew install: extension shipped alongside binary
  path.resolve(path.dirname(process.execPath), '..', 'share', 'browse', 'extension'),
  // User config fallback
  path.join(process.env.HOME || '', '.config', 'browse', 'extension'),
].filter(Boolean);
```

### 12.2 Chromium profile path

After the mechanical `.gstack` → `.browse` substitution in §3.1, the profile path at line ~245 and ~847 becomes:
```typescript
const userDataDir = path.join(process.env.HOME || '/tmp', '.browse', 'chromium-profile');
```
This is correct. Optionally, read from config-store:
```typescript
import { getConfigValue } from './config-store';
const chromiumProfileOverride = getConfigValue('chromium_profile') as string | undefined;
const userDataDir = chromiumProfileOverride || path.join(process.env.HOME || '/tmp', '.browse', 'chromium-profile');
```

### 12.3 Log message

At line ~184:
```typescript
console.error('[browse] Console/network logs flushed to .gstack/browse-*.log');
```
After mechanical substitution becomes:
```typescript
console.error('[browse] Console/network logs flushed to .browse/browse-*.log');
```

### 12.4 UI string

The inline CSS injected by `launchHeaded()` contains `gstack-ctrl` and `gstack-shimmer` CSS class/animation names and the DOM ID `gstack-ctrl`. These are cosmetic but should be updated to avoid confusion. Change:
- `id="gstack-ctrl"` → `id="browse-ctrl"`
- `#gstack-ctrl` → `#browse-ctrl`
- `gstack-shimmer` → `browse-shimmer`
- `document.getElementById('gstack-ctrl')` → `document.getElementById('browse-ctrl')`

---

## 13. server.ts Changes

### 13.1 Import config-store

Add at the top of the file, after existing imports:
```typescript
import { getConfigValue } from './config-store';
```

### 13.2 IDLE_TIMEOUT_MS

Replace (as described in §5):
```typescript
const IDLE_TIMEOUT_MS = parseInt(process.env.BROWSE_IDLE_TIMEOUT || '1800000', 10);
```
With:
```typescript
const _idleConfigSeconds = getConfigValue('idle_timeout');
const IDLE_TIMEOUT_MS = parseInt(
  process.env.BROWSE_IDLE_TIMEOUT ||
  (_idleConfigSeconds != null ? String(Number(_idleConfigSeconds) * 1000) : '1800000'),
  10
);
```

### 13.3 findBrowseBin() candidates

At line ~167, `findBrowseBin()` lists two fallback candidates using the gstack skill path. After the mechanical substitution in §3.2 those become `~/.config/browse/dist/browse`. Also add the Homebrew binary location as the first candidate:

```typescript
function findBrowseBin(): string {
  const candidates = [
    path.resolve(path.dirname(process.execPath), 'browse'), // adjacent in dist/
    '/opt/homebrew/bin/browse',
    '/usr/local/bin/browse',
    path.join(process.env.HOME || '', '.config', 'browse', 'dist', 'browse'),
  ];
  for (const c of candidates) {
    try { if (fs.existsSync(c)) return c; } catch {}
  }
  return 'browse'; // fallback to PATH
}
```

### 13.4 shortenPath()

The `shortenPath()` function at line ~216 has a replace that strips `.claude/skills/gstack/`:
```typescript
.replace(/\.claude\/skills\/gstack\//g, '')
```
Remove this line entirely. The remaining replacements (`$B`, `~`) are fine.

### 13.5 Headed mode check

Replace:
```typescript
const headed = process.env.BROWSE_HEADED === '1';
```
With:
```typescript
const headed = process.env.BROWSE_HEADED === '1' || getConfigValue('headed') === true;
```

### 13.6 worktreeDir path

At line ~299, after mechanical substitution:
```typescript
const worktreeDir = path.join(process.env.HOME || '/tmp', '.browse', 'worktrees', sessionId.slice(0, 8));
```
This is correct after §3.1 substitution — no separate action needed.

---

## 14. cli.ts Changes

### 14.1 Help text

The help text in `main()` starts with `gstack browse —`. Change the first line of the help output to:
```
browse — persistent headless browser for AI agents
```

### 14.2 Add subcommands

Add the `config` and `setup-chromium` subcommands as described in §5. Place them immediately before the `cleanupLegacyState()` call and the `connect` handler.

### 14.3 `findAgentBin()` helper

Add the function as described in §9.1.

### 14.4 Connect handler agent spawning

Replace the agent launch block as described in §9.1.

### 14.5 cleanupLegacyState()

After the mechanical `.gstack` → `.browse` substitution, the legacy `/tmp/browse-server*.json` cleanup is unrelated to path naming and can remain as-is. The comment `// No legacy state on Windows` is still accurate.

### 14.6 Profile directory references in `connect` and `disconnect`

After §3.1 substitution, these become:
```typescript
const profileDir = path.join(process.env.HOME || '/tmp', '.browse', 'chromium-profile');
```
This is correct.

---

## 15. package.json

Create `package.json` at the repo root with this exact content:

```json
{
  "name": "gstack-browse",
  "version": "1.0.0",
  "description": "Persistent headless browser CLI for AI agents",
  "license": "MIT",
  "type": "module",
  "scripts": {
    "build": "bun run build:browse && bun run build:find-browse && bun run build:node-server",
    "build:browse": "bun build --compile src/cli.ts --outfile dist/browse",
    "build:find-browse": "bun build --compile src/find-browse.ts --outfile dist/find-browse",
    "build:node-server": "bash scripts/build-node-server.sh",
    "build:agent": "bun build --compile src/sidebar-agent-main.ts --outfile dist/browse-agent",
    "postbuild": "git rev-parse HEAD > dist/.version 2>/dev/null || echo 'unknown' > dist/.version",
    "test": "bun test test/",
    "setup": "bash setup",
    "typecheck": "bun run tsc --noEmit"
  },
  "dependencies": {
    "diff": "^7.0.0",
    "playwright": "^1.58.2"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "@anthropic-ai/sdk": "^0.78.0"
  },
  "engines": {
    "bun": ">=1.0.0"
  },
  "keywords": [
    "browser",
    "automation",
    "playwright",
    "headless",
    "cli",
    "claude",
    "ai-agent",
    "devtools"
  ]
}
```

Notes:
- `@anthropic-ai/sdk` is in `devDependencies` only. It is used by `src/sidebar-agent-main.ts` which compiles into the separate `browse-agent` binary. It must not be bundled into the core `browse` binary.
- `puppeteer-core` is NOT included — it was in gstack for other purposes.
- `@types/bun` replaces any need for `@types/node` for most APIs.

---

## 16. setup Script

Create `setup` (executable, no extension) at the repo root:

```bash
#!/usr/bin/env bash
# browse setup — install dependencies and Chromium
set -e

# ─── Check Bun ───────────────────────────────────────────────────
if ! command -v bun >/dev/null 2>&1; then
  echo "Error: bun is required but not installed." >&2
  echo "Install: curl -fsSL https://bun.sh/install | bash" >&2
  exit 1
fi

BUN_VERSION_MAJOR=$(bun --version | cut -d. -f1)
if [ "$BUN_VERSION_MAJOR" -lt 1 ]; then
  echo "Error: bun >= 1.0.0 required (found $(bun --version))" >&2
  exit 1
fi

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
DIST_DIR="$REPO_DIR/dist"

echo "Installing dependencies..."
bun install

# ─── Smart rebuild ───────────────────────────────────────────────
BROWSE_BIN="$DIST_DIR/browse"
NEEDS_BUILD=0

if [ ! -f "$BROWSE_BIN" ]; then
  NEEDS_BUILD=1
else
  # Rebuild if any source file is newer than the binary
  if find "$REPO_DIR/src" -name "*.ts" -newer "$BROWSE_BIN" | grep -q .; then
    NEEDS_BUILD=1
  fi
fi

if [ "$NEEDS_BUILD" -eq 1 ]; then
  echo "Building browse..."
  mkdir -p "$DIST_DIR"
  bun run build
else
  echo "Build is up to date (use 'bun run build' to force rebuild)"
fi

# ─── Install Chromium ────────────────────────────────────────────
echo "Installing Chromium (via Playwright)..."
bunx playwright install chromium

# ─── Windows check ───────────────────────────────────────────────
case "$(uname -s)" in
  MINGW*|MSYS*|CYGWIN*)
    echo "Verifying Node.js can load Playwright on Windows..."
    node -e "require('playwright')" || {
      echo "Error: playwright not loadable via Node.js" >&2
      echo "Run: npm install playwright" >&2
      exit 1
    }
    ;;
esac

echo ""
echo "browse is ready."
echo "Usage: $BROWSE_BIN <command>"
echo "       browse --help"
```

Make it executable: `chmod +x setup`

---

## 17. tsconfig.json

Create `tsconfig.json` at the repo root:

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "types": ["bun-types"]
  },
  "include": ["src/**/*.ts", "lib/**/*.ts", "test/**/*.ts"]
}
```

---

## 18. CI Workflow: ci.yml

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  typecheck:
    name: TypeScript type check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun run typecheck

  test:
    name: Tests (${{ matrix.os }})
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [macos-14, ubuntu-latest]
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bunx playwright install chromium --with-deps
      - run: bun test test/
        env:
          CI: "1"

  build-check:
    name: Build check (${{ matrix.os }})
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [macos-14, ubuntu-latest, windows-latest]
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun run build
```

---

## 19. CI Workflow: release.yml

Create `.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

permissions:
  contents: write

jobs:
  build:
    name: Build ${{ matrix.target }}
    runs-on: ${{ matrix.runner }}
    strategy:
      matrix:
        include:
          - runner: macos-14
            target: darwin-arm64
            output: browse-darwin-arm64
          - runner: macos-13
            target: darwin-x86_64
            output: browse-darwin-x86_64
          - runner: ubuntu-latest
            target: linux-x86_64
            output: browse-linux-x86_64
          - runner: ubuntu-24.04-arm
            target: linux-arm64
            output: browse-linux-arm64
          - runner: windows-latest
            target: windows-x86_64
            output: browse-windows-x86_64
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2

      - name: Install dependencies
        run: bun install

      - name: Build (non-Windows)
        if: matrix.runner != 'windows-latest'
        run: bun run build

      - name: Build (Windows)
        if: matrix.runner == 'windows-latest'
        run: bun run build

      - name: Build agent add-on
        run: bun run build:agent

      - name: Package (non-Windows)
        if: matrix.runner != 'windows-latest'
        run: |
          cd dist
          tar czf ../${{ matrix.output }}.tar.gz browse
          tar czf ../browse-agent-${{ matrix.target }}.tar.gz browse-agent

      - name: Package (Windows)
        if: matrix.runner == 'windows-latest'
        shell: bash
        run: |
          cd dist
          tar czf ../${{ matrix.output }}.tar.gz browse.exe server-node.mjs bun-polyfill.cjs
          tar czf ../browse-agent-${{ matrix.target }}.tar.gz browse-agent.exe

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: ${{ matrix.output }}
          path: |
            ${{ matrix.output }}.tar.gz
            browse-agent-${{ matrix.target }}.tar.gz

  publish:
    name: Publish release
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.HOMEBREW_TAP_TOKEN }}

      - name: Download all artifacts
        uses: actions/download-artifact@v4
        with:
          merge-multiple: true

      - name: Extract version tag
        run: echo "VERSION=${GITHUB_REF_NAME#v}" >> $GITHUB_ENV

      - name: Create GitHub release
        env:
          GH_TOKEN: ${{ github.token }}
        run: |
          gh release create "$GITHUB_REF_NAME" \
            browse-darwin-arm64.tar.gz \
            browse-darwin-x86_64.tar.gz \
            browse-linux-x86_64.tar.gz \
            browse-linux-arm64.tar.gz \
            browse-windows-x86_64.tar.gz \
            browse-agent-darwin-arm64.tar.gz \
            browse-agent-darwin-x86_64.tar.gz \
            browse-agent-linux-x86_64.tar.gz \
            browse-agent-linux-arm64.tar.gz \
            browse-agent-windows-x86_64.tar.gz \
            --generate-notes \
            --title "browse v$VERSION"

      - name: Compute SHA256 checksums
        run: |
          for f in browse-darwin-arm64.tar.gz browse-darwin-x86_64.tar.gz browse-linux-x86_64.tar.gz browse-linux-arm64.tar.gz; do
            sha256sum "$f" | awk '{print $1}' > "${f%.tar.gz}.sha256"
          done
          for f in browse-agent-darwin-arm64.tar.gz browse-agent-darwin-x86_64.tar.gz browse-agent-linux-x86_64.tar.gz browse-agent-linux-arm64.tar.gz; do
            sha256sum "$f" | awk '{print $1}' > "${f%.tar.gz}.sha256"
          done

      - name: Clone tap repo
        run: |
          git clone https://x-access-token:${{ secrets.HOMEBREW_TAP_TOKEN }}@github.com/juanheyns/homebrew-gstack-browse.git tap

      - name: Update browse.rb
        run: |
          VERSION="${{ env.VERSION }}"
          SHA_DARWIN_ARM=$(cat browse-darwin-arm64.sha256)
          SHA_DARWIN_X86=$(cat browse-darwin-x86_64.sha256)
          SHA_LINUX_X86=$(cat browse-linux-x86_64.sha256)
          SHA_LINUX_ARM=$(cat browse-linux-arm64.sha256)
          sed -i "s|version \".*\"|version \"${VERSION}\"|g" tap/Formula/browse.rb
          # Update macOS ARM URL+SHA
          sed -i "/darwin.*arm/,/sha256/{s|url \".*\"|url \"https://github.com/juanheyns/gstack-browse/releases/download/v${VERSION}/browse-darwin-arm64.tar.gz\"|}" tap/Formula/browse.rb
          sed -i "/darwin.*arm/,/sha256/{s|sha256 \".*\"|sha256 \"${SHA_DARWIN_ARM}\"|}" tap/Formula/browse.rb
          # Repeat pattern for x86, linux arm, linux x86 (same sed approach)
          sed -i "/darwin.*intel/,/sha256/{s|url \".*\"|url \"https://github.com/juanheyns/gstack-browse/releases/download/v${VERSION}/browse-darwin-x86_64.tar.gz\"|}" tap/Formula/browse.rb
          sed -i "/darwin.*intel/,/sha256/{s|sha256 \".*\"|sha256 \"${SHA_DARWIN_X86}\"|}" tap/Formula/browse.rb
          sed -i "/linux.*intel/,/sha256/{s|url \".*\"|url \"https://github.com/juanheyns/gstack-browse/releases/download/v${VERSION}/browse-linux-x86_64.tar.gz\"|}" tap/Formula/browse.rb
          sed -i "/linux.*intel/,/sha256/{s|sha256 \".*\"|sha256 \"${SHA_LINUX_X86}\"|}" tap/Formula/browse.rb
          sed -i "/linux.*arm/,/sha256/{s|url \".*\"|url \"https://github.com/juanheyns/gstack-browse/releases/download/v${VERSION}/browse-linux-arm64.tar.gz\"|}" tap/Formula/browse.rb
          sed -i "/linux.*arm/,/sha256/{s|sha256 \".*\"|sha256 \"${SHA_LINUX_ARM}\"|}" tap/Formula/browse.rb

      - name: Update browse-agent.rb
        run: |
          VERSION="${{ env.VERSION }}"
          SHA_AGENT_DARWIN_ARM=$(cat browse-agent-darwin-arm64.sha256)
          SHA_AGENT_DARWIN_X86=$(cat browse-agent-darwin-x86_64.sha256)
          SHA_AGENT_LINUX_X86=$(cat browse-agent-linux-x86_64.sha256)
          SHA_AGENT_LINUX_ARM=$(cat browse-agent-linux-arm64.sha256)
          # Apply same sed pattern to tap/Formula/browse-agent.rb
          sed -i "s|version \".*\"|version \"${VERSION}\"|g" tap/Formula/browse-agent.rb
          sed -i "/darwin.*arm/,/sha256/{s|url \".*\"|url \"https://github.com/juanheyns/gstack-browse/releases/download/v${VERSION}/browse-agent-darwin-arm64.tar.gz\"|}" tap/Formula/browse-agent.rb
          sed -i "/darwin.*arm/,/sha256/{s|sha256 \".*\"|sha256 \"${SHA_AGENT_DARWIN_ARM}\"|}" tap/Formula/browse-agent.rb
          sed -i "/darwin.*intel/,/sha256/{s|url \".*\"|url \"https://github.com/juanheyns/gstack-browse/releases/download/v${VERSION}/browse-agent-darwin-x86_64.tar.gz\"|}" tap/Formula/browse-agent.rb
          sed -i "/darwin.*intel/,/sha256/{s|sha256 \".*\"|sha256 \"${SHA_AGENT_DARWIN_X86}\"|}" tap/Formula/browse-agent.rb
          sed -i "/linux.*intel/,/sha256/{s|url \".*\"|url \"https://github.com/juanheyns/gstack-browse/releases/download/v${VERSION}/browse-agent-linux-x86_64.tar.gz\"|}" tap/Formula/browse-agent.rb
          sed -i "/linux.*intel/,/sha256/{s|sha256 \".*\"|sha256 \"${SHA_AGENT_LINUX_X86}\"|}" tap/Formula/browse-agent.rb
          sed -i "/linux.*arm/,/sha256/{s|url \".*\"|url \"https://github.com/juanheyns/gstack-browse/releases/download/v${VERSION}/browse-agent-linux-arm64.tar.gz\"|}" tap/Formula/browse-agent.rb
          sed -i "/linux.*arm/,/sha256/{s|sha256 \".*\"|sha256 \"${SHA_AGENT_LINUX_ARM}\"|}" tap/Formula/browse-agent.rb

      - name: Commit and push formula update
        run: |
          cd tap
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add Formula/browse.rb Formula/browse-agent.rb
          git commit -m "browse ${{ env.VERSION }}"
          git push
```

**Required GitHub secrets** in `juanheyns/gstack-browse`:
- `HOMEBREW_TAP_TOKEN` — a GitHub personal access token with `repo` scope for `juanheyns/homebrew-gstack-browse`, OR a deploy key with write access to that repo.

---

## 20. Homebrew Formulae

These formulae live in the tap repo `juanheyns/homebrew-gstack-browse` (§21), but they are also kept as `Formula/browse.rb` and `Formula/browse-agent.rb` in the main repo for reference and auto-update by the release workflow.

### 20.1 `Formula/browse.rb`

```ruby
class Browse < Formula
  desc "Persistent headless browser CLI for AI agents"
  homepage "https://github.com/juanheyns/gstack-browse"
  version "1.0.0"
  license "MIT"

  on_macos do
    on_arm do
      url "https://github.com/juanheyns/gstack-browse/releases/download/v1.0.0/browse-darwin-arm64.tar.gz"
      sha256 "PLACEHOLDER"
    end
    on_intel do
      url "https://github.com/juanheyns/gstack-browse/releases/download/v1.0.0/browse-darwin-x86_64.tar.gz"
      sha256 "PLACEHOLDER"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/juanheyns/gstack-browse/releases/download/v1.0.0/browse-linux-arm64.tar.gz"
      sha256 "PLACEHOLDER"
    end
    on_intel do
      url "https://github.com/juanheyns/gstack-browse/releases/download/v1.0.0/browse-linux-x86_64.tar.gz"
      sha256 "PLACEHOLDER"
    end
  end

  def install
    bin.install "browse"
  end

  def post_install
    system bin/"browse", "setup-chromium"
  end

  test do
    assert_match "browse", shell_output("#{bin}/browse --version 2>&1 || #{bin}/browse --help 2>&1")
  end
end
```

Note on `post_install`: `browse setup-chromium` runs `bunx playwright install chromium`. For Homebrew, `bunx` must be in PATH or this will fail silently. Add a guard:

```ruby
def post_install
  if which("bun")
    system bin/"browse", "setup-chromium"
  else
    opoo "bun not found — run `browse setup-chromium` manually after installing bun"
  end
end
```

Add `--version` flag to `src/cli.ts`. Add to the `main()` function at the top, before the help check:

```typescript
if (args[0] === '--version' || args[0] === '-v') {
  const version = readVersionHash() || 'unknown';
  console.log(`browse ${version}`);
  process.exit(0);
}
```

### 20.2 `Formula/browse-agent.rb`

```ruby
class BrowseAgent < Formula
  desc "Claude AI add-on for browse — enables the sidebar agent"
  homepage "https://github.com/juanheyns/gstack-browse"
  version "1.0.0"
  license "MIT"

  depends_on "juanheyns/gstack-browse/browse"

  on_macos do
    on_arm do
      url "https://github.com/juanheyns/gstack-browse/releases/download/v1.0.0/browse-agent-darwin-arm64.tar.gz"
      sha256 "PLACEHOLDER"
    end
    on_intel do
      url "https://github.com/juanheyns/gstack-browse/releases/download/v1.0.0/browse-agent-darwin-x86_64.tar.gz"
      sha256 "PLACEHOLDER"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/juanheyns/gstack-browse/releases/download/v1.0.0/browse-agent-linux-arm64.tar.gz"
      sha256 "PLACEHOLDER"
    end
    on_intel do
      url "https://github.com/juanheyns/gstack-browse/releases/download/v1.0.0/browse-agent-linux-x86_64.tar.gz"
      sha256 "PLACEHOLDER"
    end
  end

  def install
    bin.install "browse-agent"
  end

  test do
    assert_match "browse-agent", shell_output("#{bin}/browse-agent --help 2>&1 || true")
  end
end
```

---

## 21. Tap Repository: juanheyns/homebrew-gstack-browse

Create a separate GitHub repo `juanheyns/homebrew-gstack-browse`:

```bash
gh repo create juanheyns/homebrew-gstack-browse --public \
  --description "Homebrew tap for juanheyns/gstack-browse (browse CLI)"
git clone git@github.com:juanheyns/homebrew-gstack-browse.git
```

Structure of that repo:

```
homebrew-gstack-browse/
  Formula/
    browse.rb         (copy of Formula/browse.rb from main repo, with real SHAs after first release)
    browse-agent.rb   (copy of Formula/browse-agent.rb from main repo)
  README.md
```

`README.md` content for the tap repo:

```markdown
# homebrew-gstack-browse

Homebrew tap for [browse](https://github.com/juanheyns/gstack-browse) — persistent headless browser CLI for AI agents.

## Install

```bash
brew tap juanheyns/gstack-browse
brew install browse
# Optional Claude AI add-on:
brew install browse-agent
```

## Upgrade

```bash
brew upgrade browse
```

## Formulae

- `browse` — core headless browser CLI
- `browse-agent` — Claude AI sidebar agent add-on (requires `browse`)
```

The release workflow in `juanheyns/gstack-browse` (§19) auto-commits updated formulae to this repo via `HOMEBREW_TAP_TOKEN`. The tap repo itself has no CI.

---

## 22. SKILL.md

Create `SKILL.md` at the repo root. This file is hand-maintained — no templating system, no preamble block, no gstack references.

```markdown
---
name: browse
description: Persistent headless browser for AI agents — navigate, read, interact, snapshot
version: 1.0.0
allowed-tools:
  - Bash
  - Read
  - AskUserQuestion
---

# browse

Fast headless browser automation CLI. One command per call. ~100ms per command.
Use for: verifying deployments, testing forms, taking screenshots, diffing pages, asserting UI state.

## Setup check

```bash
# Verify browse is installed and Chromium is ready
browse --version
# If Chromium is missing:
browse setup-chromium
```

## Quick reference

| Command | Description |
|---|---|
| `browse goto <url>` | Navigate to URL |
| `browse back` / `browse forward` | Browser history |
| `browse reload` | Reload current page |
| `browse url` | Print current URL |
| `browse text [sel]` | Extract visible text (all or selector) |
| `browse html [sel]` | Extract raw HTML |
| `browse links` | List all links with text and href |
| `browse forms` | List all forms and their fields |
| `browse accessibility` | Accessibility tree |
| `browse snapshot` | Structured snapshot with ref labels |
| `browse snapshot -i` | Snapshot with screenshot |
| `browse snapshot -a` | Annotated screenshot with ref labels |
| `browse snapshot -D` | Diff against previous snapshot |
| `browse screenshot [path]` | Full-page screenshot |
| `browse screenshot --viewport` | Viewport-only screenshot |
| `browse screenshot --clip x,y,w,h` | Clipped screenshot |
| `browse pdf [path]` | Save page as PDF |
| `browse responsive [prefix]` | Screenshots at common breakpoints |
| `browse click <sel>` | Click element |
| `browse fill <sel> <value>` | Fill input field |
| `browse select <sel> <value>` | Select dropdown option |
| `browse hover <sel>` | Hover element |
| `browse type <text>` | Type text at current focus |
| `browse press <key>` | Press keyboard key (e.g. Enter, Tab) |
| `browse scroll [sel]` | Scroll page or element into view |
| `browse wait <sel>` | Wait for selector to appear |
| `browse wait --networkidle` | Wait for network to go idle |
| `browse wait --load` | Wait for load event |
| `browse viewport <WxH>` | Set viewport size (e.g. 1280x800) |
| `browse upload <sel> <file>` | Upload file via input |
| `browse js <expr>` | Evaluate JavaScript expression |
| `browse eval <file>` | Execute JS from file |
| `browse css <sel> <prop>` | Get computed CSS property |
| `browse attrs <sel>` | Get all attributes of element |
| `browse is visible <sel>` | Assert element is visible |
| `browse is hidden <sel>` | Assert element is hidden |
| `browse is enabled <sel>` | Assert element is enabled |
| `browse is disabled <sel>` | Assert element is disabled |
| `browse is checked <sel>` | Assert checkbox is checked |
| `browse is editable <sel>` | Assert element is editable |
| `browse is focused <sel>` | Assert element has focus |
| `browse console` | Get browser console logs |
| `browse console --clear` | Clear console log buffer |
| `browse console --errors` | Get only error entries |
| `browse network` | Get network request log |
| `browse network --clear` | Clear network log buffer |
| `browse dialog` | Get dialog log (alerts, confirms) |
| `browse dialog --clear` | Clear dialog log |
| `browse dialog-accept [text]` | Auto-accept next dialog |
| `browse dialog-dismiss` | Auto-dismiss next dialog |
| `browse cookies` | Get all cookies |
| `browse cookie <n>=<v>` | Set a cookie |
| `browse cookie-import <json-file>` | Import cookies from JSON |
| `browse cookie-import-browser [browser]` | Import from local browser |
| `browse storage` | Get localStorage and sessionStorage |
| `browse storage set <k> <v>` | Set a storage key |
| `browse header <name>:<value>` | Set a request header |
| `browse useragent <string>` | Set User-Agent string |
| `browse perf` | Get performance timing metrics |
| `browse tabs` | List open tabs |
| `browse tab <id>` | Switch to tab by ID |
| `browse newtab [url]` | Open a new tab |
| `browse closetab [id]` | Close tab |
| `browse status` | Print server status |
| `browse stop` | Stop the server |
| `browse restart` | Restart the server |
| `browse diff <url1> <url2>` | Diff two URLs side by side |
| `browse chain` | Run multiple commands from stdin JSON |
| `browse handoff` | Export browser state for resumption |
| `browse resume` | Resume from a handoff state |
| `browse connect` | Launch headed Chrome with extension |
| `browse disconnect` | Stop headed mode |
| `browse watch` | Watch for page changes |
| `browse state` | Get full browser state JSON |
| `browse frame <sel>` | Focus an iframe |
| `browse inspect <sel>` | CDP element inspection |
| `browse config get <key>` | Read a config value |
| `browse config set <key> <val>` | Write a config value |
| `browse config list` | List all config values |
| `browse setup-chromium` | Install Chromium via Playwright |

## Common patterns

### Verify a page loaded and contains expected content

```bash
browse goto https://example.com
browse text | grep "Expected heading"
# Or check a specific selector:
browse text h1
```

### Fill a form and submit

```bash
browse goto https://example.com/login
browse fill "#email" "user@example.com"
browse fill "#password" "secret"
browse click "[type=submit]"
browse wait --networkidle
browse url  # Confirm redirect
```

### Take a screenshot as evidence

```bash
browse goto https://example.com
browse screenshot /tmp/before.png
# ... make changes ...
browse screenshot /tmp/after.png
```

### Snapshot for structured reading with refs

```bash
browse goto https://example.com
browse snapshot
# Output includes @e1, @e2... refs for interactive elements
browse click @e3   # Click the third ref
browse fill @e4 "value"
```

### Diff a page before and after an action

```bash
browse goto https://example.com/cart
browse snapshot -D  # First run: establishes baseline
browse click "#add-to-cart"
browse wait --networkidle
browse snapshot -D  # Second run: shows diff
```

### Assert element state

```bash
browse is visible "#submit-button"
browse is disabled "#submit-button"
browse is checked "#agree-terms"
```

### Check for JavaScript errors

```bash
browse goto https://example.com
browse console --errors
```

### Multi-tab workflow

```bash
browse newtab https://example.com/page-b
browse tabs       # List tab IDs
browse tab 1      # Switch back to tab 1
browse tab 2      # Switch to tab 2
```

### Responsive layout check

```bash
browse goto https://example.com
browse responsive /tmp/responsive  # Saves mobile/tablet/desktop screenshots
```

### Import cookies from Chrome for authenticated testing

```bash
browse cookie-import-browser chrome --domain example.com
browse goto https://example.com/dashboard
```

## Ref system

After running `browse snapshot`, interactive elements are labeled with `@e1`, `@e2`, ... These refs are valid until the next `snapshot` call. Use them as selectors in any command:

```bash
browse snapshot
browse click @e3
browse fill @e4 "search term"
browse hover @e1
```

With `snapshot -C` (cursor-interactive mode), non-ARIA clickable elements get `@c1`, `@c2`, ... refs.

## Snapshot flags

| Flag | Long form | Meaning |
|---|---|---|
| `-i` | `--screenshot` | Include screenshot in output |
| `-a` | `--annotate` | Annotated screenshot with ref labels overlay |
| `-D` | `--diff` | Diff against previous snapshot |
| `-c` | `--compact` | Compact output (fewer details) |
| `-d N` | `--depth N` | Accessibility tree depth limit |
| `-s sel` | `--selector sel` | Snapshot only within selector |
| `-o path` | `--output path` | Save snapshot to file |
| `-C` | `--cursor-interactive` | Find non-ARIA clickable elements |

## Session management

browse runs a persistent background server. It starts automatically on first command and shuts down after 30 minutes of inactivity (configurable via `browse config set idle_timeout 3600`).

```bash
browse status    # Check server health
browse stop      # Stop the server
browse restart   # Restart the server
```

State file: `.browse/browse.json` in the current git project root.
Logs: `.browse/browse-{console,network,dialog}.log`

## browse-agent (optional)

The `browse-agent` add-on enables a Claude-powered sidebar in headed mode. It requires the `claude` CLI in PATH.

```bash
brew install juanheyns/gstack-browse/browse-agent
browse connect  # Launch headed Chrome + start sidebar agent
```
```

---

## 23. README.md

Create `README.md` at the repo root:

```markdown
# browse

Persistent headless browser CLI for AI agents. Navigate, interact, snapshot, and assert page state — one shell command at a time. Built on Playwright + Bun.

## Install

```bash
brew tap juanheyns/gstack-browse
brew install browse
```

## Quick start

```bash
browse goto https://example.com
browse snapshot
browse click @e1
browse text
browse screenshot /tmp/result.png
```

## Commands

See [SKILL.md](./SKILL.md) for the full command reference (60+ commands) with examples.

## browse-agent (optional Claude add-on)

`browse-agent` adds a Claude-powered sidebar to headed mode. It requires the `claude` CLI in PATH.

```bash
brew install juanheyns/gstack-browse/browse-agent
browse connect
```

When installed, `browse connect` launches headed Chrome with the extension and auto-starts the sidebar agent. Without `browse-agent`, the headed mode still works — the sidebar panel is present but unresponsive.

## Chrome extension

The Chrome extension enables headed mode with a side panel, activity feed, and CSS inspector. It is bundled with browse and loaded automatically when you run `browse connect`.

To load it manually:

1. Open Chrome → `chrome://extensions`
2. Enable Developer mode
3. Click "Load unpacked"
4. Select the `extension/` directory from this repo

The extension communicates only with the local browse server via WebSocket. It makes no external network requests.

## Building from source

```bash
git clone https://github.com/juanheyns/gstack-browse.git
cd gstack-browse
./setup
dist/browse --help
```

Requires [bun](https://bun.sh) >= 1.0.0.

## Configuration

```bash
browse config set idle_timeout 3600     # Auto-shutdown after 1 hour (default: 1800)
browse config set headed true           # Always launch in headed mode
browse config set chromium_profile /path/to/profile
```

Config is stored at `~/.config/browse/config.json`.

## Upgrade

```bash
brew upgrade browse
```

## Note for existing gstack users

If you already have gstack installed, browse is available at `~/.claude/skills/gstack/browse/dist/browse`. This standalone package is for using browse independently of gstack. Both installations can coexist — they use separate state files (`.gstack/` for gstack, `.browse/` for this package).

## License

MIT
```

---

## 24. .gitignore

Create `.gitignore`:

```
node_modules/
dist/
.browse/
*.tar.gz
*.sha256
bun.lockb
```

---

## 25. Implementation Order

Work through these steps in sequence. Each step has a clear completion criterion.

1. **Create `juanheyns/gstack-browse` repo** — `gh repo create`, clone locally. Done when: empty repo cloned.

2. **Copy source files** — Copy all files per §2 table. Done when: all listed files exist at their destination paths.

3. **Apply mechanical substitutions** — Apply all find/replace rules from §3. Done when: `grep -r '\.gstack' src/ test/` returns zero matches (except comments that are fine to update).

4. **Create `package.json`** — Exact content from §15. Done when: `bun install` succeeds.

5. **Create `src/config-store.ts`** — Full content from §4.1. Done when: file exists.

6. **Create `src/sidebar-agent-main.ts`** — Content from §4.2. Done when: file exists.

7. **Patch `scripts/build-node-server.sh`** — Changes from §10. Done when: `GSTACK_DIR` no longer appears in the file.

8. **Patch `src/find-browse.ts`** — Replace `locateBinary()` per §11. Done when: `grep 'skills/gstack' src/find-browse.ts` returns nothing.

9. **Patch `src/browser-manager.ts`** — §12 changes. Done when: `grep 'skills/gstack' src/browser-manager.ts` returns nothing and CSS class names are updated.

10. **Patch `src/server.ts`** — §13 changes (import config-store, idle timeout, findBrowseBin, shortenPath, headed check). Done when: all changes applied and `grep 'skills/gstack' src/server.ts` returns nothing.

11. **Patch `src/cli.ts`** — §14 changes (help text, subcommands, findAgentBin, connect handler). Done when: all changes applied.

12. **Delete test files** — Remove `test/gstack-config.test.ts` and `test/gstack-update-check.test.ts`. Done when: neither file exists.

13. **Patch test files** — Apply §8.2 (find-browse.test.ts) and §8.3 (config.test.ts). Done when: `.gstack` no longer appears in test files.

14. **Create `tsconfig.json`** — Content from §17. Done when: file exists.

15. **Run `bun run build`** — Done when: `dist/browse`, `dist/find-browse`, `dist/server-node.mjs` all exist and the command exits 0.

16. **Run `bun test test/`** — Fix any broken imports or path assertions. Done when: all tests pass (or skip tests that require a live browser if running in a no-display environment).

17. **Create `setup` script** — Content from §16. Make executable: `chmod +x setup`. Done when: `./setup` runs to completion from a clean state.

18. **Write `SKILL.md`** — Full content from §22. Done when: file exists with correct YAML front matter.

19. **Write `README.md`** — Content from §23. Done when: file exists.

20. **Write `.gitignore`** — Content from §24. Done when: file exists.

21. **Create `juanheyns/homebrew-gstack-browse` tap repo** — `gh repo create`, clone, add formula stubs, push. Done when: `brew tap juanheyns/gstack-browse` succeeds.

22. **Add `Formula/browse.rb` and `Formula/browse-agent.rb`** to main repo — Stub content from §20 (SHAs are PLACEHOLDER until first release). Done when: both files exist.

23. **Create `.github/workflows/ci.yml`** — Content from §18. Done when: file exists.

24. **Create `.github/workflows/release.yml`** — Content from §19. Done when: file exists.

25. **Set `HOMEBREW_TAP_TOKEN` secret** in `juanheyns/gstack-browse` GitHub repo settings. Done when: secret is visible in Settings → Secrets.

26. **Initial commit and push to `main`** — Done when: CI workflow runs and passes.

27. **Tag `v1.0.0`**:
    ```bash
    git tag v1.0.0
    git push origin v1.0.0
    ```
    Done when: Release workflow completes, GitHub release page shows all 10 tarballs.

28. **Verify tap auto-update** — Done when: `tap/Formula/browse.rb` in `juanheyns/homebrew-gstack-browse` shows the v1.0.0 URLs with real SHA256 hashes.

29. **End-to-end test**:
    ```bash
    brew tap juanheyns/gstack-browse
    brew install browse
    browse --version
    browse goto https://example.com
    browse text
    ```
    Done when: all four commands succeed.

---

## 26. Verification Checklist

After completing the implementation order, verify each item:

- [ ] `grep -r 'gstack-config\|gstack-telemetry\|gstack-slug\|gstack-update-check\|gstack-repo-mode' src/` returns zero matches
- [ ] `grep -r '\.gstack' src/` returns zero matches (run after §3.1; confirm no remaining instances)
- [ ] `grep -r 'skills/gstack' src/` returns zero matches
- [ ] `grep -r 'skills/gstack' test/` returns zero matches
- [ ] `bun run build` exits 0 and produces `dist/browse`, `dist/find-browse`, `dist/server-node.mjs`
- [ ] `bun run build:agent` exits 0 and produces `dist/browse-agent`
- [ ] `dist/browse --version` prints a SHA or "unknown"
- [ ] `dist/browse --help` prints "browse —" (not "gstack browse —")
- [ ] `dist/browse setup-chromium` runs `playwright install chromium` and exits 0
- [ ] `dist/browse config list` prints `{}` on first run (no errors)
- [ ] `bun test test/` passes (excluding tests that require a display)
- [ ] `bun run typecheck` exits 0 with zero errors
- [ ] `Formula/browse.rb` and `Formula/browse-agent.rb` have correct Ruby syntax: `ruby -c Formula/browse.rb`
- [ ] GitHub Actions CI workflow passes on PR to `main`
- [ ] Release workflow produces all 10 tarballs on `v1.0.0` tag push
- [ ] `brew tap juanheyns/gstack-browse && brew install browse` completes without error
- [ ] `brew install juanheyns/gstack-browse/browse-agent` completes without error
- [ ] `.browse/browse.json` is created (not `.gstack/browse.json`) after first `browse goto` command

---

### Critical Files for Implementation

- `/Users/juanheyns/Source/github.com/garrytan/gstack/browse/src/cli.ts`
- `/Users/juanheyns/Source/github.com/garrytan/gstack/browse/src/server.ts`
- `/Users/juanheyns/Source/github.com/garrytan/gstack/browse/src/browser-manager.ts`
- `/Users/juanheyns/Source/github.com/garrytan/gstack/browse/src/config.ts`
- `/Users/juanheyns/Source/github.com/garrytan/gstack/browse/scripts/build-node-server.sh`