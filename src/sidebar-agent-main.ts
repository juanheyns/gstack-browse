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
