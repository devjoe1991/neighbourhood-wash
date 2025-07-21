// API route for push notification subscription management

import { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/utils/supabase/server'
import { pushNotificationService } from '@/lib/realtime/push-notification-service'

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const body = await request.json()
    const { subscription, userAgent } = body

    if (!subscription || !subscription.endpoint) {
      return new Response(
        JSON.stringify({ error: 'Invalid subscription data' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Subscribe user to push notifications
    await pushNotificationService.subscribeUser(
      user.id,
      subscription,
      userAgent || request.headers.get('user-agent') || undefined
    )

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Successfully subscribed to push notifications' 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Push subscription error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to subscribe to push notifications' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get('endpoint')

    // Unsubscribe user from push notifications
    await pushNotificationService.unsubscribeUser(user.id, endpoint || undefined)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Successfully unsubscribed from push notifications' 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Push unsubscription error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to unsubscribe from push notifications' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}