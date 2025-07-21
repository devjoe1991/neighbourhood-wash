/**
 * Tests for Build Context Detection Utilities
 */

import {
  isBuildTime,
  isStaticGeneration,
  getEnvironmentContext,
  getBuildContext,
  getEnvironmentConfig,
  getEnvVar,
  shouldSkipAuth,
  getBuildSafeDefaults
} from '../build-context'

// Mock next/headers
jest.mock('next/headers', () => {
  throw new Error('next/headers not available')
})

describe('Build Context Detection', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('isBuildTime', () => {
    test('detects build time in production without VERCEL_ENV', () => {
      process.env.NODE_ENV = 'production'
      delete process.env.VERCEL_ENV
      
      expect(isBuildTime()).toBe(true)
    })

    test('detects build time with NEXT_PHASE', () => {
      process.env.NEXT_PHASE = 'phase-production-build'
      
      expect(isBuildTime()).toBe(true)
    })

    test('detects build time when next/headers fails', () => {
      // next/headers is mocked to throw, so this should return true
      expect(isBuildTime()).toBe(true)
    })
  })

  describe('isStaticGeneration', () => {
    test('detects static generation when cookies are not available', () => {
      // next/headers is mocked to throw, so this should return true
      expect(isStaticGeneration()).toBe(true)
    })
  })

  describe('getEnvironmentContext', () => {
    test('returns development in development mode', () => {
      process.env.NODE_ENV = 'development'
      
      expect(getEnvironmentContext()).toBe('development')
    })

    test('returns build during build time', () => {
      process.env.NODE_ENV = 'production'
      delete process.env.VERCEL_ENV
      
      expect(getEnvironmentContext()).toBe('build')
    })
  })

  describe('getBuildContext', () => {
    test('returns comprehensive build context', () => {
      process.env.NODE_ENV = 'production'
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'
      
      const context = getBuildContext()
      
      expect(context).toMatchObject({
        isBuild: expect.any(Boolean),
        isStatic: expect.any(Boolean),
        environment: 'production',
        hasEnvironmentVars: true,
        timestamp: expect.any(String)
      })
    })
  })

  describe('getEnvironmentConfig', () => {
    test('detects configured environment', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'
      
      const config = getEnvironmentConfig()
      
      expect(config).toEqual({
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-key',
        isConfigured: true,
        missingVars: []
      })
    })

    test('detects missing environment variables', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      const config = getEnvironmentConfig()
      
      expect(config).toEqual({
        supabaseUrl: undefined,
        supabaseAnonKey: undefined,
        isConfigured: false,
        missingVars: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']
      })
    })

    test('detects partially missing environment variables', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      const config = getEnvironmentConfig()
      
      expect(config).toEqual({
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: undefined,
        isConfigured: false,
        missingVars: ['NEXT_PUBLIC_SUPABASE_ANON_KEY']
      })
    })
  })

  describe('getEnvVar', () => {
    test('returns environment variable value', () => {
      process.env.TEST_VAR = 'test-value'
      
      expect(getEnvVar('TEST_VAR')).toBe('test-value')
    })

    test('returns fallback when variable is missing', () => {
      delete process.env.TEST_VAR
      
      expect(getEnvVar('TEST_VAR', 'fallback')).toBe('fallback')
    })

    test('returns undefined when variable is missing and no fallback', () => {
      delete process.env.TEST_VAR
      
      expect(getEnvVar('TEST_VAR')).toBeUndefined()
    })
  })

  describe('shouldSkipAuth', () => {
    test('skips auth during build time', () => {
      process.env.NODE_ENV = 'production'
      delete process.env.VERCEL_ENV
      
      expect(shouldSkipAuth()).toBe(true)
    })

    test('skips auth when environment vars are missing', () => {
      process.env.NODE_ENV = 'development'
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      expect(shouldSkipAuth()).toBe(true)
    })
  })

  describe('getBuildSafeDefaults', () => {
    test('returns safe defaults for build context', () => {
      const defaults = getBuildSafeDefaults()
      
      expect(defaults).toEqual({
        user: null,
        isAuthenticated: false,
        canAccess: false,
        status: 'build_context',
        reason: 'build_time_execution',
        message: 'Authentication skipped during build process'
      })
    })
  })
})