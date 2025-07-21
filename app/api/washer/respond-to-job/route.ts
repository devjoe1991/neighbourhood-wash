import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { assignmentId, action, washerId } = await request.json()

    if (!assignmentId || !action || !washerId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['accept', 'decline'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Start a transaction
    const { data: assignment, error: fetchError } = await supabase
      .from('washer_assignments')
      .select('booking_id, status, expires_at')
      .eq('id', assignmentId)
      .eq('washer_id', washerId)
      .single()

    if (fetchError || !assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Check if assignment is still valid
    if (assignment.status !== 'offered') {
      return NextResponse.json({ error: 'Assignment no longer available' }, { status: 400 })
    }

    if (new Date(assignment.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Assignment has expired' }, { status: 400 })
    }

    // Update assignment status
    const newStatus = action === 'accept' ? 'accepted' : 'declined'
    const { error: updateError } = await supabase
      .from('washer_assignments')
      .update({
        status: newStatus,
        responded_at: new Date().toISOString()
      })
      .eq('id', assignmentId)

    if (updateError) {
      console.error('Error updating assignment:', updateError)
      return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 })
    }

    // If accepted, update booking status and assign washer
    if (action === 'accept') {
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({
          washer_id: washerId,
          status: 'assigned',
          assigned_at: new Date().toISOString()
        })
        .eq('id', assignment.booking_id)

      if (bookingError) {
        console.error('Error updating booking:', bookingError)
        return NextResponse.json({ error: 'Failed to assign booking' }, { status: 500 })
      }

      // Cancel other pending assignments for this booking
      await supabase
        .from('washer_assignments')
        .update({ status: 'cancelled' })
        .eq('booking_id', assignment.booking_id)
        .neq('id', assignmentId)
        .eq('status', 'offered')
    }

    return NextResponse.json({ success: true, action, status: newStatus })
  } catch (error) {
    console.error('Error in respond-to-job:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}