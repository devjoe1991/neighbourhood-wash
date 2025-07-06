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
