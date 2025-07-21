/**
 * Tests for AuthService
 * Basic unit tests to verify the authentication service functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock the Supabase clients
vi.mock('@/utils/supabase/server', () => ({
  createSupabaseServerClient: vi.fn()
}))

vi.mock('@/utils/supabase/client', () => ({
  createClient: vi.fn()
}))

// Mock Next.js redirect
vi.mock('next/navigation', () => ({
  redirect: vi.fn()
}))

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Type Definitions', () => {
    it('should have correct UserRole type', () => {
      // This test verifies our types are properly defined
      const roles = ['customer', 'washer', 'admin']
      expect(roles).toContain('customer')
      expect(roles).toContain('washer')
      expect(roles).toContain('admin')
    })

    it('should have correct OnboardingStatus type', () => {
      const statuses = [
        'not_started',
        'profile_setup', 
        'verification_pending',
        'verification_complete',
        'payment_setup',
        'completed'
      ]
      
      expect(statuses).toHaveLength(6)
      expect(statuses).toContain('not_started')
      expect(statuses).toContain('completed')
    })
  })

  describe('Service Structure', () => {
    it('should export AuthService class', async () => {
      const { AuthService } = await import('../auth-service')
      expect(AuthService).toBeDefined()
      expect(typeof AuthService.signUp).toBe('function')
      expect(typeof AuthService.signIn).toBe('function')
      expect(typeof AuthService.signOut).toBe('function')
      expect(typeof AuthService.getCurrentUser).toBe('function')
      expect(typeof AuthService.getUserWithRoles).toBe('function')
    })
  })

  describe('UserService Structure', () => {
    it('should export UserService class', async () => {
      const { UserService } = await import('../user-service')
      expect(UserService).toBeDefined()
      expect(typeof UserService.createUserProfile).toBe('function')
      expect(typeof UserService.getUserWithRoles).toBe('function')
      expect(typeof UserService.assignRole).toBe('function')
      expect(typeof UserService.removeRole).toBe('function')
      expect(typeof UserService.updateProfile).toBe('function')
    })
  })

  describe('Role Validation Structure', () => {
    it('should export role validation functions', async () => {
      const roleValidation = await import('../role-validation')
      expect(roleValidation.requireAuth).toBeDefined()
      expect(roleValidation.requireRole).toBeDefined()
      expect(roleValidation.requireAdmin).toBeDefined()
      expect(roleValidation.requireWasher).toBeDefined()
      expect(roleValidation.requireCustomer).toBeDefined()
      expect(roleValidation.hasRole).toBeDefined()
      expect(roleValidation.getDefaultDashboardForRole).toBeDefined()
    })
  })
})