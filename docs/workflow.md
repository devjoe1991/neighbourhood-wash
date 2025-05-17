# Enhanced Neighbourhood Wash Web Application Architecture & Workflow

## Project Overview

Neighbourhood Wash is a Next.js-based community marketplace connecting individuals seeking laundry services with local "Washers" who offer their laundry facilities and services. The platform aims to revolutionize how communities approach laundry by facilitating peer-to-peer connections, fostering neighborhood resource sharing, and creating economic opportunities through an intuitive digital platform.

## Technical Architecture

### Frontend

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: TailwindCSS with custom blue theme
  - Primary Blue: `#3498db`
  - Secondary Blue: `#85c1e9`
  - Accent Blue: `#2980b9`
- **UI Components**:
  - Radix UI components
  - Shadcn/ui for enhanced UI components
  - Light/dark mode toggle functionality

### Backend

- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with Google OAuth integration
- **Real-time Features**: Supabase Realtime for chat functionality
- **Server Logic**: Next.js API routes
- **Storage**: Supabase Storage for profile pictures and media

### Deployment

- **Hosting**: Vercel for production deployment
- **CI/CD**: Automated testing and deployment pipeline
- **Monitoring**: Performance and error tracking

## User Roles & Dashboard Architecture

The application features a role-based architecture with three distinct user experiences:

### 1. User Dashboard

#### Core Components:

- **Authentication Hub**: Registration, login, profile management
- **Washer Discovery Interface**:
  - Search functionality with distance-based algorithm
  - Advanced filtering (services, price, ratings)
  - Washer preview cards with critical information
  - Favorites management system
- **Booking Management**:
  - Service selection interface
  - Calendar view for availability selection
  - Time slot reservation system
  - **Delivery method selection (self drop-off or Washer collection)**
  - Booking confirmation process
  - **PIN verification system for handovers**
  - Booking history and management
- **Communication Center**:
  - Real-time chat messenger with Washers
  - Booking-specific conversations
  - Media sharing capabilities
  - Message history archive
- **Profile & Preferences**:
  - Personal information management
  - Address security system
  - Allergies and preferences configuration
  - Product preference selection
- **Reviews & Ratings**:
  - Post-service review submission
  - Rating across multiple criteria
  - Review history tracking
- **Referral System**:
  - Unique referral code generation
  - Referral tracking dashboard
  - Social media sharing integration
  - Reward visualization and history
- **Settings & Support**:
  - Notification preferences
  - Account settings
  - Light/dark mode toggle
  - Help/support access

### 2. Washer Dashboard

#### Core Components:

- **Authentication Hub**: Registration, login, profile management with Washer role
- **Service Management**:
  - Service offerings configuration (wash, dry, iron)
  - Pricing structure management
  - Availability calendar configuration
  - Service area definition
  - **Collection service configuration and pricing**
- **Booking Operations**:
  - Incoming booking notifications
  - Booking approval/rejection
  - **PIN verification system for secure handovers**
  - Service status tracking
  - Completion confirmation system
- **Customer Management**:
  - Customer list view
  - Customer history and preferences
  - Communication history
- **Business Analytics**:
  - Earnings tracking dashboard
  - Booking analytics visualization
  - Customer retention metrics
  - Service popularity charts
- **Inventory Management**:
  - Product inventory cataloging
  - Stock status tracking
  - Product updates notification system
- **Communication Center**:
  - Real-time chat with customers
  - Booking notes system
  - Issue flagging interface
- **Profile & Settings**:
  - Enhanced profile with service details
  - Service area management
  - Equipment specifications
  - Availability management
  - **Collection radius configuration**
- **Washer Referral System**:
  - Washer-specific referral codes
  - Promotional materials access
  - Referral tracking metrics
  - Enhanced rewards for Washer recruitment
- **Reviews & Performance**:
  - Rating and review display
  - Review response capability
  - Performance metrics visualization

### 3. Admin Dashboard

#### Core Components:

- **User Management**:
  - User account administration
  - Verification monitoring
  - Access control management
- **Washer Management**:
  - Washer verification tools
  - Service quality monitoring
  - Performance metrics analysis
- **Platform Oversight**:
  - Booking supervision interface
  - Dispute resolution system
  - Issue escalation management
- **Analytics Hub**:
  - Comprehensive platform metrics
  - Growth and adoption visualization
  - Service performance analytics
  - Geographic distribution mapping
- **Content Management**:
  - Landing page content editing
  - FAQ management
  - Testimonial curation
