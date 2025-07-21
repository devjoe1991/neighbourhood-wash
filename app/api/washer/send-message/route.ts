import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { bookingId, content, washerId } = await request.json()

    if (!bookingId || !content || !washerId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify washer has access to this booking and get customer ID
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        washer_id,
        customer_profiles!inner (
          user_id
        )
      `)
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.washer_id !== washerId) {
      return NextResponse.json({ error: 'Unauthorized access to booking' }, { status: 403 })
    }

    // Send message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        booking_id: bookingId,
        sender_id: user.id,
        recipient_id: booking.customer_profiles.user_id,
        content: content.trim(),
        message_type: 'text'
      })
      .select()
      .single()

    if (messageError) {
      console.error('Error sending message:', messageError)
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }

    // TODO: Send real-time notification to customer
    // This would integrate with the real-time system

    return NextResponse.json({ success: true, message })
  } catch (error) {
    console.error('Error in send-message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}