# Requirements Document

## Introduction

The application is experiencing a Next.js routing compatibility error where `next/headers` is being imported in a context that doesn't support it. The error indicates that a Server Component pattern is being used in a pages directory context, which is not supported. This needs to be resolved to ensure proper Supabase client initialization across different contexts.

## Requirements

### Requirement 1

**User Story:** As a developer, I want the Supabase client to work correctly in all contexts, so that the application doesn't crash with routing errors.

#### Acceptance Criteria

1. WHEN the application loads THEN the Supabase server client SHALL initialize without Next.js routing errors
2. WHEN server actions are executed THEN they SHALL successfully create Supabase clients without compatibility issues
3. WHEN middleware runs THEN it SHALL access Supabase without `next/headers` conflicts

### Requirement 2

**User Story:** As a developer, I want proper separation between server and client Supabase utilities, so that each context uses the appropriate client type.

#### Acceptance Criteria

1. WHEN server components need Supabase access THEN they SHALL use the server client with proper cookie handling
2. WHEN client components need Supabase access THEN they SHALL use the client-side Supabase client
3. WHEN middleware needs Supabase access THEN it SHALL use a middleware-specific client that doesn't rely on `next/headers`

### Requirement 3

**User Story:** As a developer, I want the existing functionality to continue working after the fix, so that no features are broken.

#### Acceptance Criteria

1. WHEN authentication flows are tested THEN they SHALL work exactly as before
2. WHEN admin functions are executed THEN they SHALL continue to access Supabase correctly
3. WHEN washer verification processes run THEN they SHALL maintain their current functionality