# Platform Workflow: User, Washer, & Admin Dashboards

This document outlines the complete operational workflow of the Neighbourhood Wash platform, detailing the distinct roles, features, and interactions between the User, Washer, and Admin dashboards.

---

## 1. The Three Core Roles

The platform is built around three distinct user roles, each with a tailored dashboard to manage their specific responsibilities.

- **The User:** The customer who needs laundry services. Their primary goal is to easily book, pay for, and track their laundry service.
- **The Washer:** The service provider. Their goal is to manage their availability, fulfill bookings efficiently, and maintain a high-quality reputation.
- **The Admin:** The platform operator. Their goal is to ensure platform quality, manage users, provide support, and oversee operations.

---

## 2. The Dashboard Features & Lifecycle

The entire platform revolves around the lifecycle of a **Booking**. Here’s how each dashboard interacts with it.

### **Part A: Setup & Onboarding**

This happens before a booking can even be made.

- **Admin Dashboard:**

  - **Washer Application Management:** The Admin's most critical role is to vet new washers. They view a list of applicants who have signed up with the 'washer' role.
  - **Verification:** The Admin can review a washer's application details and choose to **Approve** or **Reject** them. This action updates the `washer_status` in the `profiles` table. Only 'approved' washers can be assigned bookings.

- **Washer Dashboard:**
  - **Service Configuration:** Once approved, a Washer must set up their profile to be eligible for bookings.
  - **Availability:** They set their weekly working hours via a calendar interface.
  - **Services Offered:** They tick checkboxes for the services they provide (e.g., Ironing, Stain Removal).
  - **Service Area:** They define their operational radius (e.g., within 3 miles).
  - _Interlink:_ This configuration data is saved to the Washer's record in the `profiles` table and is used by the system's matching algorithm.

### **Part B: The Booking & Payment Funnel**

This is the core process initiated by the User.

- **User Dashboard:**
  - **New Booking Creation:** The User starts the process via the "New Booking" page.
  - **Step 1: Scheduling:** Selects a collection date and time slot.
  - **Step 2: Service Selection:** Chooses services by weight, adds special items (duvets), and selects add-ons (stain removal, ironing). A "Weight Guide" helps them choose correctly. They also specify if they will provide their own washing products.
  - **Step 3: Details:** Adds special instructions and uploads images for any items needing stain removal.
  - **Step 4: Payment:** Reviews the final, itemised price, agrees to the T&Cs and the 12-hour cancellation policy, and pays upfront (via Stripe placeholder).
  - _Interlink:_ Upon successful payment, a new record is created in the `bookings` table with a status of `paid_awaiting_assignment`. The user is redirected to a confirmation page.

### **Part C: Matching & Service Execution**

This is where the platform connects the User and Washer.

- **System (Backend Logic):**

  - **Matching Algorithm:** **12 hours before** the scheduled collection time, the system automatically runs a matching algorithm.
  - It queries all **approved** Washers from the `profiles` table whose availability, services, and service area match the booking's requirements.
  - It assigns the booking to the best-matched Washer and updates the booking record with the `washer_id` and changes the status to `washer_assigned`.

- **User Dashboard:**

  - **Status Tracking:** The user can view their booking in the "My Bookings" list. The status badge will update from "Awaiting Assignment" to "Washer Assigned".
  - **Real-time Updates:** On the booking detail page, the user sees the assigned Washer's name appear.
  - **PIN Codes:** The user can now see their unique 4-digit **Collection PIN** and **Delivery PIN**.

- **Washer Dashboard:**
  - **New Booking Alert:** The assigned Washer receives a notification and the new booking appears in their "My Bookings" list.
  - **Booking Details:** The Washer can view all booking details, including the user's special instructions and any uploaded stain images.
  - **PIN Verification (Collection):** At the time of collection, the Washer asks the User for their Collection PIN. The Washer inputs this PIN into their dashboard.
  - _Interlink:_ The Washer's input triggers a server action that validates the PIN. If correct, the `bookings` table is updated: `collection_verified_at` is set, and the status changes to `in_progress`. The User sees this status change in real-time on their detail page.

### **Part D: Service Completion & Feedback Loop**

This final phase closes the loop and builds platform trust.

- **Washer Dashboard:**

  - **PIN Verification (Delivery):** When the laundry is returned, the Washer asks the User for their Delivery PIN and inputs it into their dashboard.
  - _Interlink:_ This action validates the final PIN. The `bookings` table is updated: `delivery_verified_at` is set, and the status changes to `completed`.

- **User Dashboard:**

  - **Booking Management:** The user can cancel a booking, but the server action will fail if it's within the 12-hour window.
  - **Post-Booking Prompts:** After a booking status changes to `completed`, a new prompt appears on the user's main dashboard.
  - **Leave a Review:** The user can submit a star rating and a comment.
  - _Interlink:_ This creates a new entry in the `reviews` table, linked to the `booking_id`, `user_id`, and `washer_id`. This rating will affect the Washer's overall score.
  - **Add to Favourites:** The user can add the Washer to their favourites list.
  - _Interlink:_ This creates a new entry in the `favourite_washers` table, linking the `user_id` and `washer_id`.

- **Admin Dashboard:**
  - **Oversight:** The Admin can view all bookings, see their statuses, and investigate any issues. They can also view all reviews left on the platform to monitor washer quality.
