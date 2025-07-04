# Enhanced Implementation Plan: Neighbourhood Wash Web Application

## 1. Project Goals

- Develop and launch a user-friendly, visually appealing Neighbourhood Wash web application that connects users with local "Washers" for laundry services
- Focus on frontend development first to create a fully functional UI/UX before implementing complex backend functionality
- Prioritize development of key landing pages (Main page, How it Works, Our Washers, Reviews, FAQs) to establish brand presence
- Utilise Next.js for frontend and Supabase for backend services and database
- Create separate user experiences for three user roles: Users, Washers, and Administrators
- Implement referral system from launch for both Users and Washers to encourage platform growth

## 1.A. Current Development Focus: Soft Launch Branch

**Note:** Development is currently proceeding on the `soft-launch` branch. The primary objectives for this phase are:

- Rapid User Acquisition strategies.
- Streamlined Washer Onboarding processes.
- Implementation and promotion of the Referral System (for both Users and Washers).
- Ensuring all dashboards clearly indicate the platform is in a beta/soft-launch phase.
  Tasks related to these objectives within the subsequent phases will be prioritized.

## 2. Technology Stack

- **Frontend**:
  - Next.js 14 with App Router
  - TypeScript
  - TailwindCSS with custom blue theme
  - Radix UI components
  - Shadcn/ui for enhanced UI components
- **Backend**:
  - Supabase (PostgreSQL database)
  - Supabase Auth with Google OAuth integration
  - Supabase Realtime for chat functionality
  - Next.js API routes
- **Deployment**:
  - Vercel for hosting
  - CI/CD pipeline for automated testing and deployment

## 3. Color Scheme

- Primary Blue: `#3498db` (Main brand color)
- Secondary Blue: `#85c1e9` (Lighter shade)
- Accent Blue: `#2980b9` (Darker shade)
- Background: `#ffffff` (Light mode)
- Text: `#333333` (Dark text)
- Success: `#2ecc71` (Green)
- Warning: `#e67e22` (Orange)
- Error: `#e74c3c` (Red)

## 4. Implementation Phases

### Phase 1: Project Setup & Landing Pages (3 weeks)

#### Week 1: Project Initialization

- [x] Set up Next.js project with TypeScript
- [x] Configure TailwindCSS with custom theme
- [x] Install and set up necessary dependencies
- [x] Create project structure and component architecture
- [x] Set up version control (GitHub repository)
- [x] Configure ESLint and Prettier
- [x] Set up automated testing environment (Playwright)

#### Week 2: Core Landing Pages

- [x] Create responsive layout with header and footer
- [~] Implement light/dark mode toggle _(Note: Temporarily disabled due to React 19/next-themes compatibility issues. To be revisited.)_
- [x] Develop main landing page with:
  - [x] Hero section with clear value proposition
  - [x] Service explanation section
  - [x] Call-to-action buttons
  - [x] Testimonials section (placeholder content)
- [x] Build "How It Works" page with:
  - [x] Step-by-step process explanation for both Users and Washers
  - [x] Visual process flow diagram _(Note: Basic version implemented; can be enhanced later)_
  - [x] Benefits section highlighting convenience and community aspects _(Note: Initial placeholder content added)_
  - [x] FAQ section specific to the service process _(Note: Implemented with Accordion component)_

#### Week 3: Additional Landing Pages

- [x] Create "Our Washers" page with:
  - [x] Washer vetting process explanation
  - [x] Featured Washer profiles (placeholder content & images, e.g., /images/placeholder-washer-\*.jpg)
  - [x] Benefits of becoming a Washer section
  - [x] Washer sign-up call-to-action
  - [x] Application process overview
  - [x] Washer testimonials (placeholder content)
- [x] Build "Reviews" showcase page with:
  - [x] Overall rating display
  - [x] Rating distribution visualization
  - [x] Featured review cards with user location (static grid with placeholders)
  - [ ] Filter options for review categories (placeholder button added)
  - [ ] User success stories (covered by featured reviews for now)
  - [ ] Washer testimonials (covered by featured reviews for now)
  - [x] Verified review badges
