import Link from 'next/link'
import {
  LogOut,
  Settings,
  Users,
  Briefcase,
  LayoutDashboard,
  DollarSign,
  TrendingUp,
} from 'lucide-react'
// import { createClient } from '@/utils/supabase/server_new'; // For server-side sign out
// import { redirect } from 'next/navigation';

const AdminNavbar = () => {
  // const handleSignOut = async () => {
  //   'use server';
  //   const supabase = await createClient();
  //   await supabase.auth.signOut();
  //   return redirect('/signin');
  // };

  const navItems = [
    {
      href: '/admin/dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className='mr-2 h-5 w-5' />,
    },
    {
      href: '/admin/users',
      label: 'Users',
      icon: <Users className='mr-2 h-5 w-5' />,
    },
    {
      href: '/admin/washers',
      label: 'Washers',
      icon: <Briefcase className='mr-2 h-5 w-5' />,
    },
    {
      href: '/admin/bookings',
      label: 'Bookings',
      icon: <Briefcase className='mr-2 h-5 w-5' />,
    },
    {
      href: '/admin/revenue',
      label: 'Revenue',
      icon: <DollarSign className='mr-2 h-5 w-5' />,
    },
    {
      href: '/admin/onboarding',
      label: 'Onboarding',
      icon: <TrendingUp className='mr-2 h-5 w-5' />,
    },
    {
      href: '/admin/settings',
      label: 'Settings',
      icon: <Settings className='mr-2 h-5 w-5' />,
    },
  ]

  return (
    <nav className='bg-slate-800 p-5 text-slate-100 shadow-lg'>
      <div className='container mx-auto flex items-center justify-between'>
        <Link
          href='/admin/dashboard'
          className='text-2xl font-semibold transition-colors duration-150 hover:text-sky-400'
        >
          Neighbourhood Wash Admin
        </Link>
        <ul className='flex items-center space-x-6'>
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className='flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 hover:bg-slate-700 hover:text-sky-300'
              >
                {item.icon}
                {item.label}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href='/auth/signout'
              className='flex items-center rounded-md px-3 py-2 text-sm font-medium text-slate-300 transition-colors duration-150 hover:bg-red-700 hover:text-white'
            >
              <LogOut className='mr-2 h-5 w-5' />
              Sign Out
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  )
}

export default AdminNavbar
