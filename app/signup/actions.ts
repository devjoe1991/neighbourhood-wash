'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { AuthService } from '@/lib/auth/auth-service'
import type { UserRole } from '@/lib/types'

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const referralCode = formData.get('referral_code') as string
  const role = (formData.get('role') as string) || 'customer'
  const fullName = formData.get('full_name') as string
  const phoneNumber = formData.get('phone_number') as string

  // Validate role
  const validRoles: UserRole[] = ['customer', 'washer', 'admin']
  const userRole: UserRole = validRoles.includes(role as UserRole) ? role as UserRole : 'customer'

  // Prepare additional data
  const additionalData = {
    fullName: fullName || undefined,
    phoneNumber: phoneNumber || undefined,
    referralCode: referralCode?.trim() || undefined
  }

  // Use the new AuthService
  const result = await AuthService.signUp(email, password, userRole, additionalData)

  if (!result.success) {
    console.error('Sign up error:', result.error)
    const errorMessage = result.error?.message || 'Could not authenticate user'
    return redirect(`/signup?message=${encodeURIComponent(errorMessage)}`)
  }

  // Process referral code if provided (legacy support)
  if (additionalData.referralCode) {
    try {
      // This is handled in the AuthService, but we can add additional processing here if needed
      console.log('Referral code processed:', additionalData.referralCode)
    } catch (error) {
      // Log error but don't fail signup for referral issues
      console.error('Error processing referral:', error)
    }
  }

  // Success! Redirect to the confirmation page or specified redirect
  return redirect(result.redirectTo || '/auth/confirm-email')
}
