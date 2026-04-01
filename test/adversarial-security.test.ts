/**
 * Adversarial security tests — XSS and boundary-check hardening
 *
 * Test 19: Sidepanel escapes entry.command in activity feed (prevents XSS)
 * Test 20: Freeze hook uses trailing slash in boundary check (prevents prefix collision)
 */

import { describe, test, expect } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';

describe('Adversarial security', () => {
  test('sidepanel escapes entry.command in activity feed', () => {
    const source = fs.readFileSync(
      path.join(import.meta.dir, '../extension/sidepanel.js'),
      'utf-8',
    );
    // entry.command must be wrapped in escapeHtml() to prevent XSS injection
    // via crafted command names in the activity feed
    expect(source).toContain('escapeHtml(entry.command');
  });

  // freeze hook test removed — freeze is a gstack-specific component not in gstack-browse
});
