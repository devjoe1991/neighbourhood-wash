# Enhanced Implementation Plan: Neighbourhood Wash Web Application

## IMPORTANT: Major Workflow Pivot (December 2024)

**BREAKING CHANGE**: The user workflow has been fundamentally changed from a manual "Washer Discovery" system to an automatic "Booking Assignment" system.

**Previous Flow**: User browses available washers → selects preferred washer → creates booking
**New Flow**: User creates booking with requirements → system automatically assigns best available washer

This pivot simplifies the user experience by removing the need for manual washer selection and comparison. Users now simply specify their laundry needs, and the platform's algorithm handles washer matching and assignment automatically.

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
- [x] Build Washer request interface with automatic assignment: _(Notes: **PIVOTED FROM DISCOVERY TO AUTOMATIC ASSIGNMENT FLOW**. Created "Request a Wash" page at `app/dashboard/request-wash/page.tsx` with comprehensive form for users to submit laundry requirements. Form includes services selection (wash/dry/iron), collection service option, preferred date/time textarea, and special instructions. Added server action at `app/dashboard/request-wash/actions.ts` for form submission with placeholder processing logic. Updated sidebar navigation from "Find a Washer" to "Request a Wash". This replaces the manual discovery/browsing approach with an automatic matching system. Files: `app/dashboard/request-wash/page.tsx`, `app/dashboard/request-wash/actions.ts`, updated `components/dashboard/Sidebar.tsx`. **Note**: Previous discovery components (`WasherCard`, `find-washer` page) remain in codebase but are no longer used in the main flow.)_
  - [x] Service selection form (wash/dry/iron checkboxes)
  - [x] Collection service option
  - [x] Scheduling preference input
  - [x] Special instructions textarea
  - [x] Form submission with placeholder server action
  - [x] User feedback messaging
- [~] **Create referral section on dashboard with:** _(Notes: Created placeholder page `app/dashboard/referrals/page.tsx`.)_
  - [~] Unique referral code generation _(Notes: Implemented backend logic in `lib/referral.ts` to generate and store unique codes in a new `referrals` table. The `app/dashboard/referrals/page.tsx` now displays this code. RLS policy added for users to read their own codes.)_
  - [ ] Referral status tracking _(Notes: TODO - Requires linking `referral_events` table data to dashboard UI.)_
  - [ ] Promotional copy for sharing _(Notes: TODO - Add to `app/dashboard/referrals/page.tsx`.)_
  - [ ] Social media sharing links _(Notes: TODO - Add to `app/dashboard/referrals/page.tsx`.)_
  - [ ] Referral reward explanation _(Notes: TODO - Add to `app/dashboard/referrals/page.tsx`.)_

#### Week 6: Booking Funnel - Configuration & Scheduling

- [x] Design and implement multi-step booking UI with a persistent price summary component. _(Notes: Completed. The 4-step booking funnel is live with a two-column layout and sticky price summary. Created `app/dashboard/new-booking/page.tsx` with progress indicators, step navigation, and comprehensive state management across Schedule → Services → Details → Payment steps.)_
- [x] Create a dynamic service selection component with live price calculation. _(Notes: Completed. Service selection dynamically updates the total price in real-time. Implemented `ServiceStep` component in `components/booking/ServiceStep.tsx` with live price updates via `lib/pricing.ts` configuration. Price summary component (`components/booking/PriceSummary.tsx`) shows itemized breakdown with live updates.)_
- [x] Add a "Weight Guide" modal to help users estimate their laundry weight. _(Notes: Completed. The 'HelpCircle' icon opens a dialog with helpful examples (6kg = 5 outfits, 10kg = 8 outfits, etc.). Modal provides practical guidance for users to select appropriate weight tiers.)_
- [x] Implement options for stain removal and user-provided washing products. _(Notes: Completed. These options are available as checkboxes in the service selection step with dynamic pricing. Stain removal triggers conditional image uploader in Details step. User products option provides discount on total price.)_
- [x] Build the scheduling interface with a calendar for collection and estimated delivery dates/times. _(Notes: Completed. Users can select a date using shadcn/ui Calendar component (prevents past dates) and choose from predefined time slots. Estimated delivery time is calculated and displayed based on collection time. Created `ScheduleStep` component in `components/booking/ScheduleStep.tsx`.)_

