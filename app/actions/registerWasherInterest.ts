'use server'

import { createSupabaseServerClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function registerWasherInterest(
  userId: string,
  area: string
): Promise<{ success: boolean; error?: string }> {
  if (!userId) {
    return {
      success: false,
      error: 'You must be logged in to register interest.',
    }
  }

  const supabase = createSupabaseServerClient()

  // 1. Check if interest already registered
  const { data: existingInterest, error: selectError } = await supabase
    .from('washer_interest_registrations')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (selectError && selectError.code !== 'PGRST116') {
    // PGRST116 is 'No rows found', which is fine. Any other error is a problem.
    console.error('Error checking for existing interest:', selectError)
    return {
      success: false,
      error: 'A server error occurred. Please try again.',
    }
  }

  if (existingInterest) {
    return {
      success: false,
      error: 'You have already registered your interest.',
    }
  }

  // 2. Insert new interest registration
  const { error: insertError } = await supabase
    .from('washer_interest_registrations')
    .insert({ user_id: userId, area: area })

  if (insertError) {
    console.error('Error inserting washer interest:', insertError)
    return {
      success: false,
      error: 'Could not save your interest. Please try again.',
    }
  }

  revalidatePath('/dashboard/become-washer')
  return { success: true }
}
