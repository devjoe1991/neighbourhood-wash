/**
 * Tests for Safe Supabase Server Client
 */

import { 
  createSupabaseServerClient, 
  createSupabaseServerClientSafe,
  createSupabaseServerClientWithCookies 
} from '../server'

// Mock the build context utilities
jest.mock('@/lib/utils/build-context', () => ({
  shouldSkipAuth: jest.fn(),
  getEnvironmentConfig: jest.fn(),
  logBuildContext: jest.fn()
}))

// Mock @supabase/ssr
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn()
}))

// Mock next/headers
jest.mock('next/headers', () => ({
  cookies: jest.fn()
}))

import { shouldSkipAuth, getEnvironmentConfig, logBuildContext } from '@/lib/utils/build-context'
import { createServerClient } from '@supabase/ssr'

const mockShouldSkipAuth = shouldSkipAuth as jest.MockedFunction<typeof shouldSkipAuth>
const mockGetEnvironmentConfig = getEnvironmentConfig as jest.MockedFunction<typeof getEnvironmentConfig>
const mockLogBuildContext = logBuildContext as jest.MockedFunction<typeof logBuildContext>
const mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>

describe('Safe Supabase Server Client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createSupabaseServerClientSafe', () => {
    test('returns null client during build context', () => {
      mockShouldSkipAuth.mockReturnValue(true)
      
      const result = createSupabaseServerClientSafe()
      
      expect(result).toEqual({
        client: null,
        error: 'Build context: Authentication skipped during static generation',
        isBuildContext: true
      })
      expect(mockLogBuildContext).toHaveBeenCalledWith('Skipping Supabase client creation during build')
    })

    test('returns error when environment variables are missing', () => {
      mockShouldSkipAuth.mockReturnValue(false)
      mockGetEnvironmentConfig.mockReturnValue({
        supabaseUrl: undefined,
        supabaseAnonKey: undefined,
        isConfigured: false,
        missingVars: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']
      })
      
      const result = createSupabaseServerClientSafe()
      
      expect(result).toEqual({
        client: null,
        error: 'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY',
        isBuildContext: false
      })
    })

    test('creates client successfully with valid configuration', () => {
      const mockClient = { auth: { getUser: jest.fn() } }
      
      mockShouldSkipAuth.mockReturnValue(false)
      mockGetEnvironmentConfig.mockReturnValue({
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-key',
        isConfigured: true,
        missingVars: []
      })
      mockCreateServerClient.mockReturnValue(mockClient as any)
      
      const result = createSupabaseServerClientSafe()
      
      expect(result).toEqual({
        client: mockClient,
        isBuildContext: false
      })
      expect(mockCreateServerClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-key',
        expect.objectContaining({
          cookies: expect.any(Object)
        })
      )
    })

    test('handles client creation errors', () => {
      mockShouldSkipAuth.mockReturnValue(false)
      mockGetEnvironmentConfig.mockReturnValue({
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-key',
        isConfigured: true,
        missingVars: []
      })
      mockCreateServerClient.mockImplementation(() => {
        throw new Error('Client creation failed')
      })
      
      const result = createSupabaseServerClientSafe()
      
      expect(result).toEqual({
        client: null,
        error: 'Client creation failed',
        isBuildContext: false
      })
    })
  })

  describe('createSupabaseServerClient', () => {
    test('throws error during build context', () => {
      mockShouldSkipAuth.mockReturnValue(true)
      
      expect(() => createSupabaseServerClient()).toThrow(
        'Build context: Supabase client not available during static generation'
      )
      expect(mockLogBuildContext).toHaveBeenCalledWith('Supabase client creation skipped during build')
    })

    test('throws error when environment variables are missing', () => {
      mockShouldSkipAuth.mockReturnValue(false)
      mockGetEnvironmentConfig.mockReturnValue({
        supabaseUrl: undefined,
        supabaseAnonKey: undefined,
        isConfigured: false,
        missingVars: ['NEXT_PUBLIC_SUPABASE_URL']
      })
      
      expect(() => createSupabaseServerClient()).toThrow(
        'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL'
      )
    })

    test('returns client when configuration is valid', () => {
      const mockClient = { auth: { getUser: jest.fn() } }
      
      mockShouldSkipAuth.mockReturnValue(false)
      mockGetEnvironmentConfig.mockReturnValue({
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-key',
        isConfigured: true,
        missingVars: []
      })
      mockCreateServerClient.mockReturnValue(mockClient as any)
      
      const result = createSupabaseServerClient()
      
      expect(result).toBe(mockClient)
    })
  })

  describe('createSupabaseServerClientWithCookies', () => {
    test('throws error during build context', () => {
      mockShouldSkipAuth.mockReturnValue(true)
      
      expect(() => createSupabaseServerClientWithCookies()).toThrow(
        'Build context: Supabase client not available during static generation'
      )
      expect(mockLogBuildContext).toHaveBeenCalledWith('Skipping Supabase client creation during build (with cookies)')
    })

    test('throws error when environment variables are missing', () => {
      mockShouldSkipAuth.mockReturnValue(false)
      mockGetEnvironmentConfig.mockReturnValue({
        supabaseUrl: undefined,
        supabaseAnonKey: undefined,
        isConfigured: false,
        missingVars: ['NEXT_PUBLIC_SUPABASE_ANON_KEY']
      })
      
      expect(() => createSupabaseServerClientWithCookies()).toThrow(
        'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_ANON_KEY'
      )
    })

    test('creates client successfully with valid configuration', () => {
      const mockClient = { auth: { getUser: jest.fn() } }
      
      mockShouldSkipAuth.mockReturnValue(false)
      mockGetEnvironmentConfig.mockReturnValue({
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-key',
        isConfigured: true,
        missingVars: []
      })
      mockCreateServerClient.mockReturnValue(mockClient as any)
      
      const result = createSupabaseServerClientWithCookies()
      
      expect(result).toBe(mockClient)
      expect(mockCreateServerClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-key',
        expect.objectContaining({
          cookies: expect.any(Object)
        })
      )
    })
  })
})