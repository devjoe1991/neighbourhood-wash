# Stripe Connect & Payment Implementation Plan

This document provides a step-by-step guide to integrate Stripe Connect into the Neighbourhood Wash application. Follow each task in order to ensure a smooth setup.

---

## **Phase 1: Backend Setup & Configuration**

_This phase involves setting up your Stripe and Supabase environments. These are manual steps for you, the founder, to complete._

### ☐ **Task 1.1: Set Up Your Stripe Account Structure**

**Goal:** Create the foundational Stripe accounts.

**Your Steps:**

1.  **Log in to your main Stripe account** (this will be "Techpreneur Joe"). If you don't have one, create it now at [dashboard.stripe.com](https://dashboard.stripe.com).
2.  **Activate your account:** Complete the business details for "Techpreneur Joe" to be able to process live payments.
3.  **Create the Connected Account:**
    - In your Stripe Dashboard, go to **Connect** > **Accounts**.
    - Click **+ New**.
    - For "Type", select **Express** (as this provides a Stripe-hosted onboarding flow).
    - For "Country", select **United Kingdom**.
    - Click **Create account**.
    - You will now have a new account with an ID like `acct_...`. This is the Stripe account for **Neighbourhood Wash**. You don't need to complete its details manually; Washers will do this.
    - **Important:** Keep this `acct_...` ID handy, but it's not the one you'll use for API keys. Your API keys will always come from your main "Techpreneur Joe" account.

### ☐ **Task 1.2: Configure Stripe API Keys in Next.js**

**Goal:** Securely store your Stripe API keys in your application's environment variables.

**Your Steps:**

1.  In your Stripe Dashboard (for "Techpreneur Joe"), go to **Developers** > **API keys**.
2.  You will see **Publishable key** (starts with `pk_test_...`) and **Secret key** (starts with `sk_test_...`).
3.  In your Next.js project, open the `.env.local` file (create it if it doesn't exist).
4.  Add the following lines, pasting your keys from the Stripe dashboard:
    ```
    # .env.local
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY
    STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY
    ```
5.  **Restart your Next.js development server** for the changes to take effect.

### ☐ **Task 1.3: Update Supabase Database Schema**

**Goal:** Add the necessary tables and columns to your Supabase database to store Stripe-related information.

**Your Steps:**

1.  Go to your Supabase project dashboard.
2.  Navigate to the **SQL Editor** and click **+ New query**.
3.  **Run the first query** to update the `profiles` table. This adds columns to track a Washer's payment status.
    ```sql
    -- Query 1: Update Profiles Table
    ALTER TABLE public.profiles
    ADD COLUMN onboarding_fee_paid BOOLEAN DEFAULT false,
    ADD COLUMN stripe_account_id TEXT,
    ADD COLUMN stripe_account_status TEXT DEFAULT 'restricted',
    ADD COLUMN successful_bookings_count INTEGER DEFAULT 0;
    ```
4.  **Run the second query** to create a new `transactions` table. This will give you a clear audit trail of all money movements.
    ```sql
    -- Query 2: Create Transactions Table
    CREATE TABLE public.transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id),
        booking_id UUID,
        stripe_payment_intent_id TEXT,
        amount_in_pence INTEGER NOT NULL,
        currency TEXT NOT NULL,
        transaction_type TEXT NOT NULL,
        status TEXT NOT NULL,
        metadata JSONB,
        created_at TIMESTAMPTZ DEFAULT now()
    );
    ```

---

## **Phase 2: Washer Onboarding Flow**

_This phase involves creating the UI and backend logic for a new Washer to pay their fee and connect their bank account._

### ☐ **Task 2.1: Create Stripe Product for Onboarding Fee**

**Goal:** Create a representation of the onboarding fee inside Stripe so you can charge for it.

**Your Steps:**

1.  In your Stripe Dashboard, go to the **Products** tab.
2.  Click **+ Add product**.
3.  **Name:** `Neighbourhood Wash - Washer Onboarding`
4.  **Pricing:**
    - Select **Standard pricing**.
    - Price: `14.99`
    - Currency: **GBP**
    - Select **One time**.
5.  Click **Save product**.
6.  On the product page, you will see a **Price ID** (looks like `price_...`). Copy this ID.
7.  Add this ID to your `.env.local` file:
    ```
    # .env.local
    STRIPE_WASHER_ONBOARDING_PRICE_ID=price_YOUR_PRICE_ID
    ```

### ☐ **Task 2.2: Implement Backend Logic for Onboarding Fee**

**Goal (for Cursor):** Create a new Server Action that generates a Stripe Checkout session for the onboarding fee.

**Instructions for Cursor:**

1.  Install the official Stripe Node.js library: `pnpm install stripe`.
2.  Create a new file: `lib/stripe/actions.ts`.
3.  Inside this file, create an async function named `createOnboardingFeeCheckoutSession`.
4.  This function should:
    - Take the Washer's `userId` as an argument.
    - Initialize the Stripe library using the `STRIPE_SECRET_KEY`.
    - Use `stripe.checkout.sessions.create()` to build a session.
    - **Parameters for the session:**
      - `mode: 'payment'`
      - `line_items`: Use the `STRIPE_WASHER_ONBOARDING_PRICE_ID` from your environment variables.
      - `success_url`: `http://localhost:3000/dashboard?payment_success=true`
      - `cancel_url`: `http://localhost:3000/dashboard?payment_cancelled=true`
      - `client_reference_id`: The Washer's `userId`. This is **crucial** for identifying the user in the webhook later.
    - Return the `url` from the created session object.

### ☐ **Task 2.3: Implement Backend Logic for Connect Onboarding**

**Goal (for Cursor):** Create a Server Action that generates a Stripe Connect account link for the Washer.

**Instructions for Cursor:**

1.  In the same `lib/stripe/actions.ts` file, create an async function named `createStripeConnectAccountLink`.
2.  This function should take the Washer's `stripe_account_id` as an argument.
3.  It should use `stripe.accountLinks.create()` with these parameters:
    - `account`: the Washer's `stripe_account_id`.
    - `refresh_url`: `http://localhost:3000/dashboard/become-washer`
    - `return_url`: `http://localhost:3000/dashboard?connect_success=true`
    - `type: 'account_onboarding'`
4.  Return the `url` from the created account link object.

### ☐ **Task 2.4: Build the Frontend Onboarding Component**

**Goal (for Cursor):** Create the conditional UI in the Washer's dashboard that guides them through the payment and connection steps.

**Instructions for Cursor:**

1.  Create a new component file: `components/dashboard/WasherActivation.tsx`.
2.  This component must be a Client Component (`'use client'`).
3.  It should fetch the current user's profile from Supabase to get `onboarding_fee_paid`, `stripe_account_id`, and `stripe_account_status`.
4.  **Implement the conditional logic:**
    - **If `onboarding_fee_paid === false`**:
      - Display a Shadcn/ui `Card` component.
      - Show the text: "~~£49.99~~ **£14.99**".
      - Add a button "Become a Verified Washer". On click, it should call the `createOnboardingFeeCheckoutSession` server action and redirect the user to the returned URL.
    - **If `onboarding_fee_paid === true` AND `stripe_account_id` is null**:
      - Display a `Card` with the message: "Payment successful! Connect your bank to start receiving payouts."
      - Add a button "Connect with Stripe". On click, it should call a new server action that first creates a Stripe Connect Account (`stripe.accounts.create`) for the user, saves the returned `acct_...` ID to their Supabase `profiles` table, and _then_ calls `createStripeConnectAccountLink` to get the redirect URL.
    - **If `stripe_account_status` is not `'enabled'`**:
      - Display a `Card` with a message like: "Your Stripe account is pending verification. This can take a few minutes. We'll notify you when it's ready."
    - **If all conditions are met**:
      - The component should render `null`.
5.  Place this `<WasherActivation />` component prominently on the Washer's main dashboard page (`app/dashboard/page.tsx`, conditionally rendered if the user's role is 'washer').

