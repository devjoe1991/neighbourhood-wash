import React from 'react'
import AdminNavbar from '@/components/admin/AdminNavbar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Later, we'll add logic here to fetch user and check for admin role
  // For now, let's assume the middleware handles access control.

  return (
    <div className='flex min-h-screen flex-col bg-gray-100'>
      <AdminNavbar />
      {/* <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-xl font-semibold text-gray-900">Neighbourhood Wash - Admin Panel</h1>
        </div>
      </header> */}
      <main className='flex-grow'>
        <div className='mx-auto max-w-7xl py-6 sm:px-6 lg:px-8'>{children}</div>
      </main>
      <footer className='mt-auto bg-gray-200 p-4 text-center'>
        <p className='text-sm text-gray-600'>
          &copy; {new Date().getFullYear()} Neighbourhood Wash. Admin Area.
        </p>
      </footer>
    </div>
  )
}
