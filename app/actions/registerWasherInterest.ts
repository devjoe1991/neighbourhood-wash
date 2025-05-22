'use server'

import { createClient } from '@/utils/supabase/server_new'
import { revalidatePath } from 'next/cache'

export async function registerWasherInterestAction(
  _prevState: { success: boolean; message: string } | null,
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      success: false,
      message: 'Authentication required. Please sign in.',
    }
  }

  const area = formData.get('area') as string

  if (!area || area.trim() === '') {
    return {
      success: false,
      message: 'Please enter your area (postcode or London borough).',
    }
  }

  // Check if user has already registered interest
  const { data: existingRegistration, error: selectError } = await supabase
    .from('washer_interest_registrations')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (selectError && selectError.code !== 'PGRST116') {
    // PGRST116: no rows found
    console.error('Error checking existing registration:', selectError)
    return {
      success: false,
      message: 'Could not process your request. Please try again.',
    }
  }

  if (existingRegistration) {
    return {
      success: true,
      message:
        'You have already registered your interest. We will be in touch soon!',
    }
  }

  const { error: insertError } = await supabase
    .from('washer_interest_registrations')
    .insert({ user_id: user.id, area })

  if (insertError) {
    if (insertError.code === '23505') {
      // Unique violation, though the previous check should catch this
      return {
        success: true,
        message:
          'You have already registered your interest. We will be in touch soon!',
      }
    }
    console.error('Error inserting washer interest:', insertError)
    return {
      success: false,
      message: 'Failed to register interest. Please try again.',
    }
  }

  revalidatePath('/dashboard/become-washer') // Revalidate the page to update its state
  return {
    success: true,
    message:
      'Thank you for registering your interest! We will be in touch soon.',
  }
}
