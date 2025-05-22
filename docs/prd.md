# Product Requirements Document: Neighbourhood Wash Web Application

## 1. Executive Summary

Neighbourhood Wash is a Next.js-based web application designed to connect individuals seeking laundry services with local "Washers" who offer their laundry facilities and services. The platform aims to create a community-based marketplace that provides convenient, affordable laundry solutions while enabling neighbours to earn supplemental income by sharing their resources.

### 1.1 Vision Statement

To revolutionise how communities approach laundry services by facilitating peer-to-peer connections, fostering neighbourhood resource sharing, and creating economic opportunities through a user-friendly digital platform.

### 1.2 Core Objectives

- Provide accessible, convenient laundry solutions for users without facilities or with limited time
- Enable individuals to monetise their underutilised laundry resources
- Foster community connections through a trusted service exchange
- Deliver an intuitive, seamless experience for both service users and providers
- Build a scalable platform that can grow with user adoption through effective referral mechanisms

## 2. Target Audience

### 2.1 Service Users

- **Students**: Living in dormitories or shared housing with limited laundry access
- **Individuals with disabilities**: Who may find traditional laundromats challenging to access
- **Busy professionals**: Seeking time-saving solutions for household chores
- **People without in-home laundry facilities**: Apartment dwellers or those with broken machines
- **Travellers**: Needing laundry services while away from home

### 2.2 Service Providers ("Washers")

- **Home-owners with laundry equipment**: Looking to earn supplemental income
- **Stay-at-home parents/individuals**: With availability during daytime hours
- **Part-time workers**: With flexible schedules and laundry facilities
- **Retirees**: Seeking additional income and community connections

## 3. Platform Architecture

Neighbourhood Wash features a role-based architecture with three distinct user experiences:

### 3.1 User Dashboard

Central hub for those seeking laundry services with streamlined access to:

- Washer discovery and selection
- Service booking
- Communication tools
- Transaction history
- Reviews and ratings
- Account management
- Allergies management
- Referral system with tracking

### 3.2 Washer Dashboard

Comprehensive management interface for service providers featuring:

- **Pre-Launch Interest Registration & Status**:
  - For users who have selected the "Washer" role but are not yet approved (especially during pre-launch).
  - Clear indication of their current status (e.g., "Pending Approval", "Interest Registered").
  - If not yet registered interest: Call to action to register interest, outlining benefits (e.g., priority onboarding, help community, earn income).
  - Form to collect essential pre-launch information (e.g., postcode/London borough like "Islington" or "N7 0EL") to gauge area demand.
  - Confirmation message upon interest submission, explaining that full onboarding and verification will follow.
- Service configuration and pricing
- Availability calendar
- Booking management
- Customer communications
- Earnings tracking
- Customer management
- Reviews and ratings
- Performance analytics
- Inventory management
- Profile customisation
- Washer referral system

### 3.3 Admin Dashboard

Oversight and management portal with tools for:

- User and Washer account administration
- Booking supervision
- Platform analytics
- Content management
- Settings configuration
- Issue resolution
- Referral system management

## 4. Detailed Functional Requirements

### 4.1 Key Landing Pages

#### 4.1.1 Main Landing Page

- Compelling hero section with clear value proposition
- Visual representation of the service concept
- Benefits section for both Users and Washers
- Featured testimonials section
- Call-to-action buttons for both user types
- Simple process overview
- Trust indicators (security, community, quality)

#### 4.1.2 How It Works Page

- Detailed step-by-step process explanation
- Visual timeline or process flow
- Separate sections for User and Washer journeys
- Animated illustrations of key steps
- Pricing explanation section
- Benefits and conveniences highlighted
- FAQ section specific to the process

#### 4.1.3 Our Washers Page

- Washer vetting and verification process
- Featured Washer profiles with success stories
- Benefits of becoming a Washer
- Equipment and space requirements
- Earning potential explanations
- Application process overview
- Testimonials from current Washers

