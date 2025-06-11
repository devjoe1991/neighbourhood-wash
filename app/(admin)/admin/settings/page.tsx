import React from 'react'

// TODO: Define structure for platform settings

const AdminSettingsPage = () => {
  return (
    <div className='container mx-auto p-4 sm:p-6 lg:p-8'>
      <div className='mb-8'>
        <h1 className='mb-6 text-3xl font-bold text-gray-800'>
          Admin Settings
        </h1>
        <p className='mb-8 text-gray-600'>
          Manage global platform settings and configurations.
        </p>
      </div>

      <div className='space-y-8'>
        {/* General Settings */}
        <div className='rounded-lg bg-white p-6 shadow'>
          <h2 className='mb-3 text-xl font-semibold text-gray-700'>
            General Settings
          </h2>
          <p className='text-gray-500'>
            Placeholder for general platform settings like site name, contact
            info, etc.
          </p>
          {/* TODO: Add form fields */}
        </div>

        {/* Payment Gateway Settings */}
        <div className='rounded-lg bg-white p-6 shadow'>
          <h2 className='mb-3 text-xl font-semibold text-gray-700'>
            Payment Gateway
          </h2>
          <p className='text-gray-500'>
            Configure Stripe or other payment gateway API keys and settings.
          </p>
          {/* TODO: Add form fields */}
        </div>

        {/* Commission Rate Settings */}
        <div className='rounded-lg bg-white p-6 shadow'>
          <h2 className='mb-3 text-xl font-semibold text-gray-700'>
            Commission Rates
          </h2>
          <p className='text-gray-500'>
            Set the platform&apos;s commission fee on washer earnings.
          </p>
          {/* TODO: Add form fields */}
        </div>

        {/* Other Admin Settings */}
        <div className='rounded-lg bg-white p-6 shadow'>
          <h2 className='mb-3 text-xl font-semibold text-gray-700'>
            System Maintenance
          </h2>
          <p className='text-gray-500'>
            Actions like clearing cache, putting site in maintenance mode, etc.
          </p>
          {/* TODO: Add buttons for actions */}
        </div>
      </div>
    </div>
  )
}

export default AdminSettingsPage
