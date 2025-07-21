// =============================================
// CORE USER ARCHITECTURE TYPES
// =============================================

export type UserRole = 'customer' | 'washer' | 'admin'

export interface Profile {
  id: string
  email: string
  full_name?: string
  phone_number?: string
  avatar_url?: string
  timezone?: string
  language?: string
  created_at: string
  updated_at: string
}

export interface UserRoleAssignment {
  id: string
  user_id: string
  role: UserRole
  status: 'active' | 'inactive' | 'suspended'
  assigned_at: string
  assigned_by?: string
}

export interface UserWithRoles {
  id: string
  email: string
  profile: Profile
  roles: UserRole[]
  primaryRole: UserRole
  washerProfile?: WasherProfile
  customerProfile?: CustomerProfile
}

export type OnboardingStatus = 
  | 'not_started' 
  | 'profile_setup' 
  | 'verification_pending' 
  | 'verification_complete' 
  | 'payment_setup' 
  | 'completed'

export interface WasherProfile {
  id: string
  user_id: string
  onboarding_status: OnboardingStatus
  bio?: string
  service_areas: string[]
  service_types: string[]
  equipment_details?: string
  years_experience: number
  availability_schedule?: any
  max_concurrent_bookings: number
  advance_booking_days: number
  primary_location?: any
  service_radius_km: number
  stripe_account_id?: string
  stripe_account_status?: string
  stripe_onboarding_url?: string
  verification_documents?: any
  background_check_status: 'pending' | 'approved' | 'rejected'
  approval_status: 'pending' | 'approved' | 'rejected' | 'suspended'
  approval_notes?: string
  approved_by?: string
  approved_at?: string
  rating: number
  total_jobs: number
  completed_jobs: number
  cancellation_rate: number
  hourly_rate?: number
  commission_rate: number
  onboarding_started_at?: string
  onboarding_completed_at?: string
  last_step_completed_at?: string
  is_online: boolean
  last_seen_at?: string
  created_at: string
  updated_at: string
}

export interface CustomerProfile {
  id: string
  user_id: string
  default_address?: any
  laundry_preferences?: any
  communication_preferences?: any
  total_bookings: number
  completed_bookings: number
  average_rating: number
  default_payment_method?: string
  stripe_customer_id?: string
  status: 'active' | 'inactive' | 'suspended'
  created_at: string
  updated_at: string
}

export interface CustomerAddress {
  id: string
  customer_id: string
  label: string
  address_line_1: string
  address_line_2?: string
  city: string
  state: string
  postal_code: string
  country: string
  coordinates?: any
  is_default: boolean
  created_at: string
}

// =============================================
// AUTHENTICATION TYPES
// =============================================

export interface AuthResult {
  success: boolean
  user?: UserWithRoles
  error?: AuthError
  redirectTo?: string
}

export interface AuthError {
  message: string
  type?: string
  code?: string
}

export interface RedirectResult {
  url: string
  role: UserRole
}

// =============================================
// SERVICE RESULT TYPES
// =============================================

export interface ServiceResult<T> {
  success: boolean
  data?: T
  error?: {
    message: string
    code?: string
    type?: string
  }
}

// =============================================
// BOOKING & MATCHING TYPES
// =============================================

export type BookingStatus = 
  | 'pending'
  | 'assigned'
  | 'confirmed'
  | 'in_progress'
  | 'pickup_complete'
  | 'washing'
  | 'ready_for_delivery'
  | 'out_for_delivery'
  | 'completed'
  | 'cancelled'
  | 'refunded'

export interface Booking {
  id: number
  customer_id: string
  washer_id?: string
  service_type: string
  service_description?: string
  estimated_duration_hours?: number
  requested_date: string
  requested_time_start?: string
  requested_time_end?: string
  scheduled_at?: string
  pickup_address: any
  delivery_address?: any
  status: BookingStatus
  base_price: number
  additional_fees: number
  discount_amount: number
  total_price: number
  payment_status: 'pending' | 'authorized' | 'captured' | 'refunded' | 'failed'
  payment_intent_id?: string
  assigned_at?: string
  confirmed_at?: string
  started_at?: string
  completed_at?: string
  cancelled_at?: string
  cancellation_reason?: string
  created_at: string
  updated_at: string
}

export interface BookingItem {
  id: string
  booking_id: number
  item_type: string
  quantity: number
  special_instructions?: string
  price_per_item?: number
  created_at: string
}

export interface WasherAssignment {
  id: string
  booking_id: number
  washer_id: string
  assignment_type: 'auto' | 'manual'
  match_score?: number
  distance_km?: number
  estimated_travel_time_minutes?: number
  status: 'offered' | 'accepted' | 'declined' | 'expired' | 'cancelled'
  offered_at: string
  expires_at?: string
  responded_at?: string
  created_at: string
}

export interface BookingStatusHistory {
  id: string
  booking_id: number
  from_status?: string
  to_status: string
  changed_by?: string
  notes?: string
  created_at: string
}

export interface Message {
  id: string
  booking_id: number
  sender_id: string
  recipient_id: string
  message_type: 'text' | 'image' | 'system'
  content: string
  attachments?: any[]
  is_read: boolean
  read_at?: string
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  body: string
  data?: any
  channels: string[]
  status: 'pending' | 'sent' | 'delivered' | 'failed'
  is_read: boolean
  read_at?: string
  created_at: string
  sent_at?: string
}

// =============================================
// LEGACY WASHER TYPE (for backward compatibility)
// =============================================

export interface Washer {
  id: string
  first_name: string
  last_name: string
  profile_image_url: string | null
  rating: number
  review_count: number
  distance: number // in miles
  services: ('wash' | 'dry' | 'iron' | 'collection')[]
  specialties: string[]
  next_available_slot: string // e.g., "Today, 5:00 PM"
  is_verified: boolean
  price_tier: '£' | '££' | '£££'
}
