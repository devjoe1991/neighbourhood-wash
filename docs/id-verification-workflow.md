# Neighbourhood Wash – ID Verification Workflow

## 🧩 Overview

To enhance platform trust and safety, a mandatory ID verification step is being introduced into the Washer onboarding process. This workflow leverages **Stripe Identity**, a secure and automated solution, to verify a Washer's identity before they can offer services on the platform. This process is designed to be seamless, secure, and integrated directly into the existing onboarding flow.

---

## 🔑 Key Technology

- **Verification Service**: **Stripe Identity** will be used to collect and verify identity documents and selfie data.
- **Integration**: This will be linked with the existing **Stripe Connect** setup and Supabase backend.

---

## 🔁 End-to-End User & System Flow

### 1. **Initiating Verification (Washer's Journey)**

The ID verification step occurs after a new Washer has paid their onboarding fee but before they connect their bank account.

1.  **Prompt for Verification**: After the `£14.99` onboarding fee is successfully paid, the Washer's dashboard displays the next step: "Verify Your Identity."
2.  **Start Verification**: The Washer clicks a "Start Verification" button within the Neighbourhood Wash application.
3.  **Redirection to Stripe**: The application securely redirects the Washer to a dedicated, Stripe-hosted verification page.
4.  **Stripe's Secure Flow**: On the Stripe page, the Washer is guided through a multi-step process:
    - Consent to data collection and verification.
    - Select their country and ID document type (e.g., Driver's License, Passport).
    - Use their device's camera to capture a clear image of the front and back of their ID.
    - Use their device's camera to take a live selfie. Stripe's AI will perform a biometric comparison between the selfie and the ID photo.
5.  **Submission & Return**: Once all steps are complete, the Washer submits the verification. They are then automatically redirected back to the Neighbourhood Wash dashboard.
6.  **Pending Status**: The dashboard now shows a "Verification in progress" status, informing the Washer that the process may take a few minutes to complete.

### 2. **Backend Processing (System's Journey)**

The system automates the session creation and status updates using webhooks.

1.  **Create Verification Session**: When the Washer clicks "Start Verification," a server action in the Next.js backend makes an API call to `stripe.identity.verificationSessions.create()`.
    - This request includes the user's `id` in the metadata to link the session back to their profile.
    - It also includes the `success_url` and `cancel_url` for redirection.
2.  **Listen for Webhook**: The `handle-stripe-webhooks` Supabase Edge Function is configured to listen for the `identity.verification_session.verified` event.
3.  **Update Database**: When Stripe successfully verifies the documents and the webhook is received, the system performs the following actions:
    - It retrieves the `user_id` from the webhook event's metadata.
    - It updates the user's record in the `profiles` table, setting `id_verification_status` from `'pending'` to `'verified'`.
    - The Washer is now eligible for the final onboarding step: connecting their Stripe Express account.

### 3. **Admin Review Process**

For most cases, verification is automated. Manual reviews are handled directly within the Stripe Dashboard, requiring no custom development.

- **Automated Verification**: Stripe's AI handles the majority of verifications in minutes.
- **Manual Review**: If a verification requires manual review (e.g., blurry image, potential mismatch), Stripe flags it. An administrator from Neighbourhood Wash can log in to the Stripe Dashboard, navigate to the Identity section, view the submitted documents securely, and manually approve or reject the verification.

### 4. **Database Schema Changes**

The `profiles` table will be updated to track the verification status.

| Column Name                      | Data Type | Description                                                                     |
| :------------------------------- | :-------- | :------------------------------------------------------------------------------ |
| `id_verification_status`         | `TEXT`    | `DEFAULT 'unverified'`. Stores the status: `unverified`, `pending`, `verified`. |
| `stripe_verification_session_id` | `TEXT`    | `Nullable`. Stores the `vs_...` ID from Stripe for auditing and reference.      |
