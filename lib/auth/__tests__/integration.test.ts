/**
 * Integration tests for the new authentication architecture
 * Tests the complete flow from signup to role-based access
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock environment variables
vi.mock('@/lib/utils/build-context', () => ({
  shouldSkipAuth: vi.fn(() => false),
  getEnvironmentConfig: vi.fn(() => ({
    isConfigured: true,
    supabaseUrl: 'https://test.supabase.co',
    supabaseAnonKey: 'test-key',
    missingVars: []
  })),
  logBuildContext: vi.fn(),
  isBuildTime: vi.fn(() => false)
}))

// Mock Supabase
const mockSupabaseClient = {
  auth: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    getUser: vi.fn(),
    exchangeCodeForSession: vi.fn()
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
        maybeSingle: vi.fn()
      })),
      filter: vi.fn(() => ({
        single: vi.fn()
      }))
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn()
      }))
    })),
    upsert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn()
      }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    }))
  }))
}

vi.mock('@/utils/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(() => mockSupabaseClient)
}))

vi.mock('@/utils/supabase/client', () => ({
  createClient: vi.fn(() => mockSupabaseClient)
}))

// Mock Next.js
vi.mock('next/navigation', () => ({
  redirect: vi.fn()
}))

describe('Authentication Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('User Signup Flow', () => {
    it('should handle customer signup successfully', async () => {
      // Mock successful signup
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com'
          }
        },
        error: null
      })

      const { AuthService } = await import('../auth-service')
      
      const result = await AuthService.signUp(
        'test@example.com',
        'password123',
        'customer'
      )

      expect(result.success).toBe(true)
      expect(result.redirectTo).toBe('/auth/confirm-email')
      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: {
            selected_role: 'customer',
            full_name: undefined,
            phone_number: undefined
          },
          emailRedirectTo: expect.stringContaining('/auth/callback?role=customer')
        }
      })
    })

    it('should handle washer signup successfully', async () => {
      // Mock successful signup
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: {
          user: {
            id: 'user-456',
            email: 'washer@example.com'
          }
        },
        error: null
      })

      const { AuthService } = await import('../auth-service')
      
      const result = await AuthService.signUp(
        'washer@example.com',
        'password123',
        'washer',
        {
          fullName: 'John Doe',
          phoneNumber: '+1234567890'
        }
      )

      expect(result.success).toBe(true)
      expect(result.redirectTo).toBe('/auth/confirm-email')
      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: 'washer@example.com',
        password: 'password123',
        options: {
          data: {
            selected_role: 'washer',
            full_name: 'John Doe',
            phone_number: '+1234567890'
          },
          emailRedirectTo: expect.stringContaining('/auth/callback?role=washer')
        }
      })
    })

    it('should handle signup errors gracefully', async () => {
      // Mock signup error
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: {
          message: 'Email already registered',
          status: 400
        }
      })

      const { AuthService } = await import('../auth-service')
      
      const result = await AuthService.signUp(
        'existing@example.com',
        'password123',
        'customer'
      )

      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('Email already registered')
      expect(result.error?.type).toBe('SignUpError')
    })
  })

  describe('User Profile Creation', () => {
    it('should create user profile with role assignment', async () => {
      // Mock successful profile creation
      mockSupabaseClient.from().upsert().select().single.mockResolvedValue({
        data: {
          id: 'user-123',
          email: 'test@example.com',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        error: null
      })

      // Mock successful role assignment
      mockSupabaseClient.from().upsert.mockResolvedValue({
        data: null,
        error: null
      })

      const { AuthService } = await import('../auth-service')
      
      const result = await AuthService.createUserProfile(
        'user-123',
        'test@example.com',
        'customer'
      )

      expect(result.success).toBe(true)
      expect(result.data?.id).toBe('user-123')
      expect(result.data?.email).toBe('test@example.com')
    })
  })

  describe('Role Management', () => {
    it('should assign roles correctly', async () => {
      // Mock successful role assignment
      mockSupabaseClient.from().upsert.mockResolvedValue({
        data: null,
        error: null
      })

      const { AuthService } = await import('../auth-service')
      
      const result = await AuthService.assignRole('user-123', 'washer')

      expect(result.success).toBe(true)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_roles')
    })

    it('should check user roles correctly', async () => {
      // Mock role check
      mockSupabaseClient.from().select().eq().eq().eq().single.mockResolvedValue({
        data: { id: 'role-123' },
        error: null
      })

      const { AuthService } = await import('../auth-service')
      
      const hasRole = await AuthService.userHasRole('user-123', 'washer')

      expect(hasRole).toBe(true)
    })
  })

  describe('Role Validation', () => {
    it('should provide correct dashboard URLs for roles', async () => {
      const { getDefaultDashboardForRole } = await import('../role-validation')
      
      expect(getDefaultDashboardForRole('admin')).toBe('/admin/dashboard')
      expect(getDefaultDashboardForRole('washer')).toBe('/washer/dashboard')
      expect(getDefaultDashboardForRole('customer')).toBe('/user/dashboard')
    })

    it('should provide correct role display names', async () => {
      const { getRoleDisplayName } = await import('../role-validation')
      
      expect(getRoleDisplayName('admin')).toBe('Administrator')
      expect(getRoleDisplayName('washer')).toBe('Washer')
      expect(getRoleDisplayName('customer')).toBe('Customer')
    })

    it('should check role permissions correctly', async () => {
      const { canAccessAdmin, canAccessWasher, canAccessCustomer } = await import('../role-validation')
      
      expect(canAccessAdmin(['admin'])).toBe(true)
      expect(canAccessAdmin(['customer'])).toBe(false)
      
      expect(canAccessWasher(['washer'])).toBe(true)
      expect(canAccessWasher(['admin'])).toBe(true)
      expect(canAccessWasher(['customer'])).toBe(false)
      
      expect(canAccessCustomer(['customer'])).toBe(true)
      expect(canAccessCustomer(['admin'])).toBe(true)
      expect(canAccessCustomer(['washer'])).toBe(false)
    })
  })

  describe('User Service', () => {
    it('should update profiles correctly', async () => {
      // Mock successful profile update
      mockSupabaseClient.from().update().eq().select().single.mockResolvedValue({
        data: {
          id: 'user-123',
          email: 'test@example.com',
          full_name: 'Updated Name',
          updated_at: '2024-01-01T01:00:00Z'
        },
        error: null
      })

      const { UserService } = await import('../user-service')
      
      const result = await UserService.updateProfile('user-123', {
        full_name: 'Updated Name'
      })

      expect(result.success).toBe(true)
      expect(result.data?.full_name).toBe('Updated Name')
    })

    it('should get user roles correctly', async () => {
      // Mock role query
      mockSupabaseClient.from().select().eq().eq.mockResolvedValue({
        data: [
          { role: 'customer' },
          { role: 'washer' }
        ],
        error: null
      })

      const { UserService } = await import('../user-service')
      
      const result = await UserService.getUserRoles('user-123')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(['customer', 'washer'])
    })
  })
})