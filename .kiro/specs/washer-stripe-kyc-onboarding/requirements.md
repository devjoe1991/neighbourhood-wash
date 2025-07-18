# Requirements Document

## Introduction

This feature implements a comprehensive 4-step washer onboarding system integrated directly into the dashboard overview. When new washers sign up, they see their dashboard with all operational features visible but locked/disabled. A prominent "Complete Your Setup" section guides them through: (1) Profile/Service Setup with data stored in our backend, (2) Stripe Connect KYC verification with ID uploads, (3) Bank account connection to Stripe for payouts, and (4) Onboarding fee payment. Only after completing all steps do washers gain access to full dashboard functionality. The entire process happens inline within the dashboard, ensuring a seamless integrated experience.

## Requirements

### Requirement 1

**User Story:** As a new washer who has just signed up, I want to see my dashboard with all features visible but locked, and a clear "Complete Your Setup" section, so that I understand what I can access once I complete onboarding.

#### Acceptance Criteria

1. WHEN a washer with role 'washer' but incomplete onboarding accesses their dashboard THEN the system SHALL display all operational features (bookings, payouts, etc.) in a locked/disabled state
2. WHEN the dashboard is displayed THEN it SHALL show a prominent "Complete Your Setup" section with 4-step progress indicators
3. WHEN the setup section is displayed THEN it SHALL show which steps are completed, current, and pending
4. WHEN the setup section is displayed THEN it SHALL allow the washer to start or continue their onboarding process inline within the dashboard

### Requirement 2

**User Story:** As a new washer, I want to complete my profile and service setup as the first step of onboarding, so that the platform knows my service area and availability for analytics and filtering.

#### Acceptance Criteria

1. WHEN a washer starts Step 1 of onboarding THEN the system SHALL display a form for profile and service setup
2. WHEN the profile form is displayed THEN it SHALL include First Name and Last Name fields pre-filled from signup data
3. WHEN the profile form is displayed THEN it SHALL include a Service Area dropdown with the following London boroughs: Barking and Dagenham, Barnet, Bexley, Brent, Bromley, Camden, Croydon, Ealing, Enfield, Greenwich, Hackney, Hammersmith and Fulham, Haringey, Harrow, Havering, Hillingdon, Hounslow, Islington, Kensington and Chelsea, Kingston upon Thames, Lambeth, Lewisham, Merton, Newham, Redbridge, Richmond upon Thames, Southwark, Sutton, Tower Hamlets, Waltham Forest, Wandsworth, Westminster, City of London
4. WHEN the profile form is displayed THEN it SHALL include availability checkboxes with clear time slots matching the exact booking time slots available to users
5. WHEN the profile form is displayed THEN it SHALL NOT include service types selection as all washers provide all services
6. WHEN the profile form is displayed THEN it SHALL NOT include additional preferences section
7. WHEN a washer submits the profile form THEN the system SHALL save all data to the washer's profile for analytics and filtering
8. WHEN the profile data is successfully saved THEN Step 1 SHALL be marked as completed and Step 2 SHALL become available
9. WHEN Step 1 is completed THEN the washer SHALL be able to proceed to Stripe Connect KYC verification

### Requirement 3

**User Story:** As a new washer, I want to complete Stripe Connect KYC verification with ID uploads, so that I can be verified to handle payments on the platform.

#### Acceptance Criteria

1. WHEN a washer starts Step 2 of onboarding THEN the system SHALL create a Stripe Connect Express account if one doesn't exist
2. WHEN a Stripe Connect account is created THEN the system SHALL save the account ID to the washer's profile
3. WHEN the account creation is successful THEN the system SHALL redirect the washer to Stripe's hosted KYC onboarding flow
4. WHEN the washer completes Stripe KYC (including ID uploads) THEN they SHALL be redirected back to their dashboard
5. WHEN the washer returns from Stripe KYC THEN Step 2 SHALL be marked as completed and Step 3 SHALL become available

### Requirement 4

**User Story:** As a verified washer, I want to connect my bank account to Stripe for payouts, so that I can receive payments for my services.

