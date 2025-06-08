import { createClient } from '@/utils/supabase/server_new'
import { redirect } from 'next/navigation'
import { getOrCreateReferralCode } from '@/lib/referral'
import {
  Gift,
  Users,
  Award,
  Copy,
  Share2,
  UserPlus,
  Star,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

interface ReferralEvent {
  id: string
  referred_user_id: string
  signup_timestamp: string
  status: 'joined' | 'first_wash_completed' | 'reward_issued'
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

  const { data: referralEvents } = await supabase
    .from('referral_events')
    .select('*')
    .eq('referrer_user_id', user.id)
    .order('signup_timestamp', { ascending: false })

  const typedReferralEvents = (referralEvents || []) as ReferralEvent[]
  const referralCount = typedReferralEvents.length
  const rewardsEarned =
    typedReferralEvents.filter((e) => e.status === 'reward_issued').length * 10 // Assuming £10 reward

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
            <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10'>
              <Gift className='h-6 w-6 text-primary' />
            </div>
            <div>
              <CardTitle className='text-2xl'>
                Give 50% Off, Get £10
              </CardTitle>
              <CardDescription>
                Share your code to give friends 50% off their first wash, and
                we'll give you £10 in credit.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className='mb-3'>Your unique referral code:</p>
          <div className='flex items-center space-x-2'>
            <div className='flex-grow rounded-lg border-2 border-dashed border-primary/50 bg-white p-3 text-center'>
              <p className='font-mono text-3xl tracking-widest text-primary'>
                {userReferralCode || '...'}
              </p>
            </div>
            <Button size='icon' variant='outline' disabled>
              <Copy className='h-5 w-5' />
              <span className='sr-only'>Copy Code (coming soon)</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className='grid gap-6 md:grid-cols-2'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Friends Joined</CardTitle>
            <Users className='h-4 w-4 text-primary' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{referralCount}</div>
            <p className='text-xs text-muted-foreground'>
              users have signed up with your code.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Rewards Earned</CardTitle>
            <Award className='h-4 w-4 text-primary' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>£{rewardsEarned}</div>
            <p className='text-xs text-muted-foreground'>
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
            <div className='mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10'>
              <Share2 className='h-4 w-4 text-primary' />
            </div>
            <div>
              <p className='font-semibold'>1. Share Your Code</p>
              <p className='text-sm text-muted-foreground'>
                Copy your personal code and send it to your friends.
              </p>
            </div>
          </div>
          <div className='flex items-start space-x-3'>
            <div className='mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10'>
              <UserPlus className='h-4 w-4 text-primary' />
            </div>
            <div>
              <p className='font-semibold'>2. Your Friend Signs Up</p>
              <p className='text-sm text-muted-foreground'>
                They use your code during signup and get 50% off their first
                laundry order.
              </p>
            </div>
          </div>
          <div className='flex items-start space-x-3'>
            <div className='mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10'>
              <Star className='h-4 w-4 text-primary' />
            </div>
            <div>
              <p className='font-semibold'>3. You Get Rewarded</p>
              <p className='text-sm text-muted-foreground'>
                After their first wash is complete, we'll add £10 to your
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
                  <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-primary/90'>
                    Referred User
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-primary/90'>
                    Date Joined
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-primary/90'>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y bg-background'>
                {typedReferralEvents.length > 0 ? (
                  typedReferralEvents.map((event) => (
                    <tr key={event.id}>
                      <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground'>
                        {/* In a real app, you might fetch the user's name or email */}
                        A new friend!
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-muted-foreground'>
                        {new Date(event.signup_timestamp).toLocaleDateString()}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm'>
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
                      className='px-6 py-12 text-center text-muted-foreground'
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
    </div>
  )
}
