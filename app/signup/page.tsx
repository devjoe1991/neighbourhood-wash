'use client'

import { useState, FormEvent, ChangeEvent } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { supabase } from '@/lib/supabaseClient'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import PasswordInput from '@/components/ui/PasswordInput'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('user') // Default role
  const [referralCode, setReferralCode] = useState('') // State for referral code
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | React.ReactNode | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    setIsLoading(true)

    const metadata: {
      selected_role: string
      submitted_referral_code?: string
    } = {
      selected_role: role,
    }

    if (referralCode.trim() !== '') {
      metadata.submitted_referral_code = referralCode.trim().toUpperCase()
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/signin?message=Thank you for confirming your email. You can now sign in.`,
        data: metadata, // Pass the constructed metadata
      },
    })

    setIsLoading(false)

    if (signUpError) {
      setError(signUpError.message)
    } else if (
      data.user &&
      data.user.identities &&
      data.user.identities.length === 0
    ) {
      // This case can happen if email confirmation is disabled and the user already exists but is not confirmed.
      // Supabase might return a user object but with no identities, indicating a silent failure for an unconfirmed existing user.
      // Or if email is already in use and confirmed.
      setError(
        'This email address may already be in use or a user exists but is not confirmed. Try signing in or use a different email.'
      )
    } else if (data.user) {
      setMessage(
        <>
          Registration successful! Please check your email to confirm your
          account. Once confirmed, you&apos;ll be able to{' '}
          <Link
            href='/signin'
            className='font-medium text-blue-600 hover:text-blue-500'
          >
            sign in
          </Link>{' '}
          or will be taken to your dashboard.
        </>
      )
    } else {
      // Fallback, unexpected state
      setError(
        'An unexpected error occurred during registration. Please try again.'
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
          Create your account to get started
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
              <Label>I am a...</Label>
              <RadioGroup
                defaultValue='user'
                value={role}
                onValueChange={setRole}
                className='mt-2 flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4'
              >
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='user' id='role-user' />
                  <Label htmlFor='role-user' className='font-normal'>
                    User (Looking for laundry service)
                  </Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='washer' id='role-washer' />
                  <Label htmlFor='role-washer' className='font-normal'>
                    Washer (Offering laundry service)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor='referral-code'>Referral Code (Optional)</Label>
              <div className='mt-1'>
                <Input
                  id='referral-code'
                  name='referral-code'
                  type='text'
                  value={referralCode}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setReferralCode(e.target.value)
                  }
                  placeholder='Enter referral code'
                />
              </div>
            </div>

            <div>
              <label
                htmlFor='password'
                className='block text-sm font-medium text-gray-700'
              >
                Password
              </label>
              <div className='mt-1'>
                <PasswordInput
                  id='password'
                  name='password'
                  required
                  className='block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm'
                  value={password}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setPassword(e.target.value)
                  }
                  aria-describedby='password-requirements'
                />
              </div>
            </div>

            <div>
              <label
                htmlFor='confirmPassword'
                className='block text-sm font-medium text-gray-700'
              >
                Confirm Password
              </label>
              <div className='mt-1'>
                <PasswordInput
                  id='confirmPassword'
                  name='confirmPassword'
                  required
                  className='block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm'
                  value={confirmPassword}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setConfirmPassword(e.target.value)
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
                {isLoading ? 'Creating account...' : 'Create Account'}
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
                Already have an account?{' '}
                <Link
                  href='/signin'
                  className='font-medium text-blue-600 hover:text-blue-500'
                >
                  Sign in
                </Link>
              </p>
            </div>

            {/* <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-gray-500">
                    Or sign up as a User with
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3">
                <div>
                  <Button
                    variant='outline'
                    className='flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-500 shadow-sm hover:bg-gray-50'
                    onClick={async () => {
                      setError(null) // Clear previous errors
                      const { error: oauthError } =
                        await supabase.auth.signInWithOAuth({
                          provider: 'google',
                          options: {
                            redirectTo: `${window.location.origin}/`, // Or a specific post-OAuth landing page
                            // selected_role will be handled separately for OAuth users for now
                          },
                        })
                      if (oauthError) {
                        setError(`Google OAuth error: ${oauthError.message}`)
                      }
                    }}
                    disabled={isLoading}
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
                    Google
                  </Button>
                </div>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  )
}