- **System Configuration**:
  - Platform settings management
  - Notification template editing
  - Referral program configuration
  - Security settings administration

## Key Workflow Sequences

### 1. User Registration & Onboarding Flow

1. **Initial Registration**:

   - User selects registration option from landing page
   - Chooses between email/password or Google OAuth
   - Selects account type (User or Washer role)
   - Completes basic profile information

2. **User Profile Creation**:

   - Enters personal information (name, contact details)
   - Adds address/neighborhood for location-based matching
   - Configures notification preferences
   - Sets up account settings
   - Receives unique referral code

3. **Preference Configuration**:
   - Specifies product and detergent preferences
   - Indicates any allergies or sensitivities
   - Sets privacy and visibility preferences
   - Completes guided onboarding tour

### 2. Washer Registration & Onboarding Flow

1. **Initial Registration**:

   - Same basic registration as User
   - Selects Washer role during signup

2. **Enhanced Profile Creation**:

   - Completes personal information and verification details
   - Adds profile images and description
   - Defines service area boundaries
   - Specifies laundry equipment available

3. **Service Configuration**:

   - Sets up service offerings (wash, dry, iron)
   - Configures pricing structure per service
   - Establishes availability calendar
   - Defines specialty services (if applicable)

4. **Inventory Setup**:
   - Catalogs available laundry products
   - Specifies eco-friendly options
   - Indicates allergen-free alternatives
   - Sets up product notifications

### 3. Comprehensive Booking Flow

1. **Discovery Phase**:

   - User searches for Washers in their neighborhood
   - Applies filters based on service needs, pricing, ratings
   - Views Washer profiles with preview cards showing:
     - Profile image/initials
     - First name display
     - Rating and review count
     - Approximate distance
     - Service specialties badges
     - Next available slot info
     - Verified status indicator

2. **Selection & Booking**:

   - User selects a Washer based on profile and reviews
   - Views detailed availability calendar
   - Selects specific services needed (wash, dry, iron)
   - Chooses date and time slot
   - Specifies load size and type
   - **Selects delivery method**:
     - Self drop-off/pick-up (standard option)
     - Washer collection/delivery service (with additional fee)
   - Views transparent pricing calculation (including any collection fees)
   - Adds special instructions and detergent preferences

3. **Confirmation Process**:

   - Reviews booking details and total cost
   - Submits booking request
   - Washer receives notification of pending booking
   - Washer confirms booking availability
   - User receives booking confirmation
   - **System generates unique 4-digit PINs** for both drop-off and pick-up
   - Both parties gain access to booking-specific chat
   - Both parties can view booking details including the secure PINs

4. **Service Execution**:

   - **Delivery Method Selection**:
     - During booking, user selects between:
       - Self drop-off/pick-up
       - Washer collection/delivery service (may incur additional fee)
   - **PIN Verification System**:
     - System generates unique 4-digit PIN for each booking
     - PIN is displayed in both parties' booking details
   - **For Self Drop-off**:
     - User arrives at Washer's location at agreed time
     - User shows booking reference
     - Washer enters the 4-digit PIN in their app to confirm receipt
     - System records chain of custody transfer
   - **For Washer Collection**:
     - Washer arrives at User's location at agreed time
     - Washer shows booking reference
     - User enters the 4-digit PIN in their app to confirm handover
     - System records chain of custody transfer
   - **Service Processing**:
     - Washer updates service status as it progresses
     - Status updates automatically notify user
     - Real-time chat available for questions/updates
     - Washer marks service as processing complete
   - **For Self Pick-up**:
     - User arrives at Washer's location at agreed time
     - Washer enters second 4-digit PIN (different from drop-off)
     - User confirms receipt by entering same PIN in their app
     - System records completed chain of custody
   - **For Washer Delivery**:
     - Washer arrives at User's location at agreed time
     - User enters second 4-digit PIN (different from collection)
     - Washer confirms delivery by entering same PIN in their app
     - System records completed chain of custody
   - Service is marked as fully complete
   - System prompts for review and rating

5. **Post-Service Actions**:
   - User submits rating and review
   - Washer receives notification of new review
   - Booking is archived in history for both parties
   - User can add Washer to favorites for future bookings

### 4. Multi-Layered Referral System Flow

1. **Referral Initiation**:

   - User/Washer accesses referral section on dashboard
   - System displays current referral status and rewards
   - User/Washer obtains unique referral code
   - Platform provides pre-written promotional messages

