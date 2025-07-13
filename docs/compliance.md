# Prompt for AI Legal Counsel: Generating Compliance Documents for "Neighbourhood Wash" (UK)

## 1. Introduction: The Platform

**Neighbourhood Wash** is a UK-based, peer-to-peer community marketplace operating via a web application. It connects two main user groups:

- **Users**: Individuals, families, students, and professionals who need their laundry done.
- **Washers**: Vetted local individuals who use their own domestic washing machines and dryers to provide laundry services for profit.

The platform's core function is to facilitate the entire laundry service transaction: discovery, booking, payment, secure handover, communication, and reviews. It is a "gig economy" platform for hyper-local laundry services.

**Business Model**: The platform earns revenue through two primary streams:

1.  **Service Commission**: A 15% commission is deducted from every booking payment made to a Washer.
2.  **Payout Fee**: A fixed £2.50 fee is charged to Washers for each payout they request from their earnings wallet.

## 2. Core Workflows & User Journeys

Understanding these workflows is critical to drafting accurate terms that cover liability, responsibility, and user obligations at each stage.

### 2.1. Onboarding & Verification

- **User Registration**: Simple sign-up with email/password or Google OAuth. Users provide their name, contact details, and address (for locating nearby Washers). They must agree to the main Terms of Service and Privacy Policy upon creation.
- **Washer Registration & Vetting**:
  1.  **Initial Interest**: A prospective Washer signs up, expressing interest. They may be asked for their postcode to gauge area demand.
  2.  **Application**: They submit a detailed application, including personal information, address, and details about their laundry equipment.
  3.  **ID & Address Verification**: The platform will require robust ID and address verification (the specifics of the third-party service need to be integrated, but the legal framework must assume this happens). This is a critical trust and safety feature.
  4.  **Stripe Connect Onboarding**: To receive payments, all Washers **must** create a Stripe Connect Express account, managed through the platform. This means they are subject to Stripe's own terms and conditions, which must be clearly communicated.
  5.  **Profile Activation**: Once vetted and approved, their profile becomes visible to Users.

### 2.2. The Booking Lifecycle

1.  **Discovery**: A User searches for Washers near their location.
2.  **Booking Creation**:
    - The User selects a Washer, chooses services (e.g., wash, dry, iron), and selects an available time slot.
    - **CRITICAL RULE**: The platform **prohibits bookings from being made for time slots after 8:00 PM**. This is to prevent noise complaints and anti-social behaviour associated with late-night operation of domestic appliances in residential areas. Users must be made aware of this restriction during the booking process.
    - The User adds special instructions (e.g., allergies, detergent preferences).
    - The User enters payment details (processed via Stripe). Payment is authorised at this point.
3.  **User Agreement at Booking**: Before confirming payment, the User must explicitly agree to several key points:
    - Acknowledgement that **Washers are independent contractors**, not employees of Neighbourhood Wash. The platform is a facilitator.
    - Agreement on the **limitation of liability** for damaged or lost items. A clear policy on compensation or claims process is needed.
    - Acceptance of the platform's **cancellation and refund policy**.
    - Confirmation they understand and will use the **PIN verification system** for handovers.
4.  **The Handover (Drop-off)**:
    - A unique **4-digit Drop-off PIN** is generated for the booking.
    - The User brings their laundry to the Washer.
    - The Washer must enter the User's Drop-off PIN into their dashboard to confirm they have received the items. This action is timestamped and forms a **digital chain of custody**.
5.  **Service Period**:
    - The Washer completes the laundry service as per the booking details.
    - Users and Washers can communicate in real-time via an in-app chat feature for updates. All communication is stored.
6.  **The Handover (Pick-up)**:
    - A second unique **4-digit Pick-up PIN** is generated.
    - The User arrives to collect the clean laundry.
    - The User provides the Pick-up PIN to the Washer, who enters it to confirm the service is complete and the items have been returned. This finalises the digital chain of custody.
7.  **Completion & Review**:
    - Once the Pick-up PIN is verified, the User's payment is captured.
    - Both parties are prompted to leave a review and rating.

### 2.3. Financials & Payouts

- **Payments**: All payments are processed securely through Stripe. The platform does not store full credit card details.
- **Washer Earnings**: The payment (minus the 15% commission) is credited to the Washer's platform wallet.
- **Payouts**: Washers can request a payout of their wallet balance to their linked Stripe account at any time. Each payout incurs a £2.50 processing fee.

