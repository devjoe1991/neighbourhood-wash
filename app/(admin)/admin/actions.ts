'use server'

import { createSupabaseServerClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateApplicationStatus(
  applicationId: string,
  userId: string,
  status: 'approved' | 'rejected'
) {
  const supabase = createSupabaseServerClient()

  try {
    // Step 1: Update the application status
    const { error: updateAppError } = await supabase
      .from('washer_applications')
      .update({ status: status, updated_at: new Date().toISOString() })
      .eq('id', applicationId)

    if (updateAppError) {
      throw new Error(
        `Failed to update application status: ${updateAppError.message}`
      )
    }

    // Step 2: If approved, update the user's role
    if (status === 'approved') {
      const { error: updateUserError } = await supabase
        .from('profiles')
        .update({ role: 'washer' })
        .eq('id', userId)

      if (updateUserError) {
        // Optional: Add rollback logic here if updating the user fails
        console.error(
          'Failed to update user role, but application status was changed.',
          updateUserError
        )
        throw new Error(
          `Failed to update user role: ${updateUserError.message}`
        )
      }
    }

    // Step 3: Revalidate paths to reflect changes in the UI
    revalidatePath('/admin/washers')
    revalidatePath(`/admin/washers/${applicationId}`)

    return { success: true, message: `Application ${status} successfully.` }
  } catch (error) {
    console.error('Error in updateApplicationStatus:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'An unknown error occurred.' }
  }
}
