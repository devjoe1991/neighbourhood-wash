import { NextRequest, NextResponse } from 'next/server'
import { adminService } from '@/lib/admin/admin-service'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single()

    if (!userRoles) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { action, washerId, reason } = body

    let result
    switch (action) {
      case 'approve':
        result = await adminService.approveWasher(washerId, user.id)
        break
      case 'reject':
        result = await adminService.rejectWasher(washerId, user.id, reason)
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    
    if (!result.success) {
      return NextResponse.json({ error: result.error?.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in admin washer action API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}