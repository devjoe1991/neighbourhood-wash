/**
 * Core Authentication Service
 * Unified authentication service with role management for the new user architecture
 */

import { createSupabaseServerClient } from '@/utils/supabase/server'
import { createClient } from '@/utils/supabase/client'
import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

// =============================================
// TYPES AND INTERFACES
// =============================================

export type UserRole = 'customer' | 'washer' | 'admin'

export interface AuthResult {
  success: boolean
  user?: UserWithRoles
  error?: AuthError
  redirectTo?: string
}

export interface AuthError {
  message: string
  type?: string
  code?: string
}

export interface Profile {
  id: string
  email: string
  full_name?: string
  phone_number?: string
  avatar_url?: string
  timezone?: string
  language?: string
  created_at: string
  updated_at: string
}

export interface UserRoleAssignment {
  id: string
  user_id: string
  role: UserRole
  status: 'active' | 'inactive' | 'suspended'
  assigned_at: string
  assigned_by?: string
}

export interface UserWithRoles {
  id: string
  email: string
  profile: Profile
  roles: UserRole[]
  primaryRole: UserRole
  washerProfile?: WasherProfileType
  customerProfile?: CustomerProfileType
}

// Import types from main types file to avoid duplication
import type { 
  WasherProfile as WasherProfileType,
  CustomerProfile as CustomerProfileType 
} from '@/lib/types'

// Types imported above

export type OnboardingStatus = 
  | 'not_started' 
  | 'profile_setup' 
  | 'verification_pending' 
  | 'verification_complete' 
  | 'payment_setup' 
  | 'completed'

export interface RedirectResult {
  url: string
  role: UserRole
}

// =============================================
// CORE AUTHENTICATION SERVICE
// =============================================

