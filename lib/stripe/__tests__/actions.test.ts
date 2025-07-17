import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  createStripeConnectedAccount,
  createStripeAccountLink,
  getStripeAccountStatus,
  canAccessWasherFeatures,
  handleVerificationCallback,
  processVerificationCallback
} from '../actions'
import { stripe } from '../server'
import { createSupabaseServerClient } from '@/utils/supabase/server'

// Mock Stripe
vi.mock('../server', () => ({
  stripe: {
    accounts: {
      create: vi.fn(),
      retrieve: vi.fn(),
    },
    accountLinks: {
      create: vi.fn(),
    },
  },
}))

// Mock Supabase
vi.mock('@/utils/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
}))

describe('Stripe Actions', () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      update: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
    })),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createSupabaseServerClient).mockReturnValue(mockSupabase as any)
  })

  describe('createStripeConnectedAccount', () => {
    it('creates new account successfully', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123', email: 'test@example.com' } },
        error: null,
      })

      mockSupabase.from().single.mockResolvedValue({
        data: { 
          id: 'user123', 
          role: 'washer', 
          email: 'test@example.com',
          stripe_account_id: null 
        },
        error: null,
      })

      mockSupabase.from().update().eq().mockResolvedValue({
        error: null,
      })

      vi.mocked(stripe.accounts.create).mockResolvedValue({
        id: 'acct_test123',
      } as any)

      const result = await createStripeConnectedAccount()

      expect(result.success).toBe(true)
      expect(result.accountId).toBe('acct_test123')
      expect(stripe.accounts.create).toHaveBeenCalledWith({
        type: 'express',
        email: 'test@example.com',
        business_type: 'individual',
        country: 'GB',
      })
    })

    it('returns existing account if already exists', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123', email: 'test@example.com' } },
        error: null,
      })

      mockSupabase.from().single.mockResolvedValue({
        data: { 
          id: 'user123', 
          role: 'washer', 
          email: 'test@example.com',
          stripe_account_id: 'acct_existing123' 
        },
        error: null,
      })

      const result = await createStripeConnectedAccount()

      expect(result.success).toBe(true)
      expect(result.accountId).toBe('acct_existing123')
      expect(stripe.accounts.create).not.toHaveBeenCalled()
    })

    it('handles authentication error', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const result = await createStripeConnectedAccount()

      expect(result.success).toBe(false)
      expect(result.message).toBe('Authentication error. Please log in again.')
    })

    it('handles non-washer user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123', email: 'test@example.com' } },
        error: null,
      })

      mockSupabase.from().single.mockResolvedValue({
        data: { 
          id: 'user123', 
          role: 'customer', 
          email: 'test@example.com',
          stripe_account_id: null 
        },
        error: null,
      })

      const result = await createStripeConnectedAccount()

      expect(result.success).toBe(false)
      expect(result.message).toBe('Only washers can connect payment accounts.')
    })

    it('handles Stripe account creation failure', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123', email: 'test@example.com' } },
        error: null,
      })

      mockSupabase.from().single.mockResolvedValue({
        data: { 
          id: 'user123', 
          role: 'washer', 
          email: 'test@example.com',
          stripe_account_id: null 
        },
        error: null,
      })

      vi.mocked(stripe.accounts.create).mockRejectedValue(new Error('Stripe error'))

      const result = await createStripeConnectedAccount()

      expect(result.success).toBe(false)
      expect(result.message).toBe('An unexpected error occurred. Please try again.')
    })

    it('handles database update failure', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123', email: 'test@example.com' } },
        error: null,
      })

      mockSupabase.from().single.mockResolvedValue({
        data: { 
          id: 'user123', 
          role: 'washer', 
          email: 'test@example.com',
          stripe_account_id: null 
        },
        error: null,
      })

      mockSupabase.from().update().eq().mockResolvedValue({
        error: { message: 'Database error' },
      })

      vi.mocked(stripe.accounts.create).mockResolvedValue({
        id: 'acct_test123',
      } as any)

      const result = await createStripeConnectedAccount()

      expect(result.success).toBe(false)
      expect(result.message).toBe('Failed to save account information. Please try again.')
    })
  })

  describe('createStripeAccountLink', () => {
    it('creates account link successfully', async () => {
      vi.mocked(stripe.accountLinks.create).mockResolvedValue({
        url: 'https://connect.stripe.com/setup/test',
      } as any)

      const result = await createStripeAccountLink('acct_test123')

      expect(result.success).toBe(true)
      expect(result.url).toBe('https://connect.stripe.com/setup/test')
      expect(stripe.accountLinks.create).toHaveBeenCalledWith({
        account: 'acct_test123',
        refresh_url: `${process.env.NEXT_PUBLIC_SITE_URL}/washer/dashboard/payouts`,
        return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/washer/dashboard/payouts?connect_success=true`,
        type: 'account_onboarding',
      })
    })

    it('handles Stripe error', async () => {
      vi.mocked(stripe.accountLinks.create).mockRejectedValue(new Error('Stripe error'))

      const result = await createStripeAccountLink('acct_test123')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Failed to create onboarding link. Please try again.')
    })
  })

  describe('getStripeAccountStatus', () => {
    it('returns complete status for fully verified account', async () => {
      vi.mocked(stripe.accounts.retrieve).mockResolvedValue({
        id: 'acct_test123',
        details_submitted: true,
        charges_enabled: true,
        payouts_enabled: true,
        requirements: {
          currently_due: [],
          eventually_due: [],
          past_due: [],
          pending_verification: [],
        },
        capabilities: {
          transfers: 'active',
          card_payments: 'active',
        },
      } as any)

      const result = await getStripeAccountStatus('acct_test123')

      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('complete')
      expect(result.data?.charges_enabled).toBe(true)
      expect(result.data?.payouts_enabled).toBe(true)
    })

    it('returns pending status for account under review', async () => {
      vi.mocked(stripe.accounts.retrieve).mockResolvedValue({
        id: 'acct_test123',
        details_submitted: true,
        charges_enabled: false,
        payouts_enabled: false,
        requirements: {
          currently_due: [],
          eventually_due: [],
          past_due: [],
          pending_verification: ['individual.verification.document'],
        },
      } as any)

      const result = await getStripeAccountStatus('acct_test123')

      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('pending')
    })

    it('returns requires_action status for account needing information', async () => {
      vi.mocked(stripe.accounts.retrieve).mockResolvedValue({
        id: 'acct_test123',
        details_submitted: true,
        charges_enabled: false,
        payouts_enabled: false,
        requirements: {
          currently_due: ['individual.first_name'],
          eventually_due: [],
          past_due: [],
          pending_verification: [],
        },
      } as any)

      const result = await getStripeAccountStatus('acct_test123')

      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('requires_action')
    })

    it('returns rejected status for disabled account', async () => {
      vi.mocked(stripe.accounts.retrieve).mockResolvedValue({
        id: 'acct_test123',
        details_submitted: true,
        charges_enabled: false,
        payouts_enabled: false,
        requirements: {
          currently_due: [],
          eventually_due: [],
          past_due: [],
          pending_verification: [],
          disabled_reason: 'rejected.fraud',
        },
      } as any)

      const result = await getStripeAccountStatus('acct_test123')

      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('rejected')
    })

    it('returns incomplete status for unsubmitted account', async () => {
      vi.mocked(stripe.accounts.retrieve).mockResolvedValue({
        id: 'acct_test123',
        details_submitted: false,
        charges_enabled: false,
        payouts_enabled: false,
        requirements: {
          currently_due: [],
          eventually_due: [],
          past_due: [],
          pending_verification: [],
        },
      } as any)

      const result = await getStripeAccountStatus('acct_test123')

      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('incomplete')
    })

    it('handles invalid account ID format', async () => {
      const result = await getStripeAccountStatus('invalid_id')

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('validation_error')
      expect(result.error?.message).toBe('Invalid Stripe account ID format')
    })

    it('handles empty account ID', async () => {
      const result = await getStripeAccountStatus('')

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('validation_error')
      expect(result.error?.message).toBe('Valid Stripe account ID is required')
    })

    it('handles Stripe API error', async () => {
      vi.mocked(stripe.accounts.retrieve).mockRejectedValue({
        type: 'StripeError',
        code: 'account_invalid',
        message: 'No such account',
      })

      const result = await getStripeAccountStatus('acct_test123')

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('validation_error')
      expect(result.error?.message).toBe('Stripe account not found or invalid')
    })
  })

  describe('canAccessWasherFeatures', () => {
    it('allows access for verified washer', async () => {
      mockSupabase.from().single.mockResolvedValue({
        data: { 
          stripe_account_id: 'acct_test123',
          stripe_account_status: 'complete',
          role: 'washer'
        },
        error: null,
      })

      vi.mocked(stripe.accounts.retrieve).mockResolvedValue({
        id: 'acct_test123',
        details_submitted: true,
        charges_enabled: true,
        payouts_enabled: true,
        requirements: { currently_due: [], eventually_due: [], past_due: [], pending_verification: [] },
      } as any)

      const result = await canAccessWasherFeatures('user123')

      expect(result.success).toBe(true)
      expect(result.data?.canAccess).toBe(true)
      expect(result.data?.status).toBe('complete')
    })

    it('denies access for unverified washer', async () => {
      mockSupabase.from().single.mockResolvedValue({
        data: { 
          stripe_account_id: 'acct_test123',
          stripe_account_status: 'incomplete',
          role: 'washer'
        },
        error: null,
      })

      vi.mocked(stripe.accounts.retrieve).mockResolvedValue({
        id: 'acct_test123',
        details_submitted: false,
        charges_enabled: false,
        payouts_enabled: false,
        requirements: { currently_due: [], eventually_due: [], past_due: [], pending_verification: [] },
      } as any)

      const result = await canAccessWasherFeatures('user123')

      expect(result.success).toBe(true)
      expect(result.data?.canAccess).toBe(false)
      expect(result.data?.status).toBe('incomplete')
    })

    it('allows access for non-washer users', async () => {
      mockSupabase.from().single.mockResolvedValue({
        data: { 
          stripe_account_id: null,
          stripe_account_status: null,
          role: 'customer'
        },
        error: null,
      })

      const result = await canAccessWasherFeatures('user123')

      expect(result.success).toBe(true)
      expect(result.data?.canAccess).toBe(true)
      expect(result.data?.status).toBe('complete')
    })

    it('denies access for washer without Stripe account', async () => {
      mockSupabase.from().single.mockResolvedValue({
        data: { 
          stripe_account_id: null,
          stripe_account_status: null,
          role: 'washer'
        },
        error: null,
      })

      const result = await canAccessWasherFeatures('user123')

      expect(result.success).toBe(true)
      expect(result.data?.canAccess).toBe(false)
      expect(result.data?.status).toBe('incomplete')
    })

    it('falls back to cached status on API error', async () => {
      mockSupabase.from().single.mockResolvedValue({
        data: { 
          stripe_account_id: 'acct_test123',
          stripe_account_status: 'complete',
          role: 'washer'
        },
        error: null,
      })

      vi.mocked(stripe.accounts.retrieve).mockRejectedValue(new Error('API Error'))

      const result = await canAccessWasherFeatures('user123')

      expect(result.success).toBe(true)
      expect(result.data?.canAccess).toBe(true)
      expect(result.data?.status).toBe('complete')
      expect(result.message).toContain('cached verification status')
    })

    it('handles invalid user ID', async () => {
      const result = await canAccessWasherFeatures('')

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('validation_error')
      expect(result.error?.message).toBe('Valid user ID is required')
    })

    it('handles profile not found', async () => {
      mockSupabase.from().single.mockResolvedValue({
        data: null,
        error: null,
      })

      const result = await canAccessWasherFeatures('user123')

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('validation_error')
      expect(result.error?.message).toBe('User profile not found')
    })
  })

  describe('handleVerificationCallback', () => {
    it('processes callback successfully with status change', async () => {
      mockSupabase.from().single.mockResolvedValue({
        data: { 
          stripe_account_id: 'acct_test123',
          stripe_account_status: 'pending',
          role: 'washer',
          email: 'test@example.com'
        },
        error: null,
      })

      mockSupabase.from().update().eq().mockResolvedValue({
        error: null,
      })

      vi.mocked(stripe.accounts.retrieve).mockResolvedValue({
        id: 'acct_test123',
        details_submitted: true,
        charges_enabled: true,
        payouts_enabled: true,
        requirements: { currently_due: [], eventually_due: [], past_due: [], pending_verification: [] },
      } as any)

      const result = await handleVerificationCallback('user123', 'acct_test123')

      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('complete')
      expect(result.data?.previousStatus).toBe('pending')
      expect(result.data?.statusChanged).toBe(true)
    })

    it('processes callback with no status change', async () => {
      mockSupabase.from().single.mockResolvedValue({
        data: { 
          stripe_account_id: 'acct_test123',
          stripe_account_status: 'complete',
          role: 'washer',
          email: 'test@example.com'
        },
        error: null,
      })

      mockSupabase.from().update().eq().mockResolvedValue({
        error: null,
      })

      vi.mocked(stripe.accounts.retrieve).mockResolvedValue({
        id: 'acct_test123',
        details_submitted: true,
        charges_enabled: true,
        payouts_enabled: true,
        requirements: { currently_due: [], eventually_due: [], past_due: [], pending_verification: [] },
      } as any)

      const result = await handleVerificationCallback('user123', 'acct_test123')

      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('complete')
      expect(result.data?.previousStatus).toBe('complete')
      expect(result.data?.statusChanged).toBe(false)
    })

    it('handles invalid user ID', async () => {
      const result = await handleVerificationCallback('', 'acct_test123')

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('validation_error')
      expect(result.error?.message).toBe('Valid user ID is required')
    })

    it('handles invalid account ID format', async () => {
      const result = await handleVerificationCallback('user123', 'invalid_id')

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('validation_error')
      expect(result.error?.message).toBe('Invalid Stripe account ID format')
    })

    it('handles non-washer user', async () => {
      mockSupabase.from().single.mockResolvedValue({
        data: { 
          stripe_account_id: 'acct_test123',
          stripe_account_status: 'pending',
          role: 'customer',
          email: 'test@example.com'
        },
        error: null,
      })

      const result = await handleVerificationCallback('user123', 'acct_test123')

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('validation_error')
      expect(result.error?.message).toBe('Verification callbacks only apply to washers')
    })

    it('handles database update error', async () => {
      mockSupabase.from().single.mockResolvedValue({
        data: { 
          stripe_account_id: 'acct_test123',
          stripe_account_status: 'pending',
          role: 'washer',
          email: 'test@example.com'
        },
        error: null,
      })

      mockSupabase.from().update().eq().mockResolvedValue({
        error: { message: 'Database error' },
      })

      vi.mocked(stripe.accounts.retrieve).mockResolvedValue({
        id: 'acct_test123',
        details_submitted: true,
        charges_enabled: true,
        payouts_enabled: true,
        requirements: { currently_due: [], eventually_due: [], past_due: [], pending_verification: [] },
      } as any)

      const result = await handleVerificationCallback('user123', 'acct_test123')

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('unknown_error')
      expect(result.error?.message).toBe('Failed to update verification status in database')
    })
  })

  describe('processVerificationCallback', () => {
    it('processes callback for authenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123', email: 'test@example.com' } },
        error: null,
      })

      mockSupabase.from().single.mockResolvedValue({
        data: { 
          stripe_account_id: 'acct_test123',
          stripe_account_status: 'pending',
          role: 'washer',
          email: 'test@example.com'
        },
        error: null,
      })

      mockSupabase.from().update().eq().mockResolvedValue({
        error: null,
      })

      vi.mocked(stripe.accounts.retrieve).mockResolvedValue({
        id: 'acct_test123',
        details_submitted: true,
        charges_enabled: true,
        payouts_enabled: true,
        requirements: { currently_due: [], eventually_due: [], past_due: [], pending_verification: [] },
      } as any)

      const result = await processVerificationCallback()

      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('complete')
    })

    it('handles unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const result = await processVerificationCallback()

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('auth_error')
      expect(result.error?.message).toBe('Authentication required to process verification callback')
    })
  })
})