- [~] Implement comprehensive "FAQs" page with:
  - [x] Accordion-style interface for question categories
  - [x] User-specific FAQs section
  - [x] Washer-specific FAQs section
  - [x] General platform FAQs section
  - [x] Contact form for additional questions (implemented as mailto link)
  - [ ] Search functionality for questions (placeholder input added)
  - [ ] Link to support resources (implicitly via contact)
  - [x] Common troubleshooting section (covered by general/user/washer FAQs)
  - [x] Privacy and security FAQ section
- [ ] Create Contact page with form _(Note: Deferred by user request)_
- [~] Implement About Us page _(Notes: Initial page structure created with Hero, Story, Values, and CTA. Team section removed by user request. Placeholder images used. Navigation link added.)_

### Phase 2: Authentication & User Profiles (2 weeks)

#### Week 4: Authentication System

- [x] Set up Supabase for authentication _(Notes: Installed @supabase/supabase-js and @supabase/ssr. Configured .env.local with Supabase URL & anon key. Created Supabase client utilities in `utils/supabase/client.ts` (for client-side), `utils/supabase/server_new.ts` (for server-side, formerly server.ts - renamed to fix a persistent Next.js dev cache issue related to cookie handling), and `utils/supabase/middleware.ts` (for middleware operations).)_
- [x] Implement email/password registration with role selection _(Notes: Created `app/signup/page.tsx` with UI for email, password, confirm password, and role selection (User/Washer). Added client-side validation and Supabase `signUp` call. The chosen role is passed as `selected_role` in `options.data` within the `signUp` call, which stores it in `auth.users.raw_user_meta_data`. Includes success/error messaging. Resolved various ESLint and styling issues. Corrected /join links to /signup. **Added an optional 'Referral Code' input field that stores the `submitted_referral_code` in user_metadata.**)_
- [x] Create login form and functionality _(Notes: Created `app/signin/page.tsx` with UI for email and password. Implemented Supabase `auth.signInWithPassword()` for authentication. Includes success/error messaging and redirect to `/dashboard` on successful login. Link to `/forgot-password` page added.)_
- [x] Add password reset functionality _(Notes: Created `app/forgot-password/page.tsx` to request reset link via Supabase `auth.resetPasswordForEmail()`. Created `app/reset-password/page.tsx` to handle token from URL hash, allow new password input, and update via Supabase `auth.updateUser()`. Ensured Supabase redirect URL for `http://localhost:3000/reset-password` is configured. Debugged and resolved token validation issue.)_
- [x] **Enhance Password Fields (Login & Signup):**
  - [x] Implement password visibility toggle (show/hide eye icon).
  - [x] Add Caps Lock indicator to alert users if Caps Lock is active.
  - [x] Created `components/ui/PasswordInput.tsx` and integrated it into `app/signin/page.tsx` and `app/signup/page.tsx`.
- [ ] Implement Google OAuth integration _(Notes: Paused/Deferred. UI elements removed from signup/signin pages (`app/signup/page.tsx`, `app/signin/page.tsx`) due to complexities with Supabase metadata handling (`selected_role` placement) for new OAuth users and to simplify the initial auth flow. The `set-default-role` Edge Function logic related to Google users is now dormant. Can be revisited.)_
- [ ] Create role selection page for OAuth users _(Notes: Deferred as Google OAuth integration is paused.)_
- [x] Set up protected routes and authentication middleware _(Notes: Implemented `middleware.ts` using `@supabase/ssr` to protect routes like `/dashboard` and redirect unauthenticated users to `/signin`, and authenticated users from auth pages to `/dashboard`. Created `app/dashboard/page.tsx` for testing, which now displays user email and a functional sign-out button. Resolved significant server-side cookie handling issues by updating `utils/supabase/server_new.ts` to correctly `await cookies()` and by renaming the file from `server.ts` to overcome a persistent Next.js dev server cache. This ensures `supabase.auth.getUser()` works correctly in Server Components with `export const dynamic = 'force-dynamic';`. Fixed related ESLint and TypeScript errors.)_
- [x] Add authentication state management _(Notes: Implemented basic auth state in the global header by fetching the user in `app/layout.tsx` (RootLayout) using the server-side Supabase client. The `user` object is passed to `components/layout/Header.tsx`, which conditionally renders "Sign In"/"Sign Up" buttons or "Dashboard"/"Sign Out" buttons based on authentication status. Sign-in flow updated to use a Server Action to ensure immediate header updates post-login.)_

