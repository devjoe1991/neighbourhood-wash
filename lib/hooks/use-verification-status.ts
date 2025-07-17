'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { canAccessWasherFeatures, type StripeAccountStatus } from '@/lib/stripe/actions'

export interface VerificationStatus {
  canAccess: boolean
  status: StripeAccountStatus
  accountId?: string
  isLoading: boolean
  error?: string
}

export function useVerificationStatus(userId?: string): VerificationStatus {
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>({
    canAccess: false,
    status: 'incomplete',
    isLoading: true,
  })

  const supabase = createClient()

  useEffect(() => {
    if (!userId) {
      setVerificationStatus({
        canAccess: false,
        status: 'incomplete',
        isLoading: false,
        error: 'No user ID provided',
      })
      return
    }

    const checkVerificationStatus = async () => {
      try {
        setVerificationStatus(prev => ({ ...prev, isLoading: true }))

        // First check if user is a washer
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, stripe_account_id, stripe_account_status')
          .eq('id', userId)
          .single()

        if (profileError || !profile) {
          setVerificationStatus({
            canAccess: false,
            status: 'incomplete',
            isLoading: false,
            error: 'Failed to fetch profile',
          })
          return
        }

        // Non-washers don't need verification
        if (profile.role !== 'washer') {
          setVerificationStatus({
            canAccess: true,
            status: 'complete',
            isLoading: false,
          })
          return
        }

        // Check verification status for washers
        const result = await canAccessWasherFeatures(userId)

        if (!result.success) {
          // Fall back to cached status if API call fails
          const cachedStatus = (profile.stripe_account_status as StripeAccountStatus) || 'incomplete'
          setVerificationStatus({
            canAccess: cachedStatus === 'complete',
            status: cachedStatus,
            accountId: profile.stripe_account_id || undefined,
            isLoading: false,
            error: 'Using cached status due to API error',
          })
          return
        }

        const { canAccess, status, accountId } = result.data || {
          canAccess: false,
          status: 'incomplete' as StripeAccountStatus,
          accountId: undefined,
        }

        setVerificationStatus({
          canAccess,
          status,
          accountId,
          isLoading: false,
        })
      } catch (error) {
        console.error('Error checking verification status:', error)
        setVerificationStatus({
          canAccess: false,
          status: 'incomplete',
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    checkVerificationStatus()
  }, [userId, supabase])

  return verificationStatus
}