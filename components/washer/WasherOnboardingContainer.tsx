'use client'

import { WasherOnboardingFlow } from './WasherOnboardingFlow'

interface WasherOnboardingContainerProps {
  user: { email?: string; id?: string }
}

export function WasherOnboardingContainer({ user }: WasherOnboardingContainerProps) {
  // Real onboarding handlers for Step 1 implementation
  const handleStepComplete = async (step: number, data: unknown) => {
    console.log(`Step ${step} completed with data:`, data)
    // Step 1 is handled within the WasherOnboardingFlow component
    // Steps 2-4 will be implemented in subsequent tasks
    if (step > 1) {
      console.log(`Step ${step} implementation pending - will be added in subsequent tasks`)
    }
  }

  const handleOnboardingComplete = async () => {
    console.log('Onboarding completed!')
    // Refresh the page to show the completed dashboard
    window.location.reload()
  }

  return (
    <WasherOnboardingFlow 
      user={user}
      profile={{} as never} // Mock profile - will be properly typed in implementation
      onStepComplete={handleStepComplete}
      onOnboardingComplete={handleOnboardingComplete}
    />
  )
}