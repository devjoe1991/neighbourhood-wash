'use client'

// export const dynamic = 'force-dynamic' // Not typically used with client components in this way

// import { createClientComponentClient } from '@supabase/auth-helpers-nextjs' // Recommended for client components
import { createClient } from '@/utils/supabase/client' // Correct client for @supabase/ssr
import { useRouter } from 'next/navigation' // Removed redirect as useRouter handles it
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
// import { Textarea } from '@/components/ui/textarea' // Commented out due to linter error
// import { Checkbox } from '@/components/ui/checkbox' // Commented out due to linter error
import { Button } from '@/components/ui/button'
import { useState, useEffect, FormEvent } from 'react'
import type { User, SupabaseClient } from '@supabase/supabase-js' // For typing user state
import {
  UserCircleIcon,
  BellIcon,
  ShieldCheckIcon,
  TruckIcon,
  CogIcon,
  PaletteIcon,
  TrashIcon,
  MailIcon,
  Loader2Icon, // For loading state on buttons
} from 'lucide-react'

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
  role?: string | null // Existing field from previous logic
  washer_status?: string | null // Existing field from previous logic
  email?: string | null
}

// User Profile Settings Form
const UserProfileSettings = ({
  userEmail,
  userId,
  supabase,
  initialData,
}: {
  userEmail: string | undefined
  userId: string | undefined
  supabase: SupabaseClient | null
  initialData: ProfileData | null
}) => {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [postcode, setPostcode] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (initialData) {
      setFirstName(initialData.first_name || '')
      setLastName(initialData.last_name || '')
      setPhoneNumber(initialData.phone_number || '')
      setPostcode(initialData.postcode || '')
    }
  }, [initialData])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!supabase || !userId) {
      console.error(
        'UserProfileSettings: Supabase client or User ID not available.'
      )
      // TODO: Show error to user
      return
    }
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        postcode: postcode,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId) // Though upsert with ID should handle it, eq is good for clarity on intent.

    setSaving(false)
    if (error) {
      console.error('Error updating profile:', error)
      // TODO: Show error toast/message to user
    } else {
      console.log('Profile updated successfully!')
      // TODO: Show success toast/message to user
      // TODO: Optionally, refetch profile data in parent or update parent's profile state
    }
  }

  return (
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
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <div>
              <Label htmlFor='firstName'>First Name</Label>
              <Input
                id='firstName'
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder='Enter your first name'
              />
            </div>
            <div>
              <Label htmlFor='lastName'>Last Name</Label>
              <Input
                id='lastName'
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder='Enter your last name'
              />
            </div>
          </div>
          <div>
            <Label htmlFor='email'>Email Address</Label>
            <div className='flex items-center space-x-2'>
              <MailIcon className='h-5 w-5 text-gray-400' />
              <Input
                id='email'
                type='email'
                value={userEmail || ''}
                disabled
                className='cursor-not-allowed bg-gray-100'
              />
            </div>
          </div>
          <div>
            <Label htmlFor='phoneNumber'>Phone Number</Label>
            <Input
              id='phoneNumber'
              type='tel'
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder='Enter your phone number'
            />
          </div>
          <div>
            <Label htmlFor='postcode'>Postcode</Label>
            <Input
              id='postcode'
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              placeholder='Enter your postcode'
            />
          </div>
          <Button type='submit' className='w-full sm:w-auto' disabled={saving}>
            {saving ? (
              <Loader2Icon className='mr-2 h-4 w-4 animate-spin' />
            ) : null}
            {saving ? 'Saving...' : 'Save Profile'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

// Notification Settings Form
const NotificationSettings = ({
  userId,
  supabase,
  initialPrefs,
}: {
  userId: string | undefined
  supabase: SupabaseClient | null
  initialPrefs: { email_all?: boolean } | null | undefined
}) => {
  const [emailNotifications, setEmailNotifications] = useState<boolean>(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setEmailNotifications(initialPrefs?.email_all || false)
  }, [initialPrefs])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!supabase || !userId) {
      console.error(
        'NotificationSettings: Supabase client or User ID not available.'
      )
      return
    }
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        // Using update as we are modifying a specific JSONB field or a dedicated column
        notification_preferences: { email_all: emailNotifications },
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    // If profile might not exist, an upsert is safer:
    // const { error } = await supabase
    //   .from('profiles')
    //   .upsert({
    //     id: userId,
    //     notification_preferences: { email_all: emailNotifications },
    //     updated_at: new Date().toISOString(),
    //   })
    //   .eq('id', userId)

    setSaving(false)
    if (error) {
      console.error('Error updating notification preferences:', error)
    } else {
      console.log('Notification preferences updated successfully!')
    }
  }

  return (
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
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='flex items-center space-x-2'>
            {/* <Checkbox
              id="emailNotifications"
              checked={emailNotifications}
              onCheckedChange={(checked: boolean | 'indeterminate') => {
                if (typeof checked === 'boolean') {
                  setEmailNotifications(checked)
                }
              }}
            /> */}
            <input
              type='checkbox'
              id='emailNotifications'
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
            />
            <Label htmlFor='emailNotifications' className='font-normal'>
              Opt-in to all email notifications (booking updates, promotions,
              news)
            </Label>
          </div>
          <Button type='submit' className='w-full sm:w-auto' disabled={saving}>
            {saving ? (
              <Loader2Icon className='mr-2 h-4 w-4 animate-spin' />
            ) : null}
            {saving ? 'Saving...' : 'Save Notification Preferences'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

// User Preferences Settings Form
const UserPreferencesSettings = ({
  userId,
  supabase,
  initialData,
}: {
  userId: string | undefined
  supabase: SupabaseClient | null
  initialData: ProfileData | null // Using ProfileData for consistency
}) => {
  const [allergies, setAllergies] = useState('')
  const [productPreferences, setProductPreferences] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (initialData) {
      setAllergies(initialData.allergies || '')
      setProductPreferences(initialData.product_preferences || '')
    }
  }, [initialData])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!supabase || !userId) {
      console.error(
        'UserPreferencesSettings: Supabase client or User ID not available.'
      )
      return
    }
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        allergies: allergies,
        product_preferences: productPreferences,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    setSaving(false)
    if (error) {
      console.error('Error updating user preferences:', error)
    } else {
      console.log('User preferences updated successfully!')
    }
  }

  return (
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
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <Label htmlFor='allergies'>Allergies and Sensitivities</Label>
            {/* <Textarea
              id="allergies"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder="e.g., sensitive to strong perfumes, allergic to specific brands"
              rows={3}
            /> */}
            <textarea
              id='allergies'
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder='e.g., sensitive to strong perfumes, allergic to specific brands'
              rows={3}
              className='w-full rounded-md border p-2'
            />
          </div>
          <div>
            <Label htmlFor='productPreferences'>
              Product and Detergent Preferences
            </Label>
            {/* <Textarea
              id="productPreferences"
              value={productPreferences}
              onChange={(e) => setProductPreferences(e.target.value)}
              placeholder="e.g., prefer non-bio, use eco-friendly softeners"
              rows={3}
            /> */}
            <textarea
              id='productPreferences'
              value={productPreferences}
              onChange={(e) => setProductPreferences(e.target.value)}
              placeholder='e.g., prefer non-bio, use eco-friendly softeners'
              rows={3}
              className='w-full rounded-md border p-2'
            />
          </div>
          <Button type='submit' className='w-full sm:w-auto' disabled={saving}>
            {saving ? (
              <Loader2Icon className='mr-2 h-4 w-4 animate-spin' />
            ) : null}
            {saving ? 'Saving...' : 'Save Laundry Preferences'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

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

export default function SettingsPage() {
  // No longer async, it's a client component
  const router = useRouter()
  // const supabase = createClientComponentClient() // OLD - Remove this
  const supabase = createClient() // NEW - Use the client from @/utils/supabase/client
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isApprovedWasher, setIsApprovedWasher] = useState(false)
  const [userRole, setUserRole] = useState('user')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const { data: authData, error: authError } = await supabase.auth.getUser()

      if (authError || !authData.user) {
        console.error('SettingsPage: Auth error or no user', authError)
        router.push('/signin?message=Please sign in to view settings.')
        return
      }
      setUser(authData.user)

      // Fetch all necessary profile fields
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(
          'id, role, washer_status, first_name, last_name, phone_number, postcode, notification_preferences, allergies, product_preferences'
        )
        .eq('id', authData.user.id)
        .single<ProfileData>() // Specify the expected return type

      if (profileError && profileError.code !== 'PGRST116') {
        // PGRST116: row not found, which is fine if new user
        console.warn(
          'SettingsPage: Profile not found or error fetching profile:',
          profileError.message
        )
        // Profile might be null for a new user, this is handled by initialData checks in child components
      }
      setProfile(profileData) // profileData will be null if not found

      if (profileData) {
        setIsApprovedWasher(
          profileData.role === 'washer' &&
            profileData.washer_status === 'approved'
        )
        setUserRole(
          profileData.role ||
            authData.user.user_metadata?.selected_role ||
            'user'
        )
      } else {
        // If no profile, infer role from user_metadata if available, else default to 'user'
        setUserRole(authData.user.user_metadata?.selected_role || 'user')
      }
      setLoading(false)
    }

    fetchData()
     
  }, [supabase, router]) // Removed supabase and router from deps as they are stable for client component client
  // If using a version of supabase client that might change, add it back. For createClientComponentClient, it's usually stable.

  if (loading) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900'>
        <p>Loading settings...</p>{' '}
        {/* Replace with a proper spinner/loader component */}
      </div>
    )
  }

  if (!user) {
    // This case should ideally be handled by the redirect in useEffect, but as a fallback:
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900'>
        <p>Redirecting to sign in...</p>
      </div>
    )
  }

  // const userRole = profile?.role || user.user_metadata?.selected_role || 'user' // Now set in useEffect

  return (
    <div className='flex min-h-screen bg-gray-100 dark:bg-gray-900'>
      {/* Assuming Sidebar is part of a wrapping Layout component based on typical Next.js dashboard structures */}
      {/* <Sidebar /> */}
      <main className='flex-1 p-4 sm:p-6 lg:p-8'>
        <div className='mx-auto max-w-4xl'>
          <h1 className='mb-6 text-2xl font-semibold text-gray-900 dark:text-white'>
            Settings
          </h1>
          <div className='mb-4 rounded-md bg-blue-50 p-4 dark:bg-blue-900/30'>
            <p className='text-sm text-blue-700 dark:text-blue-300'>
              You are managing settings as a{' '}
              <span className='font-semibold'>{userRole}</span>.
              {userRole === 'washer' && !isApprovedWasher && (
                <span className='ml-1 italic'>
                  (Your washer application is pending review or you need to
                  complete it.)
                </span>
              )}
            </p>
          </div>

          <div className='space-y-6'>
            <UserProfileSettings
              userEmail={user?.email}
              userId={user?.id}
              supabase={supabase}
              initialData={profile}
            />
            <NotificationSettings
              userId={user?.id}
              supabase={supabase}
              initialPrefs={profile?.notification_preferences}
            />
            {userRole === 'user' && (
              <UserPreferencesSettings
                userId={user?.id}
                supabase={supabase}
                initialData={profile}
              />
            )}
            <ThemeSettings />
            <AccountSecuritySettings />

            {userRole === 'washer' && isApprovedWasher && (
              <>
                <ServiceAreaSettings />
                <EquipmentSettings />
              </>
            )}
            {userRole === 'washer' && !isApprovedWasher && (
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center'>
                    <TruckIcon className='mr-2 h-5 w-5 text-blue-600' /> Washer
                    Application
                  </CardTitle>
                  <CardDescription>
                    Your application to become a washer is not yet complete or
                    approved.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className='text-sm text-gray-600'>
                    Please complete your application or await approval to access
                    washer-specific settings. You can check your status or
                    complete your application on the{' '}
                    <a
                      href='/dashboard/become-washer'
                      className='text-blue-600 hover:underline'
                    >
                      Become a Washer
                    </a>{' '}
                    page.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
