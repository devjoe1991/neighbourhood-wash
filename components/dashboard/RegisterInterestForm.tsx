'use client'

import { useForm, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, AlertCircle } from 'lucide-react'
import { registerWasherInterest } from '@/app/actions/registerWasherInterest'

const formSchema = z.object({
  area: z
    .string()
    .min(3, 'Please enter a valid London borough or postcode.')
    .max(50),
})

type FormValues = z.infer<typeof formSchema>

interface RegisterInterestFormProps {
  userId: string
  onInterestRegistered: () => void
}

export default function RegisterInterestForm({
  userId,
  onInterestRegistered,
}: RegisterInterestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  })

  const processForm: SubmitHandler<FormValues> = async (data) => {
    setIsSubmitting(true)
    setServerError(null)

    const result = await registerWasherInterest(userId, data.area)

    setIsSubmitting(false)

    if (result && result.error) {
      setServerError(result.error)
    } else {
      setIsSuccess(true)
      onInterestRegistered()
    }
  }

  if (isSuccess) {
    // The parent component will now show the success message
    return null
  }

  return (
    <div className='rounded-lg border border-gray-200 bg-gray-50 p-6'>
      <h3 className='text-xl font-semibold text-gray-800'>
        Register Your Interest
      </h3>
      <p className='mb-4 mt-2 text-sm text-gray-600'>
        Not ready for the full application? Just give us your London borough or
        postcode so we know where to launch next. We&apos;ll get in touch when
        we&apos;re ready for you.
      </p>
      <form onSubmit={handleSubmit(processForm)} className='space-y-4'>
        <div>
          <Label htmlFor='area'>London Borough or Postcode</Label>
          <Input
            id='area'
            {...register('area')}
            placeholder='e.g., "Islington" or "SW1A"'
            className='bg-white'
          />
          {errors.area && (
            <p className='mt-1 text-sm text-red-600'>{errors.area.message}</p>
          )}
        </div>

        {serverError && (
          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        <Button type='submit' disabled={isSubmitting} className='w-full'>
          {isSubmitting ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Submitting...
            </>
          ) : (
            'Register Interest'
          )}
        </Button>
      </form>
    </div>
  )
}
