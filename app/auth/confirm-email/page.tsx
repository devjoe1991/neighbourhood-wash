import Link from 'next/link'

export default function ConfirmEmailPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-xl border border-gray-100 bg-white p-8 text-center shadow-lg space-y-6">
        <div>
            <h1 className='text-3xl font-bold text-blue-700 sm:text-4xl'>
              Check your inbox!
            </h1>
          <p className="mt-4 text-lg text-gray-600">
            We've sent a confirmation link to your email address.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Please click the link in the email to activate your account. This is a necessary security step to make sure you're you!
          </p>
        </div>
        <div className="mt-4 border-t pt-6">
          <p className="text-sm text-gray-500">
            Didn't receive an email? Make sure to check your spam or junk folder.
          </p>
        </div>
        <div className="mt-6">
            <Link
              href="/signin"
              className="inline-block w-full rounded-md bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Return to Sign In
            </Link>
          </div>
      </div>
    </div>
  )
} 