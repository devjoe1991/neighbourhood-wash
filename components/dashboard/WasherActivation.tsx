'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState, useTransition } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  createAndOnboardStripeConnectAccount,
  createOnboardingFeeCheckoutSession,
} from '@/lib/stripe/actions'
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'

type Profile = {
  onboarding_fee_paid: boolean
  stripe_account_id: string | null
  stripe_account_status: string | null
}

export default function WasherActivation() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const supabase = createClient()

  useEffect(() => {
    async function fetchProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select(
            'onboarding_fee_paid, stripe_account_id, stripe_account_status'
          )
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Error fetching profile:', error)
        } else {
          setProfile(data as Profile)
        }
      }
      setLoading(false)
    }
    fetchProfile()
  }, [supabase])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Activation Status...</CardTitle>
        </CardHeader>
        <CardContent>
          <Loader2 className='h-8 w-8 animate-spin' />
        </CardContent>
      </Card>
    )
  }

  if (!profile) {
    return null // Or show an error
  }

  // State 1: Needs to pay onboarding fee
  if (!profile.onboarding_fee_paid) {
    return (
      <Card className='border-blue-200 bg-blue-50 dark:bg-blue-900/20'>
        <CardHeader>
          <CardTitle>Activate Your Washer Account</CardTitle>
          <CardDescription>
            A one-time fee is required for safety checks and platform access to
            start earning.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='mb-4'>
            <span className='text-primary mr-2 text-3xl font-bold'>£14.99</span>
            <span className='text-muted-foreground text-xl line-through'>
              £49.99
            </span>
          </div>
          <form
            action={() =>
              startTransition(() => createOnboardingFeeCheckoutSession())
            }
          >
            <Button type='submit' disabled={isPending}>
              {isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Become a Verified Washer
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  // State 2: Fee paid, needs to connect Stripe account
  if (!profile.stripe_account_id) {
    return (
      <Card className='border-green-200 bg-green-50 dark:bg-green-900/20'>
        <CardHeader>
          <div className='flex items-center space-x-2'>
            <CheckCircle2 className='h-6 w-6 text-green-600' />
            <CardTitle>Step 1 Complete!</CardTitle>
          </div>
          <CardDescription>
            Your payment was successful. The final step is to connect your bank
            account to receive payouts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={() =>
              startTransition(() => createAndOnboardStripeConnectAccount())
            }
          >
            <Button type='submit' disabled={isPending}>
              {isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Connect with Stripe
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  // State 3: Stripe account is pending verification
  if (profile.stripe_account_status !== 'enabled') {
    return (
      <Card className='border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20'>
        <CardHeader>
          <div className='flex items-center space-x-2'>
            <AlertTriangle className='h-6 w-6 text-yellow-600' />
            <CardTitle>Account Pending Verification</CardTitle>
          </div>
          <CardDescription>
            Your Stripe account is being verified. This can take a few minutes,
            but may sometimes take longer. Stripe will email you if any more
            information is required. You can now close this page.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // State 4: Onboarding is fully complete
  return null
}
