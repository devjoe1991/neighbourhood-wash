# Enhanced Implementation Plan: Neighbourhood Wash Web Application

## 1. Project Goals

- Develop and launch a user-friendly, visually appealing Neighbourhood Wash web application that connects users with local "Washers" for laundry services
- Focus on frontend development first to create a fully functional UI/UX before implementing complex backend functionality
- Prioritize development of key landing pages (Main page, How it Works, Our Washers, Reviews, FAQs) to establish brand presence
- Utilise Next.js for frontend and Supabase for backend services and database
- Create separate user experiences for three user roles: Users, Washers, and Administrators
- Implement referral system from launch for both Users and Washers to encourage platform growth

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

- [x] Set up Supabase for authentication _(Notes: Installed @supabase/supabase-js, configured .env.local with Supabase URL & anon key, created lib/supabaseClient.ts utility.)_
- [x] Implement email/password registration with role selection _(Notes: Created app/signup/page.tsx with UI for email, password, confirm password, and role (User/Washer). Added client-side validation and Supabase signUp call. Includes success/error messaging and redirect placeholder. Shadcn components input, label, radio-group, alert added. Corrected /join links to /signup.)_
- [x] Create login form and functionality _(Notes: Created app/signin/page.tsx with UI for email and password. Implemented Supabase auth.signInWithPassword() for authentication. Includes success/error messaging and a temporary redirect to homepage '/' on successful login. Link to placeholder /forgot-password page added.)_
- [x] Add password reset functionality _(Notes: Created app/forgot-password/page.tsx to request reset link via Supabase auth.resetPasswordForEmail(). Created app/reset-password/page.tsx to handle token from URL hash, allow new password input, and update via Supabase auth.updateUser(). Ensured Supabase redirect URL for http://localhost:3000/reset-password is configured. Debugged and resolved token validation issue.)_
- [ ] Implement Google OAuth integration
- [ ] Create role selection page for OAuth users
- [ ] Set up protected routes and authentication middleware
- [ ] Add authentication state management

#### Week 5: Profile Management

- [ ] Create user profile creation forms
- [ ] Implement Washer profile creation with additional fields
- [ ] Build profile editing functionality
- [ ] Add profile picture upload with Supabase storage
- [ ] Implement address selection with Google Maps
- [ ] Create address security system (encryption and controlled visibility)
- [ ] Add allergies/preferences management for users
- [ ] Build product/inventory management for Washers

### Phase 3: User Dashboard & Experience (3 weeks)

#### Week 6: User Dashboard Layout & Core Features

- [ ] Create responsive dashboard layout with navigation
- [ ] Implement dashboard overview page
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
- [ ] **Create referral section on dashboard with:**
  - [ ] Unique referral code generation
  - [ ] Referral status tracking
  - [ ] Promotional copy for sharing
  - [ ] Social media sharing links
  - [ ] Referral reward explanation

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
- [ ] Implement referral system with code generation
- [ ] Create user notification center
- [ ] Add user settings page
- [ ] Build allergies and preferences management
- [ ] Implement product preference selection
- [ ] Create dashboard analytics for users
- [ ] Add help/support section

### Phase 4: Washer Dashboard & Experience (3 weeks)

#### Week 9: Washer Dashboard Layout & Core Features

- [ ] Create Washer-specific dashboard layout
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

- [ ] Create admin dashboard layout and navigation
- [ ] Implement user management system
- [ ] Build Washer management tools
- [ ] Add booking oversight features
- [ ] Create platform analytics dashboard
- [ ] Implement content management system
- [ ] Build settings configuration interface

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

- [ ] Set up Supabase database schema
- [ ] Implement user and Washer profile APIs
- [ ] Create booking system backend logic
- [ ] Build service management APIs
- [ ] Implement review and rating backend
- [ ] Add location-based search and filtering
- [ ] Create notification system backend
- [ ] Build referral system backend logic

#### Week 16-17: Advanced Backend Features

- [ ] Set up Supabase Realtime for chat functionality
- [ ] Implement referral tracking and reward system
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

- Dedicated referral section on User dashboard
- Unique referral code generation
- Shareable referral links
- Social media integration for easy sharing
- Referral status tracking
- First-wash discount for referred friends
- Credit applied after referred user's first completed booking
- Referral history and earnings display

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
- [ ] Referral System Functionality

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