export class AuthService {
  /**
   * Sign up a new user with role assignment
   */
  static async signUp(
    email: string, 
    password: string, 
    role: UserRole,
    additionalData?: {
      fullName?: string
      phoneNumber?: string
      referralCode?: string
    }
  ): Promise<AuthResult> {
    try {
      const supabase = createSupabaseServerClient()

      // Prepare metadata
      const metadata: Record<string, any> = {
        selected_role: role,
        full_name: additionalData?.fullName,
        phone_number: additionalData?.phoneNumber
      }

      if (additionalData?.referralCode) {
        metadata.submitted_referral_code = additionalData.referralCode.trim().toUpperCase()
      }

      // Sign up the user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?role=${role}`,
        },
      })

      if (signUpError) {
        return {
          success: false,
          error: {
            message: signUpError.message,
            type: 'SignUpError',
            code: signUpError.status?.toString()
          }
        }
      }

      if (!data.user) {
        return {
          success: false,
          error: {
            message: 'User creation failed',
            type: 'SignUpError'
          }
        }
      }

      return {
        success: true,
        redirectTo: '/auth/confirm-email'
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
   * Sign in user with role-based redirect
   */
  static async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      const supabase = createSupabaseServerClient()

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInError) {
        return {
          success: false,
          error: {
            message: signInError.message,
            type: 'CredentialsSignin',
            code: signInError.status?.toString()
          }
        }
      }

      if (!data.user) {
        return {
          success: false,
          error: {
            message: 'Authentication failed',
            type: 'CredentialsSignin'
          }
        }
      }

      // Get user with roles for redirect determination
      const userWithRoles = await this.getUserWithRoles(data.user.id)
      
      if (!userWithRoles) {
        return {
          success: false,
          error: {
            message: 'User profile not found',
            type: 'ProfileError'
          }
        }
      }

      // Determine redirect URL based on primary role
      const redirectTo = this.getRedirectUrlForRole(userWithRoles.primaryRole, userWithRoles)

      return {
        success: true,
        user: userWithRoles,
        redirectTo
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
   * Sign out user
   */
  static async signOut(): Promise<{ success: boolean; error?: AuthError }> {
    try {
      const supabase = createSupabaseServerClient()
      const { error } = await supabase.auth.signOut()

      if (error) {
        return {
          success: false,
          error: {
            message: error.message,
            type: 'SignOutError'
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
   * Get current authenticated user
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      const supabase = createSupabaseServerClient()
      const { data: { user } } = await supabase.auth.getUser()
      return user
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  }

  /**
   * Get user with all roles and profile data
   */
  static async getUserWithRoles(userId: string): Promise<UserWithRoles | null> {
    try {
      const supabase = createSupabaseServerClient()

      // Get user profile and roles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles!inner(role, status)
        `)
        .eq('id', userId)
        .single()

      if (profileError || !profileData) {
        console.error('Error fetching user profile:', profileError)
        return null
      }

      // Extract active roles
      const activeRoles = profileData.user_roles
        .filter((ur: any) => ur.status === 'active')
        .map((ur: any) => ur.role as UserRole)

      if (activeRoles.length === 0) {
        console.error('User has no active roles')
        return null
      }

      // Determine primary role (admin > washer > customer)
      const primaryRole = this.determinePrimaryRole(activeRoles)

      // Get role-specific profiles
      let washerProfile: WasherProfileType | undefined
      let customerProfile: CustomerProfileType | undefined

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

      return {
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
    } catch (error) {
      console.error('Error getting user with roles:', error)
      return null
    }
  }

  /**
   * Handle authentication callback after email confirmation
   */
  static async handleAuthCallback(code: string, role?: UserRole): Promise<RedirectResult> {
    try {
      const supabase = createSupabaseServerClient()

      // Exchange code for session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error || !data.user) {
        throw new Error(error?.message || 'Failed to exchange code for session')
      }

      // Create user profile and assign role
      await this.createUserProfile(data.user.id, data.user.email!, role || 'customer')

      // Get user with roles for redirect
      const userWithRoles = await this.getUserWithRoles(data.user.id)
      
      if (!userWithRoles) {
        throw new Error('Failed to create user profile')
      }

      const redirectUrl = this.getRedirectUrlForRole(userWithRoles.primaryRole, userWithRoles)

      return {
        url: redirectUrl,
        role: userWithRoles.primaryRole
      }
    } catch (error) {
      console.error('Auth callback error:', error)
      return {
        url: '/auth/auth-code-error',
        role: 'customer'
      }
    }
  }

  /**
   * Create user profile and assign initial role
   */
  static async createUserProfile(
    userId: string, 
    email: string, 
    role: UserRole
  ): Promise<{ success: boolean; error?: AuthError }> {
    try {
      const supabase = createSupabaseServerClient()

      // Create profile (if it doesn't exist)
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (profileError) {
        return {
          success: false,
          error: {
            message: profileError.message,
            type: 'ProfileCreationError'
          }
        }
      }

      // Assign role
      const roleResult = await this.assignRole(userId, role)
      if (!roleResult.success) {
        return roleResult
      }

      // Create role-specific profiles
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
   * Assign role to user
   */
  static async assignRole(
    userId: string, 
    role: UserRole, 
    assignedBy?: string
  ): Promise<{ success: boolean; error?: AuthError }> {
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
            type: 'RoleAssignmentError'
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
   * Get redirect URL based on user role and profile status
   */
  private static getRedirectUrlForRole(role: UserRole, user: UserWithRoles): string {
    switch (role) {
      case 'admin':
        return '/admin/dashboard'
      
      case 'washer':
        // Check onboarding status
        if (user.washerProfile?.onboarding_status !== 'completed') {
          return '/washer/onboarding'
        }
        return '/washer/dashboard'
      
      case 'customer':
      default:
        return '/user/dashboard'
    }
  }

  /**
   * Create washer profile
   */
  private static async createWasherProfile(userId: string): Promise<void> {
    const supabase = createSupabaseServerClient()
    
    await supabase
      .from('washer_profiles')
      .upsert({
        user_id: userId,
        onboarding_status: 'not_started',
        service_areas: [],
        service_types: [],
        approval_status: 'pending',
        rating: 0,
        total_jobs: 0,
        completed_jobs: 0,
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
    
    await supabase
      .from('customer_profiles')
      .upsert({
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