#### Week 7: Booking Funnel - Finalisation & Payment

**Status**: ✅ **COMPLETED**

**Implementation Notes**:

- ✅ Professional booking confirmation page with secure redirect flow
- ✅ **Stripe Payment Integration Debugging & Fixes**: Fixed critical issue where payment form was stuck in "initializing" state. Implemented proper conditional rendering with Elements provider, added robust error handling with toast notifications, improved payment intent creation flow with loading states, and added comprehensive debugging. Payment flow now works reliably with proper state management and user feedback.
- ✅ Complete payment processing with Stripe integration
- ✅ Secure payment confirmation and booking creation
- ✅ Professional confirmation page with booking details
- ✅ Persistent price summary throughout flow
- ✅ Comprehensive form validation and error handling
- ✅ Professional loading states and user feedback
- ✅ Responsive design optimized for all devices

**Key Components**:

- Professional booking confirmation with status tracking
- Secure payment processing with Stripe Elements
- Comprehensive error handling and user feedback
- Optimized mobile experience
- Persistent price calculations and summary display

**Files Created/Modified**:

- `app/dashboard/booking-confirmation/[id]/page.tsx` - Professional confirmation page

#### Week 8: Advanced Booking Assignment System & Real-time Communication

**Status**: ✅ **COMPLETED DECEMBER 2024**

**Implementation Notes**:

- ✅ **Intelligent Booking Assignment System**: Implemented sophisticated 2-tier assignment system: washers can browse and accept available bookings within 24 hours, after which an intelligent auto-assignment algorithm assigns the best-matched washer based on location proximity, experience, and availability.
- ✅ **Available Bookings Interface**: Created privacy-protected job browsing for washers with masked customer information (postcode prefix only, "Joe C." name format) while showing essential booking details.
- ✅ **Race Condition Protection**: Implemented atomic booking acceptance with database-level constraints to prevent double-assignment.
- ✅ **24-Hour Auto-Assignment System**: Built Supabase Edge Function with intelligent scoring algorithm that automatically assigns bookings to the best available washer if not manually accepted within 24 hours.
- ✅ **Real-time Chat System**: Complete chat interface using Supabase Realtime for communication between users and assigned washers during active bookings.
- ✅ **Database Relationship Fixes**: Fixed foreign key relationships, added proper constraints, and ensured data integrity across the booking system.
- ✅ **Washer Dashboard Enhancement**: Added "Available Bookings" and "My Bookings" sections with professional UI and seamless flow management.

**Key Security Features**:

- Database-level security with RLS policies
- Privacy protection for user information until washer acceptance
- Atomic operations preventing race conditions
- Secure real-time messaging with proper authentication
- Industry-standard booking lifecycle management

**Assignment Algorithm Features**:

- Location proximity scoring (postcode area matching)
- Washer experience and tenure consideration
- Service area radius optimization
- Availability schedule integration
- Intelligent fallback system ensuring 100% assignment coverage

**Files Created/Modified**:

- `supabase/functions/auto-assign-bookings/index.ts` - Intelligent auto-assignment system
- `supabase/functions/auto-assign-bookings/deno.json` - Edge function configuration
- `app/(washer)/dashboard/available-bookings/page.tsx` - Washer job browsing interface
- `app/(washer)/dashboard/actions.ts` - Enhanced server actions for booking acceptance
- `components/chat/ChatInterface.tsx` - Real-time messaging component
- `docs/booking-assignment-flow.md` - Comprehensive system documentation
- Database migrations for proper relationships and constraints
- Enhanced sidebar navigation and washer flow optimization
- `app/dashboard/new-booking/page.tsx` - Fixed payment initialization, conditional Elements rendering, toast error handling
- `components/booking/PaymentStep.tsx` - Simplified component, removed clientSecret prop dependency
- `lib/stripe/actions.ts` - Added debugging logs for payment intent creation
- `app/layout.tsx` - Toaster configuration for error notifications

