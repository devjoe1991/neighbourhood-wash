export const dynamic = 'force-dynamic'

import { createClient } from '@/utils/supabase/server_new'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/dashboard/Sidebar'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function WasherApplicationPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect(
      '/signin?message=Please sign in to apply to become a Washer.'
    )
  }

  // Placeholder: Logic to check if user has already applied or is a washer

  return (
    <div className='flex min-h-screen bg-gray-100 pt-16'>
      <Sidebar />
      <main className='ml-64 flex-1 p-6'>
        <div className='rounded-lg bg-white p-8 shadow-md'>
          <Link
            href='/dashboard/become-washer'
            className='mb-4 block text-sm text-blue-600 hover:underline'
          >
            &larr; Back to Become a Washer Overview
          </Link>
          <h1 className='mb-6 text-3xl font-bold text-blue-600'>
            Washer Application
          </h1>

          <div className='mb-6 rounded-lg border border-yellow-300 bg-yellow-50 p-6'>
            <h2 className='mb-2 text-xl font-semibold text-yellow-700'>
              Application Under Construction!
            </h2>
            <p className='text-yellow-600'>
              Thank you for your interest! The full Washer application form is
              currently being developed for our soft launch. The form below is a
              placeholder to give you an idea of the information we might ask
              for.
            </p>
          </div>

          <form className='space-y-6'>
            <div>
              <label
                htmlFor='fullName'
                className='block text-sm font-medium text-gray-700'
              >
                Full Name
              </label>
              <input
                type='text'
                name='fullName'
                id='fullName'
                disabled
                className='mt-1 block w-full rounded-md border-gray-300 bg-gray-100 p-2 shadow-sm sm:text-sm'
                placeholder='Your Full Name (disabled)'
              />
            </div>

            <div>
              <label
                htmlFor='address'
                className='block text-sm font-medium text-gray-700'
              >
                Your Address (for service area)
              </label>
              <textarea
                name='address'
                id='address'
                rows={3}
                disabled
                className='mt-1 block w-full rounded-md border-gray-300 bg-gray-100 p-2 shadow-sm sm:text-sm'
                placeholder='Street, Town, Postcode (disabled)'
              ></textarea>
            </div>

            <div>
              <label
                htmlFor='experience'
                className='block text-sm font-medium text-gray-700'
              >
                Why do you want to be a Washer?
              </label>
              <textarea
                name='experience'
                id='experience'
                rows={4}
                disabled
                className='mt-1 block w-full rounded-md border-gray-300 bg-gray-100 p-2 shadow-sm sm:text-sm'
                placeholder='Tell us a bit about yourself and your motivation (disabled)'
              ></textarea>
            </div>

            <div className='flex items-center'>
              <input
                id='agreeTerms'
                name='agreeTerms'
                type='checkbox'
                disabled
                className='h-4 w-4 rounded border-gray-300 bg-gray-100 text-blue-600 focus:ring-blue-500'
              />
              <label
                htmlFor='agreeTerms'
                className='ml-2 block text-sm text-gray-700'
              >
                I agree to the (upcoming) Washer Terms and Conditions (disabled)
              </label>
            </div>

            <Button
              type='submit'
              disabled
              className='w-full cursor-not-allowed bg-blue-300 md:w-auto'
            >
              Submit Application (Coming Soon)
            </Button>
          </form>

          <p className='mt-8 text-sm text-gray-500'>
            We appreciate your patience and excitement. Stay tuned for updates!
          </p>
        </div>
      </main>
    </div>
  )
}
