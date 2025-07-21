/**
 * Tests for Washer Verification Middleware with Build Safety
 */

import {
  requireWasherVerification,
  requireCompleteOnboarding,
  requireFeatureAccess
} from '../washer-verification'

// Mock the dependencies
jest.mock('@/utils/supabase/server', () => ({
  createSupabaseServerClientSafe: jest.fn()
}))

jest.mock('@/lib/utils/build-context', () => ({
  shouldSkipAuth: jest.fn(),
  getBuildSafeDefaults: jest.fn(),
  logBuildContext: jest.fn()
}))

jest.mock('@/lib/stripe/actions', () => ({
  canAccessWasherFeatures: jest.fn(),
  hasCompletedOnboarding: jest.fn()
}))

jest.mock('next/navigation', () => ({
  redirect: jest.fn()
}))

import { createSupabaseServerClientSafe } from '@/utils/supabase/server'
import { shouldSkipAuth, getBuildSafeDefaults, logBuildContext } from '@/lib/utils/build-context'
import { canAccessWasherFeatures, hasCompletedOnboarding } from '@/lib/stripe/actions'
import { redirect } from 'next/navigation'

const mockCreateSupabaseServerClientSafe = createSupabaseServerClientSafe as jest.MockedFunction<typeof createSupabaseServerClientSafe>
const mockShouldSkipAuth = shouldSkipAuth as jest.MockedFunction<typeof shouldSkipAuth>
const mockGetBuildSafeDefaults = getBuildSafeDefaults as jest.MockedFunction<typeof getBuildSafeDefaults>
const mockLogBuildContext = logBuildContext as jest.MockedFunction<typeof logBuildContext>
const mockCanAccessWasherFeatures = canAccessWasherFeatures as jest.MockedFunction<typeof canAccessWasherFeatures>
const mockHasCompletedOnboarding = hasCompletedOnboarding as jest.MockedFunction<typeof hasCompletedOnboarding>
const mockRedirect = redirect as jest.MockedFunction<typeof redirect>

