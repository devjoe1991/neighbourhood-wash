import React from 'react'
import { createClient } from '@/utils/supabase/server_new'

type ProfileWithUser = {
  id: string
  role: string
  washer_status: string
  users: {
    email: string
    created_at: string
    last_sign_in_at: string | null
    email_confirmed_at: string | null
  } | null
}

// Define a type for Washer data on the admin page
type AdminPageWasher = {
  id: string
  email: string | undefined
  created_at: string
  last_sign_in_at?: string | null
  role?: string
  application_status?: string // e.g., 'pending_verification', 'approved', 'rejected'
  email_confirmed_at?: string | null
  // Potentially other washer-specific fields from profile
}

async function getWashers(): Promise<AdminPageWasher[]> {
  const supabase = createClient()

  // Ensure SUPABASE_SERVICE_ROLE_KEY is set in your environment variables
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select(
      `
      id,
      role,
      washer_status,
      users (
        email,
        created_at,
        last_sign_in_at,
        email_confirmed_at
      )
    `
    )
    .eq('role', 'washer')

  if (error) {
    console.error('Error fetching washer profiles:', error.message)
    return []
  }

  if (!profiles) {
    return []
  }

  // Map the profiles to the desired shape
  const washers = profiles.map((profile: any): AdminPageWasher => {
    const user = profile.users
    return {
      id: profile.id,
      email: user?.email,
      created_at: user?.created_at,
      last_sign_in_at: user?.last_sign_in_at || null,
      role: profile.role,
      application_status: profile.washer_status || 'N/A',
      email_confirmed_at: user?.email_confirmed_at || null,
    }
  })

  return washers
}

export default async function AdminWashersPage() {
  const washers = await getWashers()

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='mb-6 flex items-center justify-between'>
        <h1 className='text-3xl font-bold text-gray-800 dark:text-white'>
          Washer Management
        </h1>
        {/* TODO: Button for "Approve New Washers" or similar actions */}
        {/* <Button>Filter Pending</Button> */}
      </div>

      <p className='mb-4 text-gray-600 dark:text-gray-300'>
        View, approve, and manage washer profiles and applications. (
        {washers.length} washers found)
      </p>

      {washers.length > 0 ? (
        <div className='overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800'>
          <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
            <thead className='bg-gray-50 dark:bg-gray-700'>
              <tr>
                <th
                  scope='col'
                  className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300'
                >
                  Email
                </th>
                <th
                  scope='col'
                  className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300'
                >
                  Joined
                </th>
                <th
                  scope='col'
                  className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300'
                >
                  Status (Email)
                </th>
                <th
                  scope='col'
                  className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300'
                >
                  App. Status
                </th>
                <th scope='col' className='relative px-6 py-3'>
                  <span className='sr-only'>Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800'>
              {washers.map((washer) => (
                <tr key={washer.id}>
                  <td className='px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900 dark:text-white'>
                    {washer.email || 'N/A'}
                  </td>
                  <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-300'>
                    {new Date(washer.created_at).toLocaleDateString()}
                  </td>
                  <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-300'>
                    {washer.email_confirmed_at ? (
                      <span className='text-green-500'>Verified</span>
                    ) : (
                      <span className='text-yellow-500'>Pending</span>
                    )}
                  </td>
                  <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-300'>
                    {washer.application_status}
                  </td>
                  <td className='px-6 py-4 text-right text-sm font-medium whitespace-nowrap'>
                    {/* TODO: Actions like 'Approve', 'Reject', 'View Profile' */}
                    <a
                      href='#'
                      className='mr-2 text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200'
                    >
                      View
                    </a>
                    {washer.application_status === 'pending_verification' && (
                      <a
                        href='#'
                        className='text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-200'
                      >
                        Approve
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className='rounded-lg bg-white p-6 text-center shadow dark:bg-gray-800'>
          <p className='text-gray-500 dark:text-gray-400'>
            No users with the &apos;washer&apos; role found in the profiles
            table.
          </p>
        </div>
      )}
    </div>
  )
}
