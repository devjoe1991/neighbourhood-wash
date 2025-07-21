import { createSupabaseServerClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { WasherDashboardContainer } from '@/components/dashboard/washer/WasherDashboardContainer'

export const dynamic = 'force-dynamic'

export default async function ModernWasherDashboard() {
  const supabase = createSupabaseServerClient()
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/signin')
  }

  // Check if user has washer role
  const { data: userRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'washer')
    .eq('status', 'active')

  if (rolesError || !userRoles || userRoles.length === 0) {
    redirect('/user/dashboard/become-washer')
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    redirect('/signin')
  }

  // Get washer profile
  const { data: washerProfile, error: washerError } = await supabase
    .from('washer_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const userData = {
    id: user.id,
    email: user.email || '',
    full_name: profile.full_name,
    avatar_url: profile.avatar_url
  }

  return (
    <WasherDashboardContainer 
      user={userData} 
      washerProfile={washerProfile} 
    />
  )
}