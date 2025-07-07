import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/utils/supabase/server'

export default async function WasherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect(
      '/signin?message=Please sign in to access the washer dashboard.'
    )
  }

  // Check if user has washer role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, washer_status')
    .eq('id', user.id)
    .maybeSingle()

  const userRole = profile?.role || user.user_metadata?.selected_role

  if (userRole !== 'washer') {
    return redirect('/dashboard?message=Access denied. Washer role required.')
  }

  // Check if washer is approved
  if (profile?.washer_status !== 'approved') {
    return redirect(
      '/dashboard/become-washer?message=Your washer application is not yet approved.'
    )
  }

  return <>{children}</>
}
