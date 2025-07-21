import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { is_online } = await request.json()

    // Update washer online status
    const { error } = await supabase
      .from('washer_profiles')
      .update({ 
        is_online,
        last_seen_at: new Date().toISOString()
      })
      .eq('user_id', user.id)

    if (error) {
      console.error('Error updating online status:', error)
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
    }

    return NextResponse.json({ success: true, is_online })
  } catch (error) {
    console.error('Error in toggle-online:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}