#### 4.1.4 Reviews Page

- Overall platform rating display
- Rating distribution visualization
- Featured review carousel
- Filter options for review categories
- User success stories
- Washer testimonials
- Verified review badges
- Response examples from Washers

#### 4.1.5 FAQs Page

- Comprehensive accordion-style interface
- Categorized questions (Users, Washers, General)
- Search functionality for questions
- Contact form for additional questions
- Link to support resources
- Common troubleshooting section
- Privacy and security FAQ section

### 4.2 User Authentication & Profiles

- **Multi-role registration**: Secure sign-up with role selection (User/Washer)
- **Authentication**: Email/password login with secure validation
- **Social Authentication**: Google OAuth integration
- **Password management**: Reset functionality and security protocols
- **Profile creation**: Personal details, preferences, and contact information
- **Role-specific profiles**: Enhanced profiles for Washers with service details

#### User Profile Requirements:

- Personal information (name, contact details)
- Address/neighbourhood for location-based matching
- Notification preferences
- Account settings
- Referral code/tracking
- Product and detergent preferences
- Allergies and sensitivities

#### Washer Profile Requirements:

- Personal information and verification details
- **Pre-Launch Interest Area (if applicable)**: Postcode or London Borough submitted during interest registration.
- Service offerings (wash, dry, iron)
- Pricing structure per service
- Availability calendar
- Laundry equipment specifications
- Service area boundaries
- Profile images and description
- Product inventory management
- **Collection service configuration** (availability, radius, pricing)

### 4.3 Discovery & Matching

- **Location-based search**: Find Washers by proximity to user
- **Service filtering**: Search by available services (wash/dry/iron)
- **Pricing filters**: Sort by cost ranges
- **Availability search**: Find Washers with open slots on specific dates
- **Rating filters**: Sort by user ratings
- **Favourites**: Save preferred Washers for quick booking
- **Product preference matching**: Match based on detergent/product compatibility
- **Collection service filter**: Option to find Washers offering collection/delivery

### 4.4 Booking System

- **Calendar interface**: Visual display of Washer availability
- **Service selection**: Choose from available services (wash/dry/iron)
- **Time slot reservation**: Select specific dates and time blocks
- **Transparent pricing**: Clear display of service costs before confirmation
- **Special instructions**: Detergent preferences and handling instructions
- **Booking confirmation**: Automated notifications to both parties
- **Booking management**: View, modify or cancel upcoming bookings
- **Delivery method selection**: Choose between self drop-off/pick-up or Washer collection/delivery
- **PIN verification system**: Unique 4-digit PINs for secure laundry handovers (separate PINs for drop-off and pick-up)
- **Chain of custody tracking**: Timestamped verification of handovers

### 4.5 Communication System

- **Real-time chat messenger**: Direct messaging between Users and Washers
- **Booking-specific conversations**: Messages tied to specific reservations
- **Notification integration**: Alerts for new messages
- **Message history**: Archived conversations for reference
- **Media sharing**: Ability to share images (e.g., of stains or special items)

### 4.6 Service Management

- **Service status tracking**: Updates on laundry progress
- **Completion confirmation**: Verification when service is finished
- **History log**: Record of all completed services
- **Issue flagging**: System to mark problems for resolution
- **Notes system**: Add notes to bookings for special instructions
- **Collection service management**: Scheduling and tracking collection/delivery tasks
- **PIN verification system**: 4-digit PIN entry for confirming handovers

### 4.7 Earnings & Financial Tracking

- **Washer earnings dashboard**: Summary of income generated
- **Transaction history**: Record of all completed services
- **Customer list**: Overview of repeat and new customers
- **Payment processing**: Stripe integration for secure payments
- **Payout system**: Stripe Connect for Washer payouts
- **Collection fee tracking**: Separate tracking for collection service earnings

### 4.8 Review & Rating System

