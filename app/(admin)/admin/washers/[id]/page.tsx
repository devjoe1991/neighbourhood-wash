import { createClient } from '@/utils/supabase/server_new'
import { notFound } from 'next/navigation'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Phone, Home, WashingMachine, Truck, Info, Text } from 'lucide-react'
import Link from 'next/link'
import { updateApplicationStatus } from '../../actions'

export const dynamic = 'force-dynamic'

type ApplicationStatus = 'approved' | 'pending_verification' | 'rejected'

type ApplicationData = {
  id: string
  user_id: string
  phone_number: string
  service_address: string
  service_offerings: string[]
  offers_collection: boolean
  collection_radius?: number
  collection_fee?: number
  equipment_details: string
  washer_bio: string
  status: ApplicationStatus
  profiles: {
    first_name: string | null
    last_name: string | null
    email: string
  }
}

const getBadgeVariant = (
  status: ApplicationStatus
): 'default' | 'secondary' | 'destructive' | 'outline' => {
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

const DetailRow = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}) => (
  <div className='grid grid-cols-3 items-start gap-4 py-3'>
    <div className='col-span-1 flex items-center text-sm font-medium text-gray-600'>
      {icon}
      <span className='ml-2'>{label}</span>
    </div>
    <div className='col-span-2 text-sm text-gray-800'>{value}</div>
  </div>
)

export default async function ApplicationDetailPage({
  params,
  searchParams: _searchParams,
}: {
  params: { id: string }
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const supabase = createClient()
  const applicationId = params.id

  const { data: application, error } = await supabase
    .from('washer_applications')
    .select(
      `
      *,
      profiles (
        first_name,
        last_name,
        email
      )
    `
    )
    .eq('id', applicationId)
    .single()

  if (error || !application) {
    console.error('Error fetching application:', error)
    return notFound()
  }

  const { profiles: profile, ...appData } = application as ApplicationData

  const approveAction = async (_formData: FormData) => {
    await updateApplicationStatus(applicationId, appData.user_id, 'approved')
  }
  const rejectAction = async (_formData: FormData) => {
    await updateApplicationStatus(applicationId, appData.user_id, 'rejected')
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>Washer Application Details</h1>
        <Button asChild variant='outline'>
          <Link href='/admin/washers'>&larr; Back to Applications</Link>
        </Button>
      </div>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between'>
          <div>
            <CardTitle>
              {profile.first_name || 'Applicant'} {profile.last_name || ''}
            </CardTitle>
            <CardDescription>{profile.email}</CardDescription>
          </div>
          <Badge variant={getBadgeVariant(appData.status)}>
            {appData.status.replace(/_/g, ' ')}
          </Badge>
        </CardHeader>
        <CardContent className='divide-y divide-gray-200'>
          <DetailRow
            icon={<Phone className='h-4 w-4' />}
            label='Phone Number'
            value={appData.phone_number}
          />
          <DetailRow
            icon={<Home className='h-4 w-4' />}
            label='Service Address'
            value={appData.service_address}
          />
          <DetailRow
            icon={<WashingMachine className='h-4 w-4' />}
            label='Services Offered'
            value={
              <div className='flex flex-wrap gap-2'>
                {appData.service_offerings.map((service) => (
                  <Badge key={service} variant='outline'>
                    {service}
                  </Badge>
                ))}
              </div>
            }
          />
          <DetailRow
            icon={<Truck className='h-4 w-4' />}
            label='Collection Offered'
            value={
              appData.offers_collection
                ? `Yes (Radius: ${appData.collection_radius || 'N/A'} miles, Fee: £${
                    appData.collection_fee || '0.00'
                  })`
                : 'No'
            }
          />
          <DetailRow
            icon={<Info className='h-4 w-4' />}
            label='Equipment Details'
            value={
              <p className='whitespace-pre-wrap'>{appData.equipment_details}</p>
            }
          />
          <DetailRow
            icon={<Text className='h-4 w-4' />}
            label='Applicant Bio'
            value={<p className='whitespace-pre-wrap'>{appData.washer_bio}</p>}
          />
        </CardContent>
        {appData.status === 'pending_verification' && (
          <CardFooter className='flex justify-end space-x-4 border-t px-6 py-4'>
            <form action={rejectAction}>
              <Button variant='destructive' type='submit'>
                Reject
              </Button>
            </form>
            <form action={approveAction}>
              <Button type='submit' className='bg-green-600 hover:bg-green-700'>
                Approve
              </Button>
            </form>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
