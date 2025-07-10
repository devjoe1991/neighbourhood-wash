'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import PinInput from '@/components/washer/PinInput'
import ChatInterface from '@/components/chat/ChatInterface'
import { WasherBooking } from '../../actions'
import { getBookingDetails } from '../../actions'

interface WasherBookingClientProps {
  booking: WasherBooking
  currentUserId: string | null
}

export default function WasherBookingClient({
  booking: initialBooking,
  currentUserId,
}: WasherBookingClientProps) {
  const [booking, setBooking] = useState(initialBooking)

  const handleVerificationSuccess = useCallback(async () => {
    // Refetch booking details to update the UI
    try {
      const result = await getBookingDetails(booking.id)
      if (result.success && result.data) {
        setBooking(result.data)
      }
    } catch (error) {
      console.error('Error refetching booking:', error)
    }
  }, [booking.id])

  return (
    <div className='space-y-6'>
      {/* PIN Verification */}
      {(booking.status === 'in_progress' || booking.status === 'completed') && (
        <Card>
          <CardHeader>
            <CardTitle>PIN Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <PinInput
              booking={booking}
              onVerificationSuccess={handleVerificationSuccess}
            />
          </CardContent>
        </Card>
      )}

      {/* Chat Interface */}
      {(booking.status === 'in_progress' || booking.status === 'completed') &&
        currentUserId && (
          <Card>
            <CardHeader>
              <CardTitle>Chat with Customer</CardTitle>
            </CardHeader>
            <CardContent>
              <ChatInterface
                bookingId={booking.id}
                currentUserId={currentUserId}
              />
            </CardContent>
          </Card>
        )}
    </div>
  )
}
