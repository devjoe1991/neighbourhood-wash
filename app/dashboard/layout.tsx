import Sidebar from '@/components/dashboard/Sidebar' // Make sure this path is correct
import { createClient } from '@/utils/supabase/server_new' // For fetching user on server if needed for layout
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/signin?message=Please sign in to access the dashboard.')
  }

  return (
    <div className='flex min-h-screen bg-gray-100 dark:bg-gray-900'>
      <Sidebar />
      <div className='ml-64 flex flex-1 flex-col'>
        {/* You can add a dashboard-specific Header here if you have one, different from the main site Header */}
        {/* <DashboardHeader user={user} /> */}
        <main className='flex-1 p-4 sm:p-6 lg:p-8'>{children}</main>
      </div>
    </div>
  )
}
