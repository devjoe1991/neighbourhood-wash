import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock the modules first before importing
vi.mock('../server', () => ({
  stripe: {
    accountLinks: {
      create: vi.fn(),
    },
    accounts: {
      retrieve: vi.fn(),
      listExternalAccounts: vi.fn(),
    },
  },
}))

// Create a mock function for the Supabase query chain
const mockSupabaseQuery = vi.fn()

vi.mock('@/utils/supabase/server', () => ({
  createSupabaseServerClient: () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: mockSupabaseQuery,
        })),
      })),
    })),
  }),
}))

// Now import the functions to test
import { 
  initiateBankConnection, 
  checkBankConnectionStatus, 
  updateBankConnectionProgress 
} from '../actions'
import { stripe } from '../server'
// Get the mocked instances
const mockStripe = stripe as unknown

describe('Bank Connection Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initiateBankConnection', () => {
    it('should successfully create bank connection link for verified washer', async () => {
      // Mock profile data
      const mockProfile = {
        stripe_account_id: 'acct_test123',
        role: 'washer',
        stripe_account_status: 'complete',
      }

      mockSupabaseQuery.mockResolvedValue({
        data: mockProfile,
        error: null,
      })

      // Mock Stripe account link creation
      ;(mockStripe as any).accountLinks.create.mockResolvedValue({
        url: 'https://connect.stripe.com/setup/bank_account',
        expires_at: Date.now() + 3600000,
      })

      const result = await initiateBankConnection('user123')

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        accountId: 'acct_test123',
        bankConnectionUrl: 'https://connect.stripe.com/setup/bank_account',
      })

      expect((mockStripe as any).accountLinks.create).toHaveBeenCalledWith({
        account: 'acct_test123',
        refresh_url: `${process.env.NEXT_PUBLIC_SITE_URL}/washer/dashboard?bank_connection=refresh`,
        return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/washer/dashboard?bank_connection=complete`,
        type: 'account_update',
        collect: 'external_account',
      })
    })

    it('should fail if user is not a washer', async () => {
      const mockProfile = {
        stripe_account_id: 'acct_test123',
        role: 'user',
        stripe_account_status: 'complete',
      }

      mockSupabaseQuery.mockResolvedValue({
        data: mockProfile,
        error: null,
      })

      const result = await initiateBankConnection('user123')

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('validation_error')
      expect(result.error?.message).toBe('Only washers can connect bank accounts')
    })

    it('should fail if no Stripe account exists', async () => {
      const mockProfile = {
        stripe_account_id: null,
        role: 'washer',
        stripe_account_status: null,
      }

      mockSupabaseQuery.mockResolvedValue({
        data: mockProfile,
        error: null,
      })

      const result = await initiateBankConnection('user123')

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('validation_error')
      expect(result.error?.message).toBe('Stripe account required before connecting bank account')
    })

    it('should fail if KYC is not complete', async () => {
      const mockProfile = {
        stripe_account_id: 'acct_test123',
        role: 'washer',
        stripe_account_status: 'pending',
      }

      mockSupabaseQuery.mockResolvedValue({
        data: mockProfile,
        error: null,
      })

      const result = await initiateBankConnection('user123')

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('validation_error')
      expect(result.error?.message).toBe('KYC verification must be complete before connecting bank account')
    })

    it('should handle Stripe API errors', async () => {
      const mockProfile = {
        stripe_account_id: 'acct_test123',
        role: 'washer',
        stripe_account_status: 'complete',
      }

      mockSupabaseQuery.mockResolvedValue({
        data: mockProfile,
        error: null,
      })

      ;(mockStripe as any).accountLinks.create.mockRejectedValue(new Error('Stripe API error'))

      const result = await initiateBankConnection('user123')

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('unknown_error')
    })

    it('should validate user ID input', async () => {
      const result = await initiateBankConnection('')

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('validation_error')
      expect(result.error?.message).toBe('Valid user ID is required')
    })
  })

  describe('checkBankConnectionStatus', () => {
    it('should return true when bank accounts are connected', async () => {
      ;(mockStripe as any).accounts.retrieve.mockResolvedValue({
        id: 'acct_test123',
        charges_enabled: true,
        payouts_enabled: true,
      })

      mockStripe.accounts.listExternalAccounts.mockResolvedValue({
        data: [
          {
            id: 'ba_test123',
            last4: '1234',
            bank_name: 'Test Bank',
            status: 'verified',
          },
        ],
      })

      const result = await checkBankConnectionStatus('acct_test123')

      expect(result.success).toBe(true)
      expect(result.data?.bankConnected).toBe(true)
      expect(result.data?.bankDetails?.count).toBe(1)
      expect(result.data?.bankDetails?.accounts[0].last4).toBe('1234')
    })

    it('should return false when no bank accounts are connected', async () => {
      mockStripe.accounts.retrieve.mockResolvedValue({
        id: 'acct_test123',
        charges_enabled: true,
        payouts_enabled: true,
      })

      mockStripe.accounts.listExternalAccounts.mockResolvedValue({
        data: [],
      })

      const result = await checkBankConnectionStatus('acct_test123')

      expect(result.success).toBe(true)
      expect(result.data?.bankConnected).toBe(false)
      expect(result.data?.bankDetails).toBeUndefined()
    })

    it('should validate account ID input', async () => {
      const result = await checkBankConnectionStatus('')

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('validation_error')
      expect(result.error?.message).toBe('Valid account ID is required')
    })

    it('should handle Stripe API errors', async () => {
      mockStripe.accounts.retrieve.mockRejectedValue(new Error('Account not found'))

      const result = await checkBankConnectionStatus('acct_test123')

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('unknown_error')
    })
  })

  describe('updateBankConnectionProgress', () => {
    it('should successfully update progress when bank is connected', async () => {
      const mockProfile = {
        stripe_account_id: 'acct_test123',
        role: 'washer',
      }

      mockSupabaseQuery.mockResolvedValue({
        data: mockProfile,
        error: null,
      })

      // Mock successful bank connection check
      mockStripe.accounts.retrieve.mockResolvedValue({
        id: 'acct_test123',
      })

      mockStripe.accounts.listExternalAccounts.mockResolvedValue({
        data: [{ id: 'ba_test123', status: 'verified' }],
      })

      const result = await updateBankConnectionProgress('user123')

      expect(result.success).toBe(true)
      expect(result.data?.step).toBe(3)
      expect(result.message).toBe('Bank connection completed successfully')
    })

    it('should fail if bank account is not connected', async () => {
      const mockProfile = {
        stripe_account_id: 'acct_test123',
        role: 'washer',
      }

      mockSupabaseQuery.mockResolvedValue({
        data: mockProfile,
        error: null,
      })

      // Mock no bank connection
      mockStripe.accounts.retrieve.mockResolvedValue({
        id: 'acct_test123',
      })

      mockStripe.accounts.listExternalAccounts.mockResolvedValue({
        data: [],
      })

      const result = await updateBankConnectionProgress('user123')

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('validation_error')
      expect(result.error?.message).toBe('Bank account not yet connected')
    })

    it('should fail if no Stripe account exists', async () => {
      const mockProfile = {
        stripe_account_id: null,
        role: 'washer',
      }

      mockSupabaseQuery.mockResolvedValue({
        data: mockProfile,
        error: null,
      })

      const result = await updateBankConnectionProgress('user123')

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('validation_error')
      expect(result.error?.message).toBe('No Stripe account found for user')
    })

    it('should validate user ID input', async () => {
      const result = await updateBankConnectionProgress('')

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('validation_error')
      expect(result.error?.message).toBe('Valid user ID is required')
    })
  })
})