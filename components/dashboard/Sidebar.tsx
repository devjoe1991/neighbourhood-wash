'use client'

import Link from 'next/link'
// import { createClient } from '@/utils/supabase/server_new' // Cannot use server client
import { createBrowserClient } from '@supabase/ssr' // Example for client-side Supabase
import { useEffect, useState } from 'react'
import { type User } from '@supabase/supabase-js'
import { X } from 'lucide-react' // For an optional close button

interface SidebarProps {
  closeSidebar?: () => void
}

const Sidebar = ({ closeSidebar }: SidebarProps) => {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ) // Use client-side Supabase
  const [_user, _setUser] = useState<User | null>(null)
  const [isApprovedWasher, setIsApprovedWasher] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      const { data: userData, error: authError } = await supabase.auth.getUser()

      if (authError) {
        console.error('Sidebar: Auth error:', authError)
        _setUser(null)
        setIsApprovedWasher(false)
        setIsLoading(false)
        return
      }

      if (!userData.user) {
        _setUser(null)
        setIsApprovedWasher(false)
        setIsLoading(false)
        return
      }

      _setUser(userData.user)

      // Fetch profile to check washer_status
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('washer_status, role')
        .eq('id', userData.user.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Sidebar: Error fetching profile:', profileError)
      }

      setIsApprovedWasher(
        profile?.role === 'WASHER' && profile?.washer_status === 'approved'
      )
      setIsLoading(false)
    }

    fetchData()
  }, [supabase])

  // The className is now largely controlled by the parent DashboardLayout for show/hide.
  // We keep base styling here.
  return (
    <aside className='flex h-full w-full flex-col bg-gray-800 p-4 text-white'>
      {/* Optional: Mobile header within sidebar with a close button */}
      <div className='mb-4 flex items-center justify-between md:hidden'>
        <h2 className='text-lg font-semibold'>Menu</h2>
        {closeSidebar && (
          <button
            onClick={closeSidebar}
            className='rounded p-1 text-white hover:bg-gray-700'
          >
            <X size={20} />
          </button>
        )}
      </div>

      {isLoading ? (
        <div className='py-10 text-center'>Loading...</div>
      ) : (
        <nav className='mt-4 flex-grow'>
          <ul>
            <li className='mb-2'>
              <Link
                href='/dashboard'
                className='block rounded px-2 py-1 hover:bg-gray-700 hover:text-blue-300'
                onClick={closeSidebar} // Close sidebar on link click for mobile
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
                onClick={closeSidebar}
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
                  onClick={closeSidebar}
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
                onClick={closeSidebar}
              >
                Settings
              </Link>
            </li>
            {/* Add more links as needed */}
          </ul>
        </nav>
      )}

      <div className='mt-auto'>
        {' '}
        {/* Pushes beta version to bottom */}
        <p className='rounded bg-blue-600 p-2 text-center text-xs font-semibold text-white'>
          Soft Launch - Beta Version
        </p>
      </div>
    </aside>
  )
}

export default Sidebar
