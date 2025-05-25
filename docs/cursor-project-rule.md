# Neighbourhood Wash Project Rule

## Project Context

This is a comprehensive rule for the Neighbourhood Wash web application project - a Next.js-based community marketplace connecting individuals seeking laundry services with local "Washers" who offer their laundry facilities.

### Current Focus: Soft Launch Branch

**Note:** Development is currently proceeding on the `soft-launch` branch. The primary objectives for this phase are:

- Rapid User Acquisition strategies.
- Streamlined Washer Onboarding processes.
- Implementation and promotion of the Referral System (for both Users and Washers).
- Ensuring all dashboards clearly indicate the platform is in a beta/soft-launch phase.
  Tasks related to these objectives will be prioritized from the `implementation-plan.md`.

## Project Documentation Understanding

Before assisting with any task, always read and understand:

1. **workflow.md** - Contains detailed architecture, user roles, workflows, data models
2. **prd.md** - Product Requirements Document with objectives, target audience, features
3. **implementation-plan.md** - Development phases, timelines, and specific task priorities

## Key Project Components

- Next.js 14 with App Router and TypeScript
- TailwindCSS with custom blue theme (Primary: #3498db, Secondary: #85c1e9, Accent: #2980b9)
- Supabase backend (Authentication, Database, Storage)
- Role-based architecture (Users, Washers, Admin)
- PIN verification system for secure laundry handovers
- Multi-layered referral system for platform growth

## Implementation Tracking

After completing any implementation task:

1. Add detailed notes about what was completed
2. Update the corresponding task in the implementation plan
3. Note any deviations from the original plan and reasons
4. Record any remaining subtasks or follow-up items

## Implementation Memory

### Phase 1: Project Setup & Landing Pages

- [x] Next.js with TypeScript setup _(Notes: Initialized Next.js 14 project with TypeScript. Configured ESLint, Prettier, and Playwright. Set up GitHub repository for version control.)_
- [x] TailwindCSS configuration _(Notes: Configured TailwindCSS with custom blue theme - Primary: #3498db, Secondary: #85c1e9, Accent: #2980b9, and darkMode: 'class'.)_
- [x] Dependencies installation _(Notes: Installed core dependencies for Next.js, TypeScript, TailwindCSS, Shadcn/ui, lucide-react, next-themes, @heroicons/react, and testing utilities.)_
- [x] Project structure _(Notes: Established initial project directory structure and foundational component architecture, including components/layout, components/ui, components/ThemeToggle.tsx, components/theme-provider.tsx.)_
- [x] Main landing page implementation _(Notes: Created app/page.tsx with Header and Footer. Implemented Hero section (with family-wash.jpg), 'Why Choose Us' section with feature blocks and icons (corrected DollarSign to PoundSterling icon), a CTA section, and a placeholder Testimonials section. Light/dark mode toggle functionality was built but temporarily disabled due to React 19/next-themes compatibility issues. Files: app/page.tsx, components/layout/Header.tsx, components/layout/Footer.tsx, public/images/family-wash.jpg)_
- [x] How It Works page _(Notes: Created app/how-it-works/page.tsx. Implemented detailed step-by-step sections for Users and Washers with descriptions and lucide-react icons. Added a visual process flow section (basic). Expanded Benefits section including eco-friendly aspect and PoundSterling icon. Implemented a functional FAQ section using Shadcn/ui Accordion. Resolved routing conflict by deleting app/(landing)/how-it-works/page.tsx. Files: app/how-it-works/page.tsx, components/ui/accordion.tsx)_
- [x] Our Washers page _(Notes: Created app/our-washers/page.tsx. Implemented sections for: Hero, Vetting Process, Featured Washer Profiles (with placeholder images like /images/placeholder-washer-\*.jpg and data), Benefits of Becoming a Washer, Application Process Overview (timeline style), Washer Testimonials (placeholder), and a final CTA. Used Heroicons and Lucide icons. Files: app/our-washers/page.tsx)_
- [~] Reviews page _(Notes: Created app/reviews/page.tsx. Implemented Hero section, Overall Rating display, Rating Distribution chart, and a static grid of Featured Review cards with placeholder data. Included verified badges and placeholders for filters and loading more reviews. Resolved routing conflict by deleting app/(landing)/reviews/page.tsx. Files: app/reviews/page.tsx, components/layout/Header.tsx (verified link exists))_
- [ ] FAQs page \_(Notes: ...)

### Phase 2: Authentication & User Profiles

- [x] Supabase authentication _(Notes: Implemented core Supabase authentication using email/password. Set up sign-in (`app/signin/page.tsx` via Server Action), sign-up (`app/signup/page.tsx`), and sign-out (`app/auth/actions.ts`) functionalities. Created a protected dashboard page (`app/dashboard/page.tsx`) with middleware (`middleware.ts` and `utils/supabase/middleware.ts`) for route protection. Encountered and resolved a significant server-side cookie handling issue with `next/headers` and `@supabase/ssr` by renaming `utils/supabase/server.ts` to `utils/supabase/server_new.ts` to overcome a persistent Next.js dev server cache. The client is configured in `utils/supabase/client.ts` (for client components) and `utils/supabase/server_new.ts` (for server components/actions). Implemented basic auth state in the global header (`components/layout/Header.tsx`) by fetching user data in `app/layout.tsx` and conditionally rendering UI elements; sign-in flow via Server Action ensures immediate header updates.)_
- [x] Email/password registration _(Notes: Successfully implemented email and password registration functionality via `app/signup/page.tsx`. Users can create accounts, which are stored in Supabase `auth.users` table. Basic form validation and error handling are in place. Added optional 'Referral Code' input, storing `submitted_referral_code` in `user_metadata`. **Password input enhanced with visibility toggle and Caps Lock indicator.**)_
- [~] Login form and functionality _(Notes: Created app/signin/page.tsx with UI for email and password. Implemented Supabase auth.signInWithPassword() for authentication. Includes success/error messaging and a temporary redirect to homepage '/' on successful login. Link to placeholder /forgot-password page added. **Password input enhanced with visibility toggle and Caps Lock indicator.**)_
- [x] Password reset functionality _(Notes: Created app/forgot-password/page.tsx for users to request a password reset link (calls Supabase auth.resetPasswordForEmail). Created app/reset-password/page.tsx which reads the recovery token from the URL hash, allows users to set a new password, and updates it via Supabase auth.updateUser(). The redirect URL (e.g., http://localhost:3000/reset-password) must be configured in Supabase Authentication URL Configuration. Resolved an issue where explicit supabase.auth.setSession was interfering with the recovery flow; removed it to allow Supabase client to handle context implicitly. Files: app/forgot-password/page.tsx, app/reset-password/page.tsx)_
- [x] Set up protected routes and authentication middleware _(Notes: Installed @supabase/ssr. Created Supabase client utilities in utils/supabase/client.ts, utils/supabase/server.ts, and utils/supabase/middleware.ts. Implemented middleware.ts to protect routes like /dashboard and redirect unauthenticated users to /signin, and authenticated users from auth pages to /dashboard. Updated app/signin/page.tsx to use the SSR-compatible Supabase client, resolving redirect loops. Created placeholder app/dashboard/page.tsx for testing. Key files: middleware.ts, utils/supabase/, app/dashboard/page.tsx)_
- [ ] Google OAuth integration _(Notes: Paused/Deferred. UI elements removed from signup/signin pages (app/signup/page.tsx, app/signin/page.tsx) due to complexities with Supabase metadata handling (selected_role placement) for new OAuth users and to simplify the initial auth flow. The set-default-role Edge Function logic related to Google users is now dormant. Can be revisited.)_
- [x] User profile creation _(Notes: Basic UI forms and Supabase save/load logic for Profile Information (First Name, Last Name, Phone, Postcode, Email (display-only)), Notification Preferences (single opt-in checkbox), and Laundry Preferences (Allergies, Product Preferences) implemented in `app/dashboard/settings/page.tsx`. The page was refactored to be a client component (`'use client'`) using `useEffect` for data fetching. Assumes `profiles` table in Supabase is correctly set up with all necessary columns, RLS policies, and a trigger for new user profile creation. `Textarea` and `Checkbox` components are temporarily standard HTML elements; `shadcn/ui` versions to be re-integrated. Files: `app/dashboard/settings/page.tsx`)_
- [ ] Washer profile creation _(Notes: ...)_
- [~] Reviews page _(Notes: Created app/reviews/page.tsx. Implemented Hero section, Overall Rating display, Rating Distribution chart, and a static grid of Featured Review cards with placeholder data. Included verified badges and placeholders for filters and loading more reviews. Resolved routing conflict by deleting app/(landing)/reviews/page.tsx. Files: app/reviews/page.tsx, components/layout/Header.tsx (verified link exists))_
- [~] FAQs page _(Notes: Created app/faqs/page.tsx. Implemented Hero section with placeholder search. Used Shadcn/ui Accordion for categorized FAQs: General, User, Washer, and Privacy & Security, populated with placeholder Q&As. Added a Contact Support section with a mailto link. Resolved routing conflict by deleting app/(landing)/faqs/page.tsx. Corrected key prop syntax in FAQ item mapping. Files: app/faqs/page.tsx, components/ui/accordion.tsx (reused))_
- [~] About Us page _(Notes: Created app/about/page.tsx. Implemented Hero, Our Story, Our Values (with icons), and Join Our Community (CTA) sections. Team section removed by user request. Used placeholder images. Added navigation link in Header. Files: app/about/page.tsx, components/layout/Header.tsx)_

### Phase 3: User Dashboard & Experience

- [~] Dashboard layout _(Notes: Implemented a two-column dashboard layout with a fixed sidebar (`components/dashboard/Sidebar.tsx`) and main content area. Includes 'Beta Version' notice and welcome message. Sidebar links (`Overview`, `Referrals`, `Become a Washer`, `Settings`) are present. 'Become a Washer' link is now conditional based on user role (`user_metadata.selected_role`). Placeholder pages `app/dashboard/referrals/page.tsx` and `app/dashboard/become-washer/page.tsx` created, along with `app/dashboard/washer-application/page.tsx`.)_
- [ ] Washer discovery interface _(Notes: ...)_
- [ ] Booking system _(Notes: ...)_
- [~] Referral system _(Notes: Foundational elements in place. User can see their unique referral code on `app/dashboard/referrals/page.tsx` (generated via `lib/referral.ts` and stored in `referrals` table). New users can input a referral code at signup. Backend processing via `process-referral` Edge Function is set up to link referrer and referred in `referral_events` table. Basic RLS added to `referrals` table. TODOs: RLS for `referral_events`, full end-to-end testing, UI for tracking, reward logic.)_

### Phase 4: Washer Dashboard & Experience

- [ ] Washer dashboard layout _(Notes: ...)_
- [ ] Service management interface _(Notes: ...)_
- [ ] Business analytics tools _(Notes: ...)_
- [ ] Washer referral system _(Notes: ...)_

### Phase 5: Admin Dashboard & Management Tools

- [~] Admin dashboard _(Notes: Initial admin dashboard setup at `app/(admin)/admin/dashboard/page.tsx` with styled cards linking to Users, Washers, Bookings, and Settings. Layout defined in `app/(admin)/admin/layout.tsx` with a dedicated `components/admin/AdminNavbar.tsx`. Basic styling and icons applied for a professional look.)_
- [~] User/Washer management _(Notes: User listing implemented at `app/(admin)/admin/users/page.tsx`, fetching all users via admin client and displaying key details including role from metadata. Washer listing implemented at `app/(admin)/admin/washers/page.tsx`, filtering users with 'washer' role and displaying details including application_status from metadata. Both require `SUPABASE_SERVICE_ROLE_KEY`.)_
- [ ] Platform analytics _(Notes: Main admin dashboard page has placeholder cards for stats. Actual analytics data and visualizations are pending.)_
- [x] **Admin Authentication & Security:** _(Notes: Admin routes `/admin/**` are protected by `middleware.ts`, requiring `role: 'admin'` in user/app metadata. Unauthenticated access to admin routes redirects to `/signin?type=admin`, which displays a specific warning and hides sign-up/password reset. Authenticated non-admins are redirected away from admin routes. Admin login via `signInWithEmailPassword` action in `app/auth/actions.ts` correctly redirects to `/admin/dashboard`. Admins are designated manually in Supabase.)_

### Phase 6: Backend Integration & API Development

- [x] Supabase schema setup _(Notes: `referrals` and `referral_events` tables created. A `profiles` table is now also essential and assumed to be created with columns for `id` (FK to auth.users), `email`, `first_name`, `last_name`, `phone_number`, `postcode`, `notification_preferences` (jsonb), `allergies`, `product_preferences`, `role`, `washer_status`, `created_at`, `updated_at`. RLS policies and a trigger for new user profile creation on this table are critical.)_
- [~] API endpoints implementation _(Notes: `process-referral` Supabase Edge Function created. Basic user profile data is now managed client-side via Supabase SDK in `app/dashboard/settings/page.tsx` rather than dedicated API endpoints for these specific fields.)_
- [ ] Real-time chat functionality _(Notes: ...)_

### Phase 7: Testing, Optimisation & Launch Preparation

- [ ] Component testing _(Notes: ...)_
- [ ] Integration testing _(Notes: ...)_
- [ ] Performance optimization _(Notes: ...)_

### Phase 8: Launch & Post-Launch

- [ ] Production deployment _(Notes: ...)_
- [ ] Post-launch monitoring _(Notes: ...)_

## Special Feature Focus

### PIN Verification System

- Unique 4-digit PINs for each booking
- Separate PINs for drop-off and pick-up
- Chain of custody verification at handovers

### Referral System Implementation

- [x] User referral system with unique codes _(Notes: Codes generated by `lib/referral.ts`, stored in `referrals` table, displayed on dashboard.)_
- [~] Washer referral system with enhanced rewards _(Notes: User referral code system can be leveraged; specific washer rewards/tracking TBD.)_
- [~] Referral analytics and tracking _(Notes: `referral_events` table created for tracking. `process-referral` Edge Function populates it. Analytics/UI display is TODO.)_
- [ ] Reward distribution automation _(Notes: TODO)_

## Design Guidelines

- Responsive design for all devices
- Light/dark mode toggle
- Blue theme consistency across pages
- Accessible UI following WCAG 2.1 AA compliance
- Referral Model _(Notes: `referrals` table for codes, `referral_events` table for tracking relationships. `user_metadata.submitted_referral_code` for initial capture.)_
- Referral tracking and reward system _(Notes: Core tracking via `referral_events` table and `process-referral` Edge Function in place. Reward system and detailed UI/UX for tracking are future tasks.)_

## Database Schema Reminder

Remember key data models:

- User Model (common, user-specific, washer-specific fields)
- Booking Model (with PIN verification fields)
- Rating & Review Model
- Message Model
- Referral Model
- Product Inventory Model

## When Tasks Are Completed

When a task is completed:

1. Update this memory by checking the corresponding item
2. Add detailed implementation notes
3. Link to any related files or components created
4. Note any challenges faced and solutions implemented
5. Identify any technical debt or future improvements needed

## Integration Points to Track

- Authentication flow between Next.js and Supabase
- Real-time messaging with Supabase Realtime
- Location-based Washer discovery algorithm
- Booking calendar with availability checking
- PIN verification security workflow
- Referral tracking and reward system
