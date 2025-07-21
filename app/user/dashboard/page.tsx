import { createSupabaseServerClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ModernCustomerDashboard from '@/components/dashboard/customer/ModernCustomerDashboard'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/signin?message=Please sign in to view the dashboard.')
  }

  // Get user profile and roles
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return redirect('/signin?message=Profile not found.')
  }

  // Check user roles
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)

  const roles = userRoles?.map((r: any) => r.role) || []
  const isWasher = roles.includes('washer')
  const isCustomer = roles.includes('customer')

  // CRITICAL FIX: Washers should NEVER see the user dashboard
  // Immediately redirect them to the washer dashboard
  if (isWasher && !isCustomer) {
    console.log(
      `[USER_DASHBOARD] Washer ${user.id} accessing user dashboard, redirecting to washer dashboard`
    )
    return redirect('/washer/dashboard')
  }

  // Get or create customer profile
  let { data: customerProfile } = await supabase
    .from('customer_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!customerProfile) {
    // Create customer profile if it doesn't exist
    const { data: newCustomerProfile, error } = await supabase
      .from('customer_profiles')
      .insert({
        user_id: user.id,
        total_bookings: 0,
        completed_bookings: 0,
        average_rating: 0.0,
        status: 'active'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating customer profile:', error)
      return redirect('/signin?message=Failed to create customer profile.')
    }

    customerProfile = newCustomerProfile
  }

  // Calculate dashboard stats
  const { data: bookingStats } = await supabase
    .from('bookings')
    .select('status, total_price')
    .eq('customer_id', customerProfile.id)

  const totalBookings = bookingStats?.length || 0
  const activeBookings = bookingStats?.filter((b: any) => 
    ['pending', 'assigned', 'confirmed', 'in_progress', 'pickup_complete', 'washing', 'ready_for_delivery', 'out_for_delivery'].includes(b.status)
  ).length || 0
  const completedBookings = bookingStats?.filter((b: any) => b.status === 'completed').length || 0
  const totalSpent = bookingStats?.filter((b: any) => b.status === 'completed').reduce((sum: number, b: any) => sum + b.total_price, 0) || 0

  // Get average rating (mock for now)
  const averageRating = customerProfile.average_rating || 4.2

  const initialStats = {
    totalBookings,
    activeBookings,
    completedBookings,
    totalSpent,
    averageRating,
    favoriteWashers: 0 // TODO: Calculate from favorites table
  }

  return (
    <ModernCustomerDashboard
      user={{
        id: user.id,
        email: user.email || '',
        full_name: profile.full_name
      }}
      customerProfile={customerProfile}
      initialStats={initialStats}
    />
  )
}
