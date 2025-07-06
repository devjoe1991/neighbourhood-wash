-- Add washer-specific settings fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN service_offerings TEXT[] DEFAULT '{}',
ADD COLUMN availability_schedule JSONB DEFAULT '{}',
ADD COLUMN service_area_radius NUMERIC DEFAULT 5;

-- Create indexes for better performance
CREATE INDEX idx_profiles_service_offerings ON public.profiles USING GIN(service_offerings);
CREATE INDEX idx_profiles_service_area_radius ON public.profiles(service_area_radius);

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.service_offerings IS 'Array of services offered by washer (e.g., ["wash_dry", "ironing", "stain_removal", "collection_delivery"])';
COMMENT ON COLUMN public.profiles.availability_schedule IS 'JSON object storing weekly availability schedule for washers';
COMMENT ON COLUMN public.profiles.service_area_radius IS 'Service area radius in miles for washers (default: 5 miles)'; 