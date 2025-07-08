import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface _BookingToAssign {
  id: number
  user_id: string
  collection_date: string
  created_at: string
  total_price: number
  user_postcode: string
}

interface AvailableWasher {
  id: string
  postcode: string
  service_area_radius: number
  availability_schedule: Record<string, unknown> | null
  created_at: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get all bookings that are awaiting assignment and older than 24 hours
    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

    const { data: bookingsToAssign, error: bookingsError } = await supabase
      .from('bookings')
      .select(
        `
        id,
        user_id,
        collection_date,
        created_at,
        total_price,
        profiles!user_id (
          postcode
        )
      `
      )
      .eq('status', 'awaiting_assignment')
      .lt('created_at', twentyFourHoursAgo.toISOString())

    if (bookingsError) {
      console.error('Error fetching bookings to assign:', bookingsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch bookings' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (!bookingsToAssign || bookingsToAssign.length === 0) {
      return new Response(
        JSON.stringify({
          message: 'No bookings need auto-assignment',
          assigned: 0,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get all available washers
    const { data: availableWashers, error: washersError } = await supabase
      .from('profiles')
      .select(
        'id, postcode, service_area_radius, availability_schedule, created_at'
      )
      .eq('role', 'washer')
      .eq('washer_status', 'approved')

    if (washersError) {
      console.error('Error fetching washers:', washersError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch washers' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (!availableWashers || availableWashers.length === 0) {
      console.log('No available washers found')
      return new Response(
        JSON.stringify({ message: 'No available washers', assigned: 0 }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    let assignedCount = 0
    const assignmentResults = []

    // Process each booking that needs assignment
    for (const booking of bookingsToAssign) {
      const userPostcode = Array.isArray(booking.profiles)
        ? booking.profiles[0]?.postcode
        : booking.profiles?.postcode

      if (!userPostcode) {
        console.log(`Skipping booking ${booking.id}: no user postcode`)
        continue
      }

      // Find the best washer for this booking
      const bestWasher = findBestWasher(
        availableWashers,
        userPostcode,
        booking.collection_date
      )

      if (!bestWasher) {
        console.log(`No suitable washer found for booking ${booking.id}`)
        continue
      }

      // Assign the washer to the booking
      const { error: assignError } = await supabase
        .from('bookings')
        .update({
          washer_id: bestWasher.id,
          status: 'washer_assigned',
        })
        .eq('id', booking.id)
        .eq('status', 'awaiting_assignment') // Ensure it's still unassigned

      if (assignError) {
        console.error(`Error assigning booking ${booking.id}:`, assignError)
        assignmentResults.push({
          booking_id: booking.id,
          success: false,
          error: assignError.message,
        })
      } else {
        assignedCount++
        assignmentResults.push({
          booking_id: booking.id,
          washer_id: bestWasher.id,
          success: true,
        })
        console.log(
          `Successfully assigned booking ${booking.id} to washer ${bestWasher.id}`
        )
      }
    }

    return new Response(
      JSON.stringify({
        message: `Auto-assignment completed`,
        assigned: assignedCount,
        total_processed: bookingsToAssign.length,
        results: assignmentResults,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Auto-assignment function error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

/**
 * Find the best washer for a booking based on:
 * 1. Location proximity (postcode matching)
 * 2. Availability
 * 3. Experience (how long they've been a washer)
 * 4. Service area coverage
 */
function findBestWasher(
  washers: AvailableWasher[],
  userPostcode: string,
  _collectionDate: string
): AvailableWasher | null {
  if (!washers.length) return null

  // Simple postcode area matching (first 2-4 characters)
  const userPostcodeArea = userPostcode.substring(0, 4).toUpperCase()

  // Score each washer
  const scoredWashers = washers.map((washer) => {
    let score = 0

    // Location scoring (highest priority)
    if (washer.postcode) {
      const washerPostcodeArea = washer.postcode.substring(0, 4).toUpperCase()
      if (washerPostcodeArea === userPostcodeArea) {
        score += 100 // Same postcode area
      } else if (
        washerPostcodeArea.substring(0, 2) === userPostcodeArea.substring(0, 2)
      ) {
        score += 50 // Same postcode district
      }
    }

    // Service area radius scoring
    const serviceRadius = washer.service_area_radius || 5
    score += Math.min(serviceRadius, 20) // Cap at 20 for scoring

    // Experience scoring (longer-tenured washers get slight preference)
    const washerAge = Date.now() - new Date(washer.created_at).getTime()
    const daysSinceJoined = washerAge / (1000 * 60 * 60 * 24)
    score += Math.min(daysSinceJoined / 10, 10) // Max 10 points for experience

    // Availability scoring (simplified - in production would check actual schedule)
    if (washer.availability_schedule) {
      score += 20 // Has availability schedule configured
    }

    return { washer, score }
  })

  // Sort by score (highest first) and return the best match
  scoredWashers.sort((a, b) => b.score - a.score)

  return scoredWashers.length > 0 ? scoredWashers[0].washer : null
}
