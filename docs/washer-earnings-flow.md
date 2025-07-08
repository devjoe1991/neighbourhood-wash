# Washer Earnings Flow

This diagram shows how washer earnings are calculated, tracked, and paid out through the Neighbourhood Wash platform.

## Earnings Flow Diagram

```mermaid
graph TD
    A[Booking Completed] --> B[Database Trigger: calculate_earnings]
    B --> C[Calculate Booking Total]
    C --> D[Calculate Platform Fee: 15%]
    C --> E[Calculate Washer Earnings: 85%]
    
    D --> F[Insert into earnings table]
    E --> F
    F --> G[Update Washer Balance View]
    
    G --> H[Washer Sees Updated Balance]
    H --> I{Balance ≥ £10?}
    
    I -->|No| J[Wait for More Bookings]
    I -->|Yes| K[Washer Requests Payout]
    
    K --> L[Validate Stripe Account]
    L --> M{Account Verified?}
    
    M -->|No| N[Redirect to Stripe Onboarding]
    M -->|Yes| O[Create Payout Request]
    
    O --> P[Calculate £2.50 Fee]
    P --> Q[Mark Earnings as 'processing']
    Q --> R[Admin Review Required]
    
    R --> S{Admin Approves?}
    
    S -->|No| T[Reject Request]
    S -->|Yes| U[Transfer to Stripe Connect]
    
    T --> V[Return Earnings to Available]
    U --> W[Stripe Transfers to Bank]
    
    W --> X[Update Request Status: 'completed']
    X --> Y[Washer Receives Funds]
    
    J --> Z[Continue Providing Services]
    N --> AA[Complete Account Setup]
    AA --> K
```

## Earnings Calculation Example

### Booking: £100 Laundry Service

```
Customer Payment:     £100.00
Platform Fee (15%):   £15.00
Washer Gross Earning: £85.00

At Payout Request:
Available Balance:    £85.00
Payout Fee:          £2.50
Net Payout:          £82.50
```

## Balance States

| State | Description | Action Available |
|-------|-------------|------------------|
| **Available** | Ready for payout request | ✅ Can request payout |
| **Processing** | Payout request pending admin approval | ⏳ Waiting for approval |
| **Completed** | Successfully paid out | ✅ Funds transferred |

## Real-time Balance Tracking

The `washer_balances` view provides real-time calculations:

```sql
-- Available: earnings not in processing/completed payouts
-- Processing: earnings in pending payout requests  
-- Total: lifetime earnings from all completed bookings
```

## Payout Requirements

- **Minimum Balance**: £10.00
- **Verified Stripe Account**: Required for payouts
- **Admin Approval**: Manual review for security
- **Fee Structure**: £2.50 flat fee per payout
- **Processing Time**: 1-3 business days after approval

## Security Features

- **FIFO Processing**: Oldest earnings paid out first
- **Immutable Records**: Cannot modify completed earnings
- **Admin Oversight**: All payouts require manual approval
- **Audit Trail**: Complete history of all transactions
- **Account Verification**: Stripe KYC/AML compliance required 