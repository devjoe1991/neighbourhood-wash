'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Shield } from 'lucide-react'
import { VerificationStatusIndicator } from './VerificationStatusIndicator'

interface VerificationStatusCardProps {
  userId?: string
  showTitle?: boolean
  compact?: boolean
}

export function VerificationStatusCard({ 
  userId, 
  showTitle = true, 
  compact = false 
}: VerificationStatusCardProps) {
  if (compact) {
    return (
      <VerificationStatusIndicator 
        userId={userId} 
        variant="compact" 
        showDescription={true}
      />
    )
  }

  return (
    <Card>
      <CardContent className='pt-6'>
        {showTitle && (
          <div className='flex items-center gap-2 mb-4'>
            <Shield className='h-5 w-5 text-blue-600' />
            <h3 className='text-lg font-semibold text-gray-900'>Verification Status</h3>
          </div>
        )}
        <VerificationStatusIndicator 
          userId={userId} 
          variant="default" 
          showDescription={true}
        />
      </CardContent>
    </Card>
  )
}