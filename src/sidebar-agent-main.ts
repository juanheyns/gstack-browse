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

function findBun(): string {
  const r = spawnSync('which', ['bun'], { encoding: 'utf-8', stdio: 'pipe' });
  if (r.status === 0 && r.stdout.trim()) return r.stdout.trim();
  const candidates = [
    `${process.env.HOME}/.bun/bin/bun`,
    '/opt/homebrew/bin/bun',
    '/usr/local/bin/bun',
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  throw new Error('bun not found. Install from https://bun.sh then re-run the command.');
}

// Look for sidebar-agent.mjs adjacent to this binary (production install),
// then fall back to sidebar-agent.ts in the source tree (dev mode).
function resolveAgentScript(): string {
  const execDir = dirname(process.execPath);

  const prodMjs = resolve(execDir, 'sidebar-agent.mjs');
  if (existsSync(prodMjs)) return prodMjs;

  const devTs = resolve(execDir, '..', 'src', 'sidebar-agent.ts');
  if (existsSync(devTs)) return devTs;

  throw new Error(
    `Cannot find sidebar-agent.mjs. Re-install browse-agent or run \`bun run build:agent\` in the source tree.\n` +
    `Looked in: ${prodMjs}`
  );
}

let agentScript: string;
try {
  agentScript = resolveAgentScript();
} catch (e: any) {
  process.stderr.write(`[browse-agent] ${e.message}\n`);
  process.exit(1);
}

let bun: string;
try {
  bun = findBun();
} catch (e: any) {
  process.stderr.write(`[browse-agent] ${e.message}\n`);
  process.exit(1);
}

const result = spawnSync(bun, ['run', agentScript], {
  stdio: 'inherit',
  env: process.env,
});

process.exit(result.status ?? 1);