2. **Sharing Mechanism**:

   - User/Washer shares referral link via:
     - Direct social media integration
     - Email sharing functionality
     - Copy-paste link option
     - QR code generation for in-person sharing

3. **Tracking & Attribution**:

   - New user clicks referral link
   - System attributes registration to referrer
   - Referral dashboard updates with pending status
   - New user completes registration process

4. **Reward Distribution**:

   - After first completed booking:
     - Referred user receives first-booking discount
     - Referrer receives reward (credit or commission)
     - Both parties get notification of successful referral
   - Washer referrals earn enhanced rewards due to higher value

5. **Analytics & Optimization**:
   - Referral performance metrics displayed on dashboard
   - Conversion rates visualization
   - Earnings from referral program tracking
   - Suggestions for optimizing referral efforts

### 5. Communication System Flow

1. **Conversation Initiation**:

   - Chat access becomes available after booking confirmation
   - Booking-specific conversation thread created
   - System sends automated introduction message

2. **In-Service Communication**:

   - Real-time messaging between User and Washer
   - Status updates sent automatically at key stages
   - Media sharing for specific instructions/issues
   - Notification alerts for new messages

3. **Post-Service Support**:
   - Chat remains accessible for specified period after completion
   - Archived conversations available in message history
   - Issue resolution communication if needed
   - System prompts for service feedback

### 6. Review & Rating Flow

1. **Review Prompt**:

   - System automatically prompts for review after service completion
   - User accesses rating interface from dashboard or notification

2. **Evaluation Process**:

   - User rates service across multiple criteria:
     - Service quality
     - Timeliness
     - Communication
     - Value for money
   - Submits written review with specific feedback
   - Option to include photos of completed laundry

3. **Review Publication**:
   - Washer receives notification of new review
   - Review appears on Washer's profile after moderation
   - Aggregate ratings automatically update
   - Washer can respond to review (optional)
   - Review contributes to platform trust metrics

### 7. Analytics & Insights Flow (Washer)

1. **Dashboard Overview**:

   - Summary of key performance metrics
   - Earnings visualization with trend analysis
   - Booking completion statistics
   - Average ratings display

2. **Detailed Performance Analysis**:

   - Service popularity breakdown
   - Customer retention metrics
   - Rating distribution across categories
   - Seasonal demand patterns

3. **Business Optimization**:
   - Peak time identification
   - Pricing optimization suggestions
   - Service enhancement recommendations
   - Customer preference insights

### 8. Administrative Oversight Flow

1. **User Verification**:

   - New registrations flagged for review
   - Verification status monitoring
   - Issue resolution for contested accounts
   - Access control management

2. **Platform Monitoring**:

   - Real-time activity dashboard
   - Issue flagging and escalation system
   - Performance metrics tracking
   - Security alert management

3. **Content Management**:
   - Review moderation workflow
   - Landing page content updates
   - FAQ management process
   - Promotional content coordination

## Data Models

### User Model

- **Common Fields**:

  - `id`: Unique identifier
  - `email`: Login email address
  - `password_hash`: Securely stored password (if email/password auth)
  - `oauth_provider`: Authentication provider if using OAuth
  - `role`: User or Washer
  - `first_name`: User's first name
  - `last_name`: User's last name
  - `phone_number`: Contact phone
  - `profile_image_url`: Profile picture URL
  - `date_joined`: Registration timestamp
  - `is_verified`: Account verification status
  - `notification_preferences`: Communication settings
  - `referral_code`: Unique code for referrals
  - `referred_by`: ID of referring user/washer (if applicable)

- **User-Specific Fields**:

  - `address`: Encrypted location information
  - `neighborhood`: General area for matching
  - `favorite_washers`: Array of saved Washer IDs
  - `allergies`: List of allergies/sensitivities
  - `product_preferences`: Preferred detergents/fabric softeners
  - `default_service_preferences`: Common service selections

- **Washer-Specific Fields**:
  - `washer_bio`: Description of services
  - `service_address`: Encrypted service location
  - `service_area_radius`: Maximum service distance
  - `offers_collection`: Boolean for collection service availability
  - `collection_radius`: Maximum distance for collection service
  - `collection_fee`: Price for collection/delivery service
  - `equipment_details`: Available machines/facilities
  - `service_offerings`: Available service types
  - `availability_schedule`: Calendar availability
  - `pricing_structure`: Service rates
  - `is_featured`: Featured Washer status
  - `washer_verification_level`: Trust indicator

### Booking Model

