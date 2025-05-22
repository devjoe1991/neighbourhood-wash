export const dynamic = 'force-dynamic'

import { createClient } from '@/utils/supabase/server_new'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/dashboard/Sidebar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
// Import icons as needed, e.g., UserCircle, Bell, ShieldCheck, Truck, Cog
import {
  UserCircleIcon,
  BellIcon,
  ShieldCheckIcon,
  TruckIcon,
  CogIcon,
  PaletteIcon,
  TrashIcon,
} from 'lucide-react'

// Placeholder components for different settings sections
// We can expand these later into actual forms
const UserProfileSettings = () => (
  <Card>
    <CardHeader>
      <CardTitle className='flex items-center'>
        <UserCircleIcon className='mr-2 h-5 w-5 text-blue-600' /> Profile
        Information
      </CardTitle>
      <CardDescription>
        Manage your personal details and account information.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <p className='text-sm text-gray-600'>
        Profile editing coming soon (e.g., name, contact).
      </p>
      {/* Placeholder for form fields */}
    </CardContent>
  </Card>
)

const NotificationSettings = () => (
  <Card>
    <CardHeader>
      <CardTitle className='flex items-center'>
        <BellIcon className='mr-2 h-5 w-5 text-blue-600' /> Notification
        Preferences
      </CardTitle>
      <CardDescription>
        Choose how you receive updates and alerts.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <p className='text-sm text-gray-600'>
        Notification settings coming soon (e.g., email, push).
      </p>
      {/* Placeholder for toggles/options */}
    </CardContent>
  </Card>
)

const UserPreferencesSettings = () => (
  <Card>
    <CardHeader>
      <CardTitle className='flex items-center'>
        <CogIcon className='mr-2 h-5 w-5 text-blue-600' /> Laundry Preferences
      </CardTitle>
      <CardDescription>
        Set your preferences for detergents, fabric softeners, and allergy
        information.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <p className='text-sm text-gray-600'>
        Allergies and product preferences management coming soon.
      </p>
      {/* Placeholder for form fields */}
    </CardContent>
  </Card>
)

const ThemeSettings = () => (
  <Card>
    <CardHeader>
      <CardTitle className='flex items-center'>
        <PaletteIcon className='mr-2 h-5 w-5 text-blue-600' /> Appearance
      </CardTitle>
      <CardDescription>
        Customize the look and feel of the platform.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <p className='text-sm text-gray-600'>
        Light/Dark mode toggle coming soon.
      </p>
      {/* Placeholder for theme toggle - this might be global though */}
    </CardContent>
  </Card>
)

const AccountSecuritySettings = () => (
  <Card>
    <CardHeader>
      <CardTitle className='flex items-center'>
        <ShieldCheckIcon className='mr-2 h-5 w-5 text-blue-600' /> Account &
        Security
      </CardTitle>
      <CardDescription>
        Manage your password and account security options.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <p className='text-sm text-gray-600'>
        Password change and other security features coming soon.
      </p>
      <div className='mt-4 border-t pt-4'>
        <h3 className='text-md flex items-center font-semibold text-red-600'>
          <TrashIcon className='mr-2 h-4 w-4' /> Account Deletion
        </h3>
        <p className='mt-1 text-sm text-gray-500'>
          Permanently delete your account and all associated data. This action
          cannot be undone.
        </p>
        <button className='mt-2 text-sm text-red-600 underline hover:text-red-700'>
          Request Account Deletion (Coming Soon)
        </button>
      </div>
    </CardContent>
  </Card>
)

// Washer-specific settings
const ServiceAreaSettings = () => (
  <Card>
    <CardHeader>
      <CardTitle className='flex items-center'>
        <TruckIcon className='mr-2 h-5 w-5 text-blue-600' /> Service Area &
        Collection
      </CardTitle>
      <CardDescription>
        Define your service radius and collection options.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <p className='text-sm text-gray-600'>
        Service area and collection configuration coming soon.
      </p>
      {/* Placeholder for map/radius input */}
    </CardContent>
  </Card>
)

const EquipmentSettings = () => (
  <Card>
    <CardHeader>
      <CardTitle className='flex items-center'>
        <CogIcon className='mr-2 h-5 w-5 text-blue-600' /> Laundry Equipment
      </CardTitle>
      <CardDescription>
        Specify details about your laundry machines and facilities.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <p className='text-sm text-gray-600'>
        Equipment details management coming soon.
      </p>
      {/* Placeholder for form fields */}
    </CardContent>
  </Card>
)

export default async function SettingsPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/signin?message=Please sign in to view settings.')
  }

  let isApprovedWasher = false
  // Fetch profile to determine if user is an approved washer
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, washer_status')
    .eq('id', user.id)
    .single()

  if (profileError && profileError.code !== 'PGRST116') {
    console.error('SettingsPage: Error fetching profile:', profileError)
    // Handle error, perhaps redirect to dashboard with an error message
  }

  if (profile) {
    isApprovedWasher =
      profile.role === 'WASHER' && profile.washer_status === 'approved'
  }

  const userRoleDisplay = profile?.role
    ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1).toLowerCase()
    : 'User'

  return (
    <div className='flex min-h-screen bg-gray-100 pt-16'>
      <Sidebar />
      <main className='ml-64 flex-1 p-8'>
        <header className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-800'>Settings</h1>
          <p className='text-md text-gray-500'>
            Manage your account and preferences as a {userRoleDisplay}.
          </p>
        </header>

        <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
          {/* Common Settings for All Users */}
          <UserProfileSettings />
          <NotificationSettings />
          <UserPreferencesSettings />
          <ThemeSettings />
          <AccountSecuritySettings />

          {/* Washer-Specific Settings */}
          {isApprovedWasher && (
            <>
              <ServiceAreaSettings />
              <EquipmentSettings />
              {/* Add more washer-specific settings cards here */}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
