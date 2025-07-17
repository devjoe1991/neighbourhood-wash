# Requirements Document

## Introduction

This feature implements a comprehensive washer verification system using Stripe Connect KYC onboarding. When new washers sign up, they will see a dedicated onboarding container on their dashboard that guides them through the Stripe Connect verification process. Only verified washers can access core washer functionality like viewing available bookings, managing their current bookings, and accessing payouts. The system ensures compliance with financial regulations while providing a smooth onboarding experience.

## Requirements

### Requirement 1

**User Story:** As a new washer who has just signed up, I want to see clear onboarding instructions on my dashboard, so that I understand what steps I need to complete to start working on the platform.

#### Acceptance Criteria

1. WHEN a washer with role 'washer' but without verified Stripe Connect status accesses their dashboard THEN the system SHALL display a prominent onboarding container
2. WHEN the onboarding container is displayed THEN it SHALL include clear instructions about the verification process
3. WHEN the onboarding container is displayed THEN it SHALL include a call-to-action button to start the Stripe Connect onboarding
4. WHEN the onboarding container is displayed THEN it SHALL explain why verification is required and what benefits it provides

### Requirement 2

**User Story:** As a new washer, I want to complete Stripe Connect KYC verification through a seamless process, so that I can start earning money on the platform.

#### Acceptance Criteria

1. WHEN a washer clicks the "Start Verification" button THEN the system SHALL create a Stripe Connect Express account if one doesn't exist
2. WHEN a Stripe Connect account is created THEN the system SHALL save the account ID to the washer's profile
3. WHEN the account creation is successful THEN the system SHALL redirect the washer to Stripe's hosted onboarding flow
4. WHEN the washer completes the Stripe onboarding THEN they SHALL be redirected back to their dashboard
5. WHEN the washer returns from Stripe onboarding THEN the system SHALL update their verification status

### Requirement 3

**User Story:** As a verified washer, I want to access all washer functionality including bookings and payouts, so that I can work effectively on the platform.

#### Acceptance Criteria

1. WHEN a washer has completed Stripe Connect verification THEN they SHALL have access to available bookings
2. WHEN a washer has completed Stripe Connect verification THEN they SHALL have access to their current bookings
3. WHEN a washer has completed Stripe Connect verification THEN they SHALL have access to payouts functionality
4. WHEN a washer has completed Stripe Connect verification THEN the onboarding container SHALL no longer be displayed

### Requirement 4

**User Story:** As an unverified washer, I want to be prevented from accessing core washer functionality, so that the platform maintains compliance and security standards.

#### Acceptance Criteria

1. WHEN a washer has not completed Stripe Connect verification THEN they SHALL NOT have access to available bookings
2. WHEN a washer has not completed Stripe Connect verification THEN they SHALL NOT have access to current bookings
3. WHEN a washer has not completed Stripe Connect verification THEN they SHALL NOT have access to payouts
4. WHEN an unverified washer attempts to access restricted functionality THEN they SHALL be redirected to the onboarding flow

### Requirement 5

**User Story:** As a washer in the middle of verification, I want to see the current status of my verification process, so that I know what steps remain to be completed.

#### Acceptance Criteria

1. WHEN a washer has started but not completed Stripe Connect onboarding THEN the system SHALL display their current verification status
2. WHEN verification is in progress THEN the system SHALL show appropriate messaging about pending verification
3. WHEN verification requires additional information THEN the system SHALL provide a link to continue the process
4. WHEN verification fails THEN the system SHALL display error information and next steps

### Requirement 6

**User Story:** As a system administrator, I want to track washer verification statuses, so that I can monitor platform compliance and help users with verification issues.

#### Acceptance Criteria

1. WHEN a washer's Stripe Connect status changes THEN the system SHALL update the profile record accordingly
2. WHEN verification status is updated THEN the system SHALL log the change for audit purposes
3. WHEN verification fails THEN the system SHALL capture error details for support purposes
4. WHEN a washer completes verification THEN the system SHALL enable all washer functionality automatically