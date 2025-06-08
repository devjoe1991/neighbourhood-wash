CREATE TABLE public.washer_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Application Data
    phone_number TEXT NOT NULL,
    service_address TEXT NOT NULL,
    service_offerings TEXT[] NOT NULL,
    offers_collection BOOLEAN DEFAULT false,
    collection_radius NUMERIC,
    collection_fee NUMERIC,
    equipment_details TEXT NOT NULL,
    washer_bio TEXT NOT NULL,

    -- Application Status
    status TEXT NOT NULL DEFAULT 'pending_verification', -- e.g., pending_verification, approved, rejected

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    CONSTRAINT unique_pending_application UNIQUE (user_id, status) WHERE (status = 'pending_verification')
);

ALTER TABLE public.washer_applications ENABLE ROW LEVEL SECURITY;

-- Policies for washer_applications
CREATE POLICY "Users can insert their own application"
ON public.washer_applications
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own applications"
ON public.washer_applications
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all applications"
ON public.washer_applications
FOR ALL USING (
  (get_my_claim('user_role'::text)) = '"admin"'::jsonb
);

COMMENT ON TABLE public.washer_applications IS 'Stores detailed applications submitted by users wishing to become Washers.';
COMMENT ON COLUMN public.washer_applications.status IS 'The current status of the application, e.g., pending_verification, approved, rejected.';
COMMENT ON CONSTRAINT unique_pending_application ON public.washer_applications IS 'Ensures a user cannot have more than one pending application at a time.'; 