export const dynamic = 'force-dynamic'

import { createClient } from '@/utils/supabase/server_new'
import { redirect } from 'next/navigation'
// import Sidebar from '@/components/dashboard/Sidebar' // No longer needed here, layout handles it
import { getOrCreateReferralCode } from '@/lib/referral'

// Define an interface for the shape of a referral event
interface ReferralEvent {
  id: string
  referred_user_id: string // Assuming this is the ID of the user who was referred
  referral_code_used: string
  signup_timestamp: string
  status: string
}

export default async function ReferralsPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/signin?message=Please sign in to view your referrals.')
  }

  const userReferralCode = await getOrCreateReferralCode(user.id)

  // Fetch actual referral events
  const { data: referralEvents, error: referralEventsError } = await supabase
    .from('referral_events')
    .select('*')
    .eq('referrer_user_id', user.id)
    .order('signup_timestamp', { ascending: false })

  if (referralEventsError) {
    console.error(
      'Error fetching referral events:',
      referralEventsError.message
    )
    // Optionally, you could show an error message to the user
  }

  const typedReferralEvents = (referralEvents || []) as ReferralEvent[]
  const referralCount = typedReferralEvents.length
  // Placeholder for rewards earned, can be calculated later based on status
  const referralRewardsEarned = 0

  // The main layout (app/dashboard/layout.tsx) now provides the overall page structure (sidebar, main tag, margins)
  // This component should only return the content specific to the referrals page.
  return (
    <div className='rounded-lg bg-white p-8 shadow-md'>
      <h1 className='mb-6 text-3xl font-bold text-blue-600'>Referrals</h1>

      <div className='mb-8 rounded-lg border border-blue-200 bg-blue-50 p-6'>
        <h2 className='mb-2 text-xl font-semibold text-blue-700'>
          Share Your Referral Code!
        </h2>
        {userReferralCode ? (
          <>
            <p className='mb-3 text-gray-600'>
              Invite friends to Neighbourhood Wash and earn rewards. Share your
              unique code:
            </p>
            <div className='rounded-md border border-dashed border-blue-400 bg-white p-3 text-center'>
              <p className='font-mono text-2xl text-blue-600'>
                {userReferralCode}
              </p>
            </div>
            <button className='mt-4 w-full rounded-md bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white shadow-sm hover:bg-blue-700'>
              Copy Code & Share (Coming Soon)
            </button>
          </>
        ) : (
          <p className='text-red-600'>
            Could not retrieve your referral code at this time. Please try again
            later or contact support.
          </p>
        )}
      </div>

      <div className='mb-8 grid grid-cols-1 gap-6 md:grid-cols-2'>
        <div className='rounded-lg border border-gray-200 p-6'>
          <h3 className='mb-2 text-lg font-semibold text-gray-700'>
            Friends Joined
          </h3>
          <p className='text-3xl font-bold text-blue-600'>{referralCount}</p>
        </div>
        <div className='rounded-lg border border-gray-200 p-6'>
          <h3 className='mb-2 text-lg font-semibold text-gray-700'>
            Rewards Earned
          </h3>
          <p className='text-3xl font-bold text-blue-600'>
            £{referralRewardsEarned}
          </p>
        </div>
      </div>

      <div className='mt-6'>
        <h2 className='mb-3 text-xl font-semibold text-gray-700'>
          How it Works
        </h2>
        <ol className='list-inside list-decimal space-y-2 text-gray-600'>
          <li>Share your unique referral code with friends.</li>
          <li>Your friend signs up and completes their first wash.</li>
          <li>You both get a reward! (Details coming soon)</li>
        </ol>
      </div>

      {/* New Section: Referral Activity */}
      <div className='mt-10'>
        <h2 className='mb-4 text-xl font-semibold text-gray-700'>
          Your Referral Activity
        </h2>
        {typedReferralEvents.length > 0 ? (
          <div className='overflow-x-auto rounded-lg border border-gray-200'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'
                  >
                    Referred User ID
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'
                  >
                    Date Joined
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-200 bg-white'>
                {typedReferralEvents.map((event) => (
                  <tr key={event.id}>
                    <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-500'>
                      {event.referred_user_id}
                    </td>
                    <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-500'>
                      {new Date(event.signup_timestamp).toLocaleDateString()}
                    </td>
                    <td className='px-6 py-4 text-sm whitespace-nowrap'>
                      <span
                        className={`rounded-full px-2 py-1 text-xs leading-tight font-semibold capitalize ${
                          event.status === 'joined'
                            ? 'bg-blue-100 text-blue-700'
                            : event.status === 'first_wash_completed'
                              ? 'bg-green-100 text-green-700'
                              : event.status === 'reward_issued'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {event.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className='text-gray-500'>
            No referral activity yet. Share your code to get started!
          </p>
        )}
      </div>
      {/* End New Section */}

      <p className='mt-8 text-sm text-gray-500'>
        Note: Full referral program details and functionality are coming soon
        for the soft launch!
      </p>
    </div>
  )
}
