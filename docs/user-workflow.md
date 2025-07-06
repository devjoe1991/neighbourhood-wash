# User Workflow: Multi-Step Booking & Payment

This document outlines the detailed, step-by-step user journey for creating, customising, and paying for a laundry booking. The flow is designed to be intuitive, transparent, and secure, mirroring industry-standard service platforms.

---

### **Part 1: The User Dashboard**

1.  **Entry Point**: The user logs into their dashboard. The main view will feature a prominent call-to-action card or button labeled "Make a New Booking".
2.  **Navigation**: The user can also access this feature via a "New Booking" link in the main sidebar navigation.

### **Part 2: The Booking Funnel**

This is a multi-step process. The user can navigate between steps, and their selections are saved throughout the session. A progress indicator at the side of the screen shows the current step (e.g., 1. Schedule, 2. Services, 3. Details, 4. Payment).

#### **Step 1: Schedule Your Collection**

1.  **Calendar**: The user is presented with an interactive calendar to select a **collection date**.
2.  **Time Slot**: After selecting a date, they choose an estimated **collection time slot** (e.g., 9:00 AM - 12:00 PM, 1:00 PM - 4:00 PM).
3.  **Delivery Estimate**: The UI will show an _estimated_ delivery date and time (e.g., "Estimated delivery: Tomorrow, 5:00 PM - 8:00 PM").

#### **Step 2: Choose Your Services**

This is a dynamic step where the user builds their order and sees the price update in real-time.

1.  **Wash & Dry (by Weight)**:
    - The user selects a weight bracket for their standard laundry (e.g., Up to 6kg).
    - A link/icon will open a **"Weight Guide" modal**. This guide will provide helpful, real-world examples to help users estimate their laundry weight (e.g., "A 6kg load is roughly equivalent to 2 pairs of jeans, 5 t-shirts, underwear for a week, and 2 towels.").
2.  **Bulky Items**:
    - The user can add individual, fixed-price bulky items (e.g., "Double Duvet", "Pillows", "Bed Sheets Set").
3.  **Add-on Services**:
    - **Ironing**: The user can add an ironing service for a fixed fee or per-item cost.
    - **Stain Removal**: The user can tick a box for "Stain Removal Treatment". They will be prompted to upload images of the stained items in the next step.
4.  **Washing Products**:
    - A choice is presented: "I will supply my own washing products" or "Please use Washer's products".
    - Selecting the Washer's products adds a small, transparent fee to the total.
5.  **Live Price Summary**: A sticky component on the page shows an itemised list of all selected services and the running total cost.

#### **Step 3: Final Details**

1.  **Special Instructions**: A textarea allows the user to provide specific instructions for the Washer (e.g., "Please use non-bio detergent," "The blue shirt is delicate").
2.  **Upload Images**: If "Stain Removal" was selected, an upload interface appears, prompting the user to "Upload photos of any stains for your Washer."
3.  **Contact Information**: The user's name and phone number are pre-filled, with an option to edit.

#### **Step 4: Review & Pay**

1.  **Order Summary**: A final, clear summary of the entire booking is displayed: collection time, services, total cost.
2.  **Terms & Conditions**: The user must tick checkboxes to agree to:
    - The platform's Terms & Conditions.
    - The End-User Agreement between the User and Washer.
    - Acknowledge the **Cancellation Policy**: "I understand I cannot cancel this booking within 12 hours of the scheduled collection time without charge."
3.  **Payment**: A secure payment interface (Stripe placeholder) is presented for the user to enter their card details.
4.  **Confirmation**: Upon successful payment, the user is taken to a confirmation page. The booking status is now "Paid & Awaiting Assignment".

### **Part 3: Post-Booking & Assignment**

1.  **Assignment**: 12 hours before the scheduled collection time, the system runs its matching algorithm and assigns the booking to the best-fit Washer.
2.  **Notification**: Both the User and the assigned Washer are notified. The booking status updates to "Washer Assigned".
3.  **Communication**: The in-app chat between the User and their assigned Washer is now enabled on the booking details page in their respective dashboards.
