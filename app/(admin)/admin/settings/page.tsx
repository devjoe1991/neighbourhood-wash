import React from 'react'

// TODO: Define structure for platform settings

export default function AdminSettingsPage() {
  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='mb-6 text-3xl font-bold text-gray-800 dark:text-white'>
        Platform Settings
      </h1>

      <p className='mb-8 text-gray-600 dark:text-gray-300'>
        Manage global platform configurations, integrations, and other
        administrative settings.
      </p>

      <div className='grid grid-cols-1 gap-8 md:grid-cols-2'>
        {/* Placeholder for settings sections */}
        <div className='rounded-lg bg-white p-6 shadow dark:bg-gray-800'>
          <h2 className='mb-3 text-xl font-semibold text-gray-700 dark:text-white'>
            General Settings
          </h2>
          <p className='text-gray-500 dark:text-gray-400'>
            Site name, contact information, maintenance mode, etc.
          </p>
          {/* TODO: Form fields for general settings */}
        </div>

        <div className='rounded-lg bg-white p-6 shadow dark:bg-gray-800'>
          <h2 className='mb-3 text-xl font-semibold text-gray-700 dark:text-white'>
            Referral Program
          </h2>
          <p className='text-gray-500 dark:text-gray-400'>
            Configure referral bonuses, terms, etc.
          </p>
          {/* TODO: Form fields for referral settings */}
        </div>

        <div className='rounded-lg bg-white p-6 shadow dark:bg-gray-800'>
          <h2 className='mb-3 text-xl font-semibold text-gray-700 dark:text-white'>
            Content Management
          </h2>
          <p className='text-gray-500 dark:text-gray-400'>
            Manage content for FAQs, landing pages, etc.
          </p>
          {/* TODO: Links or tools for content management */}
        </div>

        <div className='rounded-lg bg-white p-6 shadow dark:bg-gray-800'>
          <h2 className='mb-3 text-xl font-semibold text-gray-700 dark:text-white'>
            Security
          </h2>
          <p className='text-gray-500 dark:text-gray-400'>
            View audit logs, manage API keys (if any), etc.
          </p>
          {/* TODO: Security related settings and logs */}
        </div>
      </div>
    </div>
  )
}
