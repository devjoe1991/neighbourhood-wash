import React from 'react'
import { Users, Briefcase, ListOrdered, ChevronRight } from 'lucide-react'
import Link from 'next/link'

// Example data for dashboard cards - later this might come from stats
const dashboardCards = [
  {
    title: 'Users',
    description: 'Manage user accounts and verifications.',
    icon: <Users className='h-8 w-8 text-sky-500' />,
    link: '/admin/users',
    value: '125', // Example stat
    valueLabel: 'Total Users',
  },
  {
    title: 'Washers',
    description: 'Manage washer profiles and applications.',
    icon: <Briefcase className='h-8 w-8 text-green-500' />,
    link: '/admin/washers',
    value: '15', // Example stat
    valueLabel: 'Active Washers',
  },
  {
    title: 'Bookings',
    description: 'Oversee and manage platform bookings.',
    icon: <ListOrdered className='h-8 w-8 text-amber-500' />,
    link: '/admin/bookings',
    value: '32', // Example stat
    valueLabel: 'Pending Bookings',
  },
]

const AdminDashboardPage = () => {
  return (
    <div className='container mx-auto p-4 sm:p-6 lg:p-8'>
      <div className='mb-8'>
        <h1 className='mb-6 text-3xl font-bold text-gray-800'>
          Admin Dashboard
        </h1>
        <p className='mb-8 text-gray-600'>
          Welcome, Admin. Here&apos;s a summary of platform activity.
        </p>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
        {/* Total Users Card */}
        <div className='flex h-full flex-col justify-between rounded-lg bg-white p-6 shadow-md'>
          <div>
            <div className='mb-4 flex items-center justify-between'>
              <h2 className='text-xl font-semibold text-slate-700'>
                Total Users
              </h2>
              <div className='rounded-full bg-sky-100 p-2'>
                <Users className='h-6 w-6 text-sky-600' />
              </div>
            </div>
            <p className='mb-4 text-sm text-slate-500'>
              The total number of registered users.
            </p>
          </div>
          <div>
            <p className='text-3xl font-bold text-slate-700'>1,234</p>
            <p className='text-xs text-slate-500'>+5% from last month</p>
            <div className='mt-4 flex items-center text-sm font-medium text-sky-600'>
              <Link href='/admin/users' className='hover:underline'>
                View all users
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
        {dashboardCards.map((card) => (
          <Link
            href={card.link}
            key={card.title}
            className='block transition-shadow duration-150 ease-in-out hover:shadow-lg'
          >
            <div className='flex h-full flex-col justify-between rounded-lg bg-white p-6 shadow-md'>
              <div>
                <div className='mb-4 flex items-center justify-between'>
                  <h2 className='text-xl font-semibold text-slate-700'>
                    {card.title}
                  </h2>
                  {card.icon}
                </div>
                <p className='mb-4 text-sm text-slate-500'>
                  {card.description}
                </p>
              </div>
              <div>
                <p className='text-3xl font-bold text-slate-700'>
                  {card.value}
                </p>
                <p className='text-xs text-slate-500'>{card.valueLabel}</p>
                <div className='mt-4 flex items-center text-sm font-medium text-sky-600'>
                  View {card.title.toLowerCase()}{' '}
                  <ChevronRight className='ml-1 h-4 w-4' />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default AdminDashboardPage
