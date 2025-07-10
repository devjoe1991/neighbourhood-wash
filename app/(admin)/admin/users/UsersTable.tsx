'use client'

import React, { useState, useEffect } from 'react'
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
import { Search, Users } from 'lucide-react'
import { AdminPageUser } from './page'

interface UsersTableProps {
  users: AdminPageUser[]
}

export default function UsersTable({ users }: UsersTableProps) {
  const [filteredUsers, setFilteredUsers] = useState<AdminPageUser[]>(users)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  useEffect(() => {
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
  }, [users, searchTerm, roleFilter])

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

  return (
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
                      <Badge variant={getRoleBadgeVariant(user.role || 'user')}>
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
  )
}
