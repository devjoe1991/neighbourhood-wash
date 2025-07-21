# Smart Booking Matching Algorithm

This module implements an intelligent washer matching system for the laundry platform, inspired by industry-leading platforms like Uber, Lyft, and TaskRabbit.

## Overview

The Smart Booking Matching Algorithm automatically assigns laundry bookings to the most suitable washers based on multiple factors including location, availability, rating, experience, and service specialization.

## Architecture

### Core Components

1. **SmartMatchingEngine** (`matching-engine.ts`)
   - Implements the core matching algorithm
   - Calculates match scores for available washers
   - Handles location-based filtering and scoring

2. **JobAssignmentService** (`assignment-service.ts`)
   - Manages the real-time job assignment process
   - Handles washer notifications and responses
   - Implements automatic reassignment for declined jobs

3. **BookingLifecycleService** (`lifecycle-service.ts`)
   - Manages the complete booking lifecycle
   - Handles status transitions and validations
   - Provides booking creation and management

## Matching Algorithm

### Scoring Factors

The algorithm uses a weighted scoring system to rank washers:

- **Distance (30%)**: Proximity to customer location
- **Availability (25%)**: Schedule availability and capacity
- **Rating (20%)**: Customer satisfaction scores
- **Experience (15%)**: Number of completed jobs
- **Specialization (10%)**: Service type expertise

### Calculation Details

#### Distance Scoring
```typescript
distanceScore = Math.max(0, 100 - (distanceKm / maxDistance) * 100)
```

#### Rating Scoring
```typescript
ratingScore = (rating / 5) * 100
```

#### Experience Scoring
```typescript
experienceScore = Math.min(totalJobs / 50 * 100, 100)
```

### Total Score
```typescript
totalScore = (
  distanceScore * 0.3 +
  availabilityScore * 0.25 +
  ratingScore * 0.2 +
  experienceScore * 0.15 +
  specializationScore * 0.1
)
```

## Assignment Flow

1. **Booking Creation**: Customer creates a new booking
2. **Matching**: Algorithm finds top 5 best matches
3. **Assignment**: Best match gets job offer with 15-minute timeout
4. **Response**: Washer accepts or declines the job
5. **Reassignment**: If declined, next best match is offered
6. **Confirmation**: Booking confirmed when accepted

## Real-Time Features

### Notifications
- Instant push notifications to washers
- Email notifications for important updates
- Real-time status updates for customers

### Automatic Reassignment
- 15-minute timeout for washer responses
- Automatic progression to next best match
- Prevents booking delays

### Capacity Management
- Tracks washer concurrent booking limits
- Considers availability schedules
- Prevents overloading washers

## API Endpoints

### Assignment Management
- `POST /api/bookings/assign` - Assign booking to best washer
- `POST /api/bookings/respond` - Washer response to assignment
- `POST /api/bookings/process-expired` - Handle expired assignments

### Server Actions
- `assignBookingAction()` - Admin booking assignment
- `respondToAssignmentAction()` - Washer job response
- `createBookingAction()` - Customer booking creation

## Database Schema

### Key Tables
- `washer_assignments` - Assignment tracking
- `booking_status_history` - Status audit trail
- `notifications` - Real-time notifications
- `washer_availability` - Schedule management

## Usage Examples

### Creating a Booking
```typescript
const bookingData = {
  customerId: 'customer-123',
  serviceType: 'standard',
  requestedDate: '2024-01-15',
  pickupAddress: {
    lat: 51.5074,
    lng: -0.1278,
    address: '123 Test Street'
  },
  basePrice: 25.00,
  items: [{ itemType: 'mixed', quantity: 1 }]
}

const result = await lifecycleService.createBooking(bookingData)
```

### Assigning a Booking
```typescript
const assignmentResult = await assignmentService.assignBooking(bookingId)
if (assignmentResult.success) {
  console.log(`Assigned to washer with ${assignmentResult.matchScore}% match`)
}
```

### Washer Response
```typescript
const response = await assignmentService.handleWasherResponse(
  assignmentId,
  washerId,
  'accepted'
)
```

## Testing

### Unit Tests
- Core algorithm logic testing
- Scoring calculation validation
- Edge case handling

### Integration Tests
- End-to-end assignment flow
- Database interaction testing
- Real-time notification testing

### Running Tests
```bash
npm run test:unit -- lib/booking/__tests__/
```

## Performance Considerations

### Optimization Features
- Efficient database queries with proper indexing
- Caching of frequently accessed data
- Batch processing for notifications
- Connection pooling for database operations

### Scalability
- Horizontal scaling support
- Queue-based assignment processing
- Rate limiting for API endpoints
- Monitoring and alerting

## Monitoring and Analytics

### Key Metrics
- Assignment success rate
- Average response time
- Washer acceptance rate
- Customer satisfaction scores

### Alerting
- Failed assignments
- High response times
- System errors
- Capacity issues

## Configuration

### Environment Variables
- `CRON_SECRET` - Secret for scheduled job processing
- Database connection settings
- Notification service configuration

### System Limits
- Maximum service radius: 50km
- Assignment timeout: 15 minutes
- Maximum concurrent bookings per washer: 5
- Top matches returned: 5

## Future Enhancements

### Planned Features
- Machine learning-based scoring improvements
- Dynamic pricing based on demand
- Predictive availability modeling
- Advanced customer preferences

### Performance Improvements
- Redis caching layer
- WebSocket real-time updates
- Background job processing
- Advanced monitoring dashboard

## Support

For technical support or questions about the booking matching system, please refer to the main project documentation or contact the development team.