#### Acceptance Criteria

1. WHEN a washer starts Step 3 of onboarding THEN the system SHALL provide options to connect their bank account to Stripe
2. WHEN a washer successfully connects their bank account THEN Stripe SHALL verify the bank account details
3. WHEN the bank account is verified THEN Step 3 SHALL be marked as completed and Step 4 SHALL become available
4. WHEN Step 3 is completed THEN the washer SHALL be able to proceed to the onboarding fee payment

### Requirement 5

**User Story:** As a washer completing onboarding, I want to pay the onboarding fee as the final step, so that I can unlock full access to the platform.

#### Acceptance Criteria

1. WHEN a washer starts Step 4 of onboarding THEN the system SHALL display the onboarding fee payment form
2. WHEN the payment form is displayed THEN it SHALL show the fee amount and payment options
3. WHEN a washer successfully pays the onboarding fee THEN the payment SHALL be processed and confirmed
4. WHEN the payment is confirmed THEN Step 4 SHALL be marked as completed and all dashboard features SHALL be unlocked
5. WHEN all 4 steps are completed THEN the washer SHALL have full access to bookings, payouts, and all platform features

### Requirement 6

**User Story:** As a completed washer, I want to access all washer functionality including bookings and payouts, so that I can work effectively on the platform.

#### Acceptance Criteria

1. WHEN a washer has completed all 4 onboarding steps THEN they SHALL have access to available bookings
2. WHEN a washer has completed all 4 onboarding steps THEN they SHALL have access to their current bookings
3. WHEN a washer has completed all 4 onboarding steps THEN they SHALL have access to payouts functionality
4. WHEN a washer has completed all 4 onboarding steps THEN the onboarding container SHALL no longer be displayed

### Requirement 7

**User Story:** As an incomplete washer, I want to be prevented from accessing core washer functionality, so that the platform maintains compliance and security standards.

#### Acceptance Criteria

1. WHEN a washer has not completed all 4 onboarding steps THEN they SHALL NOT have access to available bookings
2. WHEN a washer has not completed all 4 onboarding steps THEN they SHALL NOT have access to current bookings
3. WHEN a washer has not completed all 4 onboarding steps THEN they SHALL NOT have access to payouts
4. WHEN an incomplete washer attempts to access restricted functionality THEN they SHALL see the locked/disabled state

### Requirement 8

**User Story:** As a washer in the middle of onboarding, I want to see the current status of my onboarding progress, so that I know what steps remain to be completed.

#### Acceptance Criteria

1. WHEN a washer has started but not completed onboarding THEN the system SHALL display their current step progress
2. WHEN onboarding is in progress THEN the system SHALL show appropriate messaging about pending steps
3. WHEN a step requires additional information THEN the system SHALL provide a way to continue that step
4. WHEN a step fails THEN the system SHALL display error information and retry options

### Requirement 9

**User Story:** As a system administrator, I want to track washer onboarding progress and statuses, so that I can monitor platform compliance and help users with onboarding issues.

#### Acceptance Criteria

1. WHEN a washer's onboarding status changes THEN the system SHALL update the profile record accordingly
2. WHEN onboarding status is updated THEN the system SHALL log the change for audit purposes
3. WHEN onboarding fails THEN the system SHALL capture error details for support purposes
4. WHEN a washer completes onboarding THEN the system SHALL enable all washer functionality automatically

### Requirement 10

**User Story:** As a system administrator, I want to filter and analyze washer data by service areas and availability, so that I can understand market coverage and make data-driven business decisions.

#### Acceptance Criteria

1. WHEN viewing the admin dashboard THEN the system SHALL provide filtering options by service area
2. WHEN a service area filter is applied THEN the system SHALL show the number of washers in that area
3. WHEN viewing service area analytics THEN the system SHALL show active bookings and previous bookings per area
4. WHEN a washer selects "Other" for service area THEN the system SHALL store the custom area in the backend for future analytics
5. WHEN viewing availability analytics THEN the system SHALL show washer availability patterns by time slots
6. WHEN custom service areas are entered THEN the system SHALL track expansion requests for business planning