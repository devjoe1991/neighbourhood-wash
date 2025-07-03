import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ModernCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  padding?: 'sm' | 'md' | 'lg'
}

export function ModernCard({
  children,
  className,
  hover = false,
  padding = 'md',
}: ModernCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-gray-100 bg-white shadow-sm',
        hover &&
          'transition-all duration-300 hover:-translate-y-1 hover:shadow-lg',
        padding === 'sm' && 'p-4',
        padding === 'md' && 'p-6',
        padding === 'lg' && 'p-8',
        className
      )}
    >
      {children}
    </div>
  )
}

interface FeatureCardProps {
  icon: ReactNode
  title: string
  description: string
  iconBgColor?: string
  iconColor?: string
}

export function FeatureCard({
  icon,
  title,
  description,
  iconBgColor = 'bg-blue-50',
  iconColor = 'text-blue-600',
}: FeatureCardProps) {
  return (
    <ModernCard hover className='text-center'>
      <div
        className={cn(
          'mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl',
          iconBgColor,
          iconColor
        )}
      >
        {icon}
      </div>
      <h3 className='mb-3 text-xl font-semibold text-gray-900'>{title}</h3>
      <p className='leading-relaxed text-gray-600'>{description}</p>
    </ModernCard>
  )
}

interface ValuePropCardProps {
  icon: ReactNode
  title: string
  description: string
  benefits: string[]
  iconBgColor?: string
  iconColor?: string
  accentColor?: string
}

export function ValuePropCard({
  icon,
  title,
  description,
  benefits,
  iconBgColor = 'bg-blue-50',
  iconColor = 'text-blue-600',
  accentColor = 'text-blue-500',
}: ValuePropCardProps) {
  return (
    <ModernCard className='h-full'>
      <div
        className={cn(
          'mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl',
          iconBgColor,
          iconColor
        )}
      >
        {icon}
      </div>
      <h3 className='mb-3 text-2xl font-bold text-gray-900'>{title}</h3>
      <p className='mb-6 leading-relaxed text-gray-600'>{description}</p>
      <ul className='space-y-4'>
        {benefits.map((benefit, index) => (
          <li key={index} className='flex items-start'>
            <div
              className={cn(
                'mt-2 mr-3 h-2 w-2 flex-shrink-0 rounded-full',
                accentColor === 'text-blue-500'
                  ? 'bg-blue-500'
                  : accentColor === 'text-green-500'
                    ? 'bg-green-500'
                    : 'bg-purple-500'
              )}
            />
            <span className='leading-relaxed text-gray-700'>{benefit}</span>
          </li>
        ))}
      </ul>
    </ModernCard>
  )
}
