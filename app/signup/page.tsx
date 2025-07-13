import Link from 'next/link'
import SignupForm from './SignupForm'

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; ref?: string }>
}) {
  const params = await searchParams

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-8 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-lg'>
        {/* Header */}
        <div className='mb-8 text-center'>
          <Link href='/'>
            <h1 className='text-3xl font-bold text-blue-700 transition-colors hover:text-blue-800 sm:text-4xl'>
              Create your account
            </h1>
          </Link>
          <p className='mt-2 text-gray-600'>
            Join Neighbourhood Wash and connect with your local community
          </p>
        </div>

        {/* Form Card */}
        <div className='overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg'>
          <div className='px-6 py-8 sm:px-8'>
            <SignupForm
              defaultRefCode={params?.ref || ''}
              message={params?.message}
            />
          </div>
        </div>

        {/* Sign In Link */}
        <div className='mt-6 text-center'>
          <p className='text-gray-600'>
            Already have an account?{' '}
            <Link
              href='/signin'
              className='font-semibold text-blue-600 transition-colors hover:text-blue-500'
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
