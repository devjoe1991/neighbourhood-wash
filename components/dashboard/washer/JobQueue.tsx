'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Clock, 
  MapPin, 
  DollarSign, 
  User, 
  Package,
  CheckCircle,
  X,
  AlertCircle,
  Loader2
} from 'lucide-react'

interface JobAssignment {
  id: string
  booking_id: string
  match_score: number
  distance_km: number
  estimated_travel_time_minutes: number
  status: 'offered' | 'accepted' | 'declined' | 'expired'
  offered_at: string
  expires_at: string
  booking: {
    id: string
    service_type: string
    service_description: string
    requested_date: string
    requested_time_start: string
    pickup_address: any
    total_price: number
    customer: {
      full_name: string
      rating?: number
    }
  }
}

interface JobQueueProps {
  washerId: string
  isOnline: boolean
  compact?: boolean
}

export function JobQueue({ washerId, isOnline, compact = false }: JobQueueProps) {
  const [jobs, setJobs] = useState<JobAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [processingJobId, setProcessingJobId] = useState<string | null>(null)

  useEffect(() => {
    fetchAvailableJobs()
    
    // Set up polling for new jobs when online
    let interval: NodeJS.Timeout
    if (isOnline) {
      interval = setInterval(fetchAvailableJobs, 30000) // Poll every 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [washerId, isOnline])

  const fetchAvailableJobs = async () => {
    try {
      const response = await fetch(`/api/washer/available-jobs?washerId=${washerId}`)
      if (response.ok) {
        const data = await response.json()
        setJobs(data.jobs || [])
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleJobResponse = async (jobId: string, action: 'accept' | 'decline') => {
    setProcessingJobId(jobId)
    
    try {
      const response = await fetch('/api/washer/respond-to-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          assignmentId: jobId, 
          action,
          washerId 
        })
      })
      
      if (response.ok) {
        // Remove the job from the queue
        setJobs(prev => prev.filter(job => job.id !== jobId))
      } else {
        const error = await response.json()
        console.error('Failed to respond to job:', error)
      }
    } catch (error) {
      console.error('Failed to respond to job:', error)
    } finally {
      setProcessingJobId(null)
    }
  }

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diff = expiry.getTime() - now.getTime()
    
    if (diff <= 0) return 'Expired'
    
    const minutes = Math.floor(diff / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const formatAddress = (address: any) => {
    if (typeof address === 'string') return address
    if (address?.address_line_1) {
      return `${address.address_line_1}, ${address.city}`
    }
    return 'Address not available'
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span>Available Jobs</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!isOnline) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span>Available Jobs</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You're currently offline. Go online to receive job assignments.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span>Available Jobs</span>
            {jobs.length > 0 && (
              <Badge variant="secondary">{jobs.length}</Badge>
            )}
          </div>
          {!compact && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchAvailableJobs}
              disabled={loading}
            >
              Refresh
            </Button>
          )}
        </CardTitle>
        <CardDescription>
          New job opportunities in your area
        </CardDescription>
      </CardHeader>
      <CardContent>
        {jobs.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No jobs available right now</p>
            <p className="text-sm text-gray-400">
              New jobs will appear here when customers book services in your area
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.slice(0, compact ? 3 : undefined).map((job) => (
              <div 
                key={job.id} 
                className="border rounded-lg p-4 space-y-3 hover:bg-gray-50 transition-colors"
              >
                {/* Job Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium">{job.booking.service_type}</h4>
                      <Badge variant="outline" className="text-xs">
                        {job.match_score}% match
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {job.booking.service_description}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-green-600">
                      £{job.booking.total_price.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {getTimeRemaining(job.expires_at)}
                    </div>
                  </div>
                </div>

                {/* Job Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      {job.distance_km.toFixed(1)}km away
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      {job.estimated_travel_time_minutes} min travel
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      {job.booking.customer.full_name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      {new Date(job.booking.requested_date).toLocaleDateString()} at{' '}
                      {job.booking.requested_time_start}
                    </span>
                  </div>
                </div>

                {/* Address */}
                <div className="text-sm">
                  <span className="text-gray-500">Pickup: </span>
                  <span className="text-gray-700">
                    {formatAddress(job.booking.pickup_address)}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2 pt-2">
                  <Button
                    onClick={() => handleJobResponse(job.id, 'accept')}
                    disabled={processingJobId === job.id}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {processingJobId === job.id ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Accept Job
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleJobResponse(job.id, 'decline')}
                    disabled={processingJobId === job.id}
                    className="flex-1"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Decline
                  </Button>
                </div>
              </div>
            ))}
            
            {compact && jobs.length > 3 && (
              <div className="text-center pt-2">
                <Button variant="outline" size="sm">
                  View All Jobs ({jobs.length})
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}