#### Week 5: Profile Management

- [x] Create user profile creation forms _(Notes: UI forms for displaying and updating profile information are implemented in `app/dashboard/settings/page.tsx`. The actual profile row in the `profiles` table is now automatically created by the `handle_new_user` trigger upon user signup. This trigger reads the `selected_role` from `auth.users.raw_user_meta_data` (set during signup) and populates the `profiles.role` and an initial `profiles.washer_status` (e.g., 'pending_application' if role is 'washer'). The settings page then fetches and displays this data. Supabase save logic for profile data (first name, last name, phone, postcode), notification preferences, and laundry preferences (allergies, product preferences) is in place.)_
- [ ] Implement Washer profile creation with additional fields
- [x] Build profile editing functionality _(Notes: Covered by the user profile creation forms and their save logic in `app/dashboard/settings/page.tsx`. Initial data loading and updates operate on the automatically created profile.)_
- [ ] Add profile picture upload with Supabase storage
- [ ] Implement address selection with Google Maps
- [ ] Create address security system (encryption and controlled visibility)
- [~] Add allergies/preferences management for users _(Notes: UI and save logic implemented in `app/dashboard/settings/page.tsx`. Data populates from `profiles` table.)_
- [ ] Build product/inventory management for Washers

### Phase 3: User Dashboard & Experience (3 weeks)

#### Week 6: User Dashboard Layout & Core Features

- [x] Create responsive dashboard layout with navigation _(Notes: Implemented a two-column dashboard layout with a fixed sidebar (`components/dashboard/Sidebar.tsx`) and main content area for pages like `app/dashboard/page.tsx`, `app/dashboard/referrals/page.tsx`, `app/dashboard/become-washer/page.tsx`. Includes 'Beta Version' notice in sidebar and welcome message on main dashboard. Resolved header overlap issues.)_
- [x] Implement dashboard overview page _(Notes: Basic overview page at `app/dashboard/page.tsx` created with welcome message and beta notice.)_
- [ ] Build Washer discovery interface with:
  - [ ] Search functionality
  - [ ] Filtering options (services, price, ratings)
  - [ ] Washer preview cards with:
    - [ ] Profile image/initials
    - [ ] First name display
    - [ ] Rating and review count
    - [ ] Approximate distance
    - [ ] Service specialties badges
    - [ ] Next available slot info
    - [ ] Verified status indicator
- [ ] Implement distance-based sorting algorithm
- [ ] Add favourites functionality
- [~] **Create referral section on dashboard with:** _(Notes: Created placeholder page `app/dashboard/referrals/page.tsx`.)_
  - [~] Unique referral code generation _(Notes: Implemented backend logic in `lib/referral.ts` to generate and store unique codes in a new `referrals` table. The `app/dashboard/referrals/page.tsx` now displays this code. RLS policy added for users to read their own codes.)_
  - [ ] Referral status tracking _(Notes: TODO - Requires linking `referral_events` table data to dashboard UI.)_
  - [ ] Promotional copy for sharing _(Notes: TODO - Add to `app/dashboard/referrals/page.tsx`.)_
  - [ ] Social media sharing links _(Notes: TODO - Add to `app/dashboard/referrals/page.tsx`.)_
  - [ ] Referral reward explanation _(Notes: TODO - Add to `app/dashboard/referrals/page.tsx`.)_

#### Week 7: Booking System (User Side)

- [ ] Create service selection interface
- [ ] Build calendar view for availability selection
- [ ] Implement time slot selection
- [ ] Add service cost calculator
- [ ] Create booking confirmation process
- [ ] Build special instructions/preferences section
- [ ] Implement booking history view
- [ ] Add booking cancellation functionality

