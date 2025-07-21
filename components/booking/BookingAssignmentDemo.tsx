/**
 * Demo component for booking assignment functionality
 * This demonstrates the smart matching algorithm and assignment system
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { assignBookingAction, respondToAssignmentAction } from '@/app/actions/booking-assignment'

interface BookingAssignmentDemoProps {
  bookingId?: number
  assignmentId?: string
  userRole?: 'admin' | 'washer' | 'customer'
}

export function BookingAssignmentDemo({ 
  bookingId, 
  assignmentId, 
  userRole 
}: BookingAssignmentDemoProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleAssignBooking = async () => {
    if (!bookingId) return
    
    setLoading(true)
    try {
      const response = await assignBookingAction(bookingId)
      setResult(response)
    } catch (error) {
      setResult({ success: false, error: 'Failed to assign booking' })
    } finally {
      setLoading(false)
    }
  }

  const handleWasherResponse = async (response: 'accepted' | 'declined') => {
    if (!assignmentId) return
    
    setLoading(true)
    try {
      const responseResult = await respondToAssignmentAction(assignmentId, response)
      setResult(responseResult)
    } catch (error) {
      setResult({ success: false, error: 'Failed to process response' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Smart Booking Assignment System</CardTitle>
        <CardDescription>
          Demonstrates the intelligent washer matching algorithm and real-time assignment system
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Admin Controls */}
        {userRole === 'admin' && bookingId && (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Admin Controls</h3>
            <p className="text-sm text-gray-600">
              Booking ID: {bookingId}
            </p>
            <Button 
              onClick={handleAssignBooking}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Assigning...' : 'Assign Best Washer'}
            </Button>
          </div>
        )}

        {/* Washer Controls */}
        {userRole === 'washer' && assignmentId && (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Job Assignment</h3>
            <p className="text-sm text-gray-600">
              Assignment ID: {assignmentId}
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={() => handleWasherResponse('accepted')}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {loading ? 'Processing...' : 'Accept Job'}
              </Button>
              <Button 
                onClick={() => handleWasherResponse('declined')}
                disabled={loading}
                variant="outline"
                className="flex-1"
              >
                {loading ? 'Processing...' : 'Decline Job'}
              </Button>
            </div>
          </div>
        )}

        {/* Algorithm Features */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Smart Matching Features</h3>
          <div className="grid grid-cols-2 gap-2">
            <Badge variant="secondary">Location-based matching</Badge>
            <Badge variant="secondary">Rating & experience scoring</Badge>
            <Badge variant="secondary">Availability checking</Badge>
            <Badge variant="secondary">Service type filtering</Badge>
            <Badge variant="secondary">Real-time notifications</Badge>
            <Badge variant="secondary">Automatic reassignment</Badge>
          </div>
        </div>

        {/* Algorithm Scoring Breakdown */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Scoring Algorithm</h3>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span>Distance (30%)</span>
              <span className="text-gray-600">Closer washers score higher</span>
            </div>
            <div className="flex justify-between">
              <span>Availability (25%)</span>
              <span className="text-gray-600">Based on schedule & capacity</span>
            </div>
            <div className="flex justify-between">
              <span>Rating (20%)</span>
              <span className="text-gray-600">Customer satisfaction scores</span>
            </div>
            <div className="flex justify-between">
              <span>Experience (15%)</span>
              <span className="text-gray-600">Number of completed jobs</span>
            </div>
            <div className="flex justify-between">
              <span>Specialization (10%)</span>
              <span className="text-gray-600">Service type expertise</span>
            </div>
          </div>
        </div>

        {/* Result Display */}
        {result && (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Result</h3>
            <div className={`p-3 rounded-md ${
              result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              {result.success ? (
                <div className="space-y-1">
                  <p className="text-green-800 font-medium">✅ Success!</p>
                  {result.assignmentId && (
                    <p className="text-sm text-green-700">
                      Assignment ID: {result.assignmentId}
                    </p>
                  )}
                  {result.matchScore && (
                    <p className="text-sm text-green-700">
                      Match Score: {Math.round(result.matchScore)}%
                    </p>
                  )}
                  {result.message && (
                    <p className="text-sm text-green-700">{result.message}</p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-red-800 font-medium">❌ Error</p>
                  <p className="text-sm text-red-700">{result.error}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* System Flow */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Assignment Flow</h3>
          <div className="text-sm space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>1. Customer creates booking</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>2. Algorithm finds best washers</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>3. Top washer gets notification</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>4. Washer accepts/declines (15min timeout)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>5. If declined, next best washer is notified</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>6. Booking confirmed when accepted</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}