- **Post-service reviews**: Ability for Users to rate and review Washers
- **Rating criteria**: Multiple aspects (quality, timeliness, communication)
- **Review management**: Washers can view and respond to reviews
- **Aggregate ratings**: Overall score calculation and display
- **Verified review system**: Ensuring authentic feedback

### 4.9 Analytics & Insights

- **Washer performance metrics**: Bookings, ratings, completion rate
- **Earnings visualisation**: Charts showing income over time
- **Service popularity**: Most requested service types
- **Customer retention**: Repeat booking analysis
- **Admin-level analytics**: Platform-wide performance data
- **Collection service analytics**: Tracking usage and profitability of collection options

### 4.10 Referral System

- **Unique referral codes**: Generated for both Users and Washers
- **Referral tracking**: Monitor successful conversions
- **Reward mechanism**: Incentives for bringing new members
- **Promotion tools**: Shareable links for social media
- **Role-specific referral codes**: Different prefixes for Users vs Washers
- **Dashboard integration**: Prominent placement in both User and Washer dashboards
- **First-time discounts**: Monetary incentives for new referred users
- **Referrer rewards**: Credits or earnings for successful referrals
- **Referral analytics**: Visual tracking of referral success and earnings

### 4.11 Product Management

- **Washer inventory management**: Track available laundry products
- **User product preferences**: Specify preferred detergents and fabric softeners
- **Allergy considerations**: Identify and avoid problematic ingredients
- **Eco-friendly options**: Highlight environmentally conscious choices
- **Brand compatibility**: Match user preferences with Washer inventory

### 4.12 User Interface & Experience

- **Responsive design**: Optimised for desktop, tablet, and mobile
- **Intuitive navigation**: Clear pathways to key features
- **Accessibility compliance**: WCAG guidelines implementation
- **Light/Dark mode**: Toggle for visual preference
- **Onboarding assistance**: Guided first-use experience

### 4.13 Location Management

- **Google Maps integration**: Select and verify addresses
- **Address security**: Just-in-time visibility for active bookings
- **Privacy protection**: Address encryption and post-service data purging
- **Distance calculation**: Proximity-based matching and sorting
- **Collection radius configuration**: Define areas for collection service availability

## 5. Non-Functional Requirements

### 5.1 Performance

- Page load time under 2 seconds
- Support for concurrent users (initial target: 1000 simultaneous users)
- Real-time message delivery with minimal latency
- Booking calendar with immediate availability updates

### 5.2 Security

- Data encryption for personal information
- Authentication using industry best practices
- Session management and automatic timeouts
- Regular security audits and testing
- Two-factor authentication
- Role-based access control
- Address protection system
- PIN verification for secure handovers

### 5.3 Reliability

- 99.5% uptime target
- Automated backup systems
- Error logging and monitoring
- Graceful degradation during high load

### 5.4 Scalability

- Architecture designed for horizontal scaling
- Database optimisation for growing data volumes
- Service isolation to prevent system-wide failures
- Load balancing capabilities

### 5.5 Maintainability

- Clean code architecture with proper documentation
- Component-based design for modular updates
- Automated testing suite for regression prevention
- Version control and deployment workflows

### 5.6 Accessibility

- WCAG 2.1 AA compliance minimum
- Screen reader compatibility
- Keyboard navigation support
- Color contrast requirements
- Alternative text for images

## 6. Technical Stack & Implementation

### 6.1 Frontend

- **Framework**: Next.js with React
- **State Management**: Context API and/or Redux
- **Styling**: TailwindCSS with custom theme
- **UI Components**: Radix UI with light/dark mode support

### 6.2 Backend

- **API Architecture**: Next.js API routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: NextAuth.js with Google OAuth
- **Real-time Communication**: Supabase Realtime for chat functionality

### 6.3 Deployment & Operations

- **Hosting**: Vercel or similar Next.js-optimised platform
- **CI/CD**: Automated testing and deployment pipeline
- **Monitoring**: Performance and error tracking
- **Analytics**: User behaviour and system performance tracking

