import { createSupabaseServerClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  CreditCard, 
  CheckCircle, 
  DollarSign, 
  Clock,
  Shield,
  ArrowRight,
  Banknote,
  Lock
} from 'lucide-react'
import { getStripeAccountStatus } from '@/lib/stripe/actions'
import { requireCompleteOnboarding } from '@/lib/middleware/washer-verification'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

// Component for washers without connected bank account
function ConnectBankAccountContainer() {
  return (
    <div className="space-y-6">
      {/* Main Connection Card */}
      <Card className="border-2 border-dashed border-blue-200 bg-blue-50/50">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl text-blue-900">
            Connect Your Bank Account
          </CardTitle>
          <CardDescription className="text-blue-700">
            Set up secure payouts to start receiving your earnings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Benefits */}
          <div className="bg-white rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-gray-900 mb-3">Why connect your bank account?</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-sm text-gray-700">Receive instant payouts after each booking</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-sm text-gray-700">Secure connection via Stripe (industry standard)</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-sm text-gray-700">Your banking details are encrypted and protected</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-sm text-gray-700">No fees for standard bank transfers</span>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-green-800">Bank-level Security</h4>
                <p className="text-sm text-green-700 mt-1">
                  We use Stripe Connect, the same secure payment infrastructure trusted by millions of businesses worldwide. 
                  Your banking information is never stored on our servers.
                </p>
              </div>
            </div>
          </div>

          {/* Connect Button */}
          <Button size="lg" className="w-full">
            <CreditCard className="w-5 h-5 mr-2" />
            Connect Bank Account Securely
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <p className="text-xs text-gray-500 text-center">
            You'll be redirected to Stripe's secure platform to connect your account. 
            The process takes about 2-3 minutes.
          </p>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">When will I receive my payouts?</h4>
            <p className="text-sm text-gray-600">
              Payouts are processed automatically after each completed booking. Standard bank transfers typically arrive within 1-2 business days.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">What information do I need to provide?</h4>
            <p className="text-sm text-gray-600">
              You'll need your bank account details, sort code, and some basic information for identity verification as required by financial regulations.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">Is my banking information secure?</h4>
            <p className="text-sm text-gray-600">
              Yes, we use Stripe Connect which employs bank-level security and encryption. Your sensitive information is never stored on our servers.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">Can I change my bank account later?</h4>
            <p className="text-sm text-gray-600">
              Yes, you can update your banking information anytime through your payout settings.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Component for washers with connected bank account
function PayoutsDashboard({ 
  accountStatus: _accountStatus, 
  user: _user 
}: { 
  accountStatus: unknown
  user: { email?: string } 
}) {
  // Mock data - replace with real data from your backend
  const mockPayouts = [
    {
      id: 'po_1234',
      amount: 2850, // in pence
      status: 'paid',
      date: '2024-01-15',
      booking_id: 'bk_5678'
    },
    {
      id: 'po_1235',
      amount: 1950,
      status: 'pending',
      date: '2024-01-14',
      booking_id: 'bk_5679'
    }
  ]

  const totalEarnings = mockPayouts.reduce((sum, payout) => sum + payout.amount, 0)
  const pendingPayouts = mockPayouts.filter(p => p.status === 'pending').length

  return (
    <div className="space-y-6">
      {/* Account Status Banner */}
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">Bank Account Connected</AlertTitle>
        <AlertDescription className="text-green-700">
          Your bank account is securely connected and ready to receive payouts.
        </AlertDescription>
      </Alert>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{(totalEarnings / 100).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              From {mockPayouts.length} completed bookings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPayouts}</div>
            <p className="text-xs text-muted-foreground">
              Processing within 1-2 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Status</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Active</div>
            <p className="text-xs text-muted-foreground">
              Ready to receive payments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Payouts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payouts</CardTitle>
          <CardDescription>
            Your latest earnings and payout history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockPayouts.map((payout) => (
              <div key={payout.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${
                    payout.status === 'paid' ? 'bg-green-500' : 'bg-yellow-500'
                  }`} />
                  <div>
                    <p className="font-medium">£{(payout.amount / 100).toFixed(2)}</p>
                    <p className="text-sm text-gray-500">Booking #{payout.booking_id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium capitalize">{payout.status}</p>
                  <p className="text-sm text-gray-500">{payout.date}</p>
                </div>
              </div>
            ))}
          </div>
          
          {mockPayouts.length === 0 && (
            <div className="text-center py-8">
              <Banknote className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No payouts yet</h3>
              <p className="text-gray-600 mb-4">
                Complete your first booking to start earning!
              </p>
              <Button asChild>
                <Link href="/washer/dashboard/available-bookings">
                  View Available Bookings
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Management */}
      <Card>
        <CardHeader>
          <CardTitle>Account Management</CardTitle>
          <CardDescription>
            Manage your payout settings and banking information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Banking Information</h4>
              <p className="text-sm text-gray-600">Update your bank account details</p>
            </div>
            <Button variant="outline">
              Update Account
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Payout Schedule</h4>
              <p className="text-sm text-gray-600">Currently: Automatic after each booking</p>
            </div>
            <Button variant="outline">
              Manage Schedule
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Tax Information</h4>
              <p className="text-sm text-gray-600">Download tax documents and statements</p>
            </div>
            <Button variant="outline">
              View Documents
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default async function PayoutsPage() {
  // Check authentication, washer status, and 4-step onboarding completion
  // Requirements: 7.1, 7.3 - Prevent access to payouts for incomplete washers
  const onboardingStatus = await requireCompleteOnboarding(false) // Don't redirect, show locked state
  
  // If onboarding is not complete, show locked state with clear messaging
  if (!onboardingStatus.isComplete) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payouts & Earnings</h1>
            <p className="text-muted-foreground">
              Complete your setup to access payout features
            </p>
          </div>
        </div>

        {/* Access Denied Alert */}
        <Alert className="border-orange-200 bg-orange-50">
          <Lock className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800">Setup Required</AlertTitle>
          <AlertDescription className="text-orange-700">
            You need to complete all 4 onboarding steps to access payouts and earnings.
            {onboardingStatus.missingSteps.length > 0 && (
              <>
                <br />
                <strong>Missing steps:</strong> {onboardingStatus.missingSteps.join(', ')}
              </>
            )}
          </AlertDescription>
        </Alert>

        {/* Locked Feature Preview */}
        <Card className="border-2 border-dashed border-gray-300 bg-gray-50/50">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-gray-400" />
            </div>
            <CardTitle className="text-2xl text-gray-500">
              Payouts & Earnings
            </CardTitle>
            <CardDescription className="text-gray-400">
              Manage your earnings and payout settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Preview Features */}
            <div className="bg-white rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-gray-500 mb-3">What you'll unlock:</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-500">Instant payout requests</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-500">Earnings analytics and history</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-500">Secure bank account connection</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-500">Tax documentation and reports</span>
                </div>
              </div>
            </div>

            {/* Complete Setup Button */}
            <Button size="lg" className="w-full" asChild>
              <Link href="/washer/dashboard">
                <Lock className="w-5 h-5 mr-2" />
                Complete Setup to Unlock Payouts
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>

            <p className="text-xs text-gray-500 text-center">
              Complete all 4 onboarding steps to access your earnings and payout features.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const supabase = createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/signin?message=Please sign in to view payouts.')
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, washer_status, stripe_account_id, stripe_account_status')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return redirect('/washer/dashboard?message=Profile not found.')
  }

  // Verify user is an approved washer
  if (profile.role !== 'washer' || profile.washer_status !== 'approved') {
    return redirect('/washer/dashboard?message=Access denied.')
  }

  // Check if user has connected their Stripe account
  const hasStripeAccount = !!profile.stripe_account_id
  let accountStatus = null

  if (hasStripeAccount) {
    try {
      const statusResult = await getStripeAccountStatus(profile.stripe_account_id)
      if (statusResult.success) {
        accountStatus = statusResult.data
      }
    } catch (error) {
      console.error('Error fetching Stripe account status:', error)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payouts</h1>
          <p className="text-muted-foreground">
            {hasStripeAccount && accountStatus?.status === 'complete' 
              ? 'Manage your earnings and payout settings'
              : 'Set up your bank account to start receiving payments'
            }
          </p>
        </div>
      </div>

      {/* Show appropriate component based on connection status */}
      {!hasStripeAccount || accountStatus?.status !== 'complete' ? (
        <ConnectBankAccountContainer />
      ) : (
        <PayoutsDashboard accountStatus={accountStatus} user={user} />
      )}
    </div>
  )
}