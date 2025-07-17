import '@testing-library/jest-dom'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
  redirect: vi.fn(),
  revalidatePath: vi.fn(),
}))

// Mock Supabase client
vi.mock('@/utils/supabase/server', () => ({
  createSupabaseServerClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null,
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'test-user-id', role: 'washer', stripe_account_id: 'acct_test' },
        error: null,
      }),
      update: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
    })),
  }),
}))

// Mock Stripe
vi.mock('@/lib/stripe/server', () => ({
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

// Mock error handling utilities
vi.mock('@/lib/error-handling', () => ({
  withRetry: vi.fn((fn) => fn()),
  showErrorToast: vi.fn(),
  showLoadingToast: vi.fn(() => ({
    update: vi.fn(),
    dismiss: vi.fn(),
  })),
  showVerificationStatusToast: vi.fn(),
  getUserFriendlyErrorMessage: vi.fn((error) => ({
    description: error?.message || 'An error occurred',
    canRetry: true,
  })),
  VerificationRecovery: {
    getRecoveryState: vi.fn(),
    saveRecoveryState: vi.fn(),
    clearRecoveryState: vi.fn(),
  },
}))

// Mock verification loading state
vi.mock('@/components/washer/VerificationLoadingState', () => ({
  useVerificationLoading: () => ({
    loadingState: null,
    startLoading: vi.fn(),
    updateStage: vi.fn(),
    stopLoading: vi.fn(),
    LoadingComponent: null,
  }),
}))