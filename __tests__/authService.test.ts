/**
 * Unit tests for resolveRole() in services/authService.ts
 *
 * resolveRole(email) → 'admin' | 'driver'
 *   admin : email ends with @marasgroup.com OR @maras.iq
 *   driver: everything else
 *
 * NOTE: resolveRole() is purely client-side for UI routing only.
 * Privileged DB operations are enforced server-side via Supabase RLS.
 */

// ── Mock Supabase client so the module loads without env vars ────────────────
jest.mock('../services/supabaseClient', () => ({
  supabase: {
    auth: { signInWithPassword: jest.fn(), signUp: jest.fn(), signOut: jest.fn(), signInWithOAuth: jest.fn(), getSession: jest.fn() },
    from: jest.fn(() => ({ select: jest.fn(), insert: jest.fn(), update: jest.fn(), upsert: jest.fn(), eq: jest.fn() })),
    functions: { invoke: jest.fn() },
  },
}));

import { resolveRole } from '../services/authService';

describe('resolveRole', () => {
  // ── Admin domain: @marasgroup.com ──────────────────────────────────────────
  describe('@marasgroup.com domain', () => {
    it('returns "admin" for standard marasgroup.com address', () => {
      expect(resolveRole('user@marasgroup.com')).toBe('admin');
    });

    it('returns "admin" for subdomain-style prefix', () => {
      expect(resolveRole('ops.manager@marasgroup.com')).toBe('admin');
    });

    it('returns "admin" regardless of local-part content', () => {
      expect(resolveRole('dispatch+test@marasgroup.com')).toBe('admin');
    });
  });

  // ── Admin domain: @maras.iq ────────────────────────────────────────────────
  describe('@maras.iq domain', () => {
    it('returns "admin" for standard maras.iq address', () => {
      expect(resolveRole('admin@maras.iq')).toBe('admin');
    });

    it('returns "admin" for any local-part', () => {
      expect(resolveRole('sardar@maras.iq')).toBe('admin');
    });
  });

  // ── Driver / external emails ───────────────────────────────────────────────
  describe('non-admin domains', () => {
    it('returns "driver" for gmail address', () => {
      expect(resolveRole('driver@gmail.com')).toBe('driver');
    });

    it('returns "driver" for yahoo address', () => {
      expect(resolveRole('john@yahoo.com')).toBe('driver');
    });

    it('returns "driver" for corporate address on different domain', () => {
      expect(resolveRole('user@othercorp.com')).toBe('driver');
    });

    it('returns "driver" for empty string', () => {
      expect(resolveRole('')).toBe('driver');
    });

    it('returns "driver" for address that merely contains admin domain as substring', () => {
      // "contains" is not the same as "ends with" — this must NOT be admin
      expect(resolveRole('attacker@marasgroup.com.evil.io')).toBe('driver');
    });

    it('returns "driver" for address that contains maras.iq in middle', () => {
      expect(resolveRole('user@maras.iq.attacker.com')).toBe('driver');
    });
  });

  // ── Return type contract ───────────────────────────────────────────────────
  describe('return type', () => {
    it('always returns a string literal union member', () => {
      const adminRole = resolveRole('x@marasgroup.com');
      const driverRole = resolveRole('x@example.com');
      expect(['admin', 'driver']).toContain(adminRole);
      expect(['admin', 'driver']).toContain(driverRole);
    });
  });
});
