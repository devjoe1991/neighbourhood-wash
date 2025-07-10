'use client'

import {
  CheckCircle,
  Circle,
  Clock,
  Package,
  Truck,
  CheckCircle2,
} from 'lucide-react'

interface StatusStep {
  key: string
  label: string
  icon: React.ReactNode
  description: string
}

interface StatusTrackerProps {
  currentStatus: string
}

export default function StatusTracker({ currentStatus }: StatusTrackerProps) {
  const STEPS: StatusStep[] = [
    {
      key: 'pending_washer_assignment',
      label: 'Awaiting Washer',
      icon: <Package className='h-5 w-5' />,
      description: 'Looking for a washer to accept your booking.',
    },
    {
      key: 'washer_assigned',
      label: 'Washer Assigned',
      icon: <Package className='h-5 w-5' />,
      description: 'A washer has been assigned to your booking',
    },
    {
      key: 'in_progress',
      label: 'In Progress',
      icon: <Truck className='h-5 w-5' />,
      description: 'Your laundry is being collected and processed',
    },
    {
      key: 'completed',
      label: 'Completed',
      icon: <CheckCircle2 className='h-5 w-5' />,
      description: 'Your clean laundry has been delivered',
    },
  ]

  const getCurrentStepIndex = () => {
    return STEPS.findIndex((step) => step.key === currentStatus.toLowerCase())
  }

  const currentStepIndex = getCurrentStepIndex()

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStepIndex) return 'completed'
    if (stepIndex === currentStepIndex) return 'current'
    return 'pending'
  }

  const getStepStyles = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          circle: 'bg-green-500 text-white border-green-500',
          line: 'bg-green-500',
          text: 'text-green-700',
          description: 'text-green-600',
        }
      case 'current':
        return {
          circle: 'bg-blue-500 text-white border-blue-500',
          line: 'bg-gray-300',
          text: 'text-blue-700 font-medium',
          description: 'text-blue-600',
        }
      default:
        return {
          circle: 'bg-gray-100 text-gray-400 border-gray-300',
          line: 'bg-gray-300',
          text: 'text-gray-400',
          description: 'text-gray-400',
        }
    }
  }

  return (
    <div className='w-full'>
      <div className='relative'>
        {/* Progress line */}
        <div className='absolute top-12 bottom-0 left-6 w-0.5 bg-gray-300' />

        {/* Steps */}
        <div className='space-y-8'>
          {STEPS.map((step, index) => {
            const stepStatus = getStepStatus(index)
            const styles = getStepStyles(stepStatus)
            const isLast = index === STEPS.length - 1

            return (
              <div key={step.key} className='relative flex items-start'>
                {/* Step circle */}
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full border-2 ${styles.circle} relative z-10`}
                >
                  {stepStatus === 'completed' ? (
                    <CheckCircle className='h-6 w-6' />
                  ) : stepStatus === 'current' ? (
                    <Clock className='h-6 w-6' />
                  ) : (
                    <Circle className='h-6 w-6' />
                  )}
                </div>

                {/* Step content */}
                <div className='ml-4 flex-1 pb-8'>
                  <div className={`text-sm font-medium ${styles.text}`}>
                    {step.label}
                  </div>
                  <div className={`mt-1 text-xs ${styles.description}`}>
                    {step.description}
                  </div>
                </div>

                {/* Progress line for current step */}
                {!isLast && stepStatus === 'completed' && (
                  <div className='absolute top-12 left-6 z-0 h-8 w-0.5 bg-green-500' />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
