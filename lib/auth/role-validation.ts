/**
 * Role Validation Utilities
 * Provides utilities for role-based access control and validation
 */

import { AuthService } from './auth-service'
import { UserService } from './user-service'
import type { UserRole, UserWithRoles } from '@/lib/types'
import { redirect } from 'next/navigation'

// =============================================
// ROLE VALIDATION FUNCTIONS
// =============================================

/**
 * Require user to be authenticated
 */
export async function requireAuth(): Promise<UserWithRoles> {
  const user = await AuthService.getCurrentUser()
  
  if (!user) {
    redirect('/signin')
  }

  const userWithRoles = await AuthService.getUserWithRoles(user.id)
  
  if (!userWithRoles) {
    redirect('/signin')
  }

  return userWithRoles
}

/**
 * Require user to have specific role
 */
export async function requireRole(role: UserRole): Promise<UserWithRoles> {
  const userWithRoles = await requireAuth()
  
  if (!userWithRoles.roles.includes(role)) {
    // Redirect based on their primary role
    redirect(getDefaultDashboardForRole(userWithRoles.primaryRole))
  }

  return userWithRoles
}

/**
 * Require user to have any of the specified roles
 */
export async function requireAnyRole(roles: UserRole[]): Promise<UserWithRoles> {
  const userWithRoles = await requireAuth()
  
  const hasRequiredRole = roles.some(role => userWithRoles.roles.includes(role))
  
  if (!hasRequiredRole) {
    // Redirect based on their primary role
    redirect(getDefaultDashboardForRole(userWithRoles.primaryRole))
  }

  return userWithRoles
}

/**
 * Require admin role
 */
export async function requireAdmin(): Promise<UserWithRoles> {
  return requireRole('admin')
}

/**
 * Require washer role with completed onboarding
 */
export async function requireWasher(): Promise<UserWithRoles> {
  const userWithRoles = await requireRole('washer')
  
  // Check onboarding status
  if (userWithRoles.washerProfile?.onboarding_status !== 'completed') {
    redirect('/washer/onboarding')
  }

  return userWithRoles
}

/**
 * Require customer role
 */
export async function requireCustomer(): Promise<UserWithRoles> {
  return requireRole('customer')
}

/**
 * Check if user has role (non-blocking)
 */
export async function hasRole(userId: string, role: UserRole): Promise<boolean> {
  return UserService.userHasRole(userId, role)
}

/**
 * Check if user has any of the specified roles (non-blocking)
 */
export async function hasAnyRole(userId: string, roles: UserRole[]): Promise<boolean> {
  const userRoles = await UserService.getUserRoles(userId)
  
  if (!userRoles.success || !userRoles.data) {
    return false
  }

  return roles.some(role => userRoles.data!.includes(role))
}

/**
 * Get user with role validation (non-blocking)
 */
export async function getUserWithRoleCheck(
  userId: string, 
  requiredRole?: UserRole
): Promise<UserWithRoles | null> {
  const userWithRoles = await AuthService.getUserWithRoles(userId)
  
  if (!userWithRoles) {
    return null
  }

  if (requiredRole && !userWithRoles.roles.includes(requiredRole)) {
    return null
  }

  return userWithRoles
}

// =============================================
// ONBOARDING VALIDATION
// =============================================

/**
 * Check if washer has completed onboarding
 */
export async function isWasherOnboardingComplete(userId: string): Promise<boolean> {
  const userWithRoles = await AuthService.getUserWithRoles(userId)
  
  if (!userWithRoles?.washerProfile) {
    return false
  }

  return userWithRoles.washerProfile.onboarding_status === 'completed'
}

/**
 * Get washer onboarding status
 */
export async function getWasherOnboardingStatus(userId: string): Promise<string | null> {
  const userWithRoles = await AuthService.getUserWithRoles(userId)
  
  return userWithRoles?.washerProfile?.onboarding_status || null
}

/**
 * Require washer with specific onboarding status
 */
export async function requireWasherWithStatus(
  allowedStatuses: string[]
): Promise<UserWithRoles> {
  const userWithRoles = await requireRole('washer')
  
  const currentStatus = userWithRoles.washerProfile?.onboarding_status
  
  if (!currentStatus || !allowedStatuses.includes(currentStatus)) {
    // Redirect to appropriate onboarding step
    redirect('/washer/onboarding')
  }

  return userWithRoles
}

// =============================================
// HELPER FUNCTIONS
// =============================================

/**
 * Get default dashboard URL for role
 */
export function getDefaultDashboardForRole(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin/dashboard'
    case 'washer':
      return '/washer/dashboard'
    case 'customer':
    default:
      return '/user/dashboard'
  }
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case 'admin':
      return 'Administrator'
    case 'washer':
      return 'Washer'
    case 'customer':
      return 'Customer'
    default:
      return 'User'
  }
}

/**
 * Check if role can access admin features
 */
export function canAccessAdmin(roles: UserRole[]): boolean {
  return roles.includes('admin')
}

/**
 * Check if role can access washer features
 */
export function canAccessWasher(roles: UserRole[]): boolean {
  return roles.includes('washer') || roles.includes('admin')
}

/**
 * Check if role can access customer features
 */
export function canAccessCustomer(roles: UserRole[]): boolean {
  return roles.includes('customer') || roles.includes('admin')
}

/**
 * Get available actions for user roles
 */
export function getAvailableActions(roles: UserRole[]): string[] {
  const actions: string[] = []
  
  if (roles.includes('customer')) {
    actions.push('create_booking', 'view_bookings', 'rate_washer')
  }
  
  if (roles.includes('washer')) {
    actions.push('accept_booking', 'view_earnings', 'update_availability')
  }
  
  if (roles.includes('admin')) {
    actions.push('manage_users', 'view_analytics', 'approve_washers')
  }
  
  return actions
}

// =============================================
// MIDDLEWARE HELPERS
// =============================================

/**
 * Create role-based middleware function
 */
export function createRoleMiddleware(requiredRoles: UserRole[]) {
  return async (userId: string): Promise<boolean> => {
    const userWithRoles = await AuthService.getUserWithRoles(userId)
    
    if (!userWithRoles) {
      return false
    }

    return requiredRoles.some(role => userWithRoles.roles.includes(role))
  }
}

/**
 * Create onboarding middleware function
 */
export function createOnboardingMiddleware(requiredStatus: string[]) {
  return async (userId: string): Promise<boolean> => {
    const userWithRoles = await AuthService.getUserWithRoles(userId)
    
    if (!userWithRoles?.washerProfile) {
      return false
    }

    return requiredStatus.includes(userWithRoles.washerProfile.onboarding_status)
  }
}