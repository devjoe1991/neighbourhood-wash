'use client'

import { useState, useMemo } from 'react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
import { useRouter } from 'next/navigation'

interface Application {
  id: string
  user_id: string
  created_at: string
  status: string
  service_address: string | null
  profiles:
    | {
        first_name: string | null
        last_name: string | null
        email: string | null
        stripe_account_id: string | null
        stripe_account_status: string | null
        availability_schedule: Record<string, unknown> | null
      }[]
    | null
}

interface WashersTableClientProps {
  applications: Application[]
}

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

const getStatusDisplay = (status: string) => {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
}

export default function WashersTableClient({
  applications,
}: WashersTableClientProps) {
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [serviceAreaFilter, setServiceAreaFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const router = useRouter()

  // London boroughs for filtering (not currently used but kept for future enhancement)
  // const londonBoroughs = [
  //   'Barking and Dagenham', 'Barnet', 'Bexley', 'Brent', 'Bromley', 'Camden',
  //   'Croydon', 'Ealing', 'Enfield', 'Greenwich', 'Hackney', 'Hammersmith and Fulham',
  //   'Haringey', 'Harrow', 'Havering', 'Hillingdon', 'Hounslow', 'Islington',
  //   'Kensington and Chelsea', 'Kingston upon Thames', 'Lambeth', 'Lewisham',
  //   'Merton', 'Newham', 'Redbridge', 'Richmond upon Thames', 'Southwark',
  //   'Sutton', 'Tower Hamlets', 'Waltham Forest', 'Wandsworth', 'Westminster', 'City of London'
  // ]

  // Filter applications based on search and filters
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      // Search filter (name or email)
      const searchMatch = searchTerm === '' || 
        (app.profiles?.[0]?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         app.profiles?.[0]?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         app.profiles?.[0]?.email?.toLowerCase().includes(searchTerm.toLowerCase()))

      // Service area filter
      const serviceAreaMatch = serviceAreaFilter === 'all' || 
        app.service_address === serviceAreaFilter

      // Status filter
      const statusMatch = statusFilter === 'all' || app.status === statusFilter

      return searchMatch && serviceAreaMatch && statusMatch
    })
  }, [applications, searchTerm, serviceAreaFilter, statusFilter])

  // Get unique service areas from applications for filter dropdown
  const availableServiceAreas = useMemo(() => {
    const areas = new Set<string>()
    applications.forEach(app => {
      if (app.service_address) {
        areas.add(app.service_address)
      }
    })
    return Array.from(areas).sort()
  }, [applications])

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
        // Refresh the page to show updated data
        router.refresh()
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

  return (
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
        {/* Filters Section */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="serviceArea">Service Area</Label>
            <Select value={serviceAreaFilter} onValueChange={setServiceAreaFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All areas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Areas</SelectItem>
                {availableServiceAreas.map((area) => (
                  <SelectItem key={area} value={area}>
                    {area}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending_verification">Pending Verification</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('')
                setServiceAreaFilter('all')
                setStatusFilter('all')
              }}
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredApplications.length} of {applications.length} applications
        </div>

        {filteredApplications.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Service Area</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>App Status</TableHead>
                <TableHead>KYC Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplications.map((app) => (
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
                    <Badge variant="outline" className="text-xs">
                      {app.service_address || 'Not specified'}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-sm text-gray-600'>
                    {new Date(app.created_at).toLocaleDateString('en-GB')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getBadgeVariant(app.status)}>
                      {getStatusDisplay(app.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {app.profiles?.[0]?.stripe_account_id ? (
                      <Badge 
                        variant={
                          app.profiles[0].stripe_account_status === 'complete' 
                            ? 'default' 
                            : app.profiles[0].stripe_account_status === 'pending'
                            ? 'secondary'
                            : app.profiles[0].stripe_account_status === 'requires_action'
                            ? 'destructive'
                            : 'outline'
                        }
                      >
                        {app.profiles[0].stripe_account_status 
                          ? getStatusDisplay(app.profiles[0].stripe_account_status)
                          : 'Unknown'
                        }
                      </Badge>
                    ) : (
                      <Badge variant='outline'>Not Started</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      <Link href={`/admin/washers/${app.id}`}>
                        <Button variant='outline' size='sm'>
                          <Eye className='mr-1 h-4 w-4' />
                          View Details
                        </Button>
                      </Link>

                      {app.status === 'pending_verification' && (
                        <>
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
                                  access to the washer dashboard and allow them
                                  to receive bookings.
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
                                  application? This action will deny the
                                  applicant access to washer features. Consider
                                  reviewing the application details first.
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
                        </>
                      )}

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
            <Users className='mx-auto mb-2 h-8 w-8 text-gray-400' />
            <p className='text-gray-500'>No applications found</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
