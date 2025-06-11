import Sidebar from '@/components/dashboard/Sidebar'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { createClient } from '@/utils/supabase/server_new'
import { Menu } from 'lucide-react'
import Link from 'next/link'
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
    return redirect('/signin')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  // Robust role detection, falling back to metadata set at signup
  const userRole = profile?.role || user.user_metadata?.selected_role

  return (
    <div className='min-h-screen bg-gray-100'>
      {/* Desktop Sidebar - hidden on mobile */}
      <div className='hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col'>
        <Sidebar userRole={userRole} />
      </div>

      {/* Mobile Header & Main Content */}
      <div className='flex flex-1 flex-col md:pl-64'>
        {/* Mobile-only Header */}
        <header className='sticky top-0 z-10 flex h-16 items-center justify-between bg-white px-4 shadow-sm md:hidden'>
          <Link href='/dashboard' className='text-lg font-bold text-blue-600'>
            NW
          </Link>
          <Sheet>
            <SheetTrigger asChild>
              <button className='rounded-md p-2 text-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none focus:ring-inset'>
                <Menu className='h-6 w-6' />
              </button>
            </SheetTrigger>
            <SheetContent side='left' className='w-64 p-0'>
              <Sidebar userRole={userRole} isMobile />
            </SheetContent>
          </Sheet>
        </header>

        {/* Main Content */}
        <main className='flex-1 p-4 sm:p-6 lg:p-8'>{children}</main>
      </div>
    </div>
  )
}