#### Week 8: User Experience Enhancements

- [ ] Build reviews and ratings input interface
- [~] Implement referral system with code generation _(Notes: Partially implemented. See Week 6 for dashboard UI & code generation. See Phase 6 for backend.)_
- [ ] Create user notification center
- [x] **Add user settings page (`/dashboard/settings`):**
  - [x] Created `app/dashboard/settings/page.tsx` with basic layout.
  - [x] Fetches user role and profile data (first_name, last_name, phone_number, postcode, notification_preferences, allergies, product_preferences) to conditionally display settings sections and populate forms.
  - [x] Added placeholder sections (using `Card` components) for:
    - Profile Information
    - Notification Preferences
    - Laundry Preferences (for Users)
    - Appearance (Theme Settings)
    - Account & Security (including placeholder for account deletion)
  - [x] _(Future tasks: Implement actual forms and functionality for each section)._ _(Notes: Implemented UI forms and Supabase save/load logic for Profile Information, Notification Preferences, and Laundry Preferences in `app/dashboard/settings/page.tsx`. File refactored to be a client component. `Textarea` and `Checkbox` are temporarily standard HTML elements; `shadcn/ui` versions to be re-integrated after `pnpm add shadcn-ui@latest add textarea checkbox`.)_
- [x] Build allergies and preferences management _(Notes: UI form and Supabase save/load logic implemented within `app/dashboard/settings/page.tsx` under Laundry Preferences.)_
- [x] Implement product preference selection _(Notes: UI form and Supabase save/load logic implemented within `app/dashboard/settings/page.tsx` under Laundry Preferences.)_
- [ ] Create dashboard analytics for users
- [ ] Add help/support section

### Phase 4: Washer Dashboard & Experience (3 weeks)

#### Week 9: Washer Dashboard Layout & Core Features

