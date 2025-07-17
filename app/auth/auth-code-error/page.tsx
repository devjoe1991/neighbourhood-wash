'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function AuthCodeError() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  return (
    <div className='flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-900'>
      <div className='w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg dark:bg-gray-800'>
        <h1 className='mb-4 text-3xl font-bold text-red-600'>
          Authentication Error
        </h1>
        <p className='mb-4 text-gray-700 dark:text-gray-300'>
          The link you used is invalid or has expired. Please try signing up or
          logging in again.
        </p>
        
        {error && (
          <div className='mb-6 rounded-lg bg-red-50 p-4 text-left dark:bg-red-900/20'>
            <p className='text-sm font-medium text-red-800 dark:text-red-200'>
              Error Details:
            </p>
            <p className='text-sm text-red-700 dark:text-red-300 mt-1'>
              {error}
            </p>
          </div>
        )}
        
        <div className='mb-6 rounded-lg bg-blue-50 p-4 text-left dark:bg-blue-900/20'>
          <p className='text-sm font-medium text-blue-800 dark:text-blue-200 mb-2'>
            Common Solutions:
          </p>
          <ul className='text-sm text-blue-700 dark:text-blue-300 space-y-1'>
            <li>• Check if the email link has expired (links expire after 24 hours)</li>
            <li>• Make sure you haven't already used this confirmation link</li>
            <li>• Try requesting a new confirmation email</li>
          </ul>
        </div>
        
        <div className='flex justify-center space-x-4'>
          <Link href='/signup' passHref>
            <button className='rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700'>
              Sign Up
            </button>
          </Link>
          <Link href='/signin' passHref>
            <button className='rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'>
              Sign In
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
