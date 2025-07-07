import { createSupabaseServerClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { getOrCreateReferralCode } from '@/lib/referral'
import { Gift, Users, Award, Share2, UserPlus, Star } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ReferralCodeDisplay } from '@/components/dashboard/ReferralCodeDisplay'

export const dynamic = 'force-dynamic'

interface ReferralEvent {
  id: string
  referred_user_id: string
  signup_timestamp: string
  status: 'joined' | 'first_wash_completed' | 'reward_issued'
  profiles: {
    first_name: string | null
    last_name: string | null
    email: string
  } | null
}

export default async function ReferralsPage() {
  const supabase = createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/signin?message=Please sign in to view your referrals.')
  }

  const userReferralCode = await getOrCreateReferralCode(user.id)

  const { data: referralEvents } = await supabase
    .from('referral_events')
    .select(
      `
      *,
      profiles (
        first_name,
        last_name,
        email
      )
    `
    )
    .eq('referrer_user_id', user.id)
    .order('signup_timestamp', { ascending: false })

  const typedReferralEvents = (referralEvents || []) as ReferralEvent[]
  const referralCount = typedReferralEvents.length
  const rewardsEarned =
    typedReferralEvents.filter((e) => e.status === 'reward_issued').length * 5 // Assuming £5 reward

  return (
    <div className='space-y-8'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Refer a Friend</h1>
        <p className='text-muted-foreground'>
          Share the love of clean laundry and earn rewards.
        </p>
      </div>

      {/* Main Referral Offer Card */}
      <Card className='bg-primary/5'>
        <CardHeader>
          <div className='flex items-center space-x-3'>
            <div className='bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg'>
              <Gift className='text-primary h-6 w-6' />
            </div>
            <div>
              <CardTitle className='text-2xl'>Give 50% Off, Get £5</CardTitle>
              <CardDescription>
                Share your code to give friends 50% off their first wash, and
                we&apos;ll give you £5 in credit.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className='mb-3'>Your unique referral code:</p>
          <ReferralCodeDisplay code={userReferralCode} />
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className='grid gap-6 md:grid-cols-2'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Friends Joined
            </CardTitle>
            <Users className='text-primary h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{referralCount}</div>
            <p className='text-muted-foreground text-xs'>
              users have signed up with your code.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Rewards Earned
            </CardTitle>
            <Award className='text-primary h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>£{rewardsEarned}</div>
            <p className='text-muted-foreground text-xs'>
              credit earned from completed referrals.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* How it Works */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-start space-x-3'>
            <div className='bg-primary/10 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full'>
              <Share2 className='text-primary h-4 w-4' />
            </div>
            <div>
              <p className='font-semibold'>1. Share Your Code</p>
              <p className='text-muted-foreground text-sm'>
                Copy your personal code and send it to your friends.
              </p>
            </div>
          </div>
          <div className='flex items-start space-x-3'>
            <div className='bg-primary/10 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full'>
              <UserPlus className='text-primary h-4 w-4' />
            </div>
            <div>
              <p className='font-semibold'>2. Your Friend Signs Up</p>
              <p className='text-muted-foreground text-sm'>
                They use your code during signup and get 50% off their first
                laundry order.
              </p>
            </div>
          </div>
          <div className='flex items-start space-x-3'>
            <div className='bg-primary/10 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full'>
              <Star className='text-primary h-4 w-4' />
            </div>
            <div>
              <p className='font-semibold'>3. You Get Rewarded</p>
              <p className='text-muted-foreground text-sm'>
                After their first wash is complete, we&apos;ll add £5 to your
                account credit.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referral Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle>Referral Activity</CardTitle>
          <CardDescription>
            Track the status of your referrals here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto rounded-lg border'>
            <table className='min-w-full divide-y'>
              <thead className='bg-primary/5'>
                <tr>
                  <th className='text-primary/90 px-6 py-3 text-left text-xs font-medium tracking-wider uppercase'>
                    Referred User
                  </th>
                  <th className='text-primary/90 px-6 py-3 text-left text-xs font-medium tracking-wider uppercase'>
                    Date Joined
                  </th>
                  <th className='text-primary/90 px-6 py-3 text-left text-xs font-medium tracking-wider uppercase'>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className='bg-background divide-y'>
                {typedReferralEvents.length > 0 ? (
                  typedReferralEvents.map((event) => (
                    <tr key={event.id}>
                      <td className='text-foreground px-6 py-4 text-sm font-medium whitespace-nowrap'>
                        {event.profiles?.first_name ||
                          event.profiles?.email ||
                          'A new friend!'}
                      </td>
                      <td className='text-muted-foreground px-6 py-4 text-sm whitespace-nowrap'>
                        {new Date(event.signup_timestamp).toLocaleDateString()}
                      </td>
                      <td className='px-6 py-4 text-sm whitespace-nowrap'>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                            event.status === 'joined'
                              ? 'bg-blue-100 text-blue-800'
                              : event.status === 'first_wash_completed'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {event.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className='text-muted-foreground px-6 py-12 text-center'
                    >
                      No referral activity yet. Share your code to get started!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className='mb-12 text-center'>
        <h1 className='text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl'>
          Invite Friends, Earn Rewards
        </h1>
        <p className='mx-auto mt-6 max-w-2xl text-lg text-gray-600'>
          Share your love for Neighbourhood Wash and get rewarded. It&apos;s a
          win-win!
        </p>
      </div>

      <Card className='text-center'>
        <CardHeader>
          <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100'>
            <Gift className='h-6 w-6 text-blue-600' />
          </div>
          <CardTitle className='mt-4'>You&apos;re All Set!</CardTitle>
          <CardDescription>
            Start sharing your code to earn rewards.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
