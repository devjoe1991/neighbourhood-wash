import React from 'react'

// TODO: Define Booking type
// TODO: Fetch bookings data

const AdminBookingsPage = () => {
  // const bookings = await getBookings(); // Placeholder
  const bookings = [] // Placeholder

  return (
    <div className='container mx-auto p-4'>
      <div className='mb-8 text-center'>
        <h1 className='text-3xl font-bold text-gray-800'>Booking Management</h1>
        <p className='mb-4 text-gray-600'>
          Monitor and manage all bookings on the platform.
        </p>
      </div>

      {/* TODO: Filters for booking status, date range, etc. */}

      {/* TODO: Implement Booking Table or List component */}
      {bookings.length > 0 ? (
        <div className='overflow-x-auto rounded-lg bg-white shadow'>
          {/* Placeholder for table */}
          <p className='p-6 text-gray-500'>
            Booking data table to be implemented here.
          </p>
        </div>
      ) : (
        <div className='rounded-lg bg-white p-6 text-center shadow'>
          <p className='text-gray-500'>
            No bookings found or data not yet loaded.
          </p>
        </div>
      )}
    </div>
  )
}

export default AdminBookingsPage