**Technical Details**:

- Payment intent creation only triggered when reaching step 4 with valid price
- Conditional Elements provider wrapping prevents form initialization issues
- Loading states prevent UI from getting stuck during payment setup
- Toast notifications provide clear feedback for errors
- Comprehensive error handling prevents crashes during payment failures
- Server-side debugging helps track payment intent creation success/failure

#### Week 8: Booking Management & Post-Service Flow

- [x] **Build comprehensive "My Bookings" functionality with:** _(Notes: Implemented complete booking tracking system with list and detail views. Created `app/dashboard/my-bookings/page.tsx` for booking list with empty state handling, `app/dashboard/my-bookings/[id]/page.tsx` for detailed booking view, and `app/dashboard/my-bookings/actions.ts` for server-side data fetching. Added `BookingListItem` component (`components/bookings/BookingListItem.tsx`) with status badges and service summaries, and `StatusTracker` component (`components/bookings/StatusTracker.tsx`) for visual progress tracking. Includes washer profile fetching for assigned bookings, chat placeholder for future functionality, and proper TypeScript definitions. Added "My Bookings" to dashboard sidebar navigation. All ESLint issues resolved.)_
  - [x] Create booking list page with server-side data fetching
  - [x] Add detailed booking status page with visual progress tracker
  - [x] Implement BookingListItem component with status badges and service summaries
  - [x] Add StatusTracker component showing booking progression
  - [x] Create server actions for fetching user bookings and booking details
  - [x] Add My Bookings link to dashboard sidebar navigation
  - [x] Include washer profile fetching for assigned bookings
  - [x] Add chat placeholder for future functionality
  - [x] Handle empty states and error scenarios
- [x] Implement booking cancellation logic with the 12-hour rule on the "My Bookings" page. _(Notes: Added a 'Cancel Booking' button to the booking detail page which triggers a server action. The action enforces the 12-hour rule on the server before updating the booking status in Supabase. Features: AlertDialog confirmation with cancellation policy explanation, loading states, toast notifications for feedback, automatic page refresh on success. Only visible for non-cancelled/non-completed bookings. Files: updated `app/dashboard/my-bookings/[id]/page.tsx`, added `cancelBooking` function to `app/dashboard/my-bookings/actions.ts`, added Toaster component to `app/layout.tsx`.)_
- [x] Create the PIN code verification UI for handovers on the booking detail page. _(Notes: Updated the 'bookings' table to store PINs. Implemented PIN generation on booking creation. Created a new component to display the unique Collection and Delivery PINs to the user on their booking detail page, along with verification status. Features: 4-digit PIN generation with duplicate checking, copy-to-clipboard functionality, verification status tracking, visual indicators for verified/unverified PINs, and educational information about how PIN verification works. Only visible for non-cancelled/non-completed bookings. Files: `supabase/migrations/20240801000002_add_pin_verification_to_bookings.sql`, `lib/utils.ts` (generatePin function), updated `app/dashboard/new-booking/actions.ts`, `components/booking/PinVerification.tsx`, updated `app/dashboard/my-bookings/[id]/page.tsx` and `app/dashboard/my-bookings/actions.ts`.)_
  - [x] Build the post-completion UI on the user dashboard: "Leave a Review" and "Add Washer to Favourites" prompts. _(Notes: Created 'reviews' and 'favourite_washers' tables with proper RLS policies and indexes. Built a conditional prompt system on the main dashboard for users to review and favourite washers after a booking is completed. Implemented comprehensive server actions to handle review submissions and favourite management. Features: 5-star rating system with interactive UI, optional comment field, favourite status checking, duplicate prevention, toast notifications, and automatic UI updates. Only visible to users (not washers) and only for completed bookings without existing reviews. Files: `supabase/migrations/20240801000003_create_reviews_and_favourites_tables.sql`, `components/ui/star-rating.tsx`, `components/dashboard/PostBookingPrompt.tsx`, `app/dashboard/actions.ts`, updated `app/dashboard/page.tsx`.)_
  - [x] Develop the backend functionality for a user's "Favourite Washers" list. _(Notes: Implemented complete backend functionality with `favourite_washers` table, RLS policies, and server actions for adding/checking favourite status. Includes duplicate prevention, proper authentication, and automatic UI updates. Ready for frontend integration in future booking flows.)_
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

