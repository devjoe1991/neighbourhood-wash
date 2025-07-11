import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ModernSectionProps {
  children: ReactNode
  className?: string
  background?:
    | 'white'
    | 'gray'
    | 'gradient'
    | 'light-blue'
    | 'primary-deep-blue'
  padding?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  containerSize?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

export function ModernSection({
  children,
  className,
  background = 'white',
  padding = 'lg',
  containerSize = 'lg',
}: ModernSectionProps) {
  const backgroundClasses = {
    white: 'bg-white',
    gray: 'bg-gray-50',
    gradient: 'bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30',
    'light-blue': 'bg-blue-50',
    'primary-deep-blue': 'bg-primary-deep-blue',
  }

  const paddingClasses = {
    xs: 'py-6 md:py-8',
    sm: 'py-12 md:py-16',
    md: 'py-16 md:py-20',
    lg: 'py-20 md:py-24',
    xl: 'py-24 md:py-32',
  }

  const containerClasses = {
    sm: 'max-w-4xl',
    md: 'max-w-5xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-full',
  }

  return (
    <section
      className={cn(
        backgroundClasses[background],
        paddingClasses[padding],
        className
      )}
    >
      <div
        className={cn(
          'mx-auto px-4 sm:px-6 lg:px-8',
          containerClasses[containerSize]
        )}
      >
        {children}
      </div>
    </section>
  )
}

interface SectionHeaderProps {
  title: string
  subtitle?: string
  description?: string
  centered?: boolean
  className?: string
  titleClassName?: string
  subtitleClassName?: string
}

export function SectionHeader({
  title,
  subtitle,
  description,
  centered = true,
  className,
  titleClassName,
  subtitleClassName,
}: SectionHeaderProps) {
  return (
    <div className={cn('mb-12 md:mb-16', centered && 'text-center', className)}>
      {subtitle && (
        <p
          className={cn(
            'mb-4 text-sm font-semibold tracking-wider text-blue-600 uppercase',
            subtitleClassName
          )}
        >
          {subtitle}
        </p>
      )}
      <h2
        className={cn(
          'mb-6 text-3xl leading-tight font-bold text-gray-900 md:text-4xl lg:text-5xl',
          titleClassName
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            'text-lg leading-relaxed text-gray-600 md:text-xl',
            centered && 'mx-auto max-w-3xl'
          )}
        >
          {description}
        </p>
      )}
    </div>
  )
}
