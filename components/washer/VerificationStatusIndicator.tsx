'use client'

import { Badge } from '@/components/ui/badge'
import { 
  Shield,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle
} from 'lucide-react'
import { useVerificationStatus } from '@/lib/hooks/use-verification-status'
import { cn } from '@/lib/utils'

interface VerificationStatusIndicatorProps {
  userId?: string
  variant?: 'default' | 'compact' | 'badge-only'
  showDescription?: boolean
  className?: string
}

export function VerificationStatusIndicator({ 
  userId, 
  variant = 'default',
  showDescription = true,
  className
}: VerificationStatusIndicatorProps) {
  const verificationStatus = useVerificationStatus(userId)

  // Helper function to get verification status display
  const getVerificationStatusDisplay = () => {
    const { status, isLoading, error } = verificationStatus

    if (isLoading) {
      return {
        icon: Clock,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        text: 'Checking...',
        description: 'Verifying your account status...',
        badgeVariant: 'secondary' as const,
      }
    }

    if (error) {
      return {
        icon: AlertCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        text: 'Error',
        description: 'Unable to check verification status',
        badgeVariant: 'destructive' as const,
      }
    }

    switch (status) {
      case 'complete':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          text: 'Verified',
          description: 'Your account is fully verified and you can access all washer features.',
          badgeVariant: 'default' as const,
        }
      case 'pending':
        return {
          icon: Clock,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          text: 'Pending',
          description: 'Your verification is being processed. This may take a few business days.',
          badgeVariant: 'secondary' as const,
        }
      case 'requires_action':
        return {
          icon: AlertCircle,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          text: 'Action Required',
          description: 'Additional information is needed to complete your verification.',
          badgeVariant: 'destructive' as const,
        }
      case 'rejected':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          text: 'Verification Failed',
          description: 'Your verification was not successful. Please contact support for assistance.',
          badgeVariant: 'destructive' as const,
        }
      default:
        return {
          icon: Shield,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          text: 'Not Verified',
          description: 'Complete your Stripe Connect verification to access washer features.',
          badgeVariant: 'outline' as const,
        }
    }
  }

  const verificationDisplay = getVerificationStatusDisplay()

  // Badge-only variant
  if (variant === 'badge-only') {
    return (
      <Badge variant={verificationDisplay.badgeVariant} className={cn('gap-1', className)}>
        <verificationDisplay.icon className="h-3 w-3" />
        {verificationDisplay.text}
      </Badge>
    )
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className={cn(
        'flex items-center gap-2 rounded-lg border p-2',
        verificationDisplay.bgColor,
        verificationDisplay.borderColor,
        className
      )}>
        <verificationDisplay.icon className={cn('h-4 w-4', verificationDisplay.color)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900 truncate">
              {verificationDisplay.text}
            </span>
            <Badge variant={verificationDisplay.badgeVariant} className="text-xs">
              {verificationStatus.status?.toUpperCase() || 'UNKNOWN'}
            </Badge>
          </div>
          {showDescription && (
            <p className="text-xs text-gray-600 mt-1 truncate">
              {verificationDisplay.description}
            </p>
          )}
        </div>
      </div>
    )
  }

  // Default variant
  return (
    <div className={cn(
      'rounded-lg border p-4',
      verificationDisplay.bgColor,
      verificationDisplay.borderColor,
      className
    )}>
      <div className='flex items-start gap-3'>
        <verificationDisplay.icon className={cn('h-5 w-5 mt-0.5', verificationDisplay.color)} />
        <div className='flex-1'>
          <div className='flex items-center gap-2 mb-1'>
            <span className='font-medium text-gray-900'>{verificationDisplay.text}</span>
            <Badge variant={verificationDisplay.badgeVariant}>
              {verificationStatus.status?.toUpperCase() || 'UNKNOWN'}
            </Badge>
          </div>
          {showDescription && verificationDisplay.description && (
            <p className='text-sm text-gray-600'>{verificationDisplay.description}</p>
          )}
          {verificationStatus.accountId && (
            <p className='text-xs text-gray-500 mt-2'>
              Account ID: {verificationStatus.accountId}
            </p>
          )}
          {!verificationStatus.canAccess && verificationStatus.status !== 'complete' && (
            <p className='text-sm text-orange-600 mt-2 font-medium'>
              ⚠️ Some washer features may be limited until verification is complete.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}