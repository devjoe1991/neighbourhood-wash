'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Bell, 
  Calendar, 
  DollarSign, 
  MessageSquare, 
  Star, 
  TrendingUp,
  Clock,
  MapPin,
  User,
  Package,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { useRealTime } from '@/lib/hooks/use-realtime'
import { JobQueue } from './JobQueue'
import { EarningsOverview } from './EarningsOverview'
import { ScheduleManager } from './ScheduleManager'
import { PerformanceMetrics } from './PerformanceMetrics'
import { CustomerCommunication } from './CustomerCommunication'
import { WasherStats } from './WasherStats'

interface WasherProfile {
  id: string
  user_id: string
  rating: number
  total_jobs: number
  completed_jobs: number
  cancellation_rate: number
  is_online: boolean
  service_areas: string[]
  service_types: string[]
  availability_schedule: any
  onboarding_status: string
  approval_status: string
}

interface ModernWasherDashboardProps {
  washerProfile: WasherProfile
  user: {
    id: string
    email: string
    full_name?: string
    avatar_url?: string
  }
}

export function ModernWasherDashboard({ washerProfile, user }: ModernWasherDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [isOnline, setIsOnline] = useState(washerProfile.is_online)
  const [notifications, setNotifications] = useState<any[]>([])
  const { isConnected, subscribe } = useRealTime()

  // Handle real-time events
  useEffect(() => {
    const unsubscribeJobs = subscribe('new_job_assignment', (event) => {
      setNotifications(prev => [...prev, event])
    })

    const unsubscribeBookings = subscribe('booking_status_update', (event) => {
      setNotifications(prev => [...prev, event])
    })

    const unsubscribeMessages = subscribe('message_received', (event) => {
      setNotifications(prev => [...prev, event])
    })

    return () => {
      unsubscribeJobs()
      unsubscribeBookings()
      unsubscribeMessages()
    }
  }, [subscribe])

  const toggleOnlineStatus = async () => {
    try {
      const response = await fetch('/api/washer/toggle-online', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_online: !isOnline })
      })
      
      if (response.ok) {
        setIsOnline(!isOnline)
      }
    } catch (error) {
      console.error('Failed to toggle online status:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    Welcome back, {user.full_name || user.email}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {washerProfile.service_areas.join(', ')}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Online Status Toggle */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Status:</span>
                <Button
                  onClick={toggleOnlineStatus}
                  variant={isOnline ? "default" : "outline"}
                  size="sm"
                  className={isOnline ? "bg-green-600 hover:bg-green-700" : ""}
                >
                  <div className={`w-2 h-2 rounded-full mr-2 ${isOnline ? 'bg-white' : 'bg-gray-400'}`} />
                  {isOnline ? 'Online' : 'Offline'}
                </Button>
              </div>
              
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-xs text-gray-500">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              {/* Notifications */}
              <Button variant="ghost" size="sm">
                <Bell className="w-4 h-4" />
                {notifications.length > 0 && (
                  <Badge className="ml-1 px-1 py-0 text-xs">{notifications.length}</Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="jobs">Job Queue</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <WasherStats washerProfile={washerProfile} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <JobQueue 
                  washerId={washerProfile.id} 
                  isOnline={isOnline}
                  compact={true}
                />
              </div>
              <div className="space-y-6">
                <EarningsOverview 
                  washerId={washerProfile.id}
                  compact={true}
                />
                <PerformanceMetrics 
                  washerProfile={washerProfile}
                  compact={true}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="jobs">
            <JobQueue 
              washerId={washerProfile.id} 
              isOnline={isOnline}
            />
          </TabsContent>

          <TabsContent value="earnings">
            <EarningsOverview washerId={washerProfile.id} />
          </TabsContent>

          <TabsContent value="schedule">
            <ScheduleManager 
              washerId={washerProfile.id}
              currentSchedule={washerProfile.availability_schedule}
            />
          </TabsContent>

          <TabsContent value="performance">
            <PerformanceMetrics washerProfile={washerProfile} />
          </TabsContent>

          <TabsContent value="messages">
            <CustomerCommunication washerId={washerProfile.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}