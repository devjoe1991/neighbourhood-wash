'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Calendar,
  Clock,
  Package,
  Plus,
  MessageCircle,
  CreditCard,
  Star,
  MapPin,
  Bell,
  Activity,
  TrendingUp,
  User
} from 'lucide-react'
import Link from 'next/link'
import { useRealTime, useBookingStatusUpdates, useMessageUpdates } from '@/lib/hooks/use-realtime'
import { toast } from 'sonner'

// Import sub-components
import BookingOverview from './BookingOverview'
import ActiveBookings from './ActiveBookings'
// import BookingHistory from './BookingHistory'
import PaymentMethods from './PaymentMethods'
import QuickActions from './QuickActions'
import RecentActivity from './RecentActivity'
import ServiceStats from './ServiceStats'
import MessagingInterface from './MessagingInterface'

interface CustomerProfile {
  id: string
  user_id: string
  total_bookings: number
  completed_bookings: number
  average_rating: number
  status: string
  created_at: string
}

interface DashboardStats {
  totalBookings: number
  activeBookings: number
  completedBookings: number
  totalSpent: number
  averageRating: number
  favoriteWashers: number
}

interface ModernCustomerDashboardProps {
  user: {
    id: string
    email: string
    full_name?: string
  }
  customerProfile: CustomerProfile
  initialStats: DashboardStats
}

export default function ModernCustomerDashboard({
  user,
  customerProfile,
  initialStats
}: ModernCustomerDashboardProps) {
  const [stats, setStats] = useState<DashboardStats>(initialStats)
  const [activeTab, setActiveTab] = useState('overview')
  const [notifications, setNotifications] = useState<any[]>([])
  
  // Real-time connection
  const { isConnected, connectionStats } = useRealTime()

  // Handle real-time booking updates
  useBookingStatusUpdates('', (event) => {
    // Update stats when booking status changes
    if (event.newStatus === 'completed') {
      setStats(prev => ({
        ...prev,
        completedBookings: prev.completedBookings + 1
      }))
      
      toast.success('Booking completed!', {
        description: 'Your laundry service has been completed.'
      })
    }
  })

  // Handle real-time messages
  useMessageUpdates((event) => {
    toast.info('New message', {
      description: 'You have a new message from your washer.'
    })
  })

  // Welcome message for new users
  useEffect(() => {
    if (stats.totalBookings === 0) {
      toast.info('Welcome to Neighbourhood Wash!', {
        description: 'Ready to book your first laundry service?'
      })
    }
  }, [stats.totalBookings])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    Welcome back, {user.full_name?.split(' ')[0] || 'Customer'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {isConnected ? (
                      <span className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                        Connected
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <div className="w-2 h-2 bg-gray-400 rounded-full mr-2" />
                        Offline
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
                    {notifications.length}
                  </Badge>
                )}
              </Button>
              
              {/* Quick Book Button */}
              <Button asChild>
                <Link href="/user/dashboard/new-booking">
                  <Plus className="h-4 w-4 mr-2" />
                  New Booking
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center space-x-2">
              <Package className="h-4 w-4" />
              <span>Bookings</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center space-x-2">
              <MessageCircle className="h-4 w-4" />
              <span>Messages</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span>Payments</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>History</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalBookings}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.activeBookings} active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.completedBookings}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.totalBookings > 0 
                      ? Math.round((stats.completedBookings / stats.totalBookings) * 100)
                      : 0}% completion rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">£{stats.totalSpent.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">
                    Avg £{stats.completedBookings > 0 
                      ? (stats.totalSpent / stats.completedBookings).toFixed(2) 
                      : '0.00'} per service
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Your Rating</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold flex items-center">
                    {stats.averageRating.toFixed(1)}
                    <Star className="h-5 w-5 text-yellow-400 ml-1 fill-current" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Based on {stats.completedBookings} reviews
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - 2/3 width */}
              <div className="lg:col-span-2 space-y-6">
                <BookingOverview />
                <ActiveBookings />
              </div>

              {/* Right Column - 1/3 width */}
              <div className="space-y-6">
                <QuickActions />
                <RecentActivity />
                <ServiceStats stats={stats} />
              </div>
            </div>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">My Bookings</h2>
              <Button asChild>
                <Link href="/user/dashboard/new-booking">
                  <Plus className="h-4 w-4 mr-2" />
                  New Booking
                </Link>
              </Button>
            </div>
            <ActiveBookings showAll />
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Messages</h2>
            </div>
            <MessagingInterface />
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Payment Methods</h2>
            </div>
            <PaymentMethods />
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Service History</h2>
            </div>
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Booking History
                  </h3>
                  <p className="text-gray-600">
                    Your service history will appear here
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}