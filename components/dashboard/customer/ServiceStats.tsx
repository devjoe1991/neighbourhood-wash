'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  TrendingUp,
  Star,
  Clock,
  Award,
  Target,
  Calendar
} from 'lucide-react'

interface DashboardStats {
  totalBookings: number
  activeBookings: number
  completedBookings: number
  totalSpent: number
  averageRating: number
  favoriteWashers: number
}

interface ServiceStatsProps {
  stats: DashboardStats
}

export default function ServiceStats({ stats }: ServiceStatsProps) {
  const completionRate = stats.totalBookings > 0 
    ? (stats.completedBookings / stats.totalBookings) * 100 
    : 0

  const averageSpending = stats.completedBookings > 0 
    ? stats.totalSpent / stats.completedBookings 
    : 0

  // Calculate loyalty tier based on completed bookings
  const getLoyaltyTier = (completedBookings: number) => {
    if (completedBookings >= 50) return { name: 'Platinum', color: 'text-purple-600', progress: 100 }
    if (completedBookings >= 25) return { name: 'Gold', color: 'text-yellow-600', progress: (completedBookings / 50) * 100 }
    if (completedBookings >= 10) return { name: 'Silver', color: 'text-gray-600', progress: (completedBookings / 25) * 100 }
    if (completedBookings >= 5) return { name: 'Bronze', color: 'text-orange-600', progress: (completedBookings / 10) * 100 }
    return { name: 'New Customer', color: 'text-blue-600', progress: (completedBookings / 5) * 100 }
  }

  const loyaltyTier = getLoyaltyTier(stats.completedBookings)

  const getNextTierTarget = (completedBookings: number) => {
    if (completedBookings >= 50) return null
    if (completedBookings >= 25) return 50
    if (completedBookings >= 10) return 25
    if (completedBookings >= 5) return 10
    return 5
  }

  const nextTierTarget = getNextTierTarget(stats.completedBookings)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5" />
          <span>Your Stats</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Loyalty Tier */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Award className={`h-5 w-5 ${loyaltyTier.color}`} />
              <span className={`font-medium ${loyaltyTier.color}`}>
                {loyaltyTier.name}
              </span>
            </div>
            {nextTierTarget && (
              <span className="text-sm text-gray-600">
                {nextTierTarget - stats.completedBookings} to next tier
              </span>
            )}
          </div>
          
          {nextTierTarget && (
            <div className="space-y-1">
              <Progress value={loyaltyTier.progress} className="h-2" />
              <div className="flex justify-between text-xs text-gray-600">
                <span>{stats.completedBookings} completed</span>
                <span>{nextTierTarget} target</span>
              </div>
            </div>
          )}
        </div>

        {/* Service Statistics */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Completion Rate</span>
            </div>
            <span className="text-sm font-semibold text-green-600">
              {completionRate.toFixed(1)}%
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">Average Rating</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-sm font-semibold">
                {stats.averageRating.toFixed(1)}
              </span>
              <Star className="h-3 w-3 text-yellow-400 fill-current" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Avg. Spending</span>
            </div>
            <span className="text-sm font-semibold">
              £{averageSpending.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">This Month</span>
            </div>
            <span className="text-sm font-semibold">
              {stats.activeBookings} active
            </span>
          </div>
        </div>

        {/* Achievements */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">Recent Achievements</h4>
          <div className="space-y-2">
            {stats.completedBookings >= 1 && (
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">First booking completed</span>
              </div>
            )}
            {stats.completedBookings >= 5 && (
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">Regular customer</span>
              </div>
            )}
            {stats.averageRating >= 4.5 && stats.completedBookings >= 3 && (
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-600">Highly rated customer</span>
              </div>
            )}
            {stats.totalSpent >= 100 && (
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-gray-600">£100+ spent</span>
              </div>
            )}
            
            {/* Show message if no achievements yet */}
            {stats.completedBookings === 0 && (
              <div className="text-sm text-gray-500 italic">
                Complete your first booking to earn achievements!
              </div>
            )}
          </div>
        </div>

        {/* Monthly Summary */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium text-gray-900 mb-3">This Month</h4>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-blue-600">
                {stats.activeBookings}
              </div>
              <div className="text-xs text-gray-600">Active</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-green-600">
                {/* This would be calculated from current month data */}
                {Math.min(stats.completedBookings, 3)}
              </div>
              <div className="text-xs text-gray-600">Completed</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}