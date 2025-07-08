'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Shield, Check, Clock, Package, Truck } from 'lucide-react'
import { WasherBooking } from '@/app/washer/dashboard/actions'
import { verifyPin } from '@/app/washer/dashboard/actions'
import { toast } from 'sonner'

interface PinInputProps {
  booking: WasherBooking
  onVerificationSuccess: () => void
}

export default function PinInput({
  booking,
  onVerificationSuccess,
}: PinInputProps) {
  const [collectionPin, setCollectionPin] = useState('')
  const [deliveryPin, setDeliveryPin] = useState('')
  const [isVerifyingCollection, setIsVerifyingCollection] = useState(false)
  const [isVerifyingDelivery, setIsVerifyingDelivery] = useState(false)

  const isCollectionVerified = !!booking.collection_verified_at
  const isDeliveryVerified = !!booking.delivery_verified_at

  const handleVerifyCollection = async () => {
    if (collectionPin.length !== 4) {
      toast.error('Please enter a 4-digit PIN')
      return
    }

    setIsVerifyingCollection(true)

    try {
      const result = await verifyPin(booking.id, 'collection', collectionPin)

      if (result.success) {
        toast.success(result.message)
        setCollectionPin('')
        onVerificationSuccess()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error('Error verifying collection PIN:', error)
      toast.error('Failed to verify PIN')
    } finally {
      setIsVerifyingCollection(false)
    }
  }

  const handleVerifyDelivery = async () => {
    if (deliveryPin.length !== 4) {
      toast.error('Please enter a 4-digit PIN')
      return
    }

    setIsVerifyingDelivery(true)

    try {
      const result = await verifyPin(booking.id, 'delivery', deliveryPin)

      if (result.success) {
        toast.success(result.message)
        setDeliveryPin('')
        onVerificationSuccess()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error('Error verifying delivery PIN:', error)
      toast.error('Failed to verify PIN')
    } finally {
      setIsVerifyingDelivery(false)
    }
  }

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Shield className='h-5 w-5' />
          PIN Verification
        </CardTitle>
        <p className='text-sm text-gray-600'>
          Verify handovers with the customer using their unique PINs
        </p>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Collection PIN Section */}
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Package className='h-5 w-5 text-blue-600' />
              <h4 className='font-semibold text-gray-900'>
                Collection Verification
              </h4>
            </div>
            <Badge
              variant={isCollectionVerified ? 'default' : 'secondary'}
              className={
                isCollectionVerified ? 'bg-green-100 text-green-800' : ''
              }
            >
              {isCollectionVerified ? (
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

          {isCollectionVerified ? (
            <div className='rounded-lg bg-green-50 p-4'>
              <p className='text-sm text-green-800'>
                ✓ Collection verified on{' '}
                {formatDateTime(booking.collection_verified_at)}
              </p>
            </div>
          ) : (
            <div className='space-y-3'>
              <div>
                <Label htmlFor='collection-pin'>Enter Collection PIN</Label>
                <p className='mb-2 text-sm text-gray-600'>
                  Ask the customer for their 4-digit collection PIN
                </p>
                <div className='flex gap-2'>
                  <Input
                    id='collection-pin'
                    type='text'
                    value={collectionPin}
                    onChange={(e) => {
                      const value = e.target.value
                        .replace(/\D/g, '')
                        .slice(0, 4)
                      setCollectionPin(value)
                    }}
                    placeholder='1234'
                    maxLength={4}
                    className='w-32 text-center font-mono text-lg tracking-widest'
                  />
                  <Button
                    onClick={handleVerifyCollection}
                    disabled={
                      collectionPin.length !== 4 || isVerifyingCollection
                    }
                    className='gap-2'
                  >
                    <Package className='h-4 w-4' />
                    {isVerifyingCollection
                      ? 'Verifying...'
                      : 'Confirm Collection'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Delivery PIN Section - only show if collection is verified */}
        {isCollectionVerified && (
          <div className='space-y-4 border-t pt-6'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Truck className='h-5 w-5 text-green-600' />
                <h4 className='font-semibold text-gray-900'>
                  Delivery Verification
                </h4>
              </div>
              <Badge
                variant={isDeliveryVerified ? 'default' : 'secondary'}
                className={
                  isDeliveryVerified ? 'bg-green-100 text-green-800' : ''
                }
              >
                {isDeliveryVerified ? (
                  <>
                    <Check className='mr-1 h-3 w-3' />
                    Completed
                  </>
                ) : (
                  <>
                    <Clock className='mr-1 h-3 w-3' />
                    Awaiting
                  </>
                )}
              </Badge>
            </div>

            {isDeliveryVerified ? (
              <div className='rounded-lg bg-green-50 p-4'>
                <p className='text-sm text-green-800'>
                  ✓ Delivery verified on{' '}
                  {formatDateTime(booking.delivery_verified_at)}
                </p>
              </div>
            ) : (
              <div className='space-y-3'>
                <div>
                  <Label htmlFor='delivery-pin'>Enter Delivery PIN</Label>
                  <p className='mb-2 text-sm text-gray-600'>
                    Ask the customer for their 4-digit delivery PIN
                  </p>
                  <div className='flex gap-2'>
                    <Input
                      id='delivery-pin'
                      type='text'
                      value={deliveryPin}
                      onChange={(e) => {
                        const value = e.target.value
                          .replace(/\D/g, '')
                          .slice(0, 4)
                        setDeliveryPin(value)
                      }}
                      placeholder='1234'
                      maxLength={4}
                      className='w-32 text-center font-mono text-lg tracking-widest'
                    />
                    <Button
                      onClick={handleVerifyDelivery}
                      disabled={deliveryPin.length !== 4 || isVerifyingDelivery}
                      className='gap-2'
                    >
                      <Truck className='h-4 w-4' />
                      {isVerifyingDelivery
                        ? 'Verifying...'
                        : 'Confirm Delivery'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Information Section */}
        <div className='rounded-lg bg-blue-50 p-4'>
          <div className='flex items-start gap-3'>
            <div className='flex h-6 w-6 items-center justify-center rounded-full bg-blue-100'>
              <Shield className='h-4 w-4 text-blue-600' />
            </div>
            <div className='flex-1'>
              <h5 className='mb-2 font-medium text-blue-900'>
                PIN Verification Process
              </h5>
              <ul className='space-y-1 text-sm text-blue-800'>
                <li>
                  • Collection PIN: Verify when receiving laundry from customer
                </li>
                <li>
                  • Delivery PIN: Verify when returning clean laundry to
                  customer
                </li>
                <li>• Each PIN can only be used once for security</li>
                <li>• Contact support if there are any PIN issues</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
