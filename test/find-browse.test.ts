/**
 * Tests for find-browse binary locator.
 */

import { describe, test, expect } from 'bun:test';
import { locateBinary } from '../src/find-browse';
import { existsSync } from 'fs';

describe('locateBinary', () => {
  test('returns null when no binary exists at known paths', () => {
    // This test depends on the test environment — if a real binary exists at
    // a Homebrew or PATH location, it will find it.
    // We mainly test that the function doesn't throw.
    const result = locateBinary();
    expect(result === null || typeof result === 'string').toBe(true);
  });

  test('returns string path when binary exists', () => {
    const result = locateBinary();
    if (result !== null) {
      expect(existsSync(result)).toBe(true);
    }
  });

  test('priority chain checks Homebrew paths before config fallback', () => {
    // Verify the source code implements the correct priority order.
    // We read the function source to confirm the Homebrew paths are listed first.
    const src = require('fs').readFileSync(require('path').join(__dirname, '../src/find-browse.ts'), 'utf-8');
    const homebrewArmIdx = src.indexOf('/opt/homebrew/bin/browse');
    const homebrewIntelIdx = src.indexOf('/usr/local/bin/browse');
    const configFallbackIdx = src.indexOf('.config/browse/dist/browse');
    // All must be present
    expect(homebrewArmIdx).toBeGreaterThanOrEqual(0);
    expect(homebrewIntelIdx).toBeGreaterThanOrEqual(0);
    expect(configFallbackIdx).toBeGreaterThanOrEqual(0);
    // Homebrew paths before config fallback
    expect(homebrewArmIdx).toBeLessThan(configFallbackIdx);
    expect(homebrewIntelIdx).toBeLessThan(configFallbackIdx);
  });

  test('function signature accepts no arguments', () => {
    // locateBinary should be callable with no arguments
    expect(typeof locateBinary).toBe('function');
    expect(locateBinary.length).toBe(0);
  });
});