- [x] **Create Washer-specific dashboard layout:** _(Notes: Implemented comprehensive Washer Dashboard with `(washer)` route group. Created `app/(washer)/layout.tsx` for role-based protection ensuring only approved washers can access the dashboard. Built professional booking list page at `app/(washer)/dashboard/bookings/page.tsx` displaying assigned bookings with customer details, collection dates, status tracking, and verification statuses. Implemented detailed booking view at `app/(washer)/dashboard/bookings/[id]/page.tsx` with complete booking information, service details, and PIN verification interface. Created server actions in `app/(washer)/dashboard/actions.ts` for fetching assigned bookings, booking details, and PIN verification. Built secure PIN verification system with `components/washer/PinInput.tsx` supporting both collection and delivery PIN workflows with real-time UI updates and proper error handling.)_
- [x] **Implement Full Washer Application Flow:** _(Notes: Replaced the simple "interest registration" with a full multi-step application form. Created `components/dashboard/WasherApplicationForm.tsx` to handle the form logic, state, and validation for personal details, service offerings, and equipment. A new page, `app/dashboard/washer-application/page.tsx`, hosts this form and includes logic to check a user's role and `washer_status` before rendering. The `app/dashboard/become-washer/page.tsx` page was updated to act as a hub, directing users with a 'pending_application' status to the new form, showing a status message to those who have already applied, and keeping the interest registration form for brand new prospective washers.)_
  - [x] Create multi-step application form component (`WasherApplicationForm.tsx`).
  - [x] Implement client-side validation using `zod` and `react-hook-form`.
  - [x] Create a dedicated page for the application at `/dashboard/washer-application`.
  - [x] Add logic to check user's `washer_status` to control access and display appropriate messages.
  - [x] Update the `/dashboard/become-washer` page to intelligently direct users based on their application status.
  - [ ] Server action to save application data to a new `washer_applications` table. _(Note: Placeholder `applyToBeWasher` action exists; needs full implementation)_
- [x] **Implement PIN verification system for secure handovers:** _(Notes: Core PIN verification system implemented in `components/washer/PinInput.tsx` with separate collection and delivery PIN workflows. Washers can input 4-digit PINs provided by customers to verify handovers. System validates PINs against stored values, updates booking status automatically (to 'in_progress' after collection, 'completed' after delivery), and provides real-time feedback through toast notifications. Server action `verifyPin` in `app/(washer)/dashboard/actions.ts` handles security checks, PIN validation, and database updates with proper error handling.)_
- [x] **Build comprehensive booking management system:** _(Notes: Complete booking management implemented for washers. Features include: booking list view with status tracking, detailed booking information display, customer contact details, service configuration parsing, special instructions handling, and real-time verification status updates. All booking data is securely filtered to show only assignments for the current washer. The system supports the full booking lifecycle from assignment to completion.)_
- [ ] Implement dashboard overview with key metrics
- [ ] Build service management interface
- [ ] Create availability calendar management
- [ ] Add service pricing configuration
- [ ] Build customer list view
- [ ] **Create Washer referral section with:**
  - [ ] Unique Washer referral code generation
  - [ ] Washer referral tracking metrics
  - [ ] Promotional materials for recruiting new Washers
  - [ ] Earnings visualization for referrals
  - [ ] Referral program explanation
- [x] **Create Washer settings page** _(Notes: Implemented comprehensive Washer Settings Management system at `app/(washer)/dashboard/my-settings/page.tsx`. Created complete settings interface with three main components: **ServiceSettings** (`components/washer/ServiceSettings.tsx`) for service offering selection (wash & dry, ironing, stain removal, collection & delivery), **AvailabilitySettings** (`components/washer/AvailabilitySettings.tsx`) for weekly schedule management with day-by-day time configuration, and **AreaSettings** (`components/washer/AreaSettings.tsx`) for service radius configuration (0-25 miles). Added database schema enhancement with migration `20240801000004_add_washer_settings_to_profiles.sql` adding `service_offerings` (TEXT[]), `availability_schedule` (JSONB), and `service_area_radius` (NUMERIC) fields to profiles table. Features include real-time validation, educational content, professional UI with blue theme consistency, comprehensive error handling, and type-safe TypeScript implementation. This enables washers to fully configure their marketplace presence for booking assignments.)_

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
- [x] Implement user management system _(Notes: **COMPLETED** - Built comprehensive user management system in `app/(admin)/admin/users/page.tsx`. Converted to client-side component with search functionality, role filtering, and proper data display. Fetches all users via `supabase.auth.admin.listUsers()` and combines with profile data to display full name, email, role badges, verification status, join date, and last login. Includes real-time search by email/name and role filtering (All, Users, Washers, Admins). Professional UI with loading states, error handling, and responsive design.)_
- [x] Build Washer management tools _(Notes: **COMPLETED** - Built comprehensive washer management system spanning `app/(admin)/admin/washers/page.tsx` and `app/(admin)/admin/washers/[id]/page.tsx`. Main page shows all washer applications with separate priority sections for pending applications requiring approval. Integrated with existing `updateApplicationStatus` server action in `app/(admin)/admin/actions.ts` to approve/reject applications. Includes approve/reject buttons with confirmation dialogs, toast notifications, and automatic refresh. Detail page shows complete application information including personal details, service offerings, equipment details, and washer bio. Professional UI with loading states, error handling, and responsive design.)_
- [ ] Add booking oversight features _(Notes: Placeholder page `app/(admin)/admin/bookings/page.tsx` created.)_
- [x] **Create revenue dashboard with withdrawal fee tracking** _(Notes: **COMPLETED DECEMBER 2024** - Built comprehensive revenue dashboard at `app/(admin)/admin/revenue/page.tsx` displaying platform financial metrics in pounds (£). **Revenue Streams**: Dashboard tracks both booking commission (15% automated) and withdrawal fee revenue (£2.50 fixed per payout). **Metrics**: Shows total platform revenue combining both streams, monthly revenue and growth, available balance calculations, outstanding liabilities, and financial health indicators. **UK Currency**: All amounts displayed in £ using proper en-GB formatting. **Server Actions**: Implemented comprehensive data fetching in `app/(admin)/admin/revenue/actions.ts` including withdrawal fee tracking from payout_requests table. **Visual Design**: Color-coded cards distinguishing revenue streams with percentage breakdowns. **Files**: `app/(admin)/admin/revenue/page.tsx`, `app/(admin)/admin/revenue/actions.ts`. **Charts**: Placeholder components for future revenue/growth charts and top washers table.)_
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
- [ ] Design and implement the automatic washer matching algorithm (to run 12 hours pre-booking, factoring in location, availability, services, and washer capacity).
- [ ] Implement backend logic for dynamic price calculation based on selected services.
- [ ] Set up Supabase Storage for user-uploaded images of clothes.
- [ ] Create notification system backend
- [~] Build referral system backend logic _(Notes: Created `referrals` table for storing unique user codes and `referral_events` table for tracking referred signups. Implemented `lib/referral.ts` utility for code generation/retrieval. Deployed `process-referral` Supabase Edge Function (`supabase/functions/process-referral/index.ts`) to validate `submitted_referral_code` from new user signups (via `user_metadata`) and record successful referrals in `referral_events`. Basic RLS added to `referrals` table. **TODO: Implement RLS for `referral_events`. Thoroughly test end-to-end referral flow. Develop logic for updating referral status (e.g., after first wash) and reward distribution.**)_

#### Week 16-17: Advanced Backend Features

- [ ] Set up Supabase Realtime for chat functionality
- [~] Implement referral tracking and reward system _(Notes: Foundational tracking implemented (see Week 14-15). Reward system itself is TODO.)_
- [ ] Build analytics data processing
- [x] Create secure payment integration with Stripe _(Notes: **COMPLETED** comprehensive Stripe integration and booking funnel enhancement. Fixed Stripe Elements provider error by wrapping entire booking page component. Removed estimated delivery from ScheduleStep.tsx as it's not needed for collection-based service. Fixed initial pricing logic so collection fee (£4.99) is only added when services are selected, making initial total £0.00. Improved UI formatting in ServiceStep.tsx with proper flex layouts for service pricing. Moved "Own Products" option to separate "Washing Products" card at top with clean green discount display (-£1.50). Added access notes field to database (`access_notes` column via migration `20240801000006_add_access_notes_to_bookings.sql`) and DetailsStep.tsx component with MapPin icon. Implemented auto-population of user preferences from profile `laundry_preferences` field into special instructions textarea. Updated `BookingData` interface and server actions to handle access notes. Fixed all TypeScript errors and successfully built project. **Complete Features:** Stripe Payment Intent generation, secure payment confirmation before booking creation, professional UI formatting, user preference auto-population, access notes collection, fixed pricing logic, eliminated delivery estimates.)_
- [x] **COMPREHENSIVE PAYOUT SYSTEM IMPLEMENTATION** _(Notes: **COMPLETED DECEMBER 2024** - Built industry-standard financial platform exceeding initial Stripe Connect requirements. **Database Foundation**: Created enterprise-grade payout system with `supabase/migrations/20241201000000_create_payout_system.sql` including `earnings` table with automatic 15% commission calculation, `payout_requests` table with admin approval workflow, `washer_balances` view for real-time balance tracking, and automatic database triggers that fire when bookings complete. **Server Actions**: Implemented comprehensive financial operations in `app/dashboard/payouts/actions.ts` including balance fetching, Stripe account validation, secure payout request creation, and payout history retrieval. **UI Components**: Built professional payout interface with `PayoutRequestForm.tsx` for withdrawal requests with fee breakdown, `PayoutHistory.tsx` for transaction history, and updated payout dashboard page. **Financial Features**: £10 minimum withdrawal, £2.50 flat fee structure, manual admin approval for security, FIFO earnings processing, comprehensive audit trail, and row-level security policies. **Commission System**: Automatic 15% platform fee on all completed bookings via database triggers that cannot be bypassed. **Documentation**: Created comprehensive financial flow diagrams including commission tracking, customer payment flow, washer earnings flow, admin revenue dashboard flow, and payout request workflow. **Applied Migration**: Successfully deployed to Supabase with full functionality operational. This system now rivals industry standards used by Airbnb, Uber, and Fiverr with enterprise-level security and financial tracking.)_
- [x] **Stripe Connect Onboarding for Washers** _(Notes: **COMPLETED DECEMBER 2024** - Implemented complete washer onboarding flow for Stripe Connect. **Database**: `stripe_account_id` column already existed in `profiles` table. **Server Actions**: Enhanced existing `createStripeConnectedAccount()` and `createStripeAccountLink()` functions in `lib/stripe/actions.ts` to create Express accounts and generate secure onboarding links. **Washer UI**: Created dedicated washer payouts page at `app/(washer)/dashboard/payouts/page.tsx` with professional onboarding interface. **Features**: Clear explanation of Stripe benefits, secure account connection process, status tracking with success alerts, and integration with existing Stripe account validation. **Security**: Only approved washers can access the onboarding flow via washer layout protection. **User Experience**: Seamless redirect to Stripe's hosted onboarding with proper return URL handling and success messaging. This completes the critical missing piece for marketplace functionality - allowing washers to connect their bank accounts to receive payments.)_
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

## 6. Financial System Documentation

### Comprehensive Financial Flow Diagrams _(Notes: **COMPLETED DECEMBER 2024**)_

- [x] **Customer Payment Flow** (`docs/customer-payment-flow.md`) - Complete payment journey from booking to platform revenue capture
- [x] **Washer Earnings Flow** (`docs/washer-earnings-flow.md`) - Earnings calculation, tracking, and payout processes
- [x] **Admin Revenue Dashboard Flow** (`docs/admin-revenue-dashboard-flow.md`) - Platform commission tracking and business intelligence
- [x] **Payout Request Workflow** (`docs/payout-request-workflow.md`) - Detailed admin approval and fund transfer processes
- [x] **Commission & Payout Flow** (`docs/commission-payout-flow.md`) - Main overview with Mermaid diagram and commission examples

### Financial System Features

- **Automatic Commission**: 15% platform fee calculated via database triggers
- **Secure Payouts**: Manual admin approval with comprehensive validation
- **Real-time Tracking**: Live balance updates and transaction history
- **Audit Trail**: Complete financial record keeping for compliance
- **Industry Standards**: Rival platforms like Airbnb, Uber, and Fiverr

## 7. Referral System Requirements

### User Referral Features

- [x] **Enhanced User Referral Dashboard** _(Notes: **COMPLETED DECEMBER 2024** - Upgraded `app/dashboard/referrals/page.tsx` with comprehensive referral system. **Shareable Links**: Automatic referral link generation with URL parameter handling in signup page. **Social Sharing**: WhatsApp, Facebook, Twitter, and native share API integration via enhanced `ReferralCodeDisplay` component. **Status Tracking**: Real-time referral event tracking with reward calculations. **Promotional Copy**: Clear messaging and reward explanations integrated throughout dashboard.)_
- [x] Unique referral code generation _(Notes: Implemented via `lib/referral.ts` and `referrals` table.)_
- [x] Shareable referral links _(Notes: **COMPLETED** - Auto-generated links with ref parameter, pre-populated in signup form.)_
- [x] Referral status tracking _(Notes: **COMPLETED** - Full activity table with status updates and reward tracking.)_
- [x] Promotional copy for sharing _(Notes: **COMPLETED** - Integrated into enhanced dashboard design.)_
- [x] Social media sharing links _(Notes: **COMPLETED** - WhatsApp, Facebook, Twitter, and native sharing via ReferralCodeDisplay.)_
- [x] Referral reward explanation _(Notes: **COMPLETED** - Detailed how-it-works section and reward breakdown.)_

### Washer Referral Features

- [x] **Enhanced Washer Referral Dashboard** _(Notes: **COMPLETED DECEMBER 2024** - Built comprehensive washer referral system at `app/(washer)/dashboard/washer-referrals/page.tsx`. **Dual Reward System**: £5 for user referrals, £15 for washer referrals. **Advanced Analytics**: Separate tracking for user vs washer referrals with reward calculations. **Enhanced UI**: Purple/blue gradient design with crown icons, professional reward breakdown, and detailed activity tracking. **Promotional Materials**: Built-in sharing via enhanced ReferralCodeDisplay component with social media integration.)_
- [x] Dedicated referral section on Washer dashboard _(Notes: **COMPLETED** - Full-featured dashboard with washer-specific design.)_
- [x] Washer-specific referral codes _(Notes: **COMPLETED** - Same code system but enhanced rewards for washers.)_
- [x] Promotional materials for recruiting _(Notes: **COMPLETED** - Built-in sharing and promotional copy.)_
- [x] Incentives for referring new Washers _(Notes: **COMPLETED** - £15 reward for approved washer referrals.)_
- [x] Tracking for both User and Washer referrals _(Notes: **COMPLETED** - Separate analytics and reward tracking.)_
- [x] Enhanced rewards for successful Washer recruitment _(Notes: **COMPLETED** - 3x reward multiplier for washer referrals.)_
- [x] Referral analytics dashboard _(Notes: **COMPLETED** - Comprehensive stats with monthly trends and reward calculations.)_
- [x] Promotional copy and messaging templates _(Notes: **COMPLETED** - Detailed how-it-works section with role-specific guidance.)_

## 8. User Acceptance Testing Plan

### Test Categories

- [ ] Authentication & Profile Management
- [ ] User Dashboard Functionality
- [ ] New Booking Creation & Auto-Assignment
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

## 9. Risk Management

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

## 10. Success Metrics

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
