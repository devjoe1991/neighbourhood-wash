# Neighbourhood Wash – Payment & Onboarding Workflow

## 🧩 Overview

This document specifies the complete payment and onboarding workflow for the **Neighbourhood Wash** platform. The system uses **Stripe Connect** to operate as a marketplace, facilitating payments between **Customers** and **Washers**.

The workflow includes two primary payment types:

1.  A **one-time onboarding fee** paid by new Washers directly to the platform.
2.  **Marketplace bookings**, where a Customer pays for a service, funds are held by Stripe, and then paid out to the Washer, with the platform taking a tiered commission fee.

All transactions are processed in **GBP (£)**.

---

## 🏷️ Key Roles

- **Customer**: The end-user booking a laundry service.
- **Washer**: The service provider who has been onboarded to the platform.
- **Platform**: Neighbourhood Wash, which acts as the marketplace operator and is a connected account under the main "Techpreneur Joe" business Stripe account.

---

## 🔁 End-to-End Workflow

### **Phase 1: Washer Onboarding & Activation**

This phase is critical. A Washer cannot accept bookings until they have paid the onboarding fee AND connected their Stripe account.

#### **Step 1.1: Initial Signup & Fee Payment**

- A new user signs up with the `Washer` role.
- In their dashboard, they are presented with a persistent call-to-action to activate their account by paying the onboarding fee.
- **Pricing Display**:
  - Full Price: `£49.99` (displayed with a strikethrough).
  - **Sale Price**: **`£14.99`**.
- The UI clearly states the benefits of this fee (e.g., "A one-time fee for safety checks and platform access to start earning.").
- **Action**: Washer clicks "Become a Verified Washer" and is redirected to a **Stripe Checkout** session to pay the `£14.99` fee. This is a **direct charge** to the platform's main Stripe account.

#### **Step 1.2: Stripe Connect Onboarding**

- Upon successful payment of the onboarding fee, a Stripe webhook updates the Washer's profile in the Supabase database (e.g., `onboarding_fee_paid = true`).
- The Washer's dashboard now updates, prompting them to connect their bank account to receive payouts.
- **Action**: Washer clicks "Connect Bank Account" and is redirected to the **Stripe Connect (Express Account)** onboarding flow.
- Stripe handles the collection of:
  - Personal details (Name, Email, Phone).
  - Bank account details for payouts.
  - Identity verification (KYC/Know Your Customer).
- Upon completion, Stripe redirects the Washer back to the Neighbourhood Wash dashboard. The platform securely captures and stores the Washer's `stripe_account_id` in their `profiles` record.
- The Washer is now fully activated and can accept bookings.

---

### **Phase 2: Marketplace Booking & Payment Flow**

#### **Step 2.1: Customer Places a Booking**

- A Customer selects a Washer, services (e.g., wash, dry, iron), and a time slot.
- The total price is calculated. The system then determines the appropriate platform fee based on the Washer's tier.

#### **Step 2.2: Tiered Platform Fee Calculation (Backend Logic)**

- Before creating the payment, the system checks the Washer's `successful_bookings_count` from the Supabase `profiles` table.
- **Tier 1**: If `successful_bookings_count < 150`, the platform fee is **5%** of the total booking price.
- **Tier 2**: If `successful_bookings_count >= 150`, the platform fee drops to **2%**.
- This calculated fee will be used in the `application_fee_amount`.

#### **Step 2.3: Customer Pays & Funds are Held (Escrow)**

- The Customer proceeds to payment using a **Stripe Payment Intent**.
- The backend creates the Payment Intent with the following critical parameters:

```ts
// Example Server-Side Logic (e.g., in a Next.js API route or Server Action)

// 1. Fetch washer and calculate fee
const washer = await getWasherProfile(washerId) // Fetch from Supabase
const bookingCount = washer.successful_bookings_count
const platformFeePercentage = bookingCount >= 150 ? 0.02 : 0.05
const totalAmountInPence = 2000 // e.g., £20.00
const applicationFeeInPence = Math.round(
  totalAmountInPence * platformFeePercentage
)

// 2. Create the Payment Intent
const paymentIntent = await stripe.paymentIntents.create({
  amount: totalAmountInPence,
  currency: 'gbp',
  payment_method_types: ['card'],
  capture_method: 'manual', // IMPORTANT: This places a hold on the funds
  application_fee_amount: applicationFeeInPence,
  transfer_data: {
    destination: washer.stripe_account_id, // The Washer's connected Stripe ID
  },
  metadata: {
    app: 'NeighbourhoodWash',
    washer_id: washer.id,
    customer_id: customer.id,
    booking_id: booking.id,
    platform_fee_percentage: platformFeePercentage * 100, // Store as 5 or 2
  },
})
```
