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
    const washerId = searchParams.get('washerId')

    if (!washerId) {
      return NextResponse.json({ error: 'Washer ID required' }, { status: 400 })
    }

    // Get all bookings for this washer that have messages
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        service_type,
        status,
        requested_date,
        customer_profiles!inner (
          id,
          profiles!inner (
            id,
            full_name,
            avatar_url
          )
        ),
        messages (
          id,
          content,
          sender_id,
          is_read,
          created_at,
          profiles!sender_id (
            full_name,
            avatar_url
          )
        )
      `)
      .eq('washer_id', washerId)
      .not('messages', 'is', null)
      .order('created_at', { ascending: false })

    if (bookingsError) {
      console.error('Error fetching conversations:', bookingsError)
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
    }

    // Transform data into conversation format
    const conversations = (bookings || []).map((booking: any) => {
      const messages = booking.messages || []
      const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null
      const unreadCount = messages.filter((msg: any) => !msg.is_read && msg.sender_id !== user.id).length

      return {
        booking_id: booking.id,
        customer: {
          id: booking.customer_profiles.id,
          full_name: booking.customer_profiles.profiles.full_name,
          avatar_url: booking.customer_profiles.profiles.avatar_url
        },
        booking: {
          service_type: booking.service_type,
          status: booking.status,
          requested_date: booking.requested_date
        },
        last_message: lastMessage ? {
          id: lastMessage.id,
          content: lastMessage.content,
          sender_id: lastMessage.sender_id,
          created_at: lastMessage.created_at,
          sender: {
            full_name: lastMessage.profiles?.full_name || 'Unknown',
            avatar_url: lastMessage.profiles?.avatar_url
          }
        } : null,
        unread_count: unreadCount,
        messages: [] // Will be loaded separately when conversation is selected
      }
    }).filter((conv: any) => conv.last_message !== null)

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error('Error in conversations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}