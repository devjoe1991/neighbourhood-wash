# Customer Payment Flow

This diagram shows how customer payments flow through the Neighbourhood Wash platform, from initial booking to platform revenue capture.

## Payment Flow Diagram

```mermaid
graph TD
    A[Customer Creates Booking] --> B[Stripe Payment Intent Created]
    B --> C[Customer Enters Payment Details]
    C --> D[Stripe Processes Payment]
    D --> E{Payment Successful?}
    
    E -->|No| F[Payment Failed - Booking Cancelled]
    E -->|Yes| G[Booking Confirmed & Created]
    
    G --> H[Payment Held by Stripe]
    H --> I[Booking Status: 'confirmed']
    
    I --> J[Washer Accepts & Starts Service]
    J --> K[Collection PIN Verified]
    K --> L[Booking Status: 'in_progress']
    
    L --> M[Service Completed]
    M --> N[Delivery PIN Verified]
    N --> O[Booking Status: 'completed']
    
    O --> P[Database Trigger Fires]
    P --> Q[Calculate 15% Platform Fee]
    P --> R[Calculate 85% Washer Earnings]
    
    Q --> S[Platform Revenue Recorded]
    R --> T[Washer Earnings Added to Balance]
    
    S --> U[Admin Revenue Dashboard Updated]
    T --> V[Washer Payout Balance Updated]
    
    V --> W[Washer Can Request Payout]
    W --> X[Admin Approves Payout]
    X --> Y[Funds Released to Washer]
    
    F --> Z[Customer Refunded Automatically]
```

## Payment Breakdown Examples

| Booking Amount | Stripe Fee (~3%) | Net Received | Platform Fee (15%) | Washer Earns |
|----------------|------------------|--------------|-------------------|--------------|
| £50.00         | £1.50           | £48.50       | £7.50             | £42.50       |
| £100.00        | £3.00           | £97.00       | £15.00            | £85.00       |
| £150.00        | £4.50           | £145.50      | £22.50            | £127.50      |

## Security Features

- **Payment Security**: All payments processed through Stripe's secure infrastructure
- **Two-Factor Verification**: PIN codes required for both collection and delivery
- **Automatic Fee Calculation**: Database triggers prevent commission bypass
- **Immutable Records**: All financial transactions are permanently recorded
- **Admin Oversight**: Manual approval required for all payouts

## Technical Implementation

- **Stripe Payment Intents**: Secure payment processing with 3D Secure support
- **Database Triggers**: Automatic calculation of fees when bookings complete
- **Real-time Updates**: Live balance tracking for washers
- **Audit Trail**: Complete transaction history with timestamps
- **Error Handling**: Comprehensive payment failure management 