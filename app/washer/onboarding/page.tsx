import { createSupabaseServerClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { WasherOnboardingFlow } from '@/components/washer/WasherOnboardingFlow'

export const dynamic = 'force-dynamic'

export default async function WasherOnboardingPage() {
  const supabase = createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/signin?message=Please sign in to start onboarding.')
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, washer_status, stripe_account_id, stripe_account_status')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return redirect('/washer/dashboard?message=Profile not found.')
  }

  // Verify user is an approved washer
  if (profile.role !== 'washer' || profile.washer_status !== 'approved') {
    return redirect('/washer/dashboard?message=Access denied.')
  }

  // If they already have a complete Stripe account, redirect to dashboard
  if (profile.stripe_account_id && profile.stripe_account_status === 'complete') {
    return redirect('/washer/dashboard?message=Onboarding already complete.')
  }

  const handleStepComplete = async (step: number, data: unknown) => {
    console.log(`Step ${step} completed with data:`, data)
    // Handle step completion logic here
  }

  const handleOnboardingComplete = async () => {
    console.log('Onboarding completed!')
    // Redirect to dashboard
    redirect('/washer/dashboard')
  }

  return (
    <WasherOnboardingFlow 
      user={user}
      profile={profile as unknown}
      onStepComplete={handleStepComplete}
      onOnboardingComplete={handleOnboardingComplete}
    />
  )
}