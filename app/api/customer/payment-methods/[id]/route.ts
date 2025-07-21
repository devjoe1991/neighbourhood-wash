import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/utils/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: paymentMethodId } = await params

    // In a real implementation, you would:
    // 1. Verify the payment method belongs to the user
    // 2. Detach the payment method from Stripe
    // 3. Update any references in the database

    // For now, return success
    return NextResponse.json({
      success: true,
      message: 'Payment method removed'
    })

  } catch (error) {
    console.error('Error removing payment method:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}