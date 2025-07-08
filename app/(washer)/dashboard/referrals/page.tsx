'use client'

import { useState, useEffect } from 'react'
// Remove server imports - we'll fetch data client-side
import { Users, Award, Share2, UserPlus, Star, Crown, TrendingUp, DollarSign } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ReferralCodeDisplay } from '@/components/dashboard/ReferralCodeDisplay'
import { createClient } from '@/utils/supabase/client'

interface ReferralEvent {
  id: string
  referred_user_id: string
  signup_timestamp: string
  status: 'joined' | 'first_wash_completed' | 'reward_issued' | 'washer_approved'
  profiles: {
    first_name: string | null
    last_name: string | null
    email: string
    role: string | null
    washer_status: string | null
  } | null
}

export default function WasherReferralsPage() {
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [referralEvents, setReferralEvents] = useState<ReferralEvent[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchReferralData()
  }, [])

  const fetchReferralData = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get or create referral code via database query
      const { data: existingReferral } = await supabase
        .from('referrals')
        .select('code')
        .eq('user_id', user.id)
        .single()

      let code = existingReferral?.code

      if (!code) {
        // Generate new code if none exists
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        let newCode = ''
        for (let i = 0; i < 6; i++) {
          newCode += characters.charAt(Math.floor(Math.random() * characters.length))
        }
        
        const { error: insertError } = await supabase
          .from('referrals')
          .insert({ user_id: user.id, code: newCode })

        if (!insertError) {
          code = newCode
        }
      }

      setReferralCode(code)

      // Get referral events
      const { data: events } = await supabase
        .from('referral_events')
        .select(`
          *,
          profiles (
            first_name,
            last_name,
            email,
            role,
            washer_status
          )
        `)
        .eq('referrer_user_id', user.id)
        .order('signup_timestamp', { ascending: false })

      setReferralEvents(events || [])
    } catch (error) {
      console.error('Error fetching referral data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-64 animate-pulse rounded-lg bg-gray-200" />
      </div>
    )
  }

  const userReferrals = referralEvents.filter(e => e.profiles?.role === 'user' || !e.profiles?.role)
  const washerReferrals = referralEvents.filter(e => e.profiles?.role === 'washer')
  const approvedWashers = washerReferrals.filter(e => e.profiles?.washer_status === 'approved')
  
  const userRewardsEarned = userReferrals.filter(e => e.status === 'reward_issued').length * 5
  const washerRewardsEarned = approvedWashers.length * 25 // £25 per approved washer
  const totalRewards = userRewardsEarned + washerRewardsEarned

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Washer Referrals</h1>
        <p className="text-muted-foreground">
          Grow our community and earn enhanced rewards by referring both users and washers.
        </p>
      </div>

      {/* Enhanced Washer Offer Card */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 flex h-12 w-12 items-center justify-center rounded-lg">
              <Crown className="text-white h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl">Enhanced Washer Rewards</CardTitle>
              <CardDescription>
                As a trusted washer, you earn more for quality referrals that grow our platform.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-blue-800">Refer Users</span>
              </div>
              <p className="text-sm text-gray-600">
                £5 reward when they complete their first wash
              </p>
            </div>
            <div className="bg-white/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-5 w-5 text-purple-600" />
                <span className="font-semibold text-purple-800">Refer Washers</span>
              </div>
              <p className="text-sm text-gray-600">
                £25 reward when they get approved and complete their first booking
              </p>
            </div>
          </div>
          <p className="mb-3 text-sm text-gray-700">Your unique referral code:</p>
          <ReferralCodeDisplay code={referralCode} />
        </CardContent>
      </Card>

      {/* Enhanced Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Users className="text-primary h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{referralEvents.length}</div>
            <p className="text-muted-foreground text-xs">
              people have joined through you
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Washers</CardTitle>
            <Crown className="text-purple-600 h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{approvedWashers.length}</div>
            <p className="text-muted-foreground text-xs">
              washers approved through your referrals
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rewards</CardTitle>
            <Award className="text-green-600 h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">£{totalRewards}</div>
            <p className="text-muted-foreground text-xs">
              earned from all referrals
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="text-blue-600 h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {referralEvents.filter(e => {
                const eventDate = new Date(e.signup_timestamp)
                const thisMonth = new Date()
                thisMonth.setDate(1)
                return eventDate >= thisMonth
              }).length}
            </div>
            <p className="text-muted-foreground text-xs">
              new referrals this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* How it Works - Enhanced for Washers */}
      <Card>
        <CardHeader>
          <CardTitle>How Washer Referrals Work</CardTitle>
          <CardDescription>
            Maximize your earning potential by referring both users and washers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold text-lg mb-3 text-blue-800">Referring Users (£5 reward)</h4>
            <div className="space-y-3 ml-4">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                  <Share2 className="text-blue-600 h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">Share Your Code</p>
                  <p className="text-muted-foreground text-sm">
                    Share with friends, family, or neighbors who need laundry services.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                  <UserPlus className="text-blue-600 h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">They Sign Up & Book</p>
                  <p className="text-muted-foreground text-sm">
                    They get 50% off their first wash, expanding our customer base.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                  <DollarSign className="text-blue-600 h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">You Earn £5</p>
                  <p className="text-muted-foreground text-sm">
                    Added to your account after their first completed wash.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-3 text-purple-800">Referring Washers (£25 reward)</h4>
            <div className="space-y-3 ml-4">
              <div className="flex items-start space-x-3">
                <div className="bg-purple-100 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                  <Share2 className="text-purple-600 h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">Refer Quality Washers</p>
                  <p className="text-muted-foreground text-sm">
                    Share with people who would be great washers in your area.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-purple-100 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                  <Crown className="text-purple-600 h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">They Apply & Get Approved</p>
                  <p className="text-muted-foreground text-sm">
                    They complete the washer application and verification process.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-purple-100 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                  <Star className="text-purple-600 h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">You Earn £25</p>
                  <p className="text-muted-foreground text-sm">
                    Higher reward for helping grow our trusted washer network.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referral Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle>Referral Activity</CardTitle>
          <CardDescription>
            Track the status of all your referrals and rewards
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full divide-y">
              <thead className="bg-primary/5">
                <tr>
                  <th className="text-primary/90 px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                    Referred Person
                  </th>
                  <th className="text-primary/90 px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                    Type
                  </th>
                  <th className="text-primary/90 px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                    Date Joined
                  </th>
                  <th className="text-primary/90 px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                    Status
                  </th>
                  <th className="text-primary/90 px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                    Reward
                  </th>
                </tr>
              </thead>
              <tbody className="bg-background divide-y">
                {referralEvents.length > 0 ? (
                  referralEvents.map((event) => {
                    const isWasher = event.profiles?.role === 'washer'
                    const rewardAmount = isWasher ? 25 : 5
                    const hasEarnedReward = isWasher 
                      ? event.profiles?.washer_status === 'approved'
                      : event.status === 'reward_issued'
                    
                    return (
                      <tr key={event.id}>
                        <td className="text-foreground px-6 py-4 text-sm font-medium whitespace-nowrap">
                          {event.profiles?.first_name || 
                           event.profiles?.email?.split('@')[0] || 
                           'New member'}
                        </td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap">
                          <Badge 
                            variant={isWasher ? "default" : "secondary"}
                            className={isWasher ? "bg-purple-100 text-purple-800" : ""}
                          >
                            {isWasher ? (
                              <><Crown className="mr-1 h-3 w-3" /> Washer</>
                            ) : (
                              <><Users className="mr-1 h-3 w-3" /> User</>
                            )}
                          </Badge>
                        </td>
                        <td className="text-muted-foreground px-6 py-4 text-sm whitespace-nowrap">
                          {new Date(event.signup_timestamp).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                              hasEarnedReward
                                ? 'bg-green-100 text-green-800'
                                : event.status === 'joined' || event.profiles?.washer_status === 'pending_application'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {isWasher 
                              ? event.profiles?.washer_status?.replace(/_/g, ' ') || 'Pending'
                              : event.status.replace(/_/g, ' ')
                            }
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap">
                          <span className={`font-semibold ${hasEarnedReward ? 'text-green-600' : 'text-gray-400'}`}>
                            £{rewardAmount}
                            {hasEarnedReward && <span className="ml-1 text-xs">✓</span>}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-muted-foreground px-6 py-12 text-center"
                    >
                      No referral activity yet. Share your code to start earning enhanced rewards!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Success Message */}
      <Card className="text-center border-green-200 bg-green-50">
        <CardHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <Crown className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="mt-4 text-green-800">Growing Our Community Together</CardTitle>
          <CardDescription className="text-green-600">
            Thank you for helping expand Neighbourhood Wash. Your referrals help build a stronger, more connected community.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
} 