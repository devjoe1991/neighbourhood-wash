# Payout Request Workflow

This diagram shows the detailed workflow for washer payout requests, including validation, admin approval, and fund transfer processes.

## Payout Request Flow

```mermaid
graph TD
    A[Washer Views Balance] --> B{Balance ≥ £10?}
    B -->|No| C[Display Minimum Balance Message]
    B -->|Yes| D[Click 'Request Payout']
    
    D --> E[Validate Stripe Account]
    E --> F{Account Verified?}
    
    F -->|No| G[Redirect to Stripe Onboarding]
    G --> H[Complete Bank Details]
    H --> I[Stripe KYC Verification]
    I --> J{Verification Passed?}
    
    J -->|No| K[Show Verification Requirements]
    J -->|Yes| L[Return to Payout Request]
    
    F -->|Yes| M[Show Payout Form]
    L --> M
    
    M --> N[Enter Payout Amount]
    N --> O{Amount Valid?}
    
    O -->|No| P[Show Validation Error]
    O -->|Yes| Q[Calculate Fees & Net Amount]
    
    Q --> R[Show Fee Breakdown]
    R --> S[Confirm Payout Request]
    S --> T[Create Payout Request Record]
    
    T --> U[Mark Earnings as 'processing']
    U --> V[Send Admin Notification]
    V --> W[Update Washer Balance Display]
    
    W --> X[Admin Reviews Request]
    X --> Y{Admin Decision}
    
    Y -->|Approve| Z[Process Payout]
    Y -->|Reject| AA[Reject Request]
    
    Z --> BB[Create Stripe Transfer]
    BB --> CC{Transfer Successful?}
    
    CC -->|Yes| DD[Update Status: 'completed']
    CC -->|No| EE[Update Status: 'failed']
    
    DD --> FF[Notify Washer: Success]
    EE --> GG[Notify Washer: Failed]
    EE --> HH[Return Earnings to Available]
    
    AA --> II[Update Status: 'rejected']
    II --> JJ[Return Earnings to Available]
    II --> KK[Notify Washer: Rejected]
    
    C --> LL[Continue Earning]
    K --> MM[Contact Support]
    P --> N
```

## Payout Request States

```mermaid
stateDiagram-v2
    [*] --> pending: Request Created
    pending --> approved: Admin Approves
    pending --> rejected: Admin Rejects
    approved --> processing: Stripe Transfer Initiated
    processing --> completed: Transfer Successful
    processing --> failed: Transfer Failed
    rejected --> [*]: Request Closed
    failed --> [*]: Request Closed
    completed --> [*]: Payout Successful
```

## Admin Approval Interface

### Review Criteria
- **Washer Verification Status**: Stripe account fully verified
- **Earnings Legitimacy**: All earnings from completed bookings
- **Account Standing**: No recent disputes or issues
- **Minimum Thresholds**: Request meets minimum requirements
- **Fraud Indicators**: No suspicious activity patterns

### Admin Actions Available
| Action | Description | Effect |
|--------|-------------|--------|
| **Approve** | Process payout request | Initiates Stripe transfer |
| **Reject** | Deny payout request | Returns earnings to available balance |
| **Request Info** | Ask for additional details | Pauses request for clarification |
| **Flag Account** | Mark for investigation | Prevents future payouts until resolved |

## Validation Rules

### Amount Validation
- **Minimum**: £10.00
- **Maximum**: Available balance
- **Increments**: £0.01 precision
- **Fee Calculation**: £2.50 flat fee per request

### Account Validation
- **Stripe Connection**: Active Express account required
- **Bank Details**: Verified bank account connected
- **Identity Verification**: KYC documents approved
- **Tax Information**: W-9/W-8 forms completed (if applicable)

### Security Checks
- **Rate Limiting**: Maximum 3 requests per week
- **Fraud Detection**: Pattern analysis on request timing
- **Account Age**: Minimum 7 days since first earning
- **Completion Rate**: Minimum booking completion percentage

## Notification System

### Washer Notifications
- **Request Submitted**: Confirmation with reference number
- **Under Review**: Admin reviewing request status
- **Approved**: Payout processing notification
- **Rejected**: Reason for rejection with next steps
- **Completed**: Funds transferred successfully
- **Failed**: Transfer issue with retry options

### Admin Notifications
- **New Request**: Immediate notification to admin team
- **Verification Required**: Additional documentation needed
- **Transfer Failed**: Stripe transfer error details
- **Suspicious Activity**: Potential fraud flag alerts

## Error Handling

### Common Error Scenarios
1. **Insufficient Balance**: User tries to withdraw more than available
2. **Unverified Account**: Stripe account incomplete or suspended
3. **Transfer Failure**: Bank account issues or Stripe errors
4. **Duplicate Request**: Multiple simultaneous payout attempts
5. **Rate Limiting**: Too many requests in short timeframe

### Recovery Procedures
- **Automatic Retry**: Failed transfers retry after 24 hours
- **Manual Investigation**: Admin review for complex issues
- **Support Escalation**: Customer service intervention
- **Refund Protection**: Earnings always returned if payout fails 