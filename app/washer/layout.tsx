import Sidebar from '@/components/dashboard/Sidebar'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { createSupabaseServerClient } from '@/utils/supabase/server'
import { Menu } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

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
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, is_approved')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    // This case might happen if the profile doesn't exist for some reason
    return redirect('/user/dashboard?message=Profile not found.')
  }

  if (profile.role !== 'washer') {
    return redirect(
      '/user/dashboard?message=Access denied. Washer role required.'
    )
  }

  // Check if washer application is approved
  if (!profile.is_approved) {
    return redirect(
      '/user/dashboard/become-washer?message=Your washer application is not yet approved.'
    )
  }

  return (
    <div className='min-h-screen bg-gray-100'>
      {/* Desktop Sidebar - hidden on mobile */}
      <div className='hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col'>
        <Sidebar userRole={profile.role} />
      </div>

      {/* Mobile Header & Main Content */}
      <div className='flex flex-1 flex-col md:pl-64'>
        {/* Mobile-only Header */}
        <header className='sticky top-0 z-10 flex h-16 items-center justify-between bg-white px-4 shadow-sm md:hidden'>
          <Link
            href='/washer/dashboard'
            className='text-lg font-bold text-blue-600'
          >
            NW
          </Link>
          <Sheet>
            <SheetTrigger asChild>
              <button className='rounded-md p-2 text-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none focus:ring-inset'>
                <Menu className='h-6 w-6' />
              </button>
            </SheetTrigger>
            <SheetContent side='left' className='w-64 p-0'>
              <Sidebar userRole={profile.role} isMobile />
            </SheetContent>
          </Sheet>
        </header>

        {/* Main Content */}
        <main className='flex-1 p-4 sm:p-6 lg:p-8'>{children}</main>
      </div>
    </div>
  )
}
