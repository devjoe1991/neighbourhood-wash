'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
  Clock,
  PoundSterling,
  MapPin,
  Sparkles,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { acceptBooking } from '../actions'
import { Badge } from '@/components/ui/badge'

type Booking = {
  id: number
  collection_date: string
  collection_time_slot: string
  total_price: number
  services_config: Record<string, unknown> | null
  special_instructions: string | null
  user_profile: {
    postcode: string | null
  } | null
}

interface AvailableBookingsClientProps {
  bookings: Booking[]
}

const calculateWasherEarnings = (totalPrice: number) => {
  // Assuming a 15% platform commission
  return totalPrice * 0.85
}

const parseServices = (
  config: Record<string, unknown> | null
): {
  baseService: string
  items: number
  addOns: number
} => {
  if (!config)
    return {
      baseService: 'Standard Wash',
      items: 0,
      addOns: 0,
    }
  try {
    const base = (config.baseService as { name: string })?.name || 'Wash'
    const items = (config.selectedItems as { key: string }[])?.length || 0
    const addOns = (config.selectedAddOns as { key: string }[])?.length || 0
    return { baseService: base, items, addOns }
  } catch {
    return {
      baseService: 'Standard Wash',
      items: 0,
      addOns: 0,
    }
  }
}

function BookingCard({ booking }: { booking: Booking }) {
  const [isAccepting, setIsAccepting] = useState(false)
  const router = useRouter()
  const earnings = calculateWasherEarnings(booking.total_price)
  const services = parseServices(booking.services_config)

  const handleAccept = async () => {
    setIsAccepting(true)
    const result = await acceptBooking(booking.id)
    if (result.success) {
      toast.success(result.message)
      router.refresh()
    } else {
      toast.error(result.message)
      setIsAccepting(false)
    }
  }

  return (
    <AlertDialog>
      <Card className='flex flex-col overflow-hidden rounded-lg border shadow-sm transition-all hover:shadow-md'>
        <CardHeader className='bg-gray-50 p-4'>
          <div className='flex items-center gap-3'>
            <MapPin className='h-5 w-5 text-gray-500' />
            <CardTitle className='text-lg font-semibold'>
              Job in {booking.user_profile?.postcode || 'N/A'}
            </CardTitle>
          </div>
          <CardDescription>
            Collection: {new Date(booking.collection_date).toDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent className='flex-grow p-4'>
          <div className='mb-4 space-y-3'>
            <div className='flex items-start justify-between'>
              <div className='flex items-center gap-2 text-sm'>
                <Clock className='mt-1 h-4 w-4 text-gray-500' />
                <span>{booking.collection_time_slot}</span>
              </div>
              <Badge variant='outline'>{services.baseService}</Badge>
            </div>
            {booking.special_instructions && (
              <div className='flex items-start gap-2 rounded-md border bg-blue-50/50 p-2 text-sm text-blue-800'>
                <Info className='mt-0.5 h-4 w-4 flex-shrink-0' />
                <p className='flex-grow'>{booking.special_instructions}</p>
              </div>
            )}
            <div className='flex justify-around pt-2'>
              {services.items > 0 && (
                <div className='text-center'>
                  <p className='font-bold'>{services.items}</p>
                  <p className='text-xs text-gray-500'>Items</p>
                </div>
              )}
              {services.addOns > 0 && (
                <div className='text-center'>
                  <p className='font-bold'>{services.addOns}</p>
                  <p className='text-xs text-gray-500'>Add-ons</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className='mt-auto flex flex-col items-stretch gap-2 border-t bg-gray-50/75 p-4'>
          <div className='flex w-full items-center justify-between'>
            <span className='text-sm text-gray-600'>Your Earnings:</span>
            <div className='flex items-center gap-1 text-lg font-bold text-green-600'>
              <PoundSterling className='h-5 w-5' />
              <span>{earnings.toFixed(2)}</span>
            </div>
          </div>
          <AlertDialogTrigger asChild>
            <Button
              className='w-full'
              disabled={isAccepting}
              variant='default'
            >
              <Sparkles className='mr-2 h-4 w-4' />
              {isAccepting ? 'Accepting...' : 'Accept Booking'}
            </Button>
          </AlertDialogTrigger>
        </CardFooter>
      </Card>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Booking Acceptance</AlertDialogTitle>
          <AlertDialogDescription>
            You are about to accept this booking. Please confirm that you are
            available and ready to complete this job. This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isAccepting}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleAccept} disabled={isAccepting}>
            {isAccepting ? 'Confirming...' : 'Yes, I Confirm'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default function AvailableBookingsClient({
  bookings,
}: AvailableBookingsClientProps) {
  return (
    <div className='grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3'>
      {bookings.map((booking) => (
        <BookingCard key={booking.id} booking={booking} />
      ))}
    </div>
  )
}
