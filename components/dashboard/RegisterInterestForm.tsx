'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { registerWasherInterestAction } from '@/app/actions/registerWasherInterest'
import { useEffect } from 'react'

const initialState: { success: boolean; message: string } = {
  success: false,
  message: '',
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button
      type='submit'
      className='w-full bg-green-600 hover:bg-green-700'
      aria-disabled={pending}
      disabled={pending}
    >
      {pending ? 'Submitting...' : 'Register Interest'}
    </Button>
  )
}

export default function RegisterInterestForm() {
  const [state, formAction] = useFormState(
    registerWasherInterestAction,
    initialState
  )
  const [submittedSuccessfully, setSubmittedSuccessfully] = useState(false)

  useEffect(() => {
    if (state?.message) {
      if (state.success) {
        setSubmittedSuccessfully(true)
        console.log('Interest Registered!', state.message)
      } else {
        console.error('Error registering interest:', state.message)
      }
    }
  }, [state])

  if (submittedSuccessfully) {
    return (
      <div className='rounded-md bg-green-50 p-6 text-center'>
        <h3 className='text-xl font-semibold text-green-700'>Thank You!</h3>
        <p className='mt-2 text-gray-600'>
          {state.message ||
            'Your interest has been registered. We will contact you shortly with details on the full onboarding process.'}
        </p>
      </div>
    )
  }

  return (
    <form
      action={formAction}
      className='space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow'
    >
      <div>
        <label
          htmlFor='area'
          className='block text-sm font-medium text-gray-700'
        >
          Your Postcode or London Borough
        </label>
        <Input
          type='text'
          name='area'
          id='area'
          required
          className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm'
          placeholder='e.g., Islington or N7 0EL'
        />
      </div>
      {state?.message && !state?.success && (
        <p className='text-sm text-red-600'>{state.message}</p>
      )}
      <SubmitButton />
      <p className='mt-4 text-xs text-gray-500'>
        By registering your interest, you agree to be contacted about the
        Neighbourhood Wash Washer program. This is a pre-launch registration to
        gauge interest in specific areas. Full onboarding and verification will
        be required to become an active Washer.
      </p>
    </form>
  )
}
