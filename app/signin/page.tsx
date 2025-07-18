'use client'

import { useState, FormEvent, ChangeEvent, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
// import { createClient } from '@/utils/supabase/client'; // No longer needed for direct Supabase calls here for email/password signin
import { signInWithEmailPassword } from '@/app/auth/actions' // Import the server action
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react'
import PasswordInput from '@/components/ui/PasswordInput'

export default function SignInPage() {
  const searchParams = useSearchParams() // Get search params
  const [email, setEmail] = useState('')
  // const [password, setPassword] = useState('') // Removed unused password state
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isAdminSignIn, setIsAdminSignIn] = useState(false)

  // const supabase = createClient(); // No longer calling Supabase client-side for this form

  useEffect(() => {
    const signInType = searchParams.get('type')
    if (signInType === 'admin') {
      setIsAdminSignIn(true)
    }
  }, [searchParams])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setIsLoading(true)

    // The password will be picked up from FormData by the server action
    // based on the name attribute of the PasswordInput component.
    const formData = new FormData(e.currentTarget as HTMLFormElement)
    // We pass email directly because it's managed by state here for clarity,
    // though it could also be picked from formData if preferred.
    const result = await signInWithEmailPassword({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      // Pass isAdminSignIn or type to server action if needed for different redirect logic
      // For now, the standard redirect to /dashboard is fine for admins too.
    })

    setIsLoading(false)

    if (result?.error) {
      setError(result.error.message)
    } else {
      // If there was no error, the server action should have redirected.
      // We can set a success message, though it might only flash briefly before redirect.
      setMessage('Sign in successful! Redirecting...')
      // The redirect is handled by the server action.
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
          {isAdminSignIn ? 'Admin Sign In' : 'Sign in to your account'}
        </p>
      </div>

      <div className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'>
        <div className='bg-white px-4 py-8 shadow-xl sm:rounded-lg sm:px-10'>
          {isAdminSignIn && (
            <Alert
              variant='destructive'
              className='mb-6 border-yellow-500 bg-yellow-50 text-yellow-700'
            >
              <ShieldAlert className='h-5 w-5 text-yellow-600' />
              <AlertTitle className='font-semibold text-yellow-800'>
                ADMIN ACCESS ONLY
              </AlertTitle>
              <AlertDescription className='text-yellow-700'>
                This sign-in form is for authorized administrators only.
                Unauthorized access attempts are monitored.
              </AlertDescription>
            </Alert>
          )}
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
                  value={email} // Email is still controlled for direct use in action call
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setEmail(e.target.value)
                  }
                  placeholder='you@example.com'
                />
              </div>
            </div>

            <div>
              <div className='flex items-center justify-between'>
                <Label htmlFor='password'>Password</Label>
                {!isAdminSignIn && (
                  <div className='text-sm'>
                    <Link
                      href='/forgot-password'
                      className='font-medium text-blue-600 hover:text-blue-500'
                    >
                      Forgot your password?
                    </Link>
                  </div>
                )}
              </div>
              <div className='mt-1'>
                <PasswordInput
                  id='password'
                  name='password' // Ensure name attribute is present for FormData
                  required
                  className='block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm'
                  // No value or onChange needed here as PasswordInput manages its state,
                  // and server action will use FormData
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
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            <div>
              <Button
                type='submit'
                className='flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none'
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </div>
          </form>

          {!isAdminSignIn && (
            <div className='mt-6'>
              <div className='relative'>
                <div className='absolute inset-0 flex items-center'>
                  <div className='w-full border-t border-gray-300' />
                </div>
                <div className='relative flex justify-center text-sm'>
                  <span className='bg-white px-2 text-gray-500'>Or</span>
                </div>
              </div>

              <div className='mt-6 text-center'>
                <p className='text-sm text-gray-600'>
                  Don&apos;t have an account?{' '}
                  <Link
                    href='/signup'
                    className='font-medium text-blue-600 hover:text-blue-500'
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
