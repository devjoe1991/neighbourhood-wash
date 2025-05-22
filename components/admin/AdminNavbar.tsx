import Link from 'next/link'
import { LogOut } from 'lucide-react'
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
    { href: '/admin/dashboard', label: 'Dashboard' },
    { href: '/admin/users', label: 'Users' }, // Placeholder
    { href: '/admin/washers', label: 'Washers' }, // Placeholder
    { href: '/admin/bookings', label: 'Bookings' }, // Placeholder
    { href: '/admin/settings', label: 'Settings' }, // Placeholder
  ]

  return (
    <nav className='bg-primary-blue p-4 text-white shadow-md'>
      <div className='container mx-auto flex items-center justify-between'>
        <Link
          href='/admin/dashboard'
          className='hover:text-secondary-blue text-xl font-bold transition-colors'
        >
          Admin Panel
        </Link>
        <ul className='flex items-center space-x-4'>
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className='hover:text-secondary-blue transition-colors'
              >
                {item.label}
              </Link>
            </li>
          ))}
          <li>
            {/* 
            <form action={handleSignOut}> 
              <button 
                type="submit"
                className="flex items-center hover:text-red-400 transition-colors"
              >
                <LogOut className="mr-2 h-5 w-5" />
                Sign Out
              </button>
            </form>
            */}
            {/* For now, a simple link to a non-existent signout, or just a placeholder */}
            <Link
              href='/auth/signout'
              className='flex items-center transition-colors hover:text-red-400'
            >
              <LogOut className='mr-2 h-5 w-5' />
              Sign Out (placeholder)
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  )
}

export default AdminNavbar
