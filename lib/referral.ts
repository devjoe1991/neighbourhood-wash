import { createSupabaseServerClient } from '@/utils/supabase/server'

/**
 * Generates a random alphanumeric string of a given length.
 * @param length The desired length of the code.
 * @returns A random alphanumeric string.
 */
function generateRandomCode(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

/**
 * Retrieves an existing referral code for a user or creates a new one if it doesn't exist.
 * Ensures the generated code is unique in the referrals table.
 *
 * @param userId The ID of the user for whom to get or create the referral code.
 * @returns The user's referral code, or null if an error occurs.
 */
export async function getOrCreateReferralCode(
  userId: string
): Promise<string | null> {
  if (!userId) {
    console.error('User ID is required to get or create a referral code.')
    return null
  }

  const supabase = createSupabaseServerClient()

  try {
    // 1. Check if the user already has a code
    const { data: existingReferral, error: fetchError } = await supabase
      .from('referrals')
      .select('referral_code')
      .eq('user_id', userId)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116: 'Searched item was not found'
      console.error('Error fetching referral code:', fetchError)
      return null
    }

    if (existingReferral) {
      return existingReferral.referral_code
    }

    // 2. If not, generate a new unique code
    let newCode = ''
    let codeExists = true
    let attempts = 0
    const maxAttempts = 10 // Prevent infinite loops

    while (codeExists && attempts < maxAttempts) {
      newCode = generateRandomCode(6) // Generate a 6-character code
      const { data: codeCheck, error: checkError } = await supabase
        .from('referrals')
        .select('referral_code')
        .eq('referral_code', newCode)
        .maybeSingle() // Use maybeSingle as code might not exist

      if (checkError) {
        console.error('Error checking if code exists:', checkError)
        return null // Exit if there's an error during check
      }
      codeExists = !!codeCheck
      attempts++
    }

    if (codeExists) {
      // Failed to generate a unique code after maxAttempts
      console.error(
        'Failed to generate a unique referral code after',
        maxAttempts,
        'attempts.'
      )
      return null
    }

    // 3. Insert the new code for the user
    const { error: insertError } = await supabase
      .from('referrals')
      .insert({ user_id: userId, referral_code: newCode })

    if (insertError) {
      console.error('Error inserting new referral code:', insertError)
      // Handle potential unique constraint violation if by some very slim chance user_id was inserted by another process
      if (insertError.code === '23505') {
        // unique_violation
        // Try fetching again, maybe it was just created
        const { data: retryReferral, error: retryError } = await supabase
          .from('referrals')
          .select('referral_code')
          .eq('user_id', userId)
          .single()
        if (retryError) {
          console.error(
            'Error refetching referral code after unique violation:',
            retryError
          )
          return null
        }
        return retryReferral?.referral_code || null
      }
      return null
    }

    return newCode
  } catch (error) {
    console.error(
      'An unexpected error occurred in getOrCreateReferralCode:',
      error
    )
    return null
  }
}
