'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Star, 
  Package, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertTriangle,
  DollarSign
} from 'lucide-react'

interface WasherProfile {
  id: string
  rating: number
  total_jobs: number
  completed_jobs: number
  cancellation_rate: number
  is_online: boolean
  service_areas: string[]
  service_types: string[]
  approval_status: string
}

interface WasherStatsProps {
  washerProfile: WasherProfile
}

export function WasherStats({ washerProfile }: WasherStatsProps) {
  const completionRate = washerProfile.total_jobs > 0 
    ? ((washerProfile.completed_jobs / washerProfile.total_jobs) * 100).toFixed(1)
    : '0'

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600'
    if (rating >= 4.0) return 'text-blue-600'
    if (rating >= 3.5) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Rating Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Rating</CardTitle>
          <Star className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className={`text-2xl font-bold ${getRatingColor(washerProfile.rating)}`}>
              {washerProfile.rating.toFixed(1)}
            </div>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= washerProfile.rating
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Based on {washerProfile.total_jobs} jobs
          </p>
        </CardContent>
      </Card>

      {/* Jobs Completed Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Jobs Completed</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{washerProfile.completed_jobs}</div>
          <p className="text-xs text-muted-foreground">
            {completionRate}% completion rate
          </p>
        </CardContent>
      </Card>

      {/* Total Jobs Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{washerProfile.total_jobs}</div>
          <p className="text-xs text-muted-foreground">
            {washerProfile.cancellation_rate.toFixed(1)}% cancellation rate
          </p>
        </CardContent>
      </Card>

      {/* Status Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Account Status</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Badge className={getStatusColor(washerProfile.approval_status)}>
            {washerProfile.approval_status.charAt(0).toUpperCase() + 
             washerProfile.approval_status.slice(1)}
          </Badge>
          <p className="text-xs text-muted-foreground mt-2">
            {washerProfile.is_online ? 'Currently online' : 'Currently offline'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}