'use server'
import { Washer } from '@/lib/types'

// This is a placeholder function. It will be replaced with a real Supabase query.
// It simulates a network delay and returns a single washer for testing.
export async function getWashers(): Promise<Washer[]> {
  console.log('Fetching washer data...')
  await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate network delay

  const testWasher: Washer = {
    id: 'w1',
    first_name: 'Joe',
    last_name: 'Bloggs',
    profile_image_url: null, // Use null to test avatar fallback
    rating: 4.8,
    review_count: 75,
    distance: 1.2,
    services: ['wash', 'dry', 'collection'],
    specialties: ['Quick Service', 'Eco-Friendly'],
    next_available_slot: 'Tomorrow, 10:00 AM',
    is_verified: true,
    price_tier: '££',
  }

  // In the future, this will fetch data from the Supabase 'profiles' table
  // where role = 'washer' and washer_status = 'approved'.
  return [testWasher]
}