## 3. Data & Privacy Considerations

The platform collects and processes significant personal and sensitive data. The Privacy Policy must be comprehensive and GDPR-compliant.

- **Personal Identifiable Information (PII)**: Names, email addresses, phone numbers, physical addresses for both Users and Washers.
- **Financial Data**: Transaction history. Washers' bank details are managed via Stripe Connect.
- **Location Data**: User and Washer addresses are used for the core "nearby" search functionality.
- **User-Generated Content**: Reviews, ratings, profile descriptions, and chat messages.
- **Usage Data**: Booking history, platform interaction analytics.

## 4. Required Legal & Compliance Documents

Based on the above, please draft the following documents, tailored for UK law and the specific nature of this peer-to-peer service marketplace.

**Prompt for AI:**

"Please generate a full suite of UK-compliant legal documents for a new web platform called 'Neighbourhood Wash'. The platform is a peer-to-peer marketplace connecting people who need laundry services ('Users') with locals who do the washing ('Washers').

**Key characteristics to incorporate**:

- Washers are explicitly **independent contractors**, not employees.
- The platform facilitates bookings and payments but is not the service provider.
- A strict **8:00 PM cut-off for booking slots** is enforced to prevent noise disturbances.
- A **dual PIN system** (one for drop-off, one for pick-up) creates a digital chain of custody for each laundry load.
- The platform charges a **15% commission** on all transactions and a **£2.50 fee for washer payouts**.
- All payments and payouts are handled via **Stripe and Stripe Connect**.

**Please draft the following documents:**

1.  **Terms of Service (for all users)**: This should be the master agreement. It needs to include:

    - Clear definitions of 'User', 'Washer', 'Service', 'Platform'.
    - The scope of the platform's services (facilitator role).
    - User and Washer registration requirements (including ID verification for Washers).
    - The full booking process, explicitly mentioning the 8 PM rule and the PIN system.
    - Payment, commission, and payout fee structures.
    - Acceptable Use Policy: Prohibiting illegal activities, harassment, and misuse of the platform.
    - **Community Guidelines**: Rules regarding respectful communication, hygiene standards for laundry, and on-time drop-offs/pick-ups.
    - **Liability Clause**: A carefully worded clause limiting the platform's liability for damages to clothing, missed deadlines, or disputes between Users and Washers. Define the platform's role in dispute resolution (e.g., facilitator, not arbiter).
    - Intellectual Property clause for platform content and user-generated content.
    - Termination clause (how users can close their accounts and how the platform can suspend users).
    - Governing law (England and Wales).

2.  **Privacy Policy (GDPR Compliant)**:

    - What data is collected (PII, location, financial, usage, communications).
    - Why it's collected (purpose limitation - e.g., location for search, payment data for transactions).
    - How it's stored and secured (mentioning partners like Supabase and Stripe).
    - Data sharing: Who it's shared with (e.g., between a User and their chosen Washer for a booking, with Stripe for payment).
    - User rights under GDPR (access, rectification, erasure, etc.).
    - Use of cookies and other tracking technologies.
    - Data retention periods.

3.  **Washer Agreement**: This could be a distinct section within the main Terms of Service or a separate document that Washers must agree to during onboarding. It should detail their specific responsibilities and rights:

    - Reinforcement of their status as **independent contractors**.
    - Service Level Expectations (quality of work, timeliness, communication).
    - Obligation to use safe, clean equipment and appropriate cleaning products.
    - Responsibility for reporting income for tax purposes.
    - **Clear statement that they are responsible for obtaining their own public liability or other relevant business insurance, as the platform does not provide this cover.**
    - Agreement to the commission and payout fee structure.
    - Acknowledgement of the Stripe Connected Account Agreement.

4.  **Dispute Resolution & Claims Policy**: A clear policy outlining the step-by-step process for a User to follow if their items are lost or damaged.

    - Initial requirement: direct communication between User and Washer.
    - How to escalate a dispute to the platform.
    - Evidence required (e.g., photos, description of items).
    - The platform's role in mediation.
    - Clear statement on the limits of compensation, if any, offered by the platform.

5.  **Cancellation & Refund Policy**:
    - Timeframes for users to cancel and receive a full or partial refund.
    - Conditions under which a Washer can cancel a booking.
    - Process for issuing refunds.

Ensure all documents are written in clear, accessible language while remaining legally robust."
