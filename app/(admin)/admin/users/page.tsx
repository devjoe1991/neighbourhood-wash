'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Search, Users, Loader2 } from 'lucide-react'

// Define a more specific User type for our admin page needs
type AdminPageUser = {
  id: string
  email: string | undefined
  created_at: string
  last_sign_in_at?: string | null
  role?: string
  email_confirmed_at?: string | null
  first_name?: string | null
  last_name?: string | null
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminPageUser[]>([])
  const [filteredUsers, setFilteredUsers] = useState<AdminPageUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchUsers()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, roleFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch auth users (requires service role key)
      const {
        data: { users: authUsers },
        error: authError,
      } = await supabase.auth.admin.listUsers()

      if (authError) {
        setError('Failed to fetch users. Admin access required.')
        return
      }

      if (!authUsers) {
        setUsers([])
        return
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

      setUsers(combinedUsers)
    } catch (err) {
      console.error('Error fetching users:', err)
      setError('An unexpected error occurred while fetching users.')
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = users

    // Filter by search term (email or name)
    if (searchTerm) {
      filtered = filtered.filter((user) => {
        const fullName =
          `${user.first_name || ''} ${user.last_name || ''}`.trim()
        const email = user.email || ''
        return (
          email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          fullName.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })
    }

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role === roleFilter)
    }

    setFilteredUsers(filtered)
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive'
      case 'washer':
        return 'default'
      case 'user':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getStatusBadgeVariant = (confirmed: boolean) => {
    return confirmed ? 'default' : 'secondary'
  }

  if (loading) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='text-center'>
          <Loader2 className='mx-auto mb-4 h-8 w-8 animate-spin text-blue-600' />
          <p className='text-gray-600'>Loading users...</p>
        </div>
      </div>
    )
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

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Users className='h-5 w-5' />
            All Users ({filteredUsers.length})
          </CardTitle>
          <CardDescription>
            Search and filter users by role and personal information
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className='mb-6 flex flex-col gap-4 sm:flex-row'>
            <div className='relative flex-1'>
              <Search className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400' />
              <Input
                placeholder='Search by email or name...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='pl-10'
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className='w-full sm:w-40'>
                <SelectValue placeholder='Filter by role' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Roles</SelectItem>
                <SelectItem value='user'>Users</SelectItem>
                <SelectItem value='washer'>Washers</SelectItem>
                <SelectItem value='admin'>Admins</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Last Login</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className='font-medium'>
                        {user.first_name && user.last_name
                          ? `${user.first_name} ${user.last_name}`
                          : 'No name set'}
                      </TableCell>
                      <TableCell>{user.email || 'No email'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={getRoleBadgeVariant(user.role || 'user')}
                        >
                          {(user.role || 'user').charAt(0).toUpperCase() +
                            (user.role || 'user').slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getStatusBadgeVariant(
                            !!user.email_confirmed_at
                          )}
                        >
                          {user.email_confirmed_at ? 'Verified' : 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-sm text-gray-600'>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className='text-sm text-gray-600'>
                        {user.last_sign_in_at
                          ? new Date(user.last_sign_in_at).toLocaleDateString()
                          : 'Never'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className='py-8 text-center'>
                      <Users className='mx-auto mb-2 h-8 w-8 text-gray-400' />
                      <p className='text-gray-500'>
                        {searchTerm || roleFilter !== 'all'
                          ? 'No users match your search criteria'
                          : 'No users found'}
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
