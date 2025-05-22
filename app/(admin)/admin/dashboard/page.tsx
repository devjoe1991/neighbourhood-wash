import React from 'react'

export default function AdminDashboardPage() {
  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='mb-6 text-3xl font-bold text-gray-800 dark:text-white'>
        Admin Dashboard
      </h1>
      <p className='text-gray-600 dark:text-gray-300'>
        Welcome to the Neighbourhood Wash Admin Control Panel.
      </p>
      {/* Placeholder for admin stats and quick actions */}
      <div className='mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
        <div className='rounded-lg bg-white p-6 shadow dark:bg-gray-800'>
          <h2 className='text-xl font-semibold text-gray-700 dark:text-white'>
            Users
          </h2>
          <p className='mt-2 text-gray-600 dark:text-gray-400'>
            Manage user accounts and verifications.
          </p>
          {/* TODO: Link to user management page */}
        </div>
        <div className='rounded-lg bg-white p-6 shadow dark:bg-gray-800'>
          <h2 className='text-xl font-semibold text-gray-700 dark:text-white'>
            Washers
          </h2>
          <p className='mt-2 text-gray-600 dark:text-gray-400'>
            Manage washer profiles and applications.
          </p>
          {/* TODO: Link to washer management page */}
        </div>
        <div className='rounded-lg bg-white p-6 shadow dark:bg-gray-800'>
          <h2 className='text-xl font-semibold text-gray-700 dark:text-white'>
            Bookings
          </h2>
          <p className='mt-2 text-gray-600 dark:text-gray-400'>
            Oversee and manage platform bookings.
          </p>
          {/* TODO: Link to bookings management page */}
        </div>
      </div>
    </div>
  )
}
