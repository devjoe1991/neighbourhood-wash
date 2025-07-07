'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { CheckCircle, XCircle, Eye, Users, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { updateApplicationStatus } from '../actions'

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

export default function AdminWashersPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchApplications()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchApplications = async () => {
    try {
      setLoading(true)
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
        toast.error('Failed to fetch washer applications')
        return
      }
      setApplications(data || [])
    } catch (err) {
      console.error('Error fetching applications:', err)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (
    applicationId: string,
    userId: string,
    newStatus: 'approved' | 'rejected'
  ) => {
    setProcessingId(applicationId)

    try {
      const result = await updateApplicationStatus(
        applicationId,
        userId,
        newStatus
      )

      if (result.success) {
        toast.success(result.message)
        // Refresh applications data
        await fetchApplications()
      } else {
        toast.error(result.error || 'Failed to update application status')
      }
    } catch (err) {
      console.error('Error updating application status:', err)
      toast.error('An unexpected error occurred')
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusDisplay = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  }

  if (loading) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='text-center'>
          <Loader2 className='mx-auto mb-4 h-8 w-8 animate-spin text-blue-600' />
          <p className='text-gray-600'>Loading washer applications...</p>
        </div>
      </div>
    )
  }

  const pendingApplications = applications.filter(
    (app) => app.status === 'pending_verification'
  )

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
                    <TableCell className='text-sm text-gray-600'>
                      {new Date(app.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(app.status)}>
                        {getStatusDisplay(app.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <Link href={`/admin/washers/${app.id}`}>
                          <Button variant='outline' size='sm'>
                            <Eye className='mr-1 h-4 w-4' />
                            View
                          </Button>
                        </Link>

                        {/* Approve Button */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant='default'
                              size='sm'
                              disabled={processingId === app.id}
                            >
                              <CheckCircle className='mr-1 h-4 w-4' />
                              Approve
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Approve Washer Application
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to approve this washer
                                application? This will grant the applicant
                                access to the washer dashboard and allow them to
                                receive bookings.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleStatusUpdate(
                                    app.id,
                                    app.user_id,
                                    'approved'
                                  )
                                }
                                className='bg-green-600 hover:bg-green-700'
                              >
                                Approve Application
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        {/* Reject Button */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant='destructive'
                              size='sm'
                              disabled={processingId === app.id}
                            >
                              <XCircle className='mr-1 h-4 w-4' />
                              Reject
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Reject Washer Application
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to reject this washer
                                application? This action will deny the applicant
                                access to washer features. Consider reviewing
                                the application details first.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleStatusUpdate(
                                    app.id,
                                    app.user_id,
                                    'rejected'
                                  )
                                }
                                className='bg-red-600 hover:bg-red-700'
                              >
                                Reject Application
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        {processingId === app.id && (
                          <Loader2 className='h-4 w-4 animate-spin text-blue-600' />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className='py-8 text-center'>
              <CheckCircle className='mx-auto mb-2 h-8 w-8 text-green-500' />
              <p className='text-gray-500'>No pending applications to review</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Applications - Historical View */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Users className='h-5 w-5' />
            All Applications ({applications.length})
          </CardTitle>
          <CardDescription>
            Complete history of all washer applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {applications.length > 0 ? (
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
                {applications.map((app) => (
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
                    <TableCell className='text-sm text-gray-600'>
                      {new Date(app.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(app.status)}>
                        {getStatusDisplay(app.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/washers/${app.id}`}>
                        <Button variant='outline' size='sm'>
                          <Eye className='mr-1 h-4 w-4' />
                          View Details
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className='py-8 text-center'>
              <Users className='mx-auto mb-2 h-8 w-8 text-gray-400' />
              <p className='text-gray-500'>No applications found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
