-- Add the delivery_method column to the bookings table
alter table "public"."bookings"
add column "delivery_method" text not null default 'collection';

-- Add a comment for clarity
comment on column "public"."bookings"."delivery_method" is 'The method of delivery for the laundry, e.g., collection or drop-off.';

-- We should also add a check constraint to ensure only valid values are inserted
alter table "public"."bookings"
add constraint "bookings_delivery_method_check"
check (delivery_method in ('collection', 'drop-off'));

-- It's also good practice to ensure RLS policies are considered.
-- The existing policies on `bookings` should cover this new column implicitly,
-- as they are typically row-based. For example, a user can insert a booking if they are authenticated.
-- The policy `create policy "Users can create their own bookings." on bookings for insert with check (auth.uid() = user_id);`
-- allows a user to insert a row, and the new column is part of that row.
-- So no changes are needed for RLS. 