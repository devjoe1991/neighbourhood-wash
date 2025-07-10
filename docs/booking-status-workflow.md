# Booking Status & Availability Workflow

This document explains how our system makes new laundry jobs available to Washers.

### 1. The Goal: Making Jobs Available

When a customer books a laundry service, we need that job to immediately appear on the "Available Bookings" page for our verified Washers to accept.

### 2. The Old Way (And Why It Broke)

Previously, we used a fixed list of statuses (like `awaiting_assignment`) written directly into the code.

-   **The Problem:** This was inflexible. When we needed a new status (`pending_washer_assignment`), the database rules rejected it, causing errors. This is why jobs weren't showing up for your test washer.

### 3. The New, Better Way: A Flexible Status Table

To fix this and make the system better for the future, we introduced a dedicated `booking_statuses` table in the database.

-   **How it Works:** This table holds a list of all possible statuses a booking can have (e.g., 'Pending Washer', 'In Progress', 'Completed').
-   **The Big Advantage:** If we need to add, remove, or change a status in the future, we just update this table. No more code errors or complex migration issues. It’s clean and scalable.

### 4. The New Workflow (Step-by-Step)

Here’s the simple flow of how a job becomes available now:

1.  **Customer Books:** A customer completes and pays for a new booking.
2.  **Status Set:** The system creates the booking and automatically sets its status to `pending_washer_assignment`. This is now the default for all new jobs.
3.  **Job Appears:** The "Available Bookings" page for Washers is set up to look for any jobs with this exact status.
4.  **Washer Accepts:** The job instantly appears on the page, ready for any verified Washer to accept.

That's it. We've tidied up the codebase, fixed the issue, and made the whole system more robust for future growth.

### 5. The Security Guard: Row Level Security (RLS)

Just because a job is available doesn't mean *everyone* should see it. This is where Supabase's Row Level Security comes in. Think of it as a security guard for our database rows.

-   **The Hidden Problem:** Our old security rule was too strict. It said: "A Washer can only see a booking if their ID is already assigned to it." This meant that no one could see the unassigned jobs, because the `washer_id` field was empty.

-   **The Fix:** We added a new, smarter security policy. The new rule is: "If a user is an **approved washer**, they are allowed to see any booking that has the status `pending_washer_assignment`."

This final change ensures that only verified, active washers can see and accept new jobs, keeping the platform secure while making sure the system works as intended.

---

### 6. Future Changes: How to Ask for Updates

If you need to change the booking statuses in the future, you can give me a prompt like this. Just replace the details with what you need.

**Example Prompt for Cursor:**

> "Alright Bruv, I need to make some changes to the booking statuses.
>
> 1.  **Add a new status:** Please add a new status called `'on_hold'` with the description `'Booking is temporarily paused by admin'`.
> 2.  **Edit a status:** Please change the description for the `'disputed'` status to `'Booking is under review by customer support'`.
> 3.  **Remove a status:** Please remove the `'collection_in_progress'` status entirely.
>
> Please create a new Supabase migration file to apply these changes to the `booking_statuses` table." 