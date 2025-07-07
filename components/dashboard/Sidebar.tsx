'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Briefcase,
  Settings,
  Handshake,
  WashingMachine,
  Plus,
  Package,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  userRole?: string | null
  isMobile?: boolean
}

const navLinks = [
  { href: '/dashboard', label: 'Overview', icon: Home },
  {
    href: '/dashboard/new-booking',
    label: 'New Booking',
    icon: Plus,
    requiresRole: 'user',
  },
  {
    href: '/dashboard/my-bookings',
    label: 'My Bookings',
    icon: Package,
    requiresRole: 'user',
  },
  { href: '/dashboard/referrals', label: 'Referrals', icon: Handshake },
  {
    href: '/dashboard/laundry-preferences',
    label: 'Laundry Preferences',
    icon: WashingMachine,
    requiresRole: 'user',
  },
  {
    href: '/dashboard/become-washer',
    label: 'Become a Washer',
    icon: Briefcase,
    requiresNoRole: 'washer',
  },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ userRole, isMobile = false }: SidebarProps) {
  const pathname = usePathname()

  const baseClasses = 'flex h-full flex-col p-4 text-white'
  const desktopClasses = 'bg-gray-800'
  const mobileClasses = 'bg-gray-900' // Slightly darker for overlay

  return (
    <aside
      className={cn(baseClasses, isMobile ? mobileClasses : desktopClasses)}
    >
      <div className='mb-6 flex items-center gap-3 px-2'>
        <Briefcase className='h-8 w-8 text-blue-400' />
        <span className='text-xl font-semibold'>My Dashboard</span>
      </div>
      <nav className='flex-grow'>
        <ul className='space-y-2'>
          {navLinks.map((link) => {
            const isActive = pathname === link.href

            // Conditional rendering for "Become a Washer"
            if (link.requiresNoRole === 'washer' && userRole === 'washer') {
              return null
            }
            // Conditional rendering for links that require a specific role
            if (link.requiresRole && userRole !== link.requiresRole) {
              return null
            }

            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 transition-all hover:bg-gray-700 hover:text-white',
                    {
                      'bg-blue-600 text-white': isActive,
                    }
                  )}
                >
                  <link.icon className='h-5 w-5' />
                  <span>{link.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
      <div className='mt-auto'>
        <div className='rounded-lg bg-gray-700 p-3 text-center text-sm'>
          <p className='font-semibold'>Beta Version</p>
          <p className='text-xs text-gray-400'>Soft Launch</p>
        </div>
      </div>
    </aside>
  )
}
