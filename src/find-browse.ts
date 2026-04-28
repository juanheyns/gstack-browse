/**
 * find-browse — locate the browse binary.
 *
 * Compiled to dist/find-browse (standalone binary, no bun runtime needed).
 * Outputs the absolute path to the browse binary on stdout, or exits 1 if not found.
 */

import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

// ─── Binary Discovery ───────────────────────────────────────────

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

// ─── Main ───────────────────────────────────────────────────────

function main() {
  const bin = locateBinary();
  if (!bin) {
    process.stderr.write('ERROR: browse binary not found. Install with: brew install juanheyns/tap/browse\n');
    process.exit(1);
  }

  console.log(bin);
}

if (import.meta.main) main();