- [ ] Create Washer-specific dashboard layout
- [x] **Implement Full Washer Application Flow:** _(Notes: Replaced the simple "interest registration" with a full multi-step application form. Created `components/dashboard/WasherApplicationForm.tsx` to handle the form logic, state, and validation for personal details, service offerings, and equipment. A new page, `app/dashboard/washer-application/page.tsx`, hosts this form and includes logic to check a user's role and `washer_status` before rendering. The `app/dashboard/become-washer/page.tsx` page was updated to act as a hub, directing users with a 'pending_application' status to the new form, showing a status message to those who have already applied, and keeping the interest registration form for brand new prospective washers.)_
  - [x] Create multi-step application form component (`WasherApplicationForm.tsx`).
  - [x] Implement client-side validation using `zod` and `react-hook-form`.
  - [x] Create a dedicated page for the application at `/dashboard/washer-application`.
  - [x] Add logic to check user's `washer_status` to control access and display appropriate messages.
  - [x] Update the `/dashboard/become-washer` page to intelligently direct users based on their application status.
  - [ ] Server action to save application data to a new `washer_applications` table. _(Note: Placeholder `applyToBeWasher` action exists; needs full implementation)_
- [ ] Implement dashboard overview with key metrics
- [ ] Build service management interface
- [ ] Create availability calendar management
- [ ] Add service pricing configuration
- [ ] Implement booking management system
- [ ] Build customer list view
- [ ] **Create Washer referral section with:**
  - [ ] Unique Washer referral code generation
  - [ ] Washer referral tracking metrics
  - [ ] Promotional materials for recruiting new Washers
  - [ ] Earnings visualization for referrals
  - [ ] Referral program explanation
- [ ] Create Washer settings page
  - [x] _(Note: `app/dashboard/settings/page.tsx` now includes conditional sections for Approved Washers)_
  - [x] Placeholder sections added for:
    - Service Area & Collection
    - Laundry Equipment
  - [ ] _(Future tasks: Implement actual forms and functionality for washer-specific settings)._

#### Week 10: Washer Business Tools

- [ ] Create earnings tracking dashboard
- [ ] Implement booking history with filtering
- [ ] Build reviews and ratings display
- [ ] Add analytics dashboard with:
  - [ ] Booking analytics
  - [ ] Earnings visualisations
  - [ ] Customer retention metrics
  - [ ] Service popularity charts
- [ ] Implement referral management
- [ ] Create Washer settings page

#### Week 11: Washer Inventory & Communication

- [ ] Build product inventory management system
- [ ] Implement laundry product cataloguing
- [ ] Add stock status tracking
- [ ] Create product updates notification system
- [ ] Implement chat interface for customer communication
- [ ] Build booking notes system
- [ ] Add service completion confirmation
- [ ] Create issue flagging system

### Phase 5: Admin Dashboard & Management Tools (2 weeks)

#### Week 12: Admin Dashboard Setup

- [~] Create admin dashboard layout and navigation _(Notes: Implemented initial admin dashboard layout in `app/(admin)/admin/layout.tsx` and navigation bar in `components/admin/AdminNavbar.tsx`. Styling applied for a professional look and feel. Placeholder pages created for Dashboard (`app/(admin)/admin/dashboard/page.tsx`), Users, Washers, Bookings, and Settings. Admin dashboard main page includes styled cards linking to these sections.)_
- [~] Implement user management system _(Notes: Basic user listing implemented in `app/(admin)/admin/users/page.tsx`. Fetches all users via `supabase.auth.admin.listUsers()` and displays email, role (from metadata), joined date, last sign-in, and email verification status. Requires `SUPABASE_SERVICE_ROLE_KEY`.)_
- [~] Build Washer management tools _(Notes: Basic washer listing implemented in `app/(admin)/admin/washers/page.tsx`. Fetches users with 'washer' role via `supabase.auth.admin.listUsers()` and displays email, joined date, email verification status, and application_status (from metadata). Includes placeholder actions. Requires `SUPABASE_SERVICE_ROLE_KEY`.)_
- [ ] Add booking oversight features _(Notes: Placeholder page `app/(admin)/admin/bookings/page.tsx` created.)_
- [ ] Create platform analytics dashboard _(Notes: Partially covered by the main admin dashboard page which has placeholder cards for stats. Actual analytics data fetching and display is pending.)_
- [ ] Implement content management system
- [ ] Build settings configuration interface _(Notes: Placeholder page `app/(admin)/admin/settings/page.tsx` created with sections for general, referral, content, and security settings.)_
- [x] **Secure Admin Routes & Authentication:** _(Notes: Updated `middleware.ts` to protect all `/admin/**` routes. Only users with `role: 'admin'` in their Supabase `user_metadata` (or `app_metadata`) can access these routes. Non-admin users are redirected. The sign-in page at `/signin?type=admin` now displays a specific warning for admin login and hides sign-up/password reset links. The `signInWithEmailPassword` server action in `app/auth/actions.ts` correctly redirects admin users to `/admin/dashboard` after login. Admin users are manually designated in Supabase by setting their metadata.)_

#### Week 13: Admin Tools & Monitoring

- [ ] Create user verification tools
- [ ] Implement dispute resolution interface
- [ ] Build review moderation system
- [ ] Add platform metrics dashboard
- [ ] Implement notification management
- [ ] Create system logs and monitoring
- [ ] Build administrative settings

### Phase 6: Backend Integration & API Development (4 weeks)

#### Week 14-15: Core Functionality APIs

- [x] Set up Supabase database schema _(Notes: This is an ongoing process. Specific tables added include `referrals`, `referral_events`, and `washer_interest_registrations`. **Crucially, a `profiles` table has been defined and created with columns for `id` (FK to auth.users), `email`, `first_name`, `last_name`, `phone_number`, `postcode`, `notification_preferences` (jsonb), `allergies`, `product_preferences`, `role` (TEXT), `washer_status` (TEXT), `created_at`, `updated_at`. RLS policies for SELECT, INSERT, UPDATE on `profiles` are implemented. A new user trigger (`handle_new_user` on `auth.users` after insert) now automatically populates the `profiles` table, setting the `role` based on `auth.users.raw_user_meta_data->>'selected_role'` (captured at signup) and an initial `washer_status` if the role is 'washer' (e.g., 'pending_application').**)_
- [x] Implement user and Washer profile APIs _(Notes: Direct profile updates (editing) are now handled via client-side Supabase calls in `app/dashboard/settings/page.tsx`. Profile creation is automated by the `handle_new_user` trigger upon signup, based on the role selected by the user. This covers basic user profile data saving and loading. Washer-specific profile fields and any dedicated API endpoints for more complex operations are still pending.)_
- [ ] Create booking system backend logic
- [ ] Build service management APIs
- [ ] Implement review and rating backend
- [ ] Add location-based search and filtering
- [ ] Create notification system backend
- [~] Build referral system backend logic _(Notes: Created `referrals` table for storing unique user codes and `referral_events` table for tracking referred signups. Implemented `lib/referral.ts` utility for code generation/retrieval. Deployed `process-referral` Supabase Edge Function (`supabase/functions/process-referral/index.ts`) to validate `submitted_referral_code` from new user signups (via `user_metadata`) and record successful referrals in `referral_events`. Basic RLS added to `referrals` table. **TODO: Implement RLS for `referral_events`. Thoroughly test end-to-end referral flow. Develop logic for updating referral status (e.g., after first wash) and reward distribution.**)_

#### Week 16-17: Advanced Backend Features

- [ ] Set up Supabase Realtime for chat functionality
- [~] Implement referral tracking and reward system _(Notes: Foundational tracking implemented (see Week 14-15). Reward system itself is TODO.)_
- [ ] Build analytics data processing
- [ ] Create secure payment integration with Stripe
- [ ] Implement Stripe Connect for Washer payouts
- [ ] Add automated email notification system
- [ ] Build data encryption services for sensitive information

### Phase 7: Testing, Optimisation & Launch Preparation (3 weeks)

#### Week 18: Testing & Quality Assurance

- [ ] Conduct unit testing for individual components
- [ ] Perform integration testing for connected systems
- [ ] Complete end-to-end testing of user flows
- [ ] Execute role-based access control testing
- [ ] Perform security testing and penetration testing
- [ ] Complete cross-browser and responsive testing
- [ ] Verify accessibility compliance

#### Week 19: Optimisation & Performance

- [ ] Optimise frontend performance
- [ ] Improve database query efficiency
- [ ] Enhance image loading and caching
- [ ] Implement SEO optimisations
- [ ] Add page analytics tracking
- [ ] Improve error handling and monitoring
- [ ] Create comprehensive logging system

#### Week 20: Launch Preparation

- [ ] Prepare staging environment
- [ ] Conduct user acceptance testing (UAT)
- [ ] Create user documentation and guides
- [ ] Set up customer support system
- [ ] Configure monitoring and alerting
- [ ] Prepare backup and recovery procedures
- [ ] Create launch plan and marketing materials

### Phase 8: Launch & Post-Launch (1 week)

#### Week 21: Deployment & Monitoring

- [ ] Deploy to production environment
- [ ] Conduct final verification tests
- [ ] Monitor system performance
- [ ] Address critical issues
- [ ] Gather initial user feedback
- [ ] Implement quick fixes and improvements
- [ ] Begin planning for Phase 2 enhancements

## 5. Landing Pages Detailed Requirements

### Main Landing Page

- Compelling hero section with clear value proposition
- Visual representation of the service concept
- Benefits section for both Users and Washers
- Featured testimonials section
- Call-to-action buttons for both user types
- Simple process overview
- Trust indicators (security, community, quality)

### How It Works Page

- Detailed step-by-step process explanation
- Visual timeline or process flow
- Separate sections for User and Washer journeys
- Animated illustrations of key steps
- Pricing explanation section
- Benefits and conveniences highlighted
- FAQ section specific to the process

### Our Washers Page

- Washer vetting and verification process
- Featured Washer profiles with success stories
- Benefits of becoming a Washer
- Equipment and space requirements
- Earning potential explanations
- Application process overview
- Testimonials from current Washers

### Reviews Page

- Overall platform rating display
- Rating distribution visualization
- Featured review carousel
- Filter options for review categories
- User success stories
- Washer testimonials
- Verified review badges
- Response examples from Washers

### FAQs Page

- Comprehensive accordion-style interface
- Categorized questions (Users, Washers, General)
- Search functionality for questions
- Contact form for additional questions
- Link to support resources
- Common troubleshooting section
- Privacy and security FAQ section

## 6. Referral System Requirements

### User Referral Features

- [x] Dedicated referral section on User dashboard _(Notes: `app/dashboard/referrals/page.tsx` created.)_
- [x] Unique referral code generation _(Notes: Implemented via `lib/referral.ts` and `referrals` table.)_
- [ ] Shareable referral links _(Notes: TODO - Requires constructing links with the referral code.)_
- [ ] Referral status tracking _(Notes: TODO - Requires linking `referral_events` table data to dashboard UI.)_
- [ ] Promotional copy for sharing _(Notes: TODO - Add to `app/dashboard/referrals/page.tsx`.)_
- [ ] Social media sharing links _(Notes: TODO - Add to `app/dashboard/referrals/page.tsx`.)_
- [ ] Referral reward explanation _(Notes: TODO - Add to `app/dashboard/referrals/page.tsx`.)_

### Washer Referral Features

- Dedicated referral section on Washer dashboard
- Washer-specific referral codes
- Promotional materials for recruiting
- Incentives for referring new Washers
- Tracking for both User and Washer referrals
- Enhanced rewards for successful Washer recruitment
- Referral analytics dashboard
- Promotional copy and messaging templates

## 7. User Acceptance Testing Plan

### Test Categories

- [ ] Authentication & Profile Management
- [ ] User Dashboard Functionality
- [ ] Washer Discovery & Filtering
- [ ] Booking Process
- [ ] Communication System
- [ ] Washer Dashboard Features
- [ ] Admin Tools & Management
- [ ] Payment Processing (if implemented)
- [ ] Mobile Responsiveness
- [ ] Accessibility Compliance
- [~] Referral System Functionality _(Notes: Basic code generation and submission at signup implemented. End-to-end flow, tracking, and reward distribution need full testing and implementation.)_

### Testing Tools

- Playwright for automated end-to-end testing
- Jest for unit testing
- Manual testing for user experience evaluation
- Lighthouse for performance and SEO auditing
- WAVE for accessibility testing

## 8. Risk Management

### Technical Risks

- [ ] Real-time performance issues with chat and booking updates
- [ ] Payment processing security vulnerabilities
- [ ] Database scalability challenges
- [ ] Address data security and privacy concerns
- [ ] Mobile responsiveness issues

### Business Risks

- [ ] Slow user adoption
- [ ] Difficulty in Washer recruitment
- [ ] Payment processing fee impact on profitability
- [ ] Customer support scalability challenges
- [ ] Competition from established laundry services

### Mitigation Strategies

- Implement comprehensive testing protocols
- Start with smaller geographic focus for controlled growth
- Create compelling onboarding incentives for both users and Washers
- Establish clear privacy and security policies
- Develop contingency plans for technical issues
- Implement strong referral system from day one to drive organic growth

## 9. Success Metrics

### Technical Metrics

- Page load time < 2 seconds
- API response time < 500ms
- 99.5% uptime
- Error rate < 0.5%
- Mobile usability score > 90%

### Business Metrics

- User registration growth rate
- Booking completion rate
- User retention after 30 days
- Average booking value
- Washer retention rate
- User satisfaction rating
- Referral conversion rate

## 10. Future Considerations (Post-MVP)

- Mobile application development (iOS/Android)
- Advanced payment options and subscription models
- Expanded service offerings beyond laundry
- Community features and neighbourhood groups
- Business accounts for commercial clients
- Machine learning for improved matchmaking
- Enhanced referral system with tiered rewards

---

This implementation plan prioritises frontend development to create a complete user experience before implementing complex backend functionality. The phased approach allows for iterative development and testing, with a focus on delivering high-quality landing pages and a robust referral system to drive organic growth from launch.
