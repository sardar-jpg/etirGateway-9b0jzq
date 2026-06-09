/**
 * Unit tests for compareVersions() in services/versionService.ts
 *
 * compareVersions(v1, v2) → 1 | 0 | -1
 *   1  : v1 > v2
 *   0  : v1 === v2
 *  -1  : v1 < v2
 */

// ── Mock @/template so versionService loads without real Supabase env vars ──
jest.mock('../template', () => ({
  getSupabaseClient: jest.fn(() => ({
    from: jest.fn(() => ({ select: jest.fn().mockResolvedValue({ data: [], error: null }) })),
  })),
}));

import { compareVersions } from '../services/versionService';

describe('compareVersions', () => {
  // ── Equality ────────────────────────────────────────────────────────────────
  describe('equal versions', () => {
    it('returns 0 for identical three-part versions', () => {
      expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
    });

    it('returns 0 for identical two-part versions', () => {
      expect(compareVersions('2.3', '2.3')).toBe(0);
    });

    it('returns 0 for single-segment versions', () => {
      expect(compareVersions('5', '5')).toBe(0);
    });

    it('returns 0 for "0.0.0" vs "0.0.0"', () => {
      expect(compareVersions('0.0.0', '0.0.0')).toBe(0);
    });
  });

  // ── v1 > v2 ─────────────────────────────────────────────────────────────────
  describe('v1 greater than v2', () => {
    it('returns 1 when major is higher', () => {
      expect(compareVersions('2.0.0', '1.9.9')).toBe(1);
    });

    it('returns 1 when minor is higher', () => {
      expect(compareVersions('1.2.0', '1.1.9')).toBe(1);
    });

    it('returns 1 when patch is higher', () => {
      expect(compareVersions('1.0.1', '1.0.0')).toBe(1);
    });

    it('returns 1 for "1.1.0" vs "1.0.0"', () => {
      expect(compareVersions('1.1.0', '1.0.0')).toBe(1);
    });

    it('returns 1 when v1 has more segments (implicit zeros in v2)', () => {
      expect(compareVersions('1.0.1', '1.0')).toBe(1);
    });
  });

  // ── v1 < v2 ─────────────────────────────────────────────────────────────────
  describe('v1 less than v2', () => {
    it('returns -1 when major is lower', () => {
      expect(compareVersions('1.0.0', '2.0.0')).toBe(-1);
    });

    it('returns -1 when minor is lower', () => {
      expect(compareVersions('1.0.9', '1.1.0')).toBe(-1);
    });

    it('returns -1 when patch is lower', () => {
      expect(compareVersions('1.0.0', '1.0.1')).toBe(-1);
    });

    it('returns -1 when v2 has more segments (implicit zeros in v1)', () => {
      expect(compareVersions('1.0', '1.0.1')).toBe(-1);
    });
  });

  // ── Robustness: non-numeric prefix chars stripped ──────────────────────────
  describe('strips non-numeric prefix characters', () => {
    it('handles "v" prefix in both arguments', () => {
      expect(compareVersions('v1.2.3', 'v1.2.3')).toBe(0);
    });

    it('handles "v" prefix when comparing', () => {
      expect(compareVersions('v2.0.0', 'v1.9.9')).toBe(1);
    });
  });

  // ── ForceUpdate scenario — app version vs min_required_version ─────────────
  describe('ForceUpdate gate scenarios', () => {
    it('blocks update when app version is below minimum', () => {
      // compareVersions(appVersion, minRequired) < 0  → must update
      expect(compareVersions('1.0.0', '1.1.0')).toBe(-1);
    });

    it('allows use when app version equals minimum', () => {
      expect(compareVersions('1.1.0', '1.1.0')).toBe(0);
    });

    it('allows use when app version exceeds minimum', () => {
      expect(compareVersions('1.2.0', '1.1.0')).toBe(1);
    });

    it('allows use on major upgrade beyond minimum', () => {
      expect(compareVersions('2.0.0', '1.9.9')).toBe(1);
    });
  });
});
