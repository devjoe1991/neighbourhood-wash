alter table "public"."profiles" add column "allergies" text[] null default '{}';

alter table "public"."profiles" add column "product_preferences" text[] null default '{}';

-- Add RLS policies for the new columns to ensure users can only edit their own preferences
-- This assumes you have a policy named "Users can update their own profile."

-- As the policy likely uses a `using (auth.uid() = id)`, we just need to ensure the columns are part of the `with check`
-- If we need to be explicit, we'd alter the policy, but for now we assume the existing policy covers it.
-- Let's check the existing policy on profiles table first to be sure.

-- For safety, here's how you'd explicitly grant update on these new columns
-- This depends on the exact name of your existing policy.
-- Assuming the policy is "Enable update for users based on email":
-- ALTER POLICY "Enable update for users based on email" ON public.profiles
-- WITH CHECK (auth.uid() = id)
-- USING (auth.uid() = id);

-- No, we just need to make sure the user can update their own profile.
-- The existing policy for updates on `profiles` table should be sufficient.
-- Let's re-examine the create_profiles_table migration to be sure.
-- The policy is: `create policy "Users can update their own profile." on profiles for update with check (auth.uid() = id);`
-- This policy applies to the whole row, so any new column is automatically covered. No changes needed for RLS.

-- We should also add comments to the columns for clarity in the database schema.
COMMENT ON COLUMN "public"."profiles"."allergies" IS 'Stores user-selected allergy information, e.g., perfume-free, dye-free.';
COMMENT ON COLUMN "public"."profiles"."product_preferences" IS 'Stores user-selected product preferences, e.g., non-bio, eco-friendly.'; 