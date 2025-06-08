'use server'

import { createClient } from '@/utils/supabase/server_new'
import { revalidatePath } from 'next/cache'

export async function updateApplicationStatus(
  applicationId: string,
  userId: string,
  newStatus: 'approved' | 'rejected'
) {
  const supabase = createClient()

  // Step 1: Update the status in the washer_applications table
  const { error: appUpdateError } = await supabase
    .from('washer_applications')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', applicationId)

  if (appUpdateError) {
    console.error('Error updating application status:', appUpdateError)
    return { error: 'Failed to update the application record.' }
  }

  // Step 2: Update the corresponding profile's washer_status
  const { error: profileUpdateError } = await supabase
    .from('profiles')
    .update({ washer_status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (profileUpdateError) {
    console.error('CRITICAL: Application updated but profile status update failed:', profileUpdateError)
    // Here you might want to attempt to roll back the application status change
    return { error: 'Failed to update the user profile status.' }
  }

  // Revalidate paths to reflect the changes in the UI
  revalidatePath('/admin/washers')
  revalidatePath(`/admin/washers/${applicationId}`)

  return { success: true }
} 