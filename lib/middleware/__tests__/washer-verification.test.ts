import { describe, it, expect, vi, beforeEach } from 'vitest'
import { requireWasherVerification, getWasherVerificationStatus } from '../washer-verification'
import { canAccessWasherFeatures } from '@/lib/stripe/actions'
import { createSupabaseServerClient } from '@/utils/supabase/server'

// Mock Next.js redirect
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

// Mock Supabase
vi.mock('@/utils/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
    },
  })),
}))

// Mock Stripe actions
vi.mock('@/lib/stripe/actions', () => ({
  canAccessWasherFeatures: vi.fn(),
}))

describe('Washer Verification Middleware', () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createSupabaseServerClient).mockReturnValue(mockSupabase as any)
  })

  describe('requireWasherVerification', () => {
    it('allows access for verified washer', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123', email: 'test@example.com' } },
        error: null,
      })

      vi.mocked(canAccessWasherFeatures).mockResolvedValue({
        success: true,
        data: {
          canAccess: true,
          status: 'complete',
          accountId: 'acct_test123',
          requirements: undefined,
        },
      })

      const result = await requireWasherVerification(false)

      expect(result.canAccess).toBe(true)
      expect(result.status).toBe('complete')
      expect(result.accountId).toBe('acct_test123')
      expect(result.error).toBeUndefined()
    })

    it('denies access for unverified washer', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123', email: 'test@example.com' } },
        error: null,
      })

      vi.mocked(canAccessWasherFeatures).mockResolvedValue({
        success: true,
        data: {
          canAccess: false,
          status: 'incomplete',
          accountId: 'acct_test123',
          requirements: {
            currently_due: ['individual.verification.document'],
            eventually_due: [],
            past_due: [],
            pending_verification: [],
          },
        },
      })

      const result = await requireWasherVerification(false)

      expect(result.canAccess).toBe(false)
      expect(result.status).toBe('incomplete')
      expect(result.accountId).toBe('acct_test123')
      expect(result.requirements).toBeDefined()
    })

    it('redirects unauthenticated user to signin', async () => {
      const { redirect } = await import('next/navigation')
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const result = await requireWasherVerification(true)

      expect(redirect).toHaveBeenCalledWith('/signin')
      expect(result.canAccess).toBe(false)
      expect(result.status).toBe('unauthenticated')
    })

    it('redirects unverified washer to dashboard', async () => {
      const { redirect } = await import('next/navigation')
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123', email: 'test@example.com' } },
        error: null,
      })

      vi.mocked(canAccessWasherFeatures).mockResolvedValue({
        success: true,
        data: {
          canAccess: false,
          status: 'incomplete',
          accountId: 'acct_test123',
        },
      })

      await requireWasherVerification(true, '/custom/path')

      expect(redirect).toHaveBeenCalledWith('/custom/path')
    })

    it('fails open on verification check error', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123', email: 'test@example.com' } },
        error: null,
      })

      vi.mocked(canAccessWasherFeatures).mockResolvedValue({
        success: false,
        error: {
          type: 'unknown_error',
          message: 'Service unavailable',
        },
      })

      const result = await requireWasherVerification(false)

      expect(result.canAccess).toBe(true) // Fails open
      expect(result.status).toBe('unknown')
      expect(result.error).toBe('Service unavailable')
    })

    it('handles unexpected errors gracefully', async () => {
      const { redirect } = await import('next/navigation')
      
      mockSupabase.auth.getUser.mockRejectedValue(new Error('Unexpected error'))

      await requireWasherVerification(true, '/fallback')

      expect(redirect).toHaveBeenCalledWith('/fallback')
    })

    it('returns error without redirect when redirectOnFailure is false', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const result = await requireWasherVerification(false)

      expect(result.canAccess).toBe(false)
      expect(result.status).toBe('unauthenticated')
      expect(result.error).toBe('Authentication required')
    })

    it('uses default fallback path when not specified', async () => {
      const { redirect } = await import('next/navigation')
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123', email: 'test@example.com' } },
        error: null,
      })

      vi.mocked(canAccessWasherFeatures).mockResolvedValue({
        success: true,
        data: {
          canAccess: false,
          status: 'incomplete',
          accountId: 'acct_test123',
        },
      })

      await requireWasherVerification(true)

      expect(redirect).toHaveBeenCalledWith('/washer/dashboard')
    })
  })

  describe('getWasherVerificationStatus', () => {
    it('returns verification status for user', async () => {
      vi.mocked(canAccessWasherFeatures).mockResolvedValue({
        success: true,
        data: {
          canAccess: true,
          status: 'complete',
          accountId: 'acct_test123',
          requirements: undefined,
        },
      })

      const result = await getWasherVerificationStatus('user123')

      expect(result.canAccess).toBe(true)
      expect(result.status).toBe('complete')
      expect(result.accountId).toBe('acct_test123')
      expect(result.error).toBeUndefined()
    })

    it('handles verification check failure', async () => {
      vi.mocked(canAccessWasherFeatures).mockResolvedValue({
        success: false,
        error: {
          type: 'unknown_error',
          message: 'Service error',
        },
      })

      const result = await getWasherVerificationStatus('user123')

      expect(result.canAccess).toBe(false)
      expect(result.status).toBe('error')
      expect(result.error).toBe('Service error')
    })

    it('handles unexpected errors', async () => {
      vi.mocked(canAccessWasherFeatures).mockRejectedValue(new Error('Unexpected error'))

      const result = await getWasherVerificationStatus('user123')

      expect(result.canAccess).toBe(false)
      expect(result.status).toBe('error')
      expect(result.error).toBe('Unexpected error')
    })

    it('handles non-Error exceptions', async () => {
      vi.mocked(canAccessWasherFeatures).mockRejectedValue('String error')

      const result = await getWasherVerificationStatus('user123')

      expect(result.canAccess).toBe(false)
      expect(result.status).toBe('error')
      expect(result.error).toBe('Unexpected error occurred')
    })
  })
})