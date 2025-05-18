export const dynamic = 'force-dynamic'

import { createClient } from '@/utils/supabase/server_new'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/dashboard/Sidebar'

export default async function ReferralsPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/signin?message=Please sign in to view your referrals.')
  }

  // Placeholder: Fetch referral data for the user here later
  const userReferralCode = 'YOUR-UNIQUE-CODE' // Replace with actual logic
  const referralCount = 0 // Replace with actual logic
  const referralRewardsEarned = 0 // Replace with actual logic

  return (
    <div className='flex min-h-screen bg-gray-100 pt-16'>
      <Sidebar />
      <main className='ml-64 flex-1 p-6'>
        <div className='rounded-lg bg-white p-8 shadow-md'>
          <h1 className='mb-6 text-3xl font-bold text-blue-600'>Referrals</h1>

          <div className='mb-8 rounded-lg border border-blue-200 bg-blue-50 p-6'>
            <h2 className='mb-2 text-xl font-semibold text-blue-700'>
              Share Your Referral Code!
            </h2>
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
          </div>

          <div className='mb-8 grid grid-cols-1 gap-6 md:grid-cols-2'>
            <div className='rounded-lg border border-gray-200 p-6'>
              <h3 className='mb-2 text-lg font-semibold text-gray-700'>
                Friends Joined
              </h3>
              <p className='text-3xl font-bold text-blue-600'>
                {referralCount}
              </p>
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

          <p className='mt-8 text-sm text-gray-500'>
            Note: Full referral program details and functionality are coming
            soon for the soft launch!
          </p>
        </div>
      </main>
    </div>
  )
}
