import Link from 'next/link'
import { createClient } from '@/utils/supabase/server_new'

const Sidebar = async () => {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let isApprovedWasher = false
  // const userRole = user?.user_metadata?.selected_role // Removed unused variable

  if (user) {
    // Fetch profile to check washer_status, only if they have a user record
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('washer_status, role') // Assuming role is also in profiles to confirm they are a washer
      .eq('id', user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Sidebar: Error fetching profile:', profileError)
    }

    // A user is an approved washer if their role in profiles is WASHER and status is approved
    // Or, if selected_role at signup was 'washer' and their profile indicates approved status.
    isApprovedWasher =
      profile?.role === 'WASHER' && profile?.washer_status === 'approved'
  }

  return (
    <aside className='fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-gray-800 p-4 text-white'>
      <nav className='mt-4'>
        <ul>
          <li className='mb-2'>
            <Link
              href='/dashboard'
              className='block rounded px-2 py-1 hover:bg-gray-700 hover:text-blue-300'
            >
              Overview
            </Link>
          </li>
          {/* <li className="mb-2">
            <Link href="/dashboard/bookings" className="block rounded px-2 py-1 hover:bg-gray-700 hover:text-blue-300">
              My Bookings
            </Link>
          </li> */}
          <li className='mb-2'>
            <Link
              href='/dashboard/referrals'
              className='block rounded px-2 py-1 hover:bg-gray-700 hover:text-blue-300'
            >
              Referrals
            </Link>
          </li>

          {/* Show "Become a Washer" if the user is not yet an approved washer */}
          {!isApprovedWasher && (
            <li className='mb-2'>
              <Link
                href='/dashboard/become-washer'
                className='block rounded px-2 py-1 hover:bg-gray-700 hover:text-blue-300'
              >
                Become a Washer
              </Link>
            </li>
          )}

          {/* Example: Show Washer-specific links if they are an approved washer */}
          {isApprovedWasher && (
            <>
              {/* <li className='mb-2'>
                <Link
                  href='/dashboard/washer-hub' // Placeholder
                  className='block rounded px-2 py-1 hover:bg-gray-700 hover:text-blue-300'
                >
                  Washer Hub
                </Link>
              </li> */}
              {/* <li className='mb-2'>
                <Link
                  href='/dashboard/manage-services' // Placeholder
                  className='block rounded px-2 py-1 hover:bg-gray-700 hover:text-blue-300'
                >
                  Manage Services
                </Link>
              </li> */}
            </>
          )}

          <li className='mb-2'>
            <Link
              href='/dashboard/settings'
              className='block rounded px-2 py-1 hover:bg-gray-700 hover:text-blue-300'
            >
              Settings
            </Link>
          </li>
          {/* Add more links as needed */}
        </ul>
      </nav>
      <div className='absolute bottom-4 left-4 w-[calc(100%-2rem)]'>
        <p className='rounded bg-blue-600 p-2 text-center text-xs font-semibold text-white'>
          Soft Launch - Beta Version
        </p>
      </div>
    </aside>
  )
}

export default Sidebar
