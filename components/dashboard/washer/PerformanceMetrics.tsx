'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Star, 
  TrendingUp, 
  Target,
  Award,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  MessageSquare
} from 'lucide-react'

interface WasherProfile {
  id: string
  rating: number
  total_jobs: number
  completed_jobs: number
  cancellation_rate: number
}

interface PerformanceData {
  ratings: {
    overall: number
    service_quality: number
    communication: number
    timeliness: number
    breakdown: { [key: number]: number }
  }
  metrics: {
    response_time_avg: number
    completion_rate: number
    repeat_customer_rate: number
    on_time_rate: number
  }
  goals: {
    monthly_jobs: { target: number; current: number }
    rating_target: { target: number; current: number }
    earnings_target: { target: number; current: number }
  }
  recent_reviews: Array<{
    id: string
    rating: number
    comment: string
    customer_name: string
    date: string
    service_type: string
  }>
}

interface PerformanceMetricsProps {
  washerProfile: WasherProfile
  compact?: boolean
}

export function PerformanceMetrics({ washerProfile, compact = false }: PerformanceMetricsProps) {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPerformanceData()
  }, [washerProfile.id])

  const fetchPerformanceData = async () => {
    try {
      const response = await fetch(`/api/washer/performance?washerId=${washerProfile.id}`)
      if (response.ok) {
        const data = await response.json()
        setPerformanceData(data)
      }
    } catch (error) {
      console.error('Failed to fetch performance data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !performanceData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Performance Metrics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600'
    if (rating >= 4.0) return 'text-blue-600'
    if (rating >= 3.5) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPerformanceLevel = (rating: number) => {
    if (rating >= 4.8) return { level: 'Excellent', color: 'bg-green-500' }
    if (rating >= 4.5) return { level: 'Great', color: 'bg-blue-500' }
    if (rating >= 4.0) return { level: 'Good', color: 'bg-yellow-500' }
    return { level: 'Needs Improvement', color: 'bg-red-500' }
  }

  const performanceLevel = getPerformanceLevel(performanceData.ratings.overall)

  return (
    <div className="space-y-6">
      {/* Overall Performance Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Performance Overview</span>
            </div>
            <Badge className={`${performanceLevel.color} text-white`}>
              {performanceLevel.level}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getRatingColor(performanceData.ratings.overall)}`}>
                {performanceData.ratings.overall.toFixed(1)}
              </div>
              <div className="text-sm text-gray-500">Overall Rating</div>
              <div className="flex justify-center mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-3 w-3 ${
                      star <= performanceData.ratings.overall
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">
                {performanceData.metrics.completion_rate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500">Completion Rate</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">
                {performanceData.metrics.on_time_rate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500">On-Time Rate</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">
                {performanceData.metrics.response_time_avg.toFixed(0)}m
              </div>
              <div className="text-sm text-gray-500">Avg Response</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {compact ? (
        /* Compact View - Key Metrics Only */
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Key Performance Indicators</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Service Quality</span>
              <div className="flex items-center space-x-2">
                <Progress value={performanceData.ratings.service_quality * 20} className="w-20" />
                <span className="text-sm font-medium">{performanceData.ratings.service_quality.toFixed(1)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Communication</span>
              <div className="flex items-center space-x-2">
                <Progress value={performanceData.ratings.communication * 20} className="w-20" />
                <span className="text-sm font-medium">{performanceData.ratings.communication.toFixed(1)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Timeliness</span>
              <div className="flex items-center space-x-2">
                <Progress value={performanceData.ratings.timeliness * 20} className="w-20" />
                <span className="text-sm font-medium">{performanceData.ratings.timeliness.toFixed(1)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="ratings" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ratings">Ratings</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="ratings" className="space-y-4">
            {/* Detailed Ratings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="w-5 h-5" />
                  <span>Rating Breakdown</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Service Quality</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={performanceData.ratings.service_quality * 20} className="w-32" />
                      <span className="text-sm font-medium w-8">
                        {performanceData.ratings.service_quality.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Communication</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={performanceData.ratings.communication * 20} className="w-32" />
                      <span className="text-sm font-medium w-8">
                        {performanceData.ratings.communication.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Timeliness</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={performanceData.ratings.timeliness * 20} className="w-32" />
                      <span className="text-sm font-medium w-8">
                        {performanceData.ratings.timeliness.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Rating Distribution */}
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-3">Rating Distribution</h4>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => {
                      const count = performanceData.ratings.breakdown[rating] || 0
                      const percentage = washerProfile.total_jobs > 0 ? (count / washerProfile.total_jobs) * 100 : 0
                      
                      return (
                        <div key={rating} className="flex items-center space-x-2 text-sm">
                          <span className="w-8">{rating}★</span>
                          <Progress value={percentage} className="flex-1" />
                          <span className="w-8 text-right">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="goals" className="space-y-4">
            {/* Goals and Targets */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5" />
                  <span>Monthly Goals</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Jobs Completed</span>
                      <span className="text-sm text-gray-500">
                        {performanceData.goals.monthly_jobs.current} / {performanceData.goals.monthly_jobs.target}
                      </span>
                    </div>
                    <Progress 
                      value={(performanceData.goals.monthly_jobs.current / performanceData.goals.monthly_jobs.target) * 100} 
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Rating Target</span>
                      <span className="text-sm text-gray-500">
                        {performanceData.goals.rating_target.current.toFixed(1)} / {performanceData.goals.rating_target.target.toFixed(1)}
                      </span>
                    </div>
                    <Progress 
                      value={(performanceData.goals.rating_target.current / performanceData.goals.rating_target.target) * 100} 
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Earnings Target</span>
                      <span className="text-sm text-gray-500">
                        £{performanceData.goals.earnings_target.current.toFixed(0)} / £{performanceData.goals.earnings_target.target.toFixed(0)}
                      </span>
                    </div>
                    <Progress 
                      value={(performanceData.goals.earnings_target.current / performanceData.goals.earnings_target.target) * 100} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            {/* Recent Reviews */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5" />
                  <span>Recent Reviews</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performanceData.recent_reviews.slice(0, 5).map((review) => (
                    <div key={review.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{review.customer_name}</span>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-3 w-3 ${
                                    star <= review.rating
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            {review.service_type} • {new Date(review.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}