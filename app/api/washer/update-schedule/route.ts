import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { washerId, schedule } = await request.json()

    if (!washerId || !schedule) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Delete existing availability for this washer
    const { error: deleteError } = await supabase
      .from('washer_availability')
      .delete()
      .eq('washer_id', washerId)

    if (deleteError) {
      console.error('Error deleting existing availability:', deleteError)
      return NextResponse.json({ error: 'Failed to update schedule' }, { status: 500 })
    }

    // Insert new availability slots
    const availabilitySlots = []
    for (const [dayOfWeek, slots] of Object.entries(schedule)) {
      for (const slot of slots as any[]) {
        if (slot.is_available) {
          availabilitySlots.push({
            washer_id: washerId,
            day_of_week: parseInt(dayOfWeek),
            start_time: slot.start_time,
            end_time: slot.end_time,
            is_available: slot.is_available
          })
        }
      }
    }

    if (availabilitySlots.length > 0) {
      const { error: insertError } = await supabase
        .from('washer_availability')
        .insert(availabilitySlots)

      if (insertError) {
        console.error('Error inserting availability:', insertError)
        return NextResponse.json({ error: 'Failed to save schedule' }, { status: 500 })
      }
    }

    // Update the washer profile with the schedule JSON
    const { error: updateError } = await supabase
      .from('washer_profiles')
      .update({ 
        availability_schedule: schedule,
        updated_at: new Date().toISOString()
      })
      .eq('id', washerId)

    if (updateError) {
      console.error('Error updating washer profile:', updateError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in update-schedule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}