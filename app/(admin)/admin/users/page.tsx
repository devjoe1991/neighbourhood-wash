import React from 'react'
import { createClient } from '@/utils/supabase/server_new' // For server-side admin actions
import { User as SupabaseUser } from '@supabase/supabase-js'

// Define a more specific User type for our admin page needs
type AdminPageUser = {
  id: string
  email: string | undefined
  created_at: string
  last_sign_in_at?: string | null
  role?: string
  email_confirmed_at?: string | null
  // Add any other fields you might want from user_metadata or the main user object
}

async function getUsers(): Promise<AdminPageUser[]> {
  const supabase = createClient()

  // Check if service_role key is available implicitly, otherwise this call will fail
  // Ensure SUPABASE_SERVICE_ROLE_KEY is set in your environment variables for this to work
  const {
    data: { users },
    error,
  } = await supabase.auth.admin.listUsers()

  if (error) {
    console.error('Error fetching users with admin client:', error.message)
    // Depending on how you want to handle this, you could throw the error
    // or return an empty array, or an array with an error indicator.
    // For now, returning empty array if an error occurs.
    return []
  }

  if (!users) {
    return []
  }

  // Map Supabase user data to our AdminPageUser type
  return users.map((user: SupabaseUser) => ({
    id: user.id,
    email: user.email,
    created_at: user.created_at,
    last_sign_in_at: user.last_sign_in_at || null,
    // Access role from user_metadata or app_metadata
    role: user.user_metadata?.role || user.app_metadata?.role || 'N/A',
    email_confirmed_at: user.email_confirmed_at || null,
  }))
}

export default async function AdminUsersPage() {
  const users = await getUsers()

  return (
    <div className='container mx-auto p-4'>
      <div className='mb-8 text-center'>
        <h1 className='text-3xl font-bold text-gray-800'>User Management</h1>
        <p className='mb-4 text-gray-600'>
          View and manage all registered users on the platform.
        </p>
      </div>

      {users.length > 0 ? (
        <div className='overflow-x-auto rounded-lg bg-white shadow'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th
                  scope='col'
                  className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'
                >
                  Name
                </th>
                <th
                  scope='col'
                  className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'
                >
                  Email
                </th>
                <th
                  scope='col'
                  className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'
                >
                  Role
                </th>
                <th
                  scope='col'
                  className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'
                >
                  Joined
                </th>
                <th
                  scope='col'
                  className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'
                >
                  Status
                </th>
                <th scope='col' className='relative px-6 py-3'>
                  <span className='sr-only'>Edit</span>
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200 bg-white'>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className='px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900'>
                    {user.email || 'N/A'}
                  </td>
                  <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-500'>
                    {user.role}
                  </td>
                  <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-500'>
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-500'>
                    {user.last_sign_in_at
                      ? new Date(user.last_sign_in_at).toLocaleString()
                      : 'Never'}
                  </td>
                  <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-500'>
                    {user.email_confirmed_at ? (
                      <span className='text-green-500'>Verified</span>
                    ) : (
                      <span className='text-yellow-500'>Pending</span>
                    )}
                  </td>
                  <td className='px-6 py-4 text-right text-sm font-medium whitespace-nowrap'>
                    <a
                      href='#'
                      className='text-indigo-600 hover:text-indigo-900'
                    >
                      Edit
                    </a>
                    {/* TODO: Add more actions like 'View Details', 'Suspend', 'Delete' */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className='rounded-lg bg-white p-6 text-center shadow'>
          <p className='text-gray-500'>No users found.</p>
        </div>
      )}
    </div>
  )
}
