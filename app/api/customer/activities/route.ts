import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get recent activities from various sources
    const [bookingUpdates, messages, notifications] = await Promise.all([
      // Recent booking status changes
      supabase
        .from('booking_status_history')
        .select(`
          id,
          booking_id,
          to_status,
          created_at,
          bookings!inner(
            customer_id,
            customer_profiles!inner(
              user_id
            )
          )
        `)
        .eq('bookings.customer_profiles.user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5),

      // Recent messages
      supabase
        .from('messages')
        .select(`
          id,
          booking_id,
          content,
          created_at,
          sender_id,
          is_read
        `)
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5),

      // Recent notifications
      supabase
        .from('notifications')
        .select(`
          id,
          type,
          title,
          body,
          created_at,
          is_read
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)
    ])

    // Combine and transform activities
    const activities: any[] = []

    // Add booking status changes
    if (bookingUpdates.data) {
      bookingUpdates.data.forEach((update: any) => {
        activities.push({
          id: `booking_${update.id}`,
          type: 'booking_status_change',
          title: 'Booking Status Updated',
          description: `Your booking status changed to ${update.to_status}`,
          timestamp: update.created_at,
          metadata: { bookingId: update.booking_id, status: update.to_status },
          read: true // Assume read for now
        })
      })
    }

    // Add messages
    if (messages.data) {
      messages.data.forEach((message: any) => {
        activities.push({
          id: `message_${message.id}`,
          type: 'message_received',
          title: 'New Message',
          description: message.content.length > 50 
            ? `${message.content.substring(0, 50)}...` 
            : message.content,
          timestamp: message.created_at,
          metadata: { bookingId: message.booking_id, senderId: message.sender_id },
          read: message.is_read
        })
      })
    }

    // Add notifications
    if (notifications.data) {
      notifications.data.forEach((notification: any) => {
        activities.push({
          id: `notification_${notification.id}`,
          type: 'system_notification',
          title: notification.title,
          description: notification.body,
          timestamp: notification.created_at,
          metadata: {},
          read: notification.is_read
        })
      })
    }

    // Sort by timestamp and limit
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    const limitedActivities = activities.slice(0, limit)

    return NextResponse.json({
      success: true,
      activities: limitedActivities
    })

  } catch (error) {
    console.error('Error in activities API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}