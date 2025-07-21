import { NextRequest, NextResponse } from 'next/server'
import { adminService } from '@/lib/admin/admin-service'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
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

    const result = await adminService.getFinancialReport()
    
    if (!result.success) {
      return NextResponse.json({ error: result.error?.message }, { status: 500 })
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Error in admin financial report API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}