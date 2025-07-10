import React from 'react'
import { createSupabaseServerClient } from '@/utils/supabase/server'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import UsersTable from './UsersTable'

export const dynamic = 'force-dynamic'

// Define a more specific User type for our admin page needs
export type AdminPageUser = {
  id: string
  email: string | undefined
  created_at: string
  last_sign_in_at?: string | null
  role?: string
  email_confirmed_at?: string | null
  first_name?: string | null
  last_name?: string | null
}

// Server-side data fetching function with admin verification
async function fetchUsers(): Promise<{
  users: AdminPageUser[] | null
  error: string | null
}> {
  try {
    const supabase = createSupabaseServerClient()

    // Verify user authentication and admin role
    const {
      data: { user },
      error: userAuthError,
    } = await supabase.auth.getUser()

    if (userAuthError || !user) {
      return { users: null, error: 'Authentication required' }
    }

    // Verify admin role
    const { data: profile, error: userProfileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userProfileError || !profile) {
      return { users: null, error: 'Failed to verify user permissions' }
    }

    if (profile.role !== 'admin') {
      return { users: null, error: 'Admin access required' }
    }

    // Fetch auth users (requires service role key)
    const {
      data: { users: authUsers },
      error: authError,
    } = await supabase.auth.admin.listUsers()

    if (authError) {
      return {
        users: null,
        error: 'Failed to fetch users. Admin access required.',
      }
    }

    if (!authUsers) {
      return { users: [], error: null }
    }

    // Get user IDs to fetch profile data
    const userIds = authUsers.map((user) => user.id)

    // Fetch profile data for all users
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', userIds)

    if (profileError) {
      console.error('Error fetching profiles:', profileError)
    }

    // Combine auth and profile data
    const combinedUsers: AdminPageUser[] = authUsers.map(
      (user: SupabaseUser) => {
        const profile = profiles?.find((p) => p.id === user.id)
        return {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at || null,
          role: user.user_metadata?.role || user.app_metadata?.role || 'user',
          email_confirmed_at: user.email_confirmed_at || null,
          first_name: profile?.first_name || null,
          last_name: profile?.last_name || null,
        }
      }
    )

    return { users: combinedUsers, error: null }
  } catch (err) {
    console.error('Error fetching users:', err)
    return {
      users: null,
      error: 'An unexpected error occurred while fetching users.',
    }
  }
}

// Server Component with security redirect
export default async function AdminUsersPage() {
  const { users, error } = await fetchUsers()

  // Handle authentication/authorization errors
  if (error === 'Authentication required') {
    redirect('/signin')
  }

  if (error === 'Admin access required') {
    redirect('/user/dashboard')
  }

  if (error) {
    return (
      <div className='container mx-auto p-4'>
        <Card className='mx-auto max-w-md'>
          <CardContent className='pt-6'>
            <div className='text-center'>
              <Users className='mx-auto mb-4 h-12 w-12 text-red-500' />
              <h3 className='mb-2 text-lg font-semibold text-gray-900'>
                Error Loading Users
              </h3>
              <p className='text-gray-600'>{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className='container mx-auto p-4'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900'>User Management</h1>
        <p className='mt-2 text-gray-600'>
          View and manage all registered users on the platform
        </p>
      </div>

      <UsersTable users={users || []} />
    </div>
  )
}
