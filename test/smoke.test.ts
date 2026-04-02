/**
 * Post-installation smoke tests.
 *
 * Tests the installed `browse` binary end-to-end against live URLs.
 * Run with: bun test test/smoke.test.ts --timeout 60000
 *
 * Requires:
 *   - `browse` in PATH (or set BROWSE_BIN env var)
 *   - Chromium installed (run `browse setup-chromium` first)
 *   - Internet access (uses https://example.com)
 */

import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';

const BROWSE = process.env.BROWSE_BIN || 'browse';
const URL = 'https://example.com';
const TIMEOUT = 45_000;

// ── Helper ────────────────────────────────────────────────────────────────────

function browse(args: string[]): { out: string; err: string; status: number } {
  const r = spawnSync(BROWSE, args, {
    encoding: 'utf-8',
    timeout: TIMEOUT,
    env: { ...process.env },
  });
  return { out: r.stdout?.trim() ?? '', err: r.stderr?.trim() ?? '', status: r.status ?? 1 };
}

function ok(args: string[]): string {
  const r = browse(args);
  if (r.status !== 0) throw new Error(`browse ${args.join(' ')} failed:\n${r.err || r.out}`);
  return r.out;
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

beforeAll(() => {
  browse(['stop']);
  // Warm up — first start launches Chromium, takes ~10-20s
  ok(['goto', URL]);
}, 60_000);

afterAll(() => {
  browse(['stop']);
}, 15_000);

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('binary', () => {
  test('--help exits 0', () => {
    const r = browse(['--help']);
    expect(r.status).toBe(0);
    expect(r.out).toContain('browse');
  });
});

describe('server', () => {
  test('status is healthy', () => {
    expect(ok(['status'])).toContain('healthy');
  });

  test('url reflects current page', () => {
    expect(ok(['url'])).toContain('example.com');
  });
});

describe('navigation', () => {
  test('goto returns success', () => {
    expect(() => ok(['goto', URL])).not.toThrow();
  });

  test('reload', () => {
    ok(['goto', URL]);
    expect(ok(['reload'])).toMatch(/reload|navigated/i);
  });
});

describe('reading', () => {
  test('text returns content', () => {
    ok(['goto', URL]);
    expect(ok(['text']).length).toBeGreaterThan(10);
  });

  test('html contains tags', () => {
    ok(['goto', URL]);
    expect(ok(['html'])).toContain('<html');
  });

  test('snapshot contains @refs', () => {
    ok(['goto', URL]);
    expect(ok(['snapshot'])).toContain('@e');
  });

  test('title via js', () => {
    ok(['goto', URL]);
    expect(ok(['js', 'document.title']).length).toBeGreaterThan(0);
  });
});

describe('screenshot', () => {
  test('saves a PNG file', () => {
    const tmp = `/tmp/browse-smoke-${Date.now()}.png`;
    ok(['goto', URL]);
    ok(['screenshot', tmp]);
    expect(fs.existsSync(tmp)).toBe(true);
    expect(fs.statSync(tmp).size).toBeGreaterThan(1000);
    fs.unlinkSync(tmp);
  });
});

describe('tabs', () => {
  test('newtab opens second tab', () => {
    ok(['goto', URL]);
    ok(['newtab', URL]);
    expect(ok(['tabs'])).toContain('2');
  });

  test('tab switches context', () => {
    ok(['tab', '1']);
    expect(ok(['url'])).toContain('example.com');
  });

  test('closetab reduces count', () => {
    ok(['closetab', '2']);
    expect(ok(['tabs'])).toContain('1');
  });
});

describe('assertions', () => {
  test('is visible returns true for body', () => {
    ok(['goto', URL]);
    expect(ok(['is', 'visible', 'body'])).toContain('true');
  });

  test('is visible returns false for nonexistent element', () => {
    expect(ok(['is', 'visible', '#nonexistent-smoke-element'])).toContain('false');
  });
});
