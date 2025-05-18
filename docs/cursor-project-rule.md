# Neighbourhood Wash Project Rule

## Project Context

This is a comprehensive rule for the Neighbourhood Wash web application project - a Next.js-based community marketplace connecting individuals seeking laundry services with local "Washers" who offer their laundry facilities.

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

- [x] Supabase authentication _(Notes: Initial setup - Installed @supabase/supabase-js, configured .env.local with Supabase URL & anon key, created lib/supabaseClient.ts utility.)_
- [~] Email/password registration _(Notes: Created app/signup/page.tsx with UI for email, password, confirm password, and role (User/Washer). Added client-side validation and Supabase auth.signUp() call. Includes success/error messaging. Installed missing Shadcn components: input, label, radio-group, alert. Corrected /join links to /signup in app/page.tsx and components/layout/Header.tsx. Resolved ESLint errors in app/page.tsx related to unescaped characters.)_
- [~] Login form and functionality _(Notes: Created app/signin/page.tsx with UI for email and password. Implemented Supabase auth.signInWithPassword() for authentication. Includes success/error messaging and a temporary redirect to homepage '/' on successful login. Link to placeholder /forgot-password page added.)_
- [x] Password reset functionality _(Notes: Created app/forgot-password/page.tsx for users to request a password reset link (calls Supabase auth.resetPasswordForEmail). Created app/reset-password/page.tsx which reads the recovery token from the URL hash, allows users to set a new password, and updates it via Supabase auth.updateUser(). The redirect URL (e.g., http://localhost:3000/reset-password) must be configured in Supabase Authentication URL Configuration. Resolved an issue where explicit supabase.auth.setSession was interfering with the recovery flow; removed it to allow Supabase client to handle context implicitly. Files: app/forgot-password/page.tsx, app/reset-password/page.tsx)_
- [x] Set up protected routes and authentication middleware _(Notes: Installed @supabase/ssr. Created Supabase client utilities in utils/supabase/client.ts, utils/supabase/server.ts, and utils/supabase/middleware.ts. Implemented middleware.ts to protect routes like /dashboard and redirect unauthenticated users to /signin, and authenticated users from auth pages to /dashboard. Updated app/signin/page.tsx to use the SSR-compatible Supabase client, resolving redirect loops. Created placeholder app/dashboard/page.tsx for testing. Key files: middleware.ts, utils/supabase/, app/dashboard/page.tsx)_
- [ ] Google OAuth integration _(Notes: Paused/Deferred. UI elements removed from signup/signin pages (app/signup/page.tsx, app/signin/page.tsx) due to complexities with Supabase metadata handling (selected_role placement) for new OAuth users and to simplify the initial auth flow. The set-default-role Edge Function logic related to Google users is now dormant. Can be revisited.)_
- [ ] User profile creation _(Notes: ...)_
- [ ] Washer profile creation _(Notes: ...)_
- [~] Reviews page _(Notes: Created app/reviews/page.tsx. Implemented Hero section, Overall Rating display, Rating Distribution chart, and a static grid of Featured Review cards with placeholder data. Included verified badges and placeholders for filters and loading more reviews. Resolved routing conflict by deleting app/(landing)/reviews/page.tsx. Files: app/reviews/page.tsx, components/layout/Header.tsx (verified link exists))_
- [~] FAQs page _(Notes: Created app/faqs/page.tsx. Implemented Hero section with placeholder search. Used Shadcn/ui Accordion for categorized FAQs: General, User, Washer, and Privacy & Security, populated with placeholder Q&As. Added a Contact Support section with a mailto link. Resolved routing conflict by deleting app/(landing)/faqs/page.tsx. Corrected key prop syntax in FAQ item mapping. Files: app/faqs/page.tsx, components/ui/accordion.tsx (reused))_
- [~] About Us page _(Notes: Created app/about/page.tsx. Implemented Hero, Our Story, Our Values (with icons), and Join Our Community (CTA) sections. Team section removed by user request. Used placeholder images. Added navigation link in Header. Files: app/about/page.tsx, components/layout/Header.tsx)_

### Phase 3: User Dashboard & Experience

- [ ] Dashboard layout _(Notes: ...)_
- [ ] Washer discovery interface _(Notes: ...)_
- [ ] Booking system _(Notes: ...)_
- [ ] Referral system _(Notes: ...)_

### Phase 4: Washer Dashboard & Experience

- [ ] Washer dashboard layout _(Notes: ...)_
- [ ] Service management interface _(Notes: ...)_
- [ ] Business analytics tools _(Notes: ...)_
- [ ] Washer referral system _(Notes: ...)_

### Phase 5: Admin Dashboard & Management Tools

- [ ] Admin dashboard _(Notes: ...)_
- [ ] User/Washer management _(Notes: ...)_
- [ ] Platform analytics _(Notes: ...)_

### Phase 6: Backend Integration & API Development

- [ ] Supabase schema setup _(Notes: ...)_
- [ ] API endpoints implementation _(Notes: ...)_
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

- User referral system with unique codes
- Washer referral system with enhanced rewards
- Referral analytics and tracking
- Reward distribution automation

## Design Guidelines

- Responsive design for all devices
- Light/dark mode toggle
- Blue theme consistency across pages
- Accessible UI following WCAG 2.1 AA compliance

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
