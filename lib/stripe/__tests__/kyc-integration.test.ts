import { describe, it, expect, vi, beforeEach } from 'vitest'
import { initiateStripeKYC, updateKYCProgress } from '../actions'

// Mock Supabase
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(),
    })),
  })),
}

// Mock Stripe
const mockStripe = {
  accounts: {
    create: vi.fn(),
    retrieve: vi.fn(),
  },
  accountLinks: {
    create: vi.fn(),
  },
}

// Mock the modules
vi.mock('@/utils/supabase/server', () => ({
  createSupabaseServerClient: () => mockSupabase,
}))

vi.mock('../server', () => ({
  stripe: mockStripe,
}))

// Mock the other functions
vi.mock('../actions', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    createStripeConnectedAccount: vi.fn(),
    createStripeAccountLink: vi.fn(),
    getStripeAccountStatus: vi.fn(),
  }
})

describe('KYC Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initiateStripeKYC', () => {
    it('should validate user ID', async () => {
      const result = await initiateStripeKYC('')
      
      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('validation_error')
      expect(result.error?.message).toBe('Valid user ID is required')
    })

    it('should handle non-washer users', async () => {
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { stripe_account_id: null, role: 'user' },
        error: null,
      })

      const result = await initiateStripeKYC('user123')
      
      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('validation_error')
      expect(result.error?.message).toBe('Only washers can complete KYC verification')
    })
  })

  describe('updateKYCProgress', () => {
    it('should validate user ID', async () => {
      const result = await updateKYCProgress('', 'acct_test123')
      
      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('validation_error')
      expect(result.error?.message).toBe('Valid user ID is required')
    })

    it('should validate account ID', async () => {
      const result = await updateKYCProgress('user123', '')
      
      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('validation_error')
      expect(result.error?.message).toBe('Valid account ID is required')
    })
  })
})