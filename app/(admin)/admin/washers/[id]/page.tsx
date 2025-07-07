'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Loader2,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Wrench,
  FileText,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { updateApplicationStatus } from '../../actions'

interface WasherApplication {
  id: string
  user_id: string
  created_at: string
  status: string
  phone_number: string
  service_address: string
  service_offerings: string[]
  offers_collection: boolean
  collection_radius: number | null
  collection_fee: number | null
  equipment_details: string
  washer_bio: string
  profiles:
    | {
        first_name: string | null
        last_name: string | null
        email: string | null
      }[]
    | null
}

export default function WasherDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [application, setApplication] = useState<WasherApplication | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(
    null
  )
  const supabase = createClient()

  // Resolve params in useEffect
  useEffect(() => {
    const resolveParams = async () => {
      const resolved = await params
      setResolvedParams(resolved)
    }
    resolveParams()
  }, [params])

  useEffect(() => {
    if (resolvedParams) {
      fetchApplication()
    }
  }, [resolvedParams]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchApplication = async () => {
    if (!resolvedParams) return

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
          phone_number,
          service_address,
          service_offerings,
          offers_collection,
          collection_radius,
          collection_fee,
          equipment_details,
          washer_bio,
          profiles (
            first_name,
            last_name,
            email
          )
        `
        )
        .eq('id', resolvedParams.id)
        .single()

      if (error) {
        console.error('Error fetching application:', error)
        toast.error('Failed to fetch application details')
        return
      }

      setApplication(data)
    } catch (err) {
      console.error('Error fetching application:', err)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (newStatus: 'approved' | 'rejected') => {
    if (!application) return

    setProcessing(true)

    try {
      const result = await updateApplicationStatus(
        application.id,
        application.user_id,
        newStatus
      )

      if (result.success) {
        toast.success(result.message)
        await fetchApplication() // Refresh application data
      } else {
        toast.error(result.error || 'Failed to update application status')
      }
    } catch (err) {
      console.error('Error updating application status:', err)
      toast.error('An unexpected error occurred')
    } finally {
      setProcessing(false)
    }
  }

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

  if (loading) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='text-center'>
          <Loader2 className='mx-auto mb-4 h-8 w-8 animate-spin text-blue-600' />
          <p className='text-gray-600'>Loading application details...</p>
        </div>
      </div>
    )
  }

  if (!application) {
    return (
      <div className='container mx-auto p-4'>
        <Card className='mx-auto max-w-md'>
          <CardContent className='pt-6'>
            <div className='text-center'>
              <XCircle className='mx-auto mb-4 h-12 w-12 text-red-500' />
              <h3 className='mb-2 text-lg font-semibold text-gray-900'>
                Application Not Found
              </h3>
              <p className='mb-4 text-gray-600'>
                The requested application could not be found.
              </p>
              <Link href='/admin/washers'>
                <Button variant='outline'>
                  <ArrowLeft className='mr-2 h-4 w-4' />
                  Back to Applications
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isPending = application.status === 'pending_verification'

  return (
    <div className='container mx-auto max-w-4xl p-4'>
      {/* Header */}
      <div className='mb-8 flex items-center justify-between'>
        <div>
          <Link href='/admin/washers'>
            <Button variant='ghost' className='mb-2'>
              <ArrowLeft className='mr-2 h-4 w-4' />
              Back to Applications
            </Button>
          </Link>
          <h1 className='text-3xl font-bold text-gray-900'>
            Washer Application Details
          </h1>
          <p className='mt-2 text-gray-600'>
            Review complete application information before making a decision
          </p>
        </div>
        <Badge
          variant={getBadgeVariant(application.status)}
          className='px-3 py-1 text-sm'
        >
          {getStatusDisplay(application.status)}
        </Badge>
      </div>

      <div className='grid gap-6 lg:grid-cols-3'>
        {/* Main Content */}
        <div className='space-y-6 lg:col-span-2'>
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <User className='h-5 w-5' />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <label className='text-sm font-medium text-gray-700'>
                  Full Name
                </label>
                <p className='text-gray-900'>
                  {application.profiles?.[0]?.first_name &&
                  application.profiles?.[0]?.last_name
                    ? `${application.profiles[0].first_name} ${application.profiles[0].last_name}`
                    : 'Not provided'}
                </p>
              </div>
              <div>
                <label className='text-sm font-medium text-gray-700'>
                  Email Address
                </label>
                <p className='flex items-center gap-2 text-gray-900'>
                  <Mail className='h-4 w-4' />
                  {application.profiles?.[0]?.email || 'Not provided'}
                </p>
              </div>
              <div>
                <label className='text-sm font-medium text-gray-700'>
                  Phone Number
                </label>
                <p className='flex items-center gap-2 text-gray-900'>
                  <Phone className='h-4 w-4' />
                  {application.phone_number}
                </p>
              </div>
              <div>
                <label className='text-sm font-medium text-gray-700'>
                  Service Address
                </label>
                <p className='flex items-center gap-2 text-gray-900'>
                  <MapPin className='h-4 w-4' />
                  {application.service_address}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Service Information */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Wrench className='h-5 w-5' />
                Service Information
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <label className='text-sm font-medium text-gray-700'>
                  Services Offered
                </label>
                <div className='mt-2 flex flex-wrap gap-2'>
                  {application.service_offerings.map((service, index) => (
                    <Badge key={index} variant='outline'>
                      {service
                        .replace(/_/g, ' ')
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <label className='text-sm font-medium text-gray-700'>
                  Collection Service
                </label>
                <p className='text-gray-900'>
                  {application.offers_collection ? 'Yes' : 'No'}
                  {application.offers_collection &&
                    application.collection_radius && (
                      <span className='ml-2 text-gray-600'>
                        (Within {application.collection_radius} miles)
                      </span>
                    )}
                </p>
              </div>
              {application.offers_collection && application.collection_fee && (
                <div>
                  <label className='text-sm font-medium text-gray-700'>
                    Collection Fee
                  </label>
                  <p className='text-gray-900'>£{application.collection_fee}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Equipment & Bio */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <FileText className='h-5 w-5' />
                Equipment & Background
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <label className='text-sm font-medium text-gray-700'>
                  Equipment Details
                </label>
                <p className='whitespace-pre-wrap text-gray-900'>
                  {application.equipment_details}
                </p>
              </div>
              <div>
                <label className='text-sm font-medium text-gray-700'>
                  Washer Bio
                </label>
                <p className='whitespace-pre-wrap text-gray-900'>
                  {application.washer_bio}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className='space-y-6'>
          {/* Application Status */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Calendar className='h-5 w-5' />
                Application Status
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <label className='text-sm font-medium text-gray-700'>
                  Submitted
                </label>
                <p className='text-gray-900'>
                  {new Date(application.created_at).toLocaleDateString(
                    'en-GB',
                    {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    }
                  )}
                </p>
              </div>
              <div>
                <label className='text-sm font-medium text-gray-700'>
                  Current Status
                </label>
                <div className='mt-1'>
                  <Badge variant={getBadgeVariant(application.status)}>
                    {getStatusDisplay(application.status)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          {isPending && (
            <Card>
              <CardHeader>
                <CardTitle>Review Actions</CardTitle>
                <CardDescription>
                  Make a decision on this application
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-3'>
                {/* Approve Button */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      className='w-full bg-green-600 hover:bg-green-700'
                      disabled={processing}
                    >
                      <CheckCircle className='mr-2 h-4 w-4' />
                      Approve Application
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Approve Washer Application
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This will grant the applicant access to the washer
                        dashboard and allow them to receive bookings. Make sure
                        you've reviewed all the details carefully.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleStatusUpdate('approved')}
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
                      className='w-full'
                      disabled={processing}
                    >
                      <XCircle className='mr-2 h-4 w-4' />
                      Reject Application
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Reject Washer Application
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This will deny the applicant access to washer features.
                        This action is reversible, but the applicant will need
                        to be informed of the rejection.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleStatusUpdate('rejected')}
                        className='bg-red-600 hover:bg-red-700'
                      >
                        Reject Application
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                {processing && (
                  <div className='mt-4 flex items-center justify-center'>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin text-blue-600' />
                    <span className='text-sm text-gray-600'>Processing...</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
