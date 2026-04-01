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
