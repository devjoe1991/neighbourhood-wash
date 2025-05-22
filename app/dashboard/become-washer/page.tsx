export const dynamic = 'force-dynamic'

import { createClient } from '@/utils/supabase/server_new'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/dashboard/Sidebar'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import RegisterInterestForm from '@/components/dashboard/RegisterInterestForm'

export default async function BecomeWasherPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect(
      '/signin?message=Please sign in to learn about becoming a Washer.'
    )
  }

  // Check if user has registered interest
  const { data: interestRegistration, error: interestError } = await supabase
    .from('washer_interest_registrations')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (interestError && interestError.code !== 'PGRST116') {
    // PGRST116: no rows found
    console.error('Error fetching interest registration:', interestError)
    // Handle error appropriately, maybe show an error message to the user
  }
  const hasRegisteredInterest = !!interestRegistration

  // Placeholder: Check if user is an approved washer (you'll need a way to determine this)
  // This might involve checking a 'status' column in your 'washers' table or a 'user_roles' table.
  // For now, we'll keep it simple. This logic needs to be implemented based on your actual data model.
  const { data: washerProfile, error: washerError } = await supabase
    .from('profiles') // Assuming your user profiles/washer details are in 'profiles' table
    .select('role, washer_status') // Assuming 'role' is 'washer' and 'washer_status' is 'approved'
    .eq('id', user.id)
    .eq('role', 'WASHER') // Make sure this matches how you store roles
    .single()

  if (washerError && washerError.code !== 'PGRST116') {
    console.error('Error fetching washer profile:', washerError)
    // Handle error appropriately
  }

  const isApprovedWasher = washerProfile?.washer_status === 'approved' // Example check

  if (isApprovedWasher) {
    // Optional: Redirect to a washer dashboard or show different content
    // For now, we can just show a message, or they might not even see the link in sidebar later.
  }

  return (
    <div className='flex min-h-screen bg-gray-100 pt-16'>
      <Sidebar />
      <main className='ml-64 flex-1 p-6'>
        <div className='rounded-lg bg-white p-8 shadow-md'>
          <h1 className='mb-6 text-3xl font-bold text-blue-600'>
            Interested in Becoming a Neighbourhood Washer?
          </h1>

          {isApprovedWasher ? (
            <div>
              <p className='text-lg text-gray-700'>
                You are an approved Neighbourhood Washer! Manage your services
                and bookings from your Washer Hub.
              </p>
              <Link href='/dashboard/washer-hub'>
                <Button className='mt-4'>Go to Washer Hub</Button>
              </Link>
            </div>
          ) : hasRegisteredInterest ? (
            <div className='rounded-md bg-green-50 p-6 text-center'>
              <h3 className='text-xl font-semibold text-green-700'>
                Interest Registered!
              </h3>
              <p className='mt-2 text-gray-600'>
                Thank you for expressing your interest in becoming a Washer. We
                have your details and will contact you soon with information
                about the full onboarding and verification process. We
                appreciate your patience as we prepare for our soft launch!
              </p>
            </div>
          ) : (
            <>
              <p className='mb-4 text-lg text-gray-700'>
                Ready to turn your laundry appliances into an income source and
                help your neighbours? Register your interest to become one of
                the first Washers on our platform!
              </p>

              <div className='mb-6 rounded-lg border border-blue-200 bg-blue-50 p-6'>
                <h2 className='mb-3 text-xl font-semibold text-blue-700'>
                  Why Register Your Interest Early?
                </h2>
                <ul className='list-inside list-disc space-y-2 text-gray-600'>
                  <li>
                    <b>Be First in Line:</b> Get priority access to full
                    onboarding when we launch in your area.
                  </li>
                  <li>
                    <b>Help Shape the Platform:</b> Early registrants may be
                    invited for feedback.
                  </li>
                  <li>
                    <b>Earn Extra Income:</b> Set your own schedule and prices.
                  </li>
                  <li>
                    <b>Support Your Community:</b> Provide a valuable service to
                    your neighbours.
                  </li>
                  <li>
                    <b>Simple & Flexible:</b> Easy-to-use platform to manage
                    your laundry services.
                  </li>
                </ul>
              </div>

              <div className='mb-6'>
                <h2 className='mb-3 text-xl font-semibold text-gray-800'>
                  Register Your Interest (Pre-Launch)
                </h2>
                <p className='mb-4 text-gray-600'>
                  We are currently in a pre-launch phase and gathering interest
                  from potential Washers in various areas. Please provide your
                  postcode or London borough so we can gauge demand. Once we are
                  ready to onboard Washers in your area, we will contact you
                  with the full application details. No commitment is needed at
                  this stage.
                </p>
                <RegisterInterestForm />
              </div>

              <p className='mt-8 text-sm text-gray-500'>
                <b>Please Note:</b> This is an initial registration of interest.
                A full onboarding and verification process will be required to
                become an approved Neighbourhood Washer. We&apos;ll be in touch
                with more details soon!
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
