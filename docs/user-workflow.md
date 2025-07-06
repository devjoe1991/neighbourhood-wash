# User Workflow: Multi-Step Booking & Payment

This document outlines the detailed, step-by-step user journey for creating, customising, and paying for a laundry booking. The flow is designed to be intuitive, transparent, and secure, mirroring industry-standard service platforms.

---

### **Part 1: The User Dashboard**

1.  **Entry Point**: The user logs into their dashboard. The main view will feature a prominent call-to-action card or button labeled "Make a New Booking".
2.  **Navigation**: The user can also access this feature via a "New Booking" link in the main sidebar navigation.

### **Part 2: The Booking Funnel**

This is a multi-step process. A progress indicator at the side of the screen shows the current step (e.g., 1. Schedule, 2. Services, 3. Details, 4. Payment).

#### **Step 1: Schedule Your Collection**

1.  **Calendar**: The user is presented with an interactive calendar to select a **collection date**.
2.  **Time Slot**: After selecting a date, they choose an estimated **collection time slot** (e.g., 9:00 AM - 12:00 PM).
3.  **Delivery Estimate**: The UI shows an _estimated_ delivery date and time (e.g., "Estimated delivery: Tomorrow, 5:00 PM - 8:00 PM").

#### **Step 2: Choose Your Services**

This is a dynamic step where the user builds their order and sees the price update in real-time in a sticky summary component.

1.  **Wash & Dry (by Weight)**:
    - The user selects a weight bracket for their standard laundry (e.g., Up to 6kg).
    - A link/icon opens a **"Weight Guide" modal** providing helpful, real-world examples to help users estimate weight (e.g., "A 6kg load is roughly equivalent to 2 pairs of jeans, 5 t-shirts, underwear for a week, and 2 towels.").
2.  **Bulky Items**:
    - The user can add individual, fixed-price bulky items (e.g., "Double Duvet", "Bed Sheets Set").
3.  **Add-on Services**:
    - **Ironing**: The user can add an ironing service.
    - **Stain Removal**: The user can tick a box for "Stain Removal Treatment".
4.  **Washing Products**:
    - A choice is presented: "I will supply my own washing products" or "Please use Washer's products". Selecting the Washer's products adds a small, transparent fee.

#### **Step 3: Final Details**

1.  **Special Instructions**: A textarea allows the user to provide specific instructions for the Washer.
2.  **Upload Images**: If "Stain Removal" was selected, an upload interface appears, prompting the user to "Upload photos of any stains for your Washer."
3.  **Contact Information**: The user's contact details are pre-filled, with an option to edit.

#### **Step 4: Review & Pay**

1.  **Order Summary**: A final, clear summary of the entire booking is displayed.
2.  **Terms & Conditions**: The user must tick checkboxes to agree to:
    - The platform's Terms & Conditions.
    - The End-User Agreement.
    - Acknowledge the **Cancellation Policy**: "I understand I cannot cancel this booking within 12 hours of the scheduled collection time without charge."
3.  **Payment**: A secure payment interface is presented.
4.  **Confirmation**: Upon successful payment, the user is taken to a confirmation page. The booking status is now "Paid & Awaiting Assignment".

### **Part 3: Post-Booking Lifecycle**

1.  **Assignment**: 12 hours before collection, the system assigns the booking to the best-fit Washer. Both parties are notified.
2.  **Communication**: The in-app chat between the User and their assigned Washer is now enabled.
3.  **PIN Verification**: On the day of service, the User and Washer use the secure 4-digit PINs on the booking detail page to confirm the collection and delivery handovers.
4.  **Completion**: Once the final handover is PIN-verified, the booking is marked as "Completed".
5.  **Post-Booking Actions**: On their next visit to the dashboard, the user will see a prompt:
    - "How was your service with [Washer's Name]?" with a button to "Leave a Review".
    - A secondary prompt: "Enjoyed the service? Add [Washer's Name] to your Favourites for future requests."
