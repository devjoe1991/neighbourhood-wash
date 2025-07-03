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
        'h-full rounded-2xl border border-gray-200/75 bg-white p-6',
        className
      )}
    >
      <div className='mb-4'>{icon}</div>
      <h3 className='mb-2 font-bold text-gray-900'>{title}</h3>
      <p className='text-sm leading-relaxed text-gray-600'>{description}</p>
    </div>
  )
}
