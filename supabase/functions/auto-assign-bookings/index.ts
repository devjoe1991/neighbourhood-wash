import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface Booking {
  id: number
  user_id: string
  created_at: string
}

interface Washer {
  id: string
}

interface AssignmentResult {
  booking_id: number
  success: boolean
  washer_id?: string
  error?: string
}

serve(async (_req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Step 1: Find unassigned bookings that are due for auto-assignment
    const tenMinutesAgo = new Date()
    tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10)

    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, created_at, user_id')
      .eq('status', 'pending_washer_assignment')
      .is('washer_id', null)
      .lt('created_at', tenMinutesAgo.toISOString())
      .order('created_at', { ascending: true })

    if (bookingsError) {
      throw new Error(
        `Failed to fetch bookings: ${bookingsError.message}`
      )
    }

    if (!bookings || bookings.length === 0) {
      return new Response(
        JSON.stringify({
          message: 'No bookings to assign.',
          assigned: 0,
          total_processed: 0,
        }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Step 2: Get all available and approved washers
    const { data: washers, error: washersError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'washer')
      .eq('washer_status', 'approved')

    if (washersError) {
      throw new Error(
        `Failed to fetch washers: ${washersError.message}`
      )
    }

    if (!washers || washers.length === 0) {
      return new Response(
        JSON.stringify({
          message: 'No available washers to assign bookings to.',
          assigned: 0,
          total_processed: bookings.length,
        }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    let assignedCount = 0
    const assignmentResults: AssignmentResult[] = []

    // Step 3: Assign each booking to a random available washer
    for (const booking of bookings as Booking[]) {
      try {
        // Simple random selection for now
        const selectedWasher = washers[
          Math.floor(Math.random() * washers.length)
        ] as Washer

        const { error: updateError } = await supabase
          .from('bookings')
          .update({
            washer_id: selectedWasher.id,
            status: 'washer_assigned',
          })
          .eq('id', booking.id)
          .eq('status', 'pending_washer_assignment') // Ensure it's still unassigned
          .select('id')
          .single()

        if (updateError) {
          throw new Error(
            `Failed to assign booking ${booking.id}: ${updateError.message}`
          )
        }

        assignedCount++
        assignmentResults.push({
          booking_id: booking.id,
          success: true,
          washer_id: selectedWasher.id,
        })
      } catch (assignError) {
        assignmentResults.push({
          booking_id: booking.id,
          success: false,
          error: assignError.message,
        })
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Auto-assignment completed',
        assigned: assignedCount,
        total_processed: bookings.length,
        results: assignmentResults,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
