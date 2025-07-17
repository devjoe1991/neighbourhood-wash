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
  CreditCard,
  Shield,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVerificationStatus } from '@/lib/hooks/use-verification-status'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

interface SidebarProps {
  userRole?: string | null
  isMobile?: boolean
}

const getUserSpecificRoute = (
  userRole: string | null | undefined,
  userPath: string,
  washerPath: string
) => {
  return userRole === 'washer' ? washerPath : userPath
}

const navLinks = [
  {
    userPath: '/user/dashboard',
    washerPath: '/washer/dashboard',
    label: 'Overview',
    icon: Home,
  },
  {
    href: '/user/dashboard/new-booking',
    label: 'New Booking',
    icon: Plus,
    requiresRole: 'user',
  },
  {
    userPath: '/user/dashboard/my-bookings',
    washerPath: '/washer/dashboard/bookings',
    label: 'My Bookings',
    icon: Package,
  },
  {
    washerPath: '/washer/dashboard/available-bookings',
    userPath: '#', // Dummy path, will be hidden for non-washers
    label: 'Available Bookings',
    icon: Plus,
    requiresRole: 'washer',
  },
  {
    userPath: '/user/dashboard/referrals',
    washerPath: '/user/dashboard/referrals', // TODO: Update when washer referrals page exists
    label: 'Referrals',
    icon: Handshake,
  },
  {
    href: '/user/dashboard/laundry-preferences',
    label: 'Laundry Preferences',
    icon: WashingMachine,
    requiresRole: 'user',
  },
  {
    href: '/user/dashboard/become-washer',
    label: 'Become a Washer',
    icon: Briefcase,
    requiresNoRole: 'washer',
  },
  {
    href: '/washer/dashboard/payouts',
    label: 'Payouts',
    icon: CreditCard,
    requiresRole: 'washer',
  },
  {
    userPath: '/user/dashboard/settings',
    washerPath: '/washer/dashboard/my-settings',
    label: 'Settings',
    icon: Settings,
  },
]

export default function Sidebar({ userRole, isMobile = false }: SidebarProps) {
  const pathname = usePathname()
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()

  // Get current user ID
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)
    }
    getUser()
  }, [supabase])

  // Get verification status for washers
  const verificationStatus = useVerificationStatus(
    userRole === 'washer' ? userId || undefined : undefined
  )

  const baseClasses = 'flex h-full flex-col p-4 text-white'
  const desktopClasses = 'bg-gray-800'
  const mobileClasses = 'bg-gray-900' // Slightly darker for overlay

  // Helper function to get verification status icon and color
  const getVerificationStatusDisplay = () => {
    if (userRole !== 'washer') return null

    const { status, isLoading, error } = verificationStatus

    if (isLoading) {
      return {
        icon: Clock,
        color: 'text-yellow-400',
        text: 'Checking...',
        bgColor: 'bg-yellow-900/20',
        description: 'Verifying your account status...',
      }
    }

    if (error) {
      return {
        icon: AlertCircle,
        color: 'text-red-400',
        text: 'Error',
        bgColor: 'bg-red-900/20',
        description: 'Unable to check verification status',
      }
    }

    switch (status) {
      case 'complete':
        return {
          icon: CheckCircle,
          color: 'text-green-400',
          text: 'Verified',
          bgColor: 'bg-green-900/20',
          description: 'All features available',
        }
      case 'pending':
        return {
          icon: Clock,
          color: 'text-yellow-400',
          text: 'Pending',
          bgColor: 'bg-yellow-900/20',
          description: 'Verification under review',
        }
      case 'requires_action':
        return {
          icon: AlertCircle,
          color: 'text-orange-400',
          text: 'Action Required',
          bgColor: 'bg-orange-900/20',
          description: 'Additional info needed',
        }
      case 'rejected':
        return {
          icon: AlertCircle,
          color: 'text-red-400',
          text: 'Rejected',
          bgColor: 'bg-red-900/20',
          description: 'Contact support for help',
        }
      default:
        return {
          icon: Shield,
          color: 'text-gray-400',
          text: 'Not Verified',
          bgColor: 'bg-gray-700/50',
          description: 'Complete verification to start',
        }
    }
  }

  // Check if a washer-specific link should be disabled
  const isWasherLinkDisabled = (link: typeof navLinks[0]) => {
    if (userRole !== 'washer') return false
    if (!link.requiresRole || link.requiresRole !== 'washer') return false
    
    // Disable washer-specific features if not verified
    const washerFeatureLinks = [
      '/washer/dashboard/available-bookings',
      '/washer/dashboard/bookings',
      '/washer/dashboard/payouts'
    ]
    
    const href = link.userPath && link.washerPath
      ? getUserSpecificRoute(userRole, link.userPath, link.washerPath)
      : link.href!

    return washerFeatureLinks.includes(href) && !verificationStatus.canAccess
  }

  const verificationDisplay = getVerificationStatusDisplay()

  return (
    <aside
      className={cn(baseClasses, isMobile ? mobileClasses : desktopClasses)}
    >
      <div className='mb-6 flex items-center gap-3 px-2'>
        <Briefcase className='h-8 w-8 text-blue-400' />
        <span className='text-xl font-semibold'>My Dashboard</span>
      </div>

      {/* Verification Status Display for Washers */}
      {verificationDisplay && (
        <div className={cn(
          'mb-4 rounded-lg p-3 text-sm',
          verificationDisplay.bgColor
        )}>
          <div className='flex items-center gap-2'>
            <verificationDisplay.icon className={cn('h-4 w-4', verificationDisplay.color)} />
            <span className='font-medium'>Verification Status</span>
          </div>
          <p className={cn('mt-1 text-xs', verificationDisplay.color)}>
            {verificationDisplay.text}
          </p>
          <p className='mt-1 text-xs text-gray-400'>
            {verificationDisplay.description}
          </p>
        </div>
      )}

      <nav className='flex-grow'>
        <ul className='space-y-2'>
          {navLinks.map((link) => {
            // Use dynamic route for Overview based on user role
            const href =
              link.userPath && link.washerPath
                ? getUserSpecificRoute(userRole, link.userPath, link.washerPath)
                : link.href!

            const isActive = pathname === href
            const isDisabled = isWasherLinkDisabled(link)

            // Conditional rendering for "Become a Washer"
            if (link.requiresNoRole === 'washer' && userRole === 'washer') {
              return null
            }
            // Conditional rendering for links that require a specific role
            if (link.requiresRole && userRole !== link.requiresRole) {
              return null
            }

            return (
              <li key={href}>
                {isDisabled ? (
                  <div
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 cursor-not-allowed opacity-50',
                      'relative'
                    )}
                    title="Complete verification to access this feature"
                  >
                    <link.icon className='h-5 w-5' />
                    <span>{link.label}</span>
                    <Shield className='h-3 w-3 ml-auto text-gray-500' />
                  </div>
                ) : (
                  <Link
                    href={href}
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
                )}
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