## 7. Development Phases & Priorities

### 7.1 Phase 1: Frontend Focus (Current Priority)

- Complete development of all landing pages:
  - Main landing page
  - How It Works page
  - Our Washers page
  - Reviews page
  - FAQs page
- Focus on responsive design and user experience
- Implement light/dark mode functionality
- Establish visual identity and branding elements

### 7.2 Phase 2: Core User Functionality

- User and Washer registration/authentication
- Basic profile creation
- Washer discovery and search
- Simplified booking calendar
- Basic chat messenger
- Core dashboard functionality
- Referral system implementation

### 7.3 Phase 3: Enhanced Features

- Advanced search and filtering
- Review and rating system
- Basic analytics for Washers
- Improved chat with media sharing
- Enhanced user profiles
- Product preference matching
- Advanced referral tracking
- PIN verification system implementation
- Collection service configuration

### 7.4 Phase 4: Platform Growth

- Payment gateway integration
- Dispute resolution system
- Advanced analytics
- Mobile optimisation improvements
- Comprehensive notification system
- Mapping service integration

## 8. Success Metrics

- **User Adoption**: Number of registered users and growth rate
- **Service Completion**: Bookings made and successfully fulfilled
- **Platform Engagement**: Average time on platform and feature usage
- **Washer Retention**: Active Washers and service frequency
- **User Satisfaction**: Ratings, reviews, and feedback
- **Community Growth**: Geographical expansion and neighbourhood penetration
- **Referral Effectiveness**: Conversion rate from referral links
- **Organic Growth**: Percentage of new users from referrals
- **Collection Service Usage**: Percentage of bookings using collection option

## 9. Future Considerations

- **Mobile Applications**: Native iOS and Android apps
- **Advanced Payment Options**: Subscription models, service packages
- **Community Features**: Neighbourhood groups and community boards
- **Expanded Services**: Additional home services beyond laundry
- **Business Accounts**: Special features for small businesses
- **Sustainability Tracking**: Environmental impact measurements
- **Tiered Referral System**: Multi-level rewards for continued referrals

## 10. Release Criteria

For the initial MVP release, the following must be completed:

- All landing pages implemented, responsive, and tested
- User authentication and profile creation functional
- Washer registration and profile management complete
- Basic booking system operational
- Collection service option configurable
- PIN verification system implemented for handovers
- Referral system implemented for both Users and Washers
- Chat functionality working between parties
- Security testing completed with critical issues addressed
- Performance benchmarks met for core features
- Accessibility compliance verified
- Support documentation completed for users and Washers

## 11. User Workflow

### Booking Flow

1. User searches for Washers in their neighbourhood
2. User reviews Washer profiles, services, pricing, and availability
3. User selects a Washer and books a specific date/time slot
4. User selects delivery method (self drop-off or Washer collection)
5. User specifies detergent preferences
6. System generates unique 4-digit PINs for drop-off and pick-up
7. Washer receives booking notification and confirmation
8. Both parties communicate via chat messenger as needed
9. For drop-off/pick-up, PINs are verified during handovers
10. Service is completed according to booking
11. User provides rating and review of the Washer

### Washer Onboarding Flow

1. User signs up with Washer role selection
2. Washer creates profile with personal information and location
3. Washer sets up service offerings (wash, dry, iron) with pricing
4. Washer configures collection service availability and pricing
5. Washer configures availability calendar
6. Washer profile becomes visible to users in the neighbourhood

### Referral Flow

1. User/Washer accesses referral section on dashboard
2. System generates unique referral code
3. User/Washer shares referral link with friends
4. New user registers using referral link
5. System attributes registration to referrer
6. After first completed booking, referred user gets discount
7. Referrer receives reward (credit or commission)
8. Both parties receive notification of successful referral

---

This Product Requirements Document will guide the development of the Neighbourhood Wash web application and serve as the source of truth for feature implementation. Regular reviews and updates to this document will occur as development progresses and user feedback is incorporated.
