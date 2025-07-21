'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Plus,
  Calendar,
  Settings,
  Star,
  CreditCard,
  MessageCircle,
  MapPin,
  Clock
} from 'lucide-react'
import Link from 'next/link'

export default function QuickActions() {
  const actions = [
    {
      title: 'New Booking',
      description: 'Schedule a new laundry service',
      icon: Plus,
      href: '/user/dashboard/new-booking',
      color: 'bg-blue-500 hover:bg-blue-600',
      primary: true
    },
    {
      title: 'Schedule Recurring',
      description: 'Set up regular pickups',
      icon: Calendar,
      href: '/user/dashboard/recurring-bookings',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Laundry Preferences',
      description: 'Update your preferences',
      icon: Settings,
      href: '/user/dashboard/laundry-preferences',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Rate & Review',
      description: 'Review recent services',
      icon: Star,
      href: '/user/dashboard/reviews',
      color: 'bg-yellow-500 hover:bg-yellow-600'
    },
    {
      title: 'Payment Methods',
      description: 'Manage payment options',
      icon: CreditCard,
      href: '/user/dashboard/payments',
      color: 'bg-indigo-500 hover:bg-indigo-600'
    },
    {
      title: 'Find Washers',
      description: 'Browse local washers',
      icon: MapPin,
      href: '/user/dashboard/find-washer',
      color: 'bg-red-500 hover:bg-red-600'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>Quick Actions</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3">
          {actions.map((action) => {
            const Icon = action.icon
            
            if (action.primary) {
              return (
                <Button
                  key={action.title}
                  asChild
                  className={`${action.color} text-white h-auto p-4 justify-start`}
                >
                  <Link href={action.href}>
                    <div className="flex items-center space-x-3">
                      <div className="bg-white/20 p-2 rounded-lg">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{action.title}</div>
                        <div className="text-sm opacity-90">{action.description}</div>
                      </div>
                    </div>
                  </Link>
                </Button>
              )
            }

            return (
              <Button
                key={action.title}
                variant="outline"
                asChild
                className="h-auto p-3 justify-start hover:bg-gray-50"
              >
                <Link href={action.href}>
                  <div className="flex items-center space-x-3">
                    <div className={`${action.color} p-2 rounded-lg text-white`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-sm">{action.title}</div>
                      <div className="text-xs text-gray-600">{action.description}</div>
                    </div>
                  </div>
                </Link>
              </Button>
            )
          })}
        </div>

        {/* Emergency Contact */}
        <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <MessageCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-800">Need Help?</span>
          </div>
          <p className="text-xs text-red-700 mb-2">
            Having issues with your booking or need immediate assistance?
          </p>
          <Button size="sm" variant="outline" className="w-full border-red-300 text-red-700 hover:bg-red-50">
            Contact Support
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}