describe('Washer Verification Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('requireWasherVerification', () => {
    test('returns build safe defaults when shouldSkipAuth is true', async () => {
      mockShouldSkipAuth.mockReturnValue(true)
      mockGetBuildSafeDefaults.mockReturnValue({
        user: null,
        isAuthenticated: false,
        canAccess: false,
        status: 'build_context',
        reason: 'build_time_execution',
        message: 'Authentication skipped during build process'
      })

      const result = await requireWasherVerification()

      expect(result).toEqual({
        canAccess: false,
        status: 'build_context',
        error: 'Authentication skipped during build process'
      })
      expect(mockLogBuildContext).toHaveBeenCalledWith('Skipping washer verification during build')
    })

    test('returns build context error when Supabase client creation fails in build context', async () => {
      mockShouldSkipAuth.mockReturnValue(false)
      mockCreateSupabaseServerClientSafe.mockReturnValue({
        client: null,
        error: 'Build context error',
        isBuildContext: true
      })
      mockGetBuildSafeDefaults.mockReturnValue({
        user: null,
        isAuthenticated: false,
        canAccess: false,
        status: 'build_context',
        reason: 'build_time_execution',
        message: 'Authentication skipped during build process'
      })

      const result = await requireWasherVerification()

      expect(result).toEqual({
        canAccess: false,
        status: 'build_context',
        error: 'Authentication skipped during build process'
      })
      expect(mockLogBuildContext).toHaveBeenCalledWith('Washer verification skipped - build context')
    })

    test('returns client error when Supabase client creation fails at runtime', async () => {
      mockShouldSkipAuth.mockReturnValue(false)
      mockCreateSupabaseServerClientSafe.mockReturnValue({
        client: null,
        error: 'Runtime client error',
        isBuildContext: false
      })

      const result = await requireWasherVerification()

      expect(result).toEqual({
        canAccess: false,
        status: 'client_error',
        error: 'Runtime client error'
      })
    })

    test('processes authentication normally when client is available', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      const mockClient = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null
          })
        }
      }

      mockShouldSkipAuth.mockReturnValue(false)
      mockCreateSupabaseServerClientSafe.mockReturnValue({
        client: mockClient as any,
        isBuildContext: false
      })
      mockCanAccessWasherFeatures.mockResolvedValue({
        success: true,
        data: {
          canAccess: true,
          status: 'complete',
          accountId: 'acct_123',
          requirements: {},
          onboardingStatus: { isComplete: true, completedSteps: [1, 2, 3, 4] }
        }
      })

      const result = await requireWasherVerification()

      expect(result).toEqual({
        canAccess: true,
        status: 'complete',
        accountId: 'acct_123',
        requirements: {},
        user: mockUser,
        onboardingStatus: { isComplete: true, completedSteps: [1, 2, 3, 4] }
      })
    })
  })

  describe('requireCompleteOnboarding', () => {
    test('returns build context defaults when shouldSkipAuth is true', async () => {
      mockShouldSkipAuth.mockReturnValue(true)

      const result = await requireCompleteOnboarding()

      expect(result).toEqual({
        isComplete: false,
        completedSteps: [],
        currentStep: 1,
        missingSteps: ['Build-time context - authentication not available'],
        error: 'Build-time context'
      })
      expect(mockLogBuildContext).toHaveBeenCalledWith('Skipping onboarding verification during build')
    })

    test('returns build context error when client creation fails in build context', async () => {
      mockShouldSkipAuth.mockReturnValue(false)
      mockCreateSupabaseServerClientSafe.mockReturnValue({
        client: null,
        error: 'Build context error',
        isBuildContext: true
      })

      const result = await requireCompleteOnboarding()

      expect(result).toEqual({
        isComplete: false,
        completedSteps: [],
        currentStep: 1,
        missingSteps: ['Build-time context - authentication not available'],
        error: 'Build-time context'
      })
      expect(mockLogBuildContext).toHaveBeenCalledWith('Onboarding verification skipped - build context')
    })

    test('processes onboarding check normally when client is available', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      const mockClient = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null
          })
        }
      }

      mockShouldSkipAuth.mockReturnValue(false)
      mockCreateSupabaseServerClientSafe.mockReturnValue({
        client: mockClient as any,
        isBuildContext: false
      })
      mockHasCompletedOnboarding.mockResolvedValue({
        success: true,
        data: {
          isComplete: true,
          completedSteps: [1, 2, 3, 4],
          currentStep: 4,
          missingSteps: []
        }
      })

      const result = await requireCompleteOnboarding()

      expect(result).toEqual({
        isComplete: true,
        completedSteps: [1, 2, 3, 4],
        currentStep: 4,
        missingSteps: [],
        user: mockUser
      })
    })
  })

  describe('requireFeatureAccess', () => {
    test('returns build context response when shouldSkipAuth is true', async () => {
      mockShouldSkipAuth.mockReturnValue(true)

      const result = await requireFeatureAccess('test-feature')

      expect(result).toEqual({
        canAccess: false,
        reason: 'build_context',
        message: 'Feature access skipped during build process'
      })
      expect(mockLogBuildContext).toHaveBeenCalledWith('Skipping feature access check for test-feature during build')
    })

    test('returns build context error when client creation fails in build context', async () => {
      mockShouldSkipAuth.mockReturnValue(false)
      mockCreateSupabaseServerClientSafe.mockReturnValue({
        client: null,
        error: 'Build context error',
        isBuildContext: true
      })

      const result = await requireFeatureAccess('test-feature')

      expect(result).toEqual({
        canAccess: false,
        reason: 'build_context',
        message: 'Feature access skipped during build process'
      })
      expect(mockLogBuildContext).toHaveBeenCalledWith('Feature access for test-feature skipped - build context')
    })

    test('returns client error when client creation fails at runtime', async () => {
      mockShouldSkipAuth.mockReturnValue(false)
      mockCreateSupabaseServerClientSafe.mockReturnValue({
        client: null,
        error: 'Runtime client error',
        isBuildContext: false
      })

      const result = await requireFeatureAccess('test-feature')

      expect(result).toEqual({
        canAccess: false,
        reason: 'client_error',
        message: 'Runtime client error'
      })
    })
  })
})