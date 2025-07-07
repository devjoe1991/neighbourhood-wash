-- Create profiles table with all necessary columns
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Basic profile information
    email TEXT,
    full_name TEXT,
    phone_number TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'washer', 'admin')),
    
    -- Washer-specific fields
    washer_status TEXT CHECK (washer_status IN ('pending_application', 'pending_verification', 'approved', 'rejected')),
    
    -- Stripe payment fields
    onboarding_fee_paid BOOLEAN DEFAULT false,
    stripe_account_id TEXT,
    stripe_account_status TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add comments
COMMENT ON TABLE public.profiles IS 'User profiles with role-based access and payment information';
COMMENT ON COLUMN public.profiles.onboarding_fee_paid IS 'Whether the washer has paid their one-time onboarding fee';
COMMENT ON COLUMN public.profiles.stripe_account_id IS 'Stripe Connect account ID for washers to receive payments';
COMMENT ON COLUMN public.profiles.stripe_account_status IS 'Status of the Stripe Connect account (enabled, restricted, etc.)';
