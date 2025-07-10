import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Eye, Users } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/utils/supabase/server'
import WashersTableClient from './WashersTableClient'

export const dynamic = 'force-dynamic'

// Function to determine badge variant based on status
const getBadgeVariant = (status: string) => {
  switch (status) {
    case 'approved':
      return 'default'
    case 'pending_verification':
      return 'secondary'
    case 'rejected':
      return 'destructive'
    default:
      return 'outline'
  }
}

interface Application {
  id: string
  user_id: string
  created_at: string
  status: string
  profiles:
    | {
        first_name: string | null
        last_name: string | null
        email: string | null
      }[]
    | null
}

async function fetchApplications(): Promise<{
  applications: Application[] | null
  error: string | null
}> {
  try {
    const supabase = createSupabaseServerClient()

    // Verify user authentication and admin role
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { applications: null, error: 'Authentication required' }
    }

    // Verify admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return { applications: null, error: 'Failed to verify user permissions' }
    }

    if (profile.role !== 'admin') {
      return { applications: null, error: 'Admin access required' }
    }

    const { data, error } = await supabase
      .from('washer_applications')
      .select(
        `
        id,
        user_id,
        created_at,
        status,
        profiles (
          first_name,
          last_name,
          email
        )
      `
      )
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching washer applications:', error)
      return {
        applications: null,
        error: 'Failed to fetch washer applications',
      }
    }

    return { applications: data || [], error: null }
  } catch (err) {
    console.error('Error fetching applications:', err)
    return { applications: null, error: 'An unexpected error occurred' }
  }
}

const getStatusDisplay = (status: string) => {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
}

export default async function AdminWashersPage() {
  const { applications, error } = await fetchApplications()

  // Handle authentication/authorization errors
  if (error === 'Authentication required') {
    redirect('/signin')
  }

  if (error === 'Admin access required') {
    redirect('/user/dashboard')
  }

  if (error) {
    return (
      <div className='container mx-auto space-y-8 p-4'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>
            Washer Management
          </h1>
          <p className='mt-2 text-gray-600'>
            Review and manage washer applications to maintain platform quality
          </p>
        </div>
        <Card>
          <CardContent className='pt-6'>
            <div className='text-center'>
              <Users className='mx-auto mb-4 h-12 w-12 text-red-500' />
              <h3 className='mb-2 text-lg font-semibold text-gray-900'>
                Error Loading Applications
              </h3>
              <p className='text-gray-600'>{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const pendingApplications =
    applications?.filter((app) => app.status === 'pending_verification') || []

  return (
    <div className='container mx-auto space-y-8 p-4'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900'>Washer Management</h1>
        <p className='mt-2 text-gray-600'>
          Review and manage washer applications to maintain platform quality
        </p>
      </div>

      {/* Pending Applications - Priority Section */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Users className='h-5 w-5 text-orange-600' />
            Pending Applications ({pendingApplications.length})
          </CardTitle>
          <CardDescription>
            Applications requiring immediate review and approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingApplications.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingApplications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className='font-medium'>
                      {app.profiles?.[0]?.first_name &&
                      app.profiles?.[0]?.last_name
                        ? `${app.profiles[0].first_name} ${app.profiles[0].last_name}`
                        : 'No name set'}
                    </TableCell>
                    <TableCell>
                      {app.profiles?.[0]?.email || 'No email'}
                    </TableCell>
                    <TableCell>
                      {new Date(app.created_at).toLocaleDateString('en-GB')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(app.status)}>
                        {getStatusDisplay(app.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className='flex gap-2'>
                        <Link href={`/admin/washers/${app.id}`}>
                          <Button variant='outline' size='sm' className='gap-1'>
                            <Eye className='h-3 w-3' />
                            Review
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className='py-8 text-center'>
              <CheckCircle className='mx-auto mb-4 h-12 w-12 text-green-500' />
              <h3 className='mb-2 text-lg font-semibold text-gray-900'>
                All Caught Up!
              </h3>
              <p className='text-gray-600'>
                No pending applications require your review at this time.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Applications */}
      <WashersTableClient applications={applications || []} />
    </div>
  )
}
