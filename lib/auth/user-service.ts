/**
 * User Management Service
 * Handles user profile creation, role management, and profile updates
 */

import { createSupabaseServerClient } from '@/utils/supabase/server'
import type { 
  UserRole, 
  Profile, 
  UserWithRoles, 
  WasherProfile, 
  CustomerProfile,
  ServiceResult 
} from '@/lib/types'

// =============================================
// INTERFACES
// =============================================

export interface ProfileUpdate {
  full_name?: string
  phone_number?: string
  avatar_url?: string
  timezone?: string
  language?: string
}

export interface WasherProfileUpdate {
  bio?: string
  service_areas?: string[]
  service_types?: string[]
  equipment_details?: string
  years_experience?: number
  availability_schedule?: any
  max_concurrent_bookings?: number
  advance_booking_days?: number
  primary_location?: any
  service_radius_km?: number
  hourly_rate?: number
}

export interface CustomerProfileUpdate {
  default_address?: any
  laundry_preferences?: any
  communication_preferences?: any
  default_payment_method?: string
}

// =============================================
// USER SERVICE CLASS
// =============================================

export class UserService {
  /**
   * Create user profile with initial role
   */
  static async createUserProfile(
    userId: string, 
    email: string, 
    role: UserRole
  ): Promise<ServiceResult<Profile>> {
    try {
      const supabase = createSupabaseServerClient()

      // Create profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (profileError) {
        return {
          success: false,
          error: {
            message: profileError.message,
            type: 'ProfileCreationError',
            code: profileError.code
          }
        }
      }

      // Assign role
      const roleResult = await this.assignRole(userId, role)
      if (!roleResult.success) {
        return {
          success: false,
          error: roleResult.error
        }
      }

      // Create role-specific profiles
      if (role === 'washer') {
        await this.createWasherProfile(userId)
      } else if (role === 'customer') {
        await this.createCustomerProfile(userId)
      }

      return {
        success: true,
        data: profileData
      }
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          type: 'UnknownError'
        }
      }
    }
  }

  /**
   * Get user with all roles and profile data
   */
  static async getUserWithRoles(userId: string): Promise<ServiceResult<UserWithRoles>> {
    try {
      const supabase = createSupabaseServerClient()

      // Get user profile and roles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles!inner(role, status, assigned_at)
        `)
        .eq('id', userId)
        .single()

      if (profileError || !profileData) {
        return {
          success: false,
          error: {
            message: profileError?.message || 'Profile not found',
            type: 'ProfileNotFound',
            code: profileError?.code
          }
        }
      }

      // Extract active roles
      const activeRoles = profileData.user_roles
        .filter((ur: any) => ur.status === 'active')
        .map((ur: any) => ur.role as UserRole)

      if (activeRoles.length === 0) {
        return {
          success: false,
          error: {
            message: 'User has no active roles',
            type: 'NoActiveRoles'
          }
        }
      }

      // Determine primary role (admin > washer > customer)
      const primaryRole = this.determinePrimaryRole(activeRoles)

      // Get role-specific profiles
      let washerProfile: WasherProfile | undefined
      let customerProfile: CustomerProfile | undefined

      if (activeRoles.includes('washer')) {
        const { data: washerData } = await supabase
          .from('washer_profiles')
          .select('*')
          .eq('user_id', userId)
          .single()
        
        washerProfile = washerData || undefined
      }

      if (activeRoles.includes('customer')) {
        const { data: customerData } = await supabase
          .from('customer_profiles')
          .select('*')
          .eq('user_id', userId)
          .single()
        
        customerProfile = customerData || undefined
      }

      const userWithRoles: UserWithRoles = {
        id: profileData.id,
        email: profileData.email,
        profile: {
          id: profileData.id,
          email: profileData.email,
          full_name: profileData.full_name,
          phone_number: profileData.phone_number,
          avatar_url: profileData.avatar_url,
          timezone: profileData.timezone,
          language: profileData.language,
          created_at: profileData.created_at,
          updated_at: profileData.updated_at
        },
        roles: activeRoles,
        primaryRole,
        washerProfile,
        customerProfile
      }

      return {
        success: true,
        data: userWithRoles
      }
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          type: 'UnknownError'
        }
      }
    }
  }

  /**
   * Assign role to user
   */
  static async assignRole(
    userId: string, 
    role: UserRole, 
    assignedBy?: string
  ): Promise<ServiceResult<void>> {
    try {
      const supabase = createSupabaseServerClient()

      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role,
          status: 'active',
          assigned_by: assignedBy,
          assigned_at: new Date().toISOString()
        })

      if (error) {
        return {
          success: false,
          error: {
            message: error.message,
            type: 'RoleAssignmentError',
            code: error.code
          }
        }
      }

      // Create role-specific profile if needed
      if (role === 'washer') {
        await this.createWasherProfile(userId)
      } else if (role === 'customer') {
        await this.createCustomerProfile(userId)
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          type: 'UnknownError'
        }
      }
    }
  }

  /**
   * Remove role from user
   */
  static async removeRole(userId: string, role: UserRole): Promise<ServiceResult<void>> {
    try {
      const supabase = createSupabaseServerClient()

      const { error } = await supabase
        .from('user_roles')
        .update({ status: 'inactive' })
        .eq('user_id', userId)
        .eq('role', role)

      if (error) {
        return {
          success: false,
          error: {
            message: error.message,
            type: 'RoleRemovalError',
            code: error.code
          }
        }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          type: 'UnknownError'
        }
      }
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(
    userId: string, 
    data: ProfileUpdate
  ): Promise<ServiceResult<Profile>> {
    try {
      const supabase = createSupabaseServerClient()

      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        return {
          success: false,
          error: {
            message: error.message,
            type: 'ProfileUpdateError',
            code: error.code
          }
        }
      }

      return {
        success: true,
        data: updatedProfile
      }
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          type: 'UnknownError'
        }
      }
    }
  }

  /**
   * Update washer profile
   */
  static async updateWasherProfile(
    userId: string, 
    data: WasherProfileUpdate
  ): Promise<ServiceResult<WasherProfile>> {
    try {
      const supabase = createSupabaseServerClient()

      const { data: updatedProfile, error } = await supabase
        .from('washer_profiles')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        return {
          success: false,
          error: {
            message: error.message,
            type: 'WasherProfileUpdateError',
            code: error.code
          }
        }
      }

      return {
        success: true,
        data: updatedProfile
      }
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          type: 'UnknownError'
        }
      }
    }
  }

  /**
   * Update customer profile
   */
  static async updateCustomerProfile(
    userId: string, 
    data: CustomerProfileUpdate
  ): Promise<ServiceResult<CustomerProfile>> {
    try {
      const supabase = createSupabaseServerClient()

      const { data: updatedProfile, error } = await supabase
        .from('customer_profiles')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        return {
          success: false,
          error: {
            message: error.message,
            type: 'CustomerProfileUpdateError',
            code: error.code
          }
        }
      }

      return {
        success: true,
        data: updatedProfile
      }
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          type: 'UnknownError'
        }
      }
    }
  }

  /**
   * Check if user has specific role
   */
  static async userHasRole(userId: string, role: UserRole): Promise<boolean> {
    try {
      const supabase = createSupabaseServerClient()

      const { data, error } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role', role)
        .eq('status', 'active')
        .single()

      return !error && !!data
    } catch (error) {
      console.error('Error checking user role:', error)
      return false
    }
  }

  /**
   * Get user roles
   */
  static async getUserRoles(userId: string): Promise<ServiceResult<UserRole[]>> {
    try {
      const supabase = createSupabaseServerClient()

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('status', 'active')

      if (error) {
        return {
          success: false,
          error: {
            message: error.message,
            type: 'RoleQueryError',
            code: error.code
          }
        }
      }

      const roles = data.map((r: any) => r.role as UserRole)

      return {
        success: true,
        data: roles
      }
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          type: 'UnknownError'
        }
      }
    }
  }

  // =============================================
  // PRIVATE HELPER METHODS
  // =============================================

  /**
   * Determine primary role from list of roles
   */
  private static determinePrimaryRole(roles: UserRole[]): UserRole {
    if (roles.includes('admin')) return 'admin'
    if (roles.includes('washer')) return 'washer'
    return 'customer'
  }

  /**
   * Create washer profile
   */
  private static async createWasherProfile(userId: string): Promise<void> {
    const supabase = createSupabaseServerClient()
    
    // Check if profile already exists
    const { data: existing } = await supabase
      .from('washer_profiles')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (existing) return // Profile already exists

    await supabase
      .from('washer_profiles')
      .insert({
        user_id: userId,
        onboarding_status: 'not_started',
        service_areas: [],
        service_types: [],
        years_experience: 0,
        max_concurrent_bookings: 3,
        advance_booking_days: 7,
        service_radius_km: 10,
        background_check_status: 'pending',
        approval_status: 'pending',
        rating: 0,
        total_jobs: 0,
        completed_jobs: 0,
        cancellation_rate: 0,
        commission_rate: 15.00,
        is_online: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
  }

  /**
   * Create customer profile
   */
  private static async createCustomerProfile(userId: string): Promise<void> {
    const supabase = createSupabaseServerClient()
    
    // Check if profile already exists
    const { data: existing } = await supabase
      .from('customer_profiles')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (existing) return // Profile already exists

    await supabase
      .from('customer_profiles')
      .insert({
        user_id: userId,
        laundry_preferences: {},
        communication_preferences: {},
        total_bookings: 0,
        completed_bookings: 0,
        average_rating: 0,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
  }
}