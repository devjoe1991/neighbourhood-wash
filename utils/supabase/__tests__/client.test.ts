/**
 * Tests for Safe Supabase Browser Client
 */

import { 
  createClient, 
  createClientSafe
} from '../client'

// Mock the build context utilities
jest.mock('@/lib/utils/build-context', () => ({
  getEnvironmentConfig: jest.fn(),
  logBuildContext: jest.fn(),
  isBuildTime: jest.fn()
}))

// Mock @supabase/ssr
jest.mock('@supabase/ssr', () => ({
  createBrowserClient: jest.fn()
}))

import { getEnvironmentConfig, logBuildContext, isBuildTime } from '@/lib/utils/build-context'
import { createBrowserClient } from '@supabase/ssr'

const mockGetEnvironmentConfig = getEnvironmentConfig as jest.MockedFunction<typeof getEnvironmentConfig>
const mockLogBuildContext = logBuildContext as jest.MockedFunction<typeof logBuildContext>
const mockIsBuildTime = isBuildTime as jest.MockedFunction<typeof isBuildTime>
const mockCreateBrowserClient = createBrowserClient as jest.MockedFunction<typeof createBrowserClient>

describe('Safe Supabase Browser Client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createClientSafe', () => {
    test('returns null client during build context', () => {
      mockIsBuildTime.mockReturnValue(true)
      
      const result = createClientSafe()
      
      expect(result).toEqual({
        client: null,
        error: 'Build context: Browser client skipped during static generation',
        isBuildContext: true
      })
      expect(mockLogBuildContext).toHaveBeenCalledWith('Skipping Supabase browser client creation during build')
    })

    test('returns error when environment variables are missing', () => {
      mockIsBuildTime.mockReturnValue(false)
      mockGetEnvironmentConfig.mockReturnValue({
        supabaseUrl: undefined,
        supabaseAnonKey: undefined,
        isConfigured: false,
        missingVars: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']
      })
      
      const result = createClientSafe()
      
      expect(result).toEqual({
        client: null,
        error: 'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY',
        isBuildContext: false
      })
    })

    test('creates client successfully with valid configuration', () => {
      const mockClient = { auth: { getUser: jest.fn() } }
      
      mockIsBuildTime.mockReturnValue(false)
      mockGetEnvironmentConfig.mockReturnValue({
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-key',
        isConfigured: true,
        missingVars: []
      })
      mockCreateBrowserClient.mockReturnValue(mockClient as any)
      
      const result = createClientSafe()
      
      expect(result).toEqual({
        client: mockClient,
        isBuildContext: false
      })
      expect(mockCreateBrowserClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-key'
      )
    })

    test('handles client creation errors', () => {
      mockIsBuildTime.mockReturnValue(false)
      mockGetEnvironmentConfig.mockReturnValue({
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-key',
        isConfigured: true,
        missingVars: []
      })
      mockCreateBrowserClient.mockImplementation(() => {
        throw new Error('Browser client creation failed')
      })
      
      const result = createClientSafe()
      
      expect(result).toEqual({
        client: null,
        error: 'Browser client creation failed',
        isBuildContext: false
      })
    })

    test('handles unknown errors during client creation', () => {
      mockIsBuildTime.mockReturnValue(false)
      mockGetEnvironmentConfig.mockReturnValue({
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-key',
        isConfigured: true,
        missingVars: []
      })
      mockCreateBrowserClient.mockImplementation(() => {
        throw 'Unknown error type'
      })
      
      const result = createClientSafe()
      
      expect(result).toEqual({
        client: null,
        error: 'Unknown error creating Supabase browser client',
        isBuildContext: false
      })
    })
  })

  describe('createClient', () => {
    test('throws error during build context', () => {
      mockIsBuildTime.mockReturnValue(true)
      
      expect(() => createClient()).toThrow(
        'Build context: Supabase client not available during static generation'
      )
      expect(mockLogBuildContext).toHaveBeenCalledWith('Skipping Supabase browser client creation during build')
    })

    test('throws error when environment variables are missing', () => {
      mockIsBuildTime.mockReturnValue(false)
      mockGetEnvironmentConfig.mockReturnValue({
        supabaseUrl: undefined,
        supabaseAnonKey: undefined,
        isConfigured: false,
        missingVars: ['NEXT_PUBLIC_SUPABASE_URL']
      })
      
      expect(() => createClient()).toThrow(
        'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL'
      )
    })

    test('returns client when configuration is valid', () => {
      const mockClient = { auth: { getUser: jest.fn() } }
      
      mockIsBuildTime.mockReturnValue(false)
      mockGetEnvironmentConfig.mockReturnValue({
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-key',
        isConfigured: true,
        missingVars: []
      })
      mockCreateBrowserClient.mockReturnValue(mockClient as any)
      
      const result = createClient()
      
      expect(result).toBe(mockClient)
    })

    test('throws error when client creation fails at runtime', () => {
      mockIsBuildTime.mockReturnValue(false)
      mockGetEnvironmentConfig.mockReturnValue({
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-key',
        isConfigured: true,
        missingVars: []
      })
      mockCreateBrowserClient.mockImplementation(() => {
        throw new Error('Runtime client creation failed')
      })
      
      expect(() => createClient()).toThrow('Runtime client creation failed')
    })
  })
})