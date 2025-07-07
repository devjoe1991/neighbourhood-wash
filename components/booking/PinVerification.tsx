import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Shield, Check, Clock, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { BookingWithWasher } from '@/app/dashboard/my-bookings/actions'

interface PinVerificationProps {
  booking: BookingWithWasher
}

export default function PinVerification({ booking }: PinVerificationProps) {
  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleString('en-GB', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${type} PIN copied to clipboard`)
    } catch (err) {
      console.error('Failed to copy text: ', err)
      toast.error('Failed to copy PIN')
    }
  }

  const renderPinSection = (
    title: string,
    pin: string | null,
    verifiedAt: string | null,
    type: 'Collection' | 'Delivery'
  ) => {
    const isVerified = !!verifiedAt
    const formattedDate = formatDateTime(verifiedAt)

    return (
      <div className='space-y-3'>
        <div className='flex items-center justify-between'>
          <h4 className='font-semibold text-gray-900'>{title}</h4>
          <Badge
            variant={isVerified ? 'default' : 'secondary'}
            className={isVerified ? 'bg-green-100 text-green-800' : ''}
          >
            {isVerified ? (
              <>
                <Check className='mr-1 h-3 w-3' />
                Verified
              </>
            ) : (
              <>
                <Clock className='mr-1 h-3 w-3' />
                Awaiting
              </>
            )}
          </Badge>
        </div>

        {pin ? (
          <div className='rounded-lg border-2 border-dashed border-blue-200 bg-blue-50 p-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <div className='flex h-12 w-12 items-center justify-center rounded-full bg-blue-100'>
                  <Shield className='h-6 w-6 text-blue-600' />
                </div>
                <div>
                  <p className='text-2xl font-bold tracking-wider text-blue-900'>
                    {pin}
                  </p>
                  <p className='text-sm text-blue-600'>4-Digit PIN</p>
                </div>
              </div>
              <Button
                variant='outline'
                size='sm'
                onClick={() => copyToClipboard(pin, type)}
                className='gap-2'
              >
                <Copy className='h-4 w-4' />
                Copy
              </Button>
            </div>
          </div>
        ) : (
          <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
            <p className='text-center text-gray-500'>PIN not yet generated</p>
          </div>
        )}

        <div className='text-sm'>
          <p className='font-medium text-gray-700'>Status:</p>
          {isVerified && formattedDate ? (
            <p className='text-green-600'>✓ Verified on {formattedDate}</p>
          ) : (
            <p className='text-gray-600'>⏳ Awaiting Verification</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Shield className='h-5 w-5' />
          Secure Handover PINs
        </CardTitle>
        <p className='text-sm text-gray-600'>
          Use these unique PINs to verify laundry handovers with your washer
        </p>
      </CardHeader>
      <CardContent className='space-y-6'>
        {renderPinSection(
          'Collection PIN',
          booking.collection_pin,
          booking.collection_verified_at,
          'Collection'
        )}

        <Separator />

        {renderPinSection(
          'Delivery PIN',
          booking.delivery_pin,
          booking.delivery_verified_at,
          'Delivery'
        )}

        {/* Information Section */}
        <div className='rounded-lg bg-amber-50 p-4'>
          <div className='flex items-start gap-3'>
            <div className='flex h-6 w-6 items-center justify-center rounded-full bg-amber-100'>
              <Shield className='h-4 w-4 text-amber-600' />
            </div>
            <div className='flex-1'>
              <h5 className='mb-2 font-medium text-amber-900'>
                How PIN Verification Works
              </h5>
              <ul className='space-y-1 text-sm text-amber-800'>
                <li>
                  • Share your <strong>Collection PIN</strong> when handing over
                  your laundry
                </li>
                <li>• Your washer will verify the PIN to confirm collection</li>
                <li>
                  • Use your <strong>Delivery PIN</strong> when receiving your
                  clean laundry back
                </li>
                <li>• Keep these PINs private and secure</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
