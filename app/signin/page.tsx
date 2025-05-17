'use client'

import { useState, FormEvent, ChangeEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabaseClient'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null) // For general messages if needed
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setIsLoading(true)

    const { data, error: signInError } = await supabase.auth.signInWithPassword(
      {
        email,
        password,
      }
    )

    setIsLoading(false)

    if (signInError) {
      setError(signInError.message)
    } else if (data.user) {
      setMessage('Sign in successful! Redirecting...')
      // Successful sign in, redirect to a protected route (e.g., dashboard)
      // For now, let's redirect to the homepage after a short delay
      router.push('/') // TODO: Replace with dashboard or appropriate protected route
    } else {
      setError('An unexpected error occurred. Please try again.')
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
          Sign in to your account
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

            <div>
              <div className='flex items-center justify-between'>
                <Label htmlFor='password'>Password</Label>
                <div className='text-sm'>
                  <Link
                    href='/forgot-password'
                    className='font-medium text-blue-600 hover:text-blue-500'
                  >
                    Forgot your password?
                  </Link>
                </div>
              </div>
              <div className='mt-1'>
                <Input
                  id='password'
                  name='password'
                  type='password'
                  autoComplete='current-password'
                  required
                  value={password}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setPassword(e.target.value)
                  }
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

            <div className='mt-6'>
              <div className='relative'>
                <div className='absolute inset-0 flex items-center'>
                  <div className='w-full border-t border-gray-300' />
                </div>
                <div className='relative flex justify-center text-sm'>
                  <span className='bg-white px-2 text-gray-500'>
                    Or continue with
                  </span>
                </div>
              </div>

              <div className='mt-6 grid grid-cols-1 gap-3'>
                <div>
                  <Button
                    variant='outline'
                    className='flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-500 shadow-sm hover:bg-gray-50'
                    onClick={async () => {
                      setError(null)
                      const { error: oauthError } =
                        await supabase.auth.signInWithOAuth({
                          provider: 'google',
                          options: {
                            redirectTo: `${window.location.origin}/`, // Or a specific post-OAuth landing page
                          },
                        })
                      if (oauthError) {
                        setError(`Google OAuth error: ${oauthError.message}`)
                      }
                    }}
                    disabled={isLoading} // Optional: disable if main form is loading
                  >
                    <svg
                      className='mr-2 -ml-1 h-5 w-5'
                      aria-hidden='true'
                      focusable='false'
                      data-prefix='fab'
                      data-icon='google'
                      role='img'
                      xmlns='http://www.w3.org/2000/svg'
                      viewBox='0 0 488 512'
                    >
                      <path
                        fill='currentColor'
                        d='M488 261.8C488 403.3 381.7 504 244 504 110.8 504 0 393.2 0 256S110.8 8 244 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H244v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z'
                      ></path>
                    </svg>
                    Sign in with Google
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
