import { createSupabaseServerClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { CogIcon } from 'lucide-react'
import LaundryPreferencesForm from './LaundryPreferencesForm'

export const dynamic = 'force-dynamic'

interface ProfileData {
  id: string
  // Storing selections as an array of strings
  allergies?: string[] | null
  product_preferences?: string[] | null
}

async function getUserProfileData(): Promise<{
  user: { id: string } | null
  profile: ProfileData | null
  error: string | null
}> {
  try {
    const supabase = createSupabaseServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { user: null, profile: null, error: 'Authentication required' }
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, allergies, product_preferences')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return { user, profile: null, error: 'Failed to fetch profile data' }
    }

    return { user, profile, error: null }
  } catch (error) {
    console.error('Error in getUserProfileData:', error)
    return { user: null, profile: null, error: 'An unexpected error occurred' }
  }
}

export default async function LaundryPreferencesPage() {
  const { user, profile, error } = await getUserProfileData()

  if (error === 'Authentication required' || !user) {
    redirect('/signin')
  }

  if (error) {
    return (
      <div className='container mx-auto p-4'>
        <Card className='mx-auto max-w-md'>
          <CardContent className='pt-6'>
            <div className='text-center'>
              <CogIcon className='mx-auto mb-4 h-12 w-12 text-red-500' />
              <h3 className='mb-2 text-lg font-semibold text-gray-900'>
                Error Loading Preferences
              </h3>
              <p className='text-gray-600'>{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className='container mx-auto max-w-4xl space-y-8 p-4'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900'>
          Laundry Preferences
        </h1>
        <p className='mt-2 text-gray-600'>
          Set your laundry preferences to ensure the best service for your needs
        </p>
      </div>

      <LaundryPreferencesForm userId={user.id} initialProfile={profile} />
    </div>
  )
}
