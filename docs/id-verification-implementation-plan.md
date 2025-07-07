# ID Verification System – Implementation Plan

This document outlines the development tasks required to integrate Stripe Identity into the Washer onboarding flow.

---

## **Phase 1: Backend Setup & Configuration (Manual)**

_This phase involves updating the necessary configurations in Stripe and Supabase._

### ☐ **Task 1.1: Enable Stripe Identity**

**Goal**: Activate the Stripe Identity product in your Stripe account.
**Your Steps**:

1.  Log in to your Stripe Dashboard.
2.  Navigate to **Settings** (gear icon).
3.  Under "Products," find and click on **Identity**.
4.  Follow the prompts to activate the product. You may need to customize branding (logo, colors) to match Neighbourhood Wash.

### ☐ **Task 1.2: Update Supabase Database Schema**

**Goal**: Add new columns to the `profiles` table to track verification status.
**Your Steps**:

1.  Go to your Supabase project's **SQL Editor**.
2.  Run the following SQL query to add the new columns to the `profiles` table:
    ```sql
    ALTER TABLE public.profiles
    ADD COLUMN id_verification_status TEXT DEFAULT 'unverified',
    ADD COLUMN stripe_verification_session_id TEXT;
    ```

### ☐ **Task 1.3: Add New Stripe Webhook Event**

**Goal**: Configure your webhook endpoint to listen for identity verification events.
**Your Steps**:

1.  In your Stripe Dashboard, go to **Developers > Webhooks**.
2.  Select your existing webhook endpoint for the Supabase function.
3.  Click **Update details**.
4.  In the "Events to listen to" section, click **+ Select events**.
5.  Search for and add the event: `identity.verification_session.verified`.
6.  Click **Update endpoint**.

---

## **Phase 2: Backend Logic Implementation (for Cursor)**

_This phase involves creating the server-side logic to handle the verification flow._

### ☐ **Task 2.1: Create Server Action for Verification Session**

**Goal**: Create a function to initiate a Stripe Identity session.
**Instructions for Cursor**:

1.  Open the file `lib/stripe/actions.ts`.
2.  Add a new async function named `createIdentityVerificationSession`.
3.  This function should use `stripe.identity.verificationSessions.create()` with the following parameters:
    - `type: 'document'`
    - `metadata: { user_id: user.id }` (to link the session to the Supabase user).
    - `return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?verification_return=true``
4.  The function should then redirect the user to the `url` provided in the Stripe session response.

### ☐ **Task 2.2: Update Webhook Handler**

**Goal**: Update the Supabase Edge Function to process successful verification events.
**Instructions for Cursor**:

1.  Open the file `supabase/functions/handle-stripe-webhooks/index.ts`.
2.  Add a new `case` to the `switch (event.type)` block to handle `identity.verification_session.verified`.
3.  Inside this case:
    - Parse the event object `event.data.object as Stripe.Identity.VerificationSession`.
    - Extract the `user_id` from the session's `metadata`.
    - Perform a Supabase admin query to update the `profiles` table. Set `id_verification_status` to `'verified'` and `stripe_verification_session_id` to the session's `id` where the `id` matches the `user_id`.

---

## **Phase 3: Frontend Integration (for Cursor)**

_This phase involves updating the Washer dashboard to include the new verification step._

### ☐ **Task 3.1: Modify `WasherActivation.tsx` Component**

**Goal**: Integrate the ID verification step into the onboarding UI flow.
**Instructions for Cursor**:

1.  Open the component file `components/dashboard/WasherActivation.tsx`.
2.  Update the `fetchProfile` function to also retrieve the new `id_verification_status` column.
3.  Modify the conditional rendering logic to insert the new step. The flow should now be:
    - **Pay Fee** -> **Verify ID** -> **Connect Bank Account**.
4.  **Add a new state**:
    - When `profile.onboarding_fee_paid === true` and `profile.id_verification_status === 'unverified'`:
      - Display a new `Card` with the title "Step 2: Verify Your Identity".
      - Include a `Button` with the text "Start Verification".
      - The button's `formAction` or `onClick` handler should call the `createIdentityVerificationSession` server action.
5.  **Update existing states**:
    - The "Connect with Stripe" card should now only appear when `profile.id_verification_status === 'verified'` and `profile.stripe_account_id === null`.
    - Add a new state to handle `profile.id_verification_status === 'pending'`, which should display a message like "Verification in progress. We'll notify you once complete. This may take a few minutes."
