'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import {
  PoundSterling,
  Info,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from 'lucide-react'
import { createPayoutRequest } from '@/app/dashboard/user-payouts/actions'
import { toast } from 'sonner'

interface PayoutRequestFormProps {
  availableBalance: number
  minimumPayout: number
  withdrawalFee: number
  onSuccess: () => void
}

export default function PayoutRequestForm({
  availableBalance,
  minimumPayout = 10,
  withdrawalFee = 2.5,
  onSuccess,
}: PayoutRequestFormProps) {
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const requestedAmount = parseFloat(amount) || 0
  const netAmount = Math.max(0, requestedAmount - withdrawalFee)
  const isValidAmount =
    requestedAmount >= minimumPayout && requestedAmount <= availableBalance

  const handleSubmit = async () => {
    if (!isValidAmount) return

    setIsSubmitting(true)
    try {
      const result = await createPayoutRequest(requestedAmount, notes.trim())

      if (result.success) {
        toast.success(result.message)
        setAmount('')
        setNotes('')
        setShowConfirmation(false)
        onSuccess()
      } else {
        toast.error(result.message || 'Failed to create payout request')
      }
    } catch (error) {
      console.error('Error submitting payout request:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatCurrency = (value: number) => `£${value.toFixed(2)}`

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <PoundSterling className='h-5 w-5' />
          Request Payout
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Available Balance Display */}
        <div className='rounded-lg bg-blue-50 p-4'>
          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium text-blue-900'>
              Available Balance
            </span>
            <span className='text-lg font-bold text-blue-900'>
              {formatCurrency(availableBalance)}
            </span>
          </div>
        </div>

        {/* Minimum Payout Info */}
        {availableBalance < minimumPayout && (
          <Alert>
            <Info className='h-4 w-4' />
            <AlertDescription>
              Minimum payout amount is {formatCurrency(minimumPayout)}. Complete
              more bookings to reach the minimum threshold.
            </AlertDescription>
          </Alert>
        )}

        {/* Payout Request Form */}
        {availableBalance >= minimumPayout && (
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='amount'>Payout Amount</Label>
              <div className='relative'>
                <PoundSterling className='absolute top-3 left-3 h-4 w-4 text-gray-400' />
                <Input
                  id='amount'
                  type='number'
                  step='0.01'
                  min={minimumPayout}
                  max={availableBalance}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`${minimumPayout}.00`}
                  className='pl-10'
                />
              </div>
              <div className='flex justify-between text-xs text-gray-500'>
                <span>Min: {formatCurrency(minimumPayout)}</span>
                <span>Max: {formatCurrency(availableBalance)}</span>
              </div>
            </div>

            {/* Fee Breakdown */}
            {requestedAmount > 0 && (
              <div className='space-y-2 rounded-lg border bg-gray-50 p-3'>
                <h4 className='text-sm font-medium'>Payout Breakdown</h4>
                <div className='space-y-1 text-sm'>
                  <div className='flex justify-between'>
                    <span>Requested amount:</span>
                    <span>{formatCurrency(requestedAmount)}</span>
                  </div>
                  <div className='flex justify-between text-orange-600'>
                    <span>Withdrawal fee:</span>
                    <span>-{formatCurrency(withdrawalFee)}</span>
                  </div>
                  <Separator />
                  <div className='flex justify-between font-medium'>
                    <span>You'll receive:</span>
                    <span className='text-green-600'>
                      {formatCurrency(netAmount)}
                    </span>
                  </div>
                </div>
                <div className='mt-3 flex items-start gap-2 rounded bg-blue-50 p-2 text-xs text-blue-700'>
                  <Info className='mt-0.5 h-3 w-3 flex-shrink-0' />
                  <span>
                    Payouts are processed within 2-3 business days after admin
                    approval. The withdrawal fee helps cover payment processing
                    costs.
                  </span>
                </div>
              </div>
            )}

            {/* Optional Notes */}
            <div className='space-y-2'>
              <Label htmlFor='notes'>Additional Notes (Optional)</Label>
              <Textarea
                id='notes'
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder='Any additional information about this payout request...'
                rows={3}
                maxLength={500}
              />
              <div className='text-right text-xs text-gray-500'>
                {notes.length}/500
              </div>
            </div>

            {/* Validation Messages */}
            {amount && !isValidAmount && (
              <Alert variant='destructive'>
                <AlertTriangle className='h-4 w-4' />
                <AlertDescription>
                  {requestedAmount < minimumPayout
                    ? `Amount must be at least ${formatCurrency(minimumPayout)}`
                    : `Amount cannot exceed your available balance of ${formatCurrency(availableBalance)}`}
                </AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
              <DialogTrigger asChild>
                <Button
                  className='w-full'
                  disabled={!isValidAmount || isSubmitting}
                  size='lg'
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Processing...
                    </>
                  ) : (
                    <>
                      <PoundSterling className='mr-2 h-4 w-4' />
                      Request Payout
                    </>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Payout Request</DialogTitle>
                  <DialogDescription>
                    Please review your payout request details below.
                  </DialogDescription>
                </DialogHeader>
                <div className='space-y-4'>
                  <div className='rounded-lg border p-4'>
                    <div className='space-y-2'>
                      <div className='flex justify-between'>
                        <span>Requested amount:</span>
                        <span className='font-medium'>
                          {formatCurrency(requestedAmount)}
                        </span>
                      </div>
                      <div className='flex justify-between text-orange-600'>
                        <span>Withdrawal fee:</span>
                        <span>-{formatCurrency(withdrawalFee)}</span>
                      </div>
                      <Separator />
                      <div className='flex justify-between text-lg font-semibold'>
                        <span>Net amount:</span>
                        <span className='text-green-600'>
                          {formatCurrency(netAmount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {notes && (
                    <div>
                      <Label>Notes:</Label>
                      <p className='mt-1 text-sm text-gray-600'>{notes}</p>
                    </div>
                  )}

                  <Alert>
                    <CheckCircle className='h-4 w-4' />
                    <AlertDescription>
                      Your payout request will be reviewed by our team and
                      processed within 2-3 business days. You'll receive an
                      email confirmation once the transfer is complete.
                    </AlertDescription>
                  </Alert>

                  <div className='flex gap-2'>
                    <Button
                      variant='outline'
                      onClick={() => setShowConfirmation(false)}
                      className='flex-1'
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className='flex-1'
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                          Submitting...
                        </>
                      ) : (
                        'Confirm Request'
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
