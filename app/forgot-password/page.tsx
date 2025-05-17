'use client'

import { useState, FormEvent, ChangeEvent } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabaseClient'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setIsLoading(true)

    // Construct the redirect URL for the password reset confirmation
    // This should be the URL of your page for setting a new password
    const redirectUrl = `${window.location.origin}/reset-password`

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: redirectUrl,
      }
    )

    setIsLoading(false)

    if (resetError) {
      setError(resetError.message)
    } else {
      setMessage(
        'If an account exists for this email, a password reset link has been sent. Please check your inbox.'
      )
    }
  }

  return (
    <div className='flex min-h-screen flex-col justify-center bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 py-12 sm:px-6 lg:px-8'>
      <div className='sm:mx-auto sm:w-full sm:max-w-md'>
        <Link href='/'>
          <h2 className='mt-6 text-center text-3xl font-extrabold text-blue-700 transition-colors hover:text-blue-800'>
            Neighbourhood Wash
          </h2>
        </Link>
        <p className='mt-2 text-center text-sm text-gray-600'>
          Reset your password
        </p>
      </div>

      <div className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'>
        <div className='bg-white px-4 py-8 shadow-xl sm:rounded-lg sm:px-10'>
          <form className='space-y-6' onSubmit={handleSubmit}>
            <div>
              <Label htmlFor='email'>Email address</Label>
              <div className='mt-1'>
                <Input
                  id='email'
                  name='email'
                  type='email'
                  autoComplete='email'
                  required
                  value={email}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setEmail(e.target.value)
                  }
                  placeholder='you@example.com'
                />
              </div>
            </div>

            {error && (
              <Alert variant='destructive'>
                <AlertTriangle className='h-4 w-4' />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {message && (
              <Alert
                variant='default'
                className='border-green-300 bg-green-50 text-green-700'
              >
                <CheckCircle2 className='h-4 w-4 text-green-600' />
                <AlertTitle>Information</AlertTitle>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            <div>
              <Button
                type='submit'
                className='flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none'
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send Password Reset Email'}
              </Button>
            </div>
          </form>

          <div className='mt-6 text-center'>
            <p className='text-sm text-gray-600'>
              Remembered your password?{' '}
              <Link
                href='/signin'
                className='font-medium text-blue-600 hover:text-blue-500'
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
