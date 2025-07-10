import { createSupabaseServerClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  UserCircleIcon,
  ShieldCheckIcon,
  TruckIcon,
  CogIcon,
  PaletteIcon,
} from 'lucide-react'
import UserProfileForm from './UserProfileForm'
import NotificationSettingsForm from './NotificationSettingsForm'

export const dynamic = 'force-dynamic'

// Define a type for our profile data for better type safety
interface ProfileData {
  id: string
  first_name?: string | null
  last_name?: string | null
  phone_number?: string | null
  postcode?: string | null
  notification_preferences?: { email_all?: boolean } | null
  allergies?: string | null
  product_preferences?: string | null
  role?: string | null
  washer_status?: string | null
  email?: string | null
  borough?: string | null
}

async function getUserProfileData(): Promise<{
  user: { id: string; email?: string } | null
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
      .select('*')
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

// Theme Settings (Static component)
const ThemeSettings = () => (
  <Card>
    <CardHeader>
      <CardTitle className='flex items-center'>
        <PaletteIcon className='mr-2 h-5 w-5 text-blue-600' /> Theme
      </CardTitle>
      <CardDescription>
        Customize the appearance of your dashboard.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <p className='text-sm text-gray-600'>
        Theme settings will be available in a future update.
      </p>
    </CardContent>
  </Card>
)

// Account Security Settings (Static component)
const AccountSecuritySettings = () => (
  <Card>
    <CardHeader>
      <CardTitle className='flex items-center'>
        <ShieldCheckIcon className='mr-2 h-5 w-5 text-blue-600' /> Account
        Security
      </CardTitle>
      <CardDescription>
        Manage your account security and password settings.
      </CardDescription>
    </CardHeader>
    <CardContent className='space-y-4'>
      <div>
        <h4 className='mb-2 font-medium'>Password</h4>
        <p className='mb-4 text-sm text-gray-600'>
          Your password was last updated recently.
        </p>
        {/* <Button variant='outline'>Change Password</Button> */}
        <p className='text-sm text-gray-500'>
          Password change functionality will be available soon.
        </p>
      </div>
    </CardContent>
  </Card>
)

// Service Area Settings (Static component)
const ServiceAreaSettings = () => (
  <Card>
    <CardHeader>
      <CardTitle className='flex items-center'>
        <TruckIcon className='mr-2 h-5 w-5 text-blue-600' /> Service Area
      </CardTitle>
      <CardDescription>
        Manage your delivery and pickup preferences.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <p className='text-sm text-gray-600'>
        Service area settings will be available once the booking system is fully
        implemented.
      </p>
    </CardContent>
  </Card>
)

// Equipment Settings (Static component)
const EquipmentSettings = () => (
  <Card>
    <CardHeader>
      <CardTitle className='flex items-center'>
        <CogIcon className='mr-2 h-5 w-5 text-blue-600' /> Equipment Preferences
      </CardTitle>
      <CardDescription>
        Set your washing and drying preferences.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <p className='text-sm text-gray-600'>
        Equipment preference settings will be available in a future update.
      </p>
    </CardContent>
  </Card>
)

export default async function SettingsPage() {
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
              <UserCircleIcon className='mx-auto mb-4 h-12 w-12 text-red-500' />
              <h3 className='mb-2 text-lg font-semibold text-gray-900'>
                Error Loading Settings
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
        <h1 className='text-3xl font-bold text-gray-900'>Settings</h1>
        <p className='mt-2 text-gray-600'>
          Manage your account settings and preferences
        </p>
      </div>

      <div className='grid gap-6'>
        {/* User Profile Settings */}
        <UserProfileForm
          userEmail={user.email}
          userId={user.id}
          initialProfile={profile}
        />

        {/* Notification Settings */}
        <NotificationSettingsForm
          userId={user.id}
          initialPrefs={profile?.notification_preferences}
        />

        {/* Theme Settings */}
        <ThemeSettings />

        {/* Account Security */}
        <AccountSecuritySettings />

        {/* Service Area Settings */}
        <ServiceAreaSettings />

        {/* Equipment Settings */}
        <EquipmentSettings />
      </div>
    </div>
  )
}
