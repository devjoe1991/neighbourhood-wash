import Link from 'next/link'

const Sidebar = () => {
  return (
    <aside className='fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-gray-800 p-4 text-white'>
      <nav className='mt-4'>
        <ul>
          <li className='mb-2'>
            <Link
              href='/dashboard'
              className='block rounded px-2 py-1 hover:bg-gray-700 hover:text-blue-300'
            >
              Overview
            </Link>
          </li>
          {/* <li className="mb-2">
            <Link href="/dashboard/bookings" className="block rounded px-2 py-1 hover:bg-gray-700 hover:text-blue-300">
              My Bookings
            </Link>
          </li> */}
          <li className='mb-2'>
            <Link
              href='/dashboard/referrals'
              className='block rounded px-2 py-1 hover:bg-gray-700 hover:text-blue-300'
            >
              Referrals
            </Link>
          </li>
          <li className='mb-2'>
            <Link
              href='/dashboard/become-washer'
              className='block rounded px-2 py-1 hover:bg-gray-700 hover:text-blue-300'
            >
              Become a Washer
            </Link>
          </li>
          <li className='mb-2'>
            <Link
              href='/dashboard/settings'
              className='block rounded px-2 py-1 hover:bg-gray-700 hover:text-blue-300'
            >
              Settings
            </Link>
          </li>
          {/* Add more links as needed */}
        </ul>
      </nav>
      <div className='absolute bottom-4 left-4 w-[calc(100%-2rem)]'>
        <p className='rounded bg-blue-600 p-2 text-center text-xs font-semibold text-white'>
          Soft Launch - Beta Version
        </p>
      </div>
    </aside>
  )
}

export default Sidebar
