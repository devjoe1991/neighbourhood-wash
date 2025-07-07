import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface BenefitCardProps {
  icon: ReactNode
  title: string
  description: string
  className?: string
}

export function BenefitCard({
  icon,
  title,
  description,
  className,
}: BenefitCardProps) {
  return (
    <div
      className={cn(
        'h-full rounded-2xl border border-gray-200/75 bg-white p-4 sm:p-6',
        className
      )}
    >
      <div className='mb-3 flex justify-center sm:mb-4 sm:justify-start'>
        {icon}
      </div>
      <h3 className='mb-2 text-center text-sm font-bold text-gray-900 sm:text-left sm:text-base'>
        {title}
      </h3>
      <p className='text-center text-xs leading-relaxed text-gray-600 sm:text-left sm:text-sm'>
        {description}
      </p>
    </div>
  )
}