---

## **Phase 3: Handling Stripe Webhooks**

_This phase creates the crucial backend endpoint that listens to events from Stripe to keep your database in sync._

### ☐ **Task 3.1: Create & Implement the Webhook Function**

**Goal (for Cursor):** Create a Supabase Edge Function to handle incoming webhooks from Stripe.

**Instructions for Cursor:**

1.  Using the Supabase CLI, create a new Edge Function: `supabase functions new handle-stripe-webhooks`.
2.  In the generated `index.ts` file, write the function logic.
3.  It must handle a `POST` request.
4.  **Implement the logic to handle these events inside a `switch (event.type)` block:**
    - `case 'checkout.session.completed'`:
      - Get the `userId` from `event.data.object.client_reference_id`.
      - Update the corresponding user's row in the `profiles` table to set `onboarding_fee_paid = true`.
    - `case 'account.updated'`:
      - Get the Stripe account ID from `event.data.object.id`.
      - Find the user in your `profiles` table where `stripe_account_id` matches.
      - Update that user's `stripe_account_status` with the new status from the event.
    - `case 'payment_intent.succeeded'`:
      - (This will be used in Phase 4) Get the `booking_id` from `event.data.object.metadata`.
      - Find the associated Washer and increment their `successful_bookings_count` by 1.
      - Create a new record in your `transactions` table to log this payment.
5.  Ensure you return a `200 OK` response to Stripe to acknowledge receipt of the webhook.

### ☐ **Task 3.2: Deploy and Configure the Webhook Endpoint**

**Goal:** Deploy the function and tell Stripe to send events to it.

**Your Steps:**

1.  Deploy the function to Supabase: `supabase functions deploy handle-stripe-webhooks --project-ref <your-project-ref>`.
2.  Once deployed, you will get a URL. Copy it.
3.  In your Stripe Dashboard, go to **Developers > Webhooks**.
4.  Click **+ Add endpoint**.
5.  **Endpoint URL:** Paste the Supabase function URL.
6.  **Events to listen to:** Click "Select events" and add:
    - `checkout.session.completed`
    - `account.updated`
    - `payment_intent.succeeded`
7.  Click **Add endpoint**.
8.  You will now see a **Signing secret** (starts with `whsec_...`). Copy this.
9.  Add it to your `.env.local` file:
    ```
    # .env.local
    STRIPE_WEBHOOK_SIGNING_SECRET=whsec_YOUR_SIGNING_SECRET
    ```
10. **Final step for Cursor:** Update the webhook function to use this secret to verify that incoming requests are genuinely from Stripe. Use `stripe.webhooks.constructEvent()` at the beginning of the function.

---

_Phases 4 (Marketplace Payments) and 5 (Admin UI) can be tackled after the onboarding flow is fully tested and functional._