- `id`: Unique booking identifier
- `user_id`: Service requester ID
- `washer_id`: Service provider ID
- `services`: Selected services (wash, dry, iron)
- `date`: Scheduled service date
- `time_slot`: Reserved time period
- `status`: Booking status (pending, confirmed, in-progress, completed, canceled)
- `delivery_method`: Self drop-off/pick-up or Washer collection/delivery
- `collection_fee`: Additional fee for collection service (if applicable)
- `dropoff_pin`: 4-digit PIN for laundry handover verification
- `pickup_pin`: 4-digit PIN for laundry return verification
- `dropoff_verified_at`: Timestamp of dropoff verification
- `pickup_verified_at`: Timestamp of pickup verification
- `special_instructions`: Custom requests
- `detergent_preferences`: Product selections
- `payment_status`: Payment tracking
- `total_cost`: Calculated service price
- `created_at`: Booking creation timestamp
- `updated_at`: Last update timestamp
- `completion_time`: Service completion timestamp

### Rating & Review Model

- `id`: Unique review identifier
- `booking_id`: Associated booking
- `user_id`: Reviewer ID
- `washer_id`: Reviewed Washer ID
- `overall_rating`: Composite score
- `quality_rating`: Service quality score
- `timeliness_rating`: Punctuality score
- `communication_rating`: Communication quality score
- `value_rating`: Value for money score
- `review_text`: Written feedback
- `media_urls`: Array of image URLs (if any)
- `washer_response`: Washer's reply (if any)
- `is_verified`: Confirmation booking was completed
- `created_at`: Review submission date
- `updated_at`: Last update timestamp

### Message Model

- `id`: Unique message identifier
- `conversation_id`: Chat thread identifier
- `booking_id`: Associated booking (if applicable)
- `sender_id`: Message author ID
- `sender_role`: User or Washer
- `recipient_id`: Message recipient ID
- `content`: Message text
- `media_urls`: Array of shared media URLs
- `is_read`: Read status
- `created_at`: Message timestamp
- `system_generated`: Flag for automated messages

### Referral Model

- `id`: Unique referral identifier
- `referrer_id`: User/Washer who shared code
- `referrer_role`: User or Washer
- `referred_id`: New registered user ID
- `referred_role`: Role of new user
- `referral_code`: Code used for registration
- `status`: Tracking status (pending, completed, rewarded)
- `first_booking_completed`: First service completion flag
- `reward_amount`: Credit/commission awarded
- `created_at`: Referral generation date
- `completed_at`: Reward distribution date

### Product Inventory Model (Washers)

- `id`: Unique product identifier
- `washer_id`: Associated Washer
- `product_name`: Detergent/softener name
- `product_type`: Category classification
- `is_hypoallergenic`: Allergy-friendly status
- `is_eco_friendly`: Environmental status
- `is_available`: Current availability
- `image_url`: Product image
- `notes`: Additional information

## Security Considerations

### Data Protection

- Address encryption for location privacy
- Just-in-time address visibility for active bookings only
- Post-service data purging for sensitive information
- Secure password management and authentication
- Database encryption for all sensitive fields

### Access Control

- Role-based access restrictions
- Session management with automatic timeouts
- Two-factor authentication for added security
- IP tracking and suspicious activity monitoring

### Personal Safety

- User and Washer verification processes
- Review and rating system for trust building
- In-app communications to avoid personal contact sharing
- Address protection until booking confirmation

## Performance Optimizations

### Response Time

- Server-side rendering for critical pages
- Client-side rendering for dynamic interfaces
- Static generation for landing pages
- API response time optimization (<500ms target)

### Scalability

- Horizontal scaling architecture
- Database query optimization
- Connection pooling for database efficiency
- Caching strategies for frequent queries

### User Experience

- Responsive design for all device types
- Progressive image loading
- Skeleton screens during data fetch
- Optimistic UI updates for perceived performance

## Future Expansion Considerations

### Platform Growth

- Mobile applications for iOS and Android
- Advanced payment options and subscription models
- Expanded service offerings beyond laundry
- Business accounts for commercial clients

### Feature Enhancements

- Machine learning for improved matchmaking
- Advanced analytics with predictive modeling
- Enhanced referral system with tiered rewards
- Community features and neighborhood groups

### Technological Advancements

- Integration with smart home devices
- Automated scheduling algorithms
- Enhanced security protocols
- Advanced messaging capabilities

This comprehensive workflow document provides a detailed architecture and process overview for the Neighbourhood Wash application, setting clear guidelines for implementation while maintaining the community-focused vision of creating a trusted marketplace for laundry services.
