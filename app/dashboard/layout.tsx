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
  const [_user, _setUser] = useState<User | null>(null) // Prefixed to satisfy linter for now
  const [loading, setLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      // ... (existing placeholder fetchUser logic) ...
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
    ) // Or a proper loading skeleton
  }

  // Placeholder for actual auth check based on _user. If !_user, redirect or show sign-in message.
  // For now, we proceed to render the layout.

  return (
    <div className='flex min-h-screen bg-gray-100 dark:bg-gray-900'>
      {/* Sidebar: Adjust classes for mobile (hidden by default, shown with state) */}
      {/* The actual Sidebar component will also need class adjustments for transition */}
      <div
        className={`fixed top-0 left-0 z-40 h-screen w-64 bg-gray-800 text-white transition-transform duration-300 ease-in-out md:sticky md:top-16 md:h-[calc(100vh-4rem)] ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        {/* Pass a close function to the sidebar for an internal close button if needed */}
        <Sidebar closeSidebar={() => setIsSidebarOpen(false)} />
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {isSidebarOpen && (
        <div
          className='fixed inset-0 z-30 bg-black/50 md:hidden'
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      <div
        className={`flex flex-1 flex-col transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'md:ml-64' : 'ml-0 md:ml-64'
          // On mobile, ml-0. On desktop, ml-64.
          // If sidebar is an overlay on mobile, content doesn't need to shift.
          // If sidebar pushes content, this needs to be 'ml-64' when open on mobile too.
          // For now, let's assume overlay for mobile, so content doesn't shift based on isSidebarOpen for mobile.
          // Desktop margin is always there (md:ml-64). Mobile margin is always ml-0.
        } ml-0 md:ml-64`} // Simplified: always ml-0 on mobile, md:ml-64 on desktop
      >
        {/* Dashboard Header for Hamburger Menu */}
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

        {/* Ensure main content has top padding to account for the new mobile header */}
        <main className='flex-1 p-4 pt-20 sm:p-6 md:pt-4 lg:p-8'>
          {children}
        </main>
      </div>
    </div>
  )
}
