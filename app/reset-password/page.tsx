'use client'

import { useState, FormEvent, ChangeEvent, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation' // Removed useSearchParams
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabaseClient'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  // Supabase recovery link uses hash fragments. We need to parse them client-side.
  // Next.js server components/searchParams don't easily get URL hash.
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isTokenInvalid, setIsTokenInvalid] = useState(false)

  useEffect(() => {
    const hash = window.location.hash
    console.log('ResetPasswordPage Debug Hash:', hash) // DEBUG LINE

    if (hash) {
      const params = new URLSearchParams(hash.substring(1)) // Remove #
      const token = params.get('access_token')
      const type = params.get('type')

      if (type === 'recovery' && token) {
        setAccessToken(token)
        // We will remove the explicit setSession call here.
        // Supabase should establish a temporary user context when it processes the recovery redirect.
        // If the token is invalid, updateUser call later will fail.
      } else {
        setError('Invalid recovery link parameters.')
        setIsTokenInvalid(true)
      }
    } else {
      setError(
        'No recovery token found. Please ensure you are using the link from your email.'
      )
      setIsTokenInvalid(true)
    }
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (newPassword.length < 6) {
      // Or your Supabase password policy
      setError('Password must be at least 6 characters long.')
      return
    }

    setIsLoading(true)

    // At this point, if accessToken was valid, setSession would have established the user context
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    setIsLoading(false)

    if (updateError) {
      setError(updateError.message)
    } else {
      setMessage(
        'Your password has been successfully updated! You can now sign in with your new password.'
      )
      // Optionally clear the hash or redirect after a delay
      setTimeout(() => {
        router.push('/signin')
      }, 3000)
    }
  }

  if (isTokenInvalid && !message) {
    // Show only token error if no success message yet
    return (
      <div className='flex min-h-screen flex-col justify-center bg-gradient-to-br from-red-100 via-orange-50 to-yellow-100 py-12 sm:px-6 lg:px-8'>
        <div className='text-center sm:mx-auto sm:w-full sm:max-w-md'>
          <Alert variant='destructive'>
            <AlertTriangle className='h-4 w-4' />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error || 'Invalid password reset link.'}
            </AlertDescription>
          </Alert>
          <Link
            href='/forgot-password'
            className='mt-4 inline-block font-medium text-blue-600 hover:text-blue-500'
          >
            Request a new password reset
          </Link>
        </div>
      </div>
    )
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
          Set your new password
        </p>
      </div>

      <div className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'>
        <div className='bg-white px-4 py-8 shadow-xl sm:rounded-lg sm:px-10'>
          <form className='space-y-6' onSubmit={handleSubmit}>
            <div>
              <Label htmlFor='newPassword'>New password</Label>
              <div className='mt-1'>
                <Input
                  id='newPassword'
                  name='newPassword'
                  type='password'
                  required
                  value={newPassword}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setNewPassword(e.target.value)
                  }
                  placeholder='Enter new password'
                />
              </div>
            </div>
            <div>
              <Label htmlFor='confirmPassword'>Confirm new password</Label>
              <div className='mt-1'>
                <Input
                  id='confirmPassword'
                  name='confirmPassword'
                  type='password'
                  required
                  value={confirmPassword}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setConfirmPassword(e.target.value)
                  }
                  placeholder='Confirm new password'
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

            {!message && (
              <div>
                <Button
                  type='submit'
                  className='flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none'
                  disabled={isLoading || !accessToken || isTokenInvalid}
                >
                  {isLoading ? 'Updating Password...' : 'Update Password'}
                </Button>
              </div>
            )}
            {message && (
              <div className='mt-6 text-center'>
                <Link
                  href='/signin'
                  className='font-medium text-blue-600 hover:text-blue-500'
                >
                  Proceed to Sign In
                </Link>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
