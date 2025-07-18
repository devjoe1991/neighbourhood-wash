# Implementation Plan

- [x] 1. Create comprehensive 4-step onboarding service layer
  - Create function to get current onboarding status and progress
  - Create function to save profile setup data (Step 1)
  - Create function to handle Stripe Connect KYC process (Step 2)
  - Create function to manage bank account connection (Step 3)
  - Create function to process onboarding fee payment (Step 4)
  - Create function to complete onboarding and unlock features
  - Add comprehensive error handling for all onboarding operations
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3_

- [x] 2. Update WasherOnboardingFlow component for 4-step integrated flow
  - Redesign component for compact dashboard integration
  - Implement 4-step progress indicator with visual states
  - Create ProfileSetupStep component with form handling
  - Create StripeKYCStep component with Stripe Connect integration
  - Create BankConnectionStep component for bank account linking
  - Create PaymentStep component for onboarding fee processing
  - Add smooth transitions between steps with loading states
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 3.1, 4.1, 5.1_

- [x] 3. Enhance washer dashboard page for integrated onboarding experience
  - Display all operational features in locked/disabled state for incomplete washers
  - Show prominent "Complete Your Setup" section with onboarding flow
  - Implement conditional rendering based on onboarding completion status
  - Add dashboard preview cards that show what features will be unlocked
  - Ensure seamless integration of onboarding within dashboard layout
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3_

- [x] 4. Implement Step 1: Profile and service setup data persistence
  - Create form components for service area, availability, and preferences
  - Implement form validation and error handling
  - Create server actions to save profile data to backend
  - Add progress tracking for Step 1 completion
  - Ensure data persistence across browser sessions
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 5. Implement Step 2: Stripe Connect KYC integration
  - Integrate existing Stripe Connect account creation
  - Create seamless flow from dashboard to Stripe KYC
  - Handle callback from Stripe KYC completion
  - Update onboarding progress when KYC is approved
  - Add error handling for KYC failures and retries
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 6. Implement Step 3: Bank account connection to Stripe
  - Create bank account connection interface
  - Integrate with Stripe's bank account verification
  - Handle bank account verification status updates
  - Update onboarding progress when bank is connected
  - Add error handling for bank connection failures
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 7. Implement Step 4: Onboarding fee payment processing
  - Create payment form for £15 onboarding fee
  - Integrate with Stripe payment processing
  - Handle payment confirmation and status updates
  - Complete onboarding and unlock dashboard features
  - Add error handling for payment failures and retries
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 8. Update access control system for 4-step onboarding
  - Modify feature access checks to require all 4 steps completion
  - Update washer route protection to check onboarding status
  - Implement progressive feature unlocking based on step completion
  - Add proper redirects and messaging for incomplete onboarding
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4_

- [x] 9. Add onboarding progress tracking and status management
  - Create database schema for tracking onboarding progress
  - Implement status updates for each completed step
  - Add progress persistence and recovery mechanisms
  - Create admin interface for monitoring onboarding progress
  - Add logging and analytics for onboarding completion rates
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 9.1, 9.2, 9.3, 9.4_

- [x] 10. Create comprehensive error handling and user feedback
  - Implement user-friendly error messages for each onboarding step
  - Add retry mechanisms for failed operations
  - Create error recovery flows for incomplete steps
  - Add proper loading states throughout the onboarding process
  - Implement toast notifications for step completion and errors
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 11. Create unit tests for 4-step onboarding system
  - Write tests for WasherOnboardingFlow component and all step components
  - Write tests for onboarding service functions including error scenarios
  - Write tests for onboarding status checking and progress tracking
  - Write tests for access control functions with 4-step requirements
  - Write tests for payment processing and fee handling
  - _Requirements: All requirements - testing coverage_

- [x] 12. Create integration tests for complete 4-step onboarding flow
  - Write tests for end-to-end washer onboarding journey
  - Write tests for step-by-step progress updates and UI changes
  - Write tests for feature access after complete onboarding
  - Write tests for error scenarios and recovery flows in each step
  - Write tests for payment processing and dashboard unlocking
  - _Requirements: All requirements - integration testing_