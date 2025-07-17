'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Shield, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  FileText,
  ArrowRight,
  RefreshCw
} from 'lucide-react'

interface StripeKYCProgressProps {
  accountId?: string
  status: 'incomplete' | 'pending' | 'complete' | 'requires_action' | 'rejected'
  requirements?: {
    currently_due: string[]
    eventually_due: string[]
    past_due: string[]
    pending_verification: string[]
    disabled_reason?: string
  }
}

export function StripeKYCProgressContainer({ 
  accountId: _accountId, 
  status, 
  requirements 
}: StripeKYCProgressProps) {
  const [isStarting, setIsStarting] = useState(false)

  const getStatusInfo = () => {
    switch (status) {
      case 'incomplete':
        return {
          title: 'Identity Verification Required',
          description: 'Complete your identity verification with Stripe to start accepting bookings',
          color: 'border-orange-200 bg-orange-50',
          textColor: 'text-orange-800',
          icon: AlertCircle,
          iconColor: 'text-orange-600',
          progress: 0,
          actionText: 'Start Verification',
          canStart: true
        }
      case 'pending':
        return {
          title: 'Verification Under Review',
          description: 'Your documents are being reviewed. This typically takes 1-2 business days.',
          color: 'border-blue-200 bg-blue-50',
          textColor: 'text-blue-800',
          icon: Clock,
          iconColor: 'text-blue-600',
          progress: 75,
          actionText: 'Review in Progress',
          canStart: false
        }
      case 'requires_action':
        return {
          title: 'Action Required',
          description: 'Additional information is needed to complete your verification.',
          color: 'border-amber-200 bg-amber-50',
          textColor: 'text-amber-800',
          icon: AlertCircle,
          iconColor: 'text-amber-600',
          progress: 50,
          actionText: 'Complete Verification',
          canStart: true
        }
      case 'complete':
        return {
          title: 'Verification Complete',
          description: 'Your identity has been verified. You can now accept bookings!',
          color: 'border-green-200 bg-green-50',
          textColor: 'text-green-800',
          icon: CheckCircle,
          iconColor: 'text-green-600',
          progress: 100,
          actionText: 'Verified',
          canStart: false
        }
      case 'rejected':
        return {
          title: 'Verification Issues',
          description: 'There were issues with your verification. Please contact support for assistance.',
          color: 'border-red-200 bg-red-50',
          textColor: 'text-red-800',
          icon: AlertCircle,
          iconColor: 'text-red-600',
          progress: 25,
          actionText: 'Contact Support',
          canStart: false
        }
      default:
        return {
          title: 'Identity Verification Required',
          description: 'Complete your identity verification with Stripe to start accepting bookings',
          color: 'border-orange-200 bg-orange-50',
          textColor: 'text-orange-800',
          icon: AlertCircle,
          iconColor: 'text-orange-600',
          progress: 0,
          actionText: 'Start Verification',
          canStart: true
        }
    }
  }

  const handleStartVerification = async () => {
    setIsStarting(true)
    // TODO: Create Stripe Connect account and redirect to Stripe
    // This should create the account if it doesn't exist and redirect to Stripe KYC
    
    try {
      // Call your server action to create/get Stripe account link
      // const response = await createStripeAccountLink()
      // window.location.href = response.url
      
      // For now, simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000))
      alert('This would redirect to Stripe for KYC verification')
    } catch (error) {
      console.error('Error starting verification:', error)
      alert('Error starting verification. Please try again.')
    } finally {
      setIsStarting(false)
    }
  }

  const statusInfo = getStatusInfo()
  const StatusIcon = statusInfo.icon

  // Don't show if already complete
  if (status === 'complete') {
    return null
  }

  return (
    <Card className={`${statusInfo.color} border-2`}>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
            <StatusIcon className={`w-6 h-6 ${statusInfo.iconColor}`} />
          </div>
          <div className="flex-1">
            <CardTitle className={`${statusInfo.textColor}`}>
              {statusInfo.title}
            </CardTitle>
            <CardDescription className={`${statusInfo.textColor} opacity-80`}>
              {statusInfo.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className={`${statusInfo.textColor} font-medium`}>Verification Progress</span>
            <span className={`${statusInfo.textColor}`}>{statusInfo.progress}%</span>
          </div>
          <Progress value={statusInfo.progress} className="h-2" />
        </div>

        {/* Requirements List (if any) */}
        {requirements && (requirements.currently_due.length > 0 || requirements.past_due.length > 0) && (
          <div className="space-y-2">
            <h4 className={`font-semibold ${statusInfo.textColor}`}>Required Information:</h4>
            <ul className="space-y-1">
              {[...requirements.currently_due, ...requirements.past_due].map((req, index) => (
                <li key={index} className={`text-sm ${statusInfo.textColor} flex items-center`}>
                  <FileText className="w-3 h-3 mr-2" />
                  {req.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* What's Next */}
        <div className="bg-white/50 rounded-lg p-4">
          <h4 className={`font-semibold ${statusInfo.textColor} mb-2`}>What happens next?</h4>
          <ul className={`space-y-1 text-sm ${statusInfo.textColor}`}>
            {status === 'incomplete' && (
              <>
                <li>• You'll be redirected to Stripe's secure platform</li>
                <li>• Provide identity documents and basic information</li>
                <li>• Verification typically takes 1-2 business days</li>
                <li>• You'll be notified when complete</li>
              </>
            )}
            {status === 'pending' && (
              <>
                <li>• Stripe is reviewing your submitted documents</li>
                <li>• No action needed from you right now</li>
                <li>• You'll receive an email when review is complete</li>
                <li>• Check back here for status updates</li>
              </>
            )}
            {status === 'requires_action' && (
              <>
                <li>• Additional information is needed</li>
                <li>• Click below to continue where you left off</li>
                <li>• Complete any missing requirements</li>
                <li>• Verification will resume automatically</li>
              </>
            )}
          </ul>
        </div>

        {/* Action Button */}
        <div className="flex gap-3">
          {statusInfo.canStart && (
            <Button 
              onClick={handleStartVerification}
              disabled={isStarting}
              className="flex-1"
            >
              {isStarting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Starting...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  {statusInfo.actionText}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          )}
          
          {status === 'rejected' && (
            <Button variant="outline" className="flex-1">
              <AlertCircle className="w-4 h-4 mr-2" />
              Contact Support
            </Button>
          )}
          
          {(status === 'pending' || status === 'requires_action') && (
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Status
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}