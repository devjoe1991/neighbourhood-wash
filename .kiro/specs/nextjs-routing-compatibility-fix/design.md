# Design Document

## Overview

The Next.js routing compatibility issue stems from using `next/headers` in contexts where it's not available. The solution involves creating context-specific Supabase client utilities that work correctly in different Next.js environments: server components, client components, middleware, and server actions.

## Architecture

The current architecture has a single `createSupabaseServerClient` function that uses `next/headers`, which causes conflicts. We need to refactor this into multiple specialized client creators:

1. **Server Client** - For App Router server components and server actions
2. **Middleware Client** - For Next.js middleware (uses request/response objects)
3. **Client-side Client** - For client components (browser context)

## Components and Interfaces

### 1. Server Client (`utils/supabase/server.ts`)
- Keep existing `createSupabaseServerClient` for server components
- Add proper error handling for contexts where cookies aren't available
- Ensure compatibility with server actions

### 2. Middleware Client (`utils/supabase/middleware.ts`)
- Create `createSupabaseMiddlewareClient` that accepts NextRequest/NextResponse
- Use request/response cookie handling instead of `next/headers`
- Optimize for middleware performance requirements

### 3. Client Browser Client (`utils/supabase/client.ts`)
- Ensure existing client-side client works correctly
- Add proper browser cookie handling
- Maintain session persistence

### 4. Context Detection Utility
- Create utility to detect current execution context
- Provide appropriate client based on context
- Handle edge cases gracefully

## Data Models

No new data models are required. The existing Supabase client interfaces remain the same.

## Error Handling

### Server Context Errors
- Gracefully handle cases where `next/headers` is not available
- Provide fallback mechanisms for cookie access
- Log context-specific errors for debugging

### Middleware Errors
- Handle request/response cookie access failures
- Provide error boundaries for middleware client creation
- Ensure middleware doesn't crash on client creation failures

### Client-side Errors
- Handle browser cookie access issues
- Manage session restoration failures
- Provide user feedback for authentication issues

## Testing Strategy

### Unit Tests
- Test each client creator in isolation
- Mock Next.js contexts appropriately
- Verify error handling scenarios

### Integration Tests
- Test client creation in actual Next.js contexts
- Verify authentication flows work across all contexts
- Test middleware functionality with new client

### Compatibility Tests
- Ensure existing functionality continues to work
- Test server actions with new client structure
- Verify admin and washer flows remain functional