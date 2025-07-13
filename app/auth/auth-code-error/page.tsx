import Link from 'next/link'

export default function AuthCodeError() {
  return (
    <div className='flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-900'>
      <div className='w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg dark:bg-gray-800'>
        <h1 className='mb-4 text-3xl font-bold text-red-600'>
          Authentication Error
        </h1>
        <p className='mb-6 text-gray-700 dark:text-gray-300'>
          The link you used is invalid or has expired. Please try signing up or
          logging in again.
        </p>
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
