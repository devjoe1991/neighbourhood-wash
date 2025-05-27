'use client'

import Sidebar from '@/components/dashboard/Sidebar'
// import { createClient } from '@/utils/supabase/server_new' // Removed unused import
// import { redirect } from 'next/navigation' // Removed unused import
import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import { type User } from '@supabase/supabase-js'
import Link from 'next/link'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [_user, _setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      // Simulate fetching user, in a real app, use Supabase client API
      // This is NOT secure and for layout demonstration ONLY
      // _setUser({ id: 'simulated-user', email: 'user@example.com' } as User);
      setLoading(false)
    }
    fetchUser()
  }, [])

  if (loading) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div>Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className='flex min-h-screen bg-gray-100 pt-16 md:pt-0 dark:bg-gray-900'>
      {' '}
      {/* Added pt-16 for global header space, md:pt-0 because sticky children handle it */}
      <div
        className={`fixed top-0 left-0 z-40 h-screen w-64 bg-gray-800 text-white transition-transform duration-300 ease-in-out md:sticky md:top-16 md:h-[calc(100vh-4rem)] ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <Sidebar closeSidebar={() => setIsSidebarOpen(false)} />
      </div>
      {isSidebarOpen && (
        <div
          className='fixed inset-0 z-30 bg-black/50 md:hidden'
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
      {/* Main content area wrapper */}
      <div className='flex flex-1 flex-col'>
        {' '}
        {/* Removed md:ml-64 */}
        {/* Mobile-only Dashboard Header */}
        <header className='sticky top-0 z-20 flex h-16 items-center justify-between bg-white px-4 shadow-sm md:hidden dark:bg-gray-800'>
          <Link
            href='/dashboard'
            className='text-lg font-bold text-blue-600 dark:text-blue-400'
          >
            Neighbourhood Wash
          </Link>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className='rounded-md p-2 text-gray-700 hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none focus:ring-inset dark:text-gray-300 dark:hover:bg-gray-700'
            aria-label='Toggle menu'
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>
        {/* Main content itself */}
        {/* Mobile: pt-0 because mobile header is h-16 and sticky. Desktop: pt-0 because sidebar is md:top-16 */}
        <main className='flex-1 p-4 sm:p-6 lg:p-8'>{children}</main>
      </div>
    </div>
  )
}
