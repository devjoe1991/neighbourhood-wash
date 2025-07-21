import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('bookingId')

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID required' }, { status: 400 })
    }

    // Verify washer has access to this booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('washer_id')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Get washer profile to verify access
    const { data: washerProfile, error: washerError } = await supabase
      .from('washer_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (washerError || !washerProfile || booking.washer_id !== washerProfile.id) {
      return NextResponse.json({ error: 'Unauthorized access to booking' }, { status: 403 })
    }

    // Get messages for this booking
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        id,
        sender_id,
        recipient_id,
        content,
        message_type,
        is_read,
        created_at,
        profiles!sender_id (
          full_name,
          avatar_url
        )
      `)
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true })

    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    // Mark messages as read for this user
    await supabase
      .from('messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('booking_id', bookingId)
      .eq('recipient_id', user.id)
      .eq('is_read', false)

    const formattedMessages = (messages || []).map((msg: any) => ({
      id: msg.id,
      sender_id: msg.sender_id,
      recipient_id: msg.recipient_id,
      content: msg.content,
      message_type: msg.message_type,
      is_read: msg.is_read,
      created_at: msg.created_at,
      sender: {
        full_name: msg.profiles?.full_name || 'Unknown',
        avatar_url: msg.profiles?.avatar_url
      }
    }))

    return NextResponse.json({ messages: formattedMessages })
  } catch (error) {
    console.error('Error in messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}