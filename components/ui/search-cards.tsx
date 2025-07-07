import Link from 'next/link'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Info, ArrowRight } from 'lucide-react'

interface SearchCategoryCardProps {
  icon: ReactNode
  title: string
  description: string
  infoText: string
  infoLink: string
  bgColor: string
  className?: string
}

export function SearchCategoryCard({
  icon,
  title,
  description,
  infoText,
  infoLink,
  bgColor,
  className,
}: SearchCategoryCardProps) {
  return (
    <div className={cn('flex flex-col', className)}>
      <div
        className={cn(
          'flex flex-grow flex-col items-center rounded-t-2xl p-4 text-center sm:p-6',
          bgColor
        )}
      >
        <div className='mb-3 flex h-24 w-full items-center justify-center sm:mb-4 sm:h-32'>
          {icon}
        </div>
        <div className='w-full rounded-xl bg-white/70 p-3 backdrop-blur-sm sm:p-4'>
          <h3 className='text-sm font-bold text-gray-900 sm:text-base'>
            {title}
          </h3>
          <p className='text-xs text-gray-600 sm:text-sm'>{description}</p>
        </div>
      </div>
      <Link
        href={infoLink}
        className='flex items-center justify-center gap-2 rounded-b-2xl border-t border-gray-200/75 bg-white p-3 text-xs font-medium text-gray-700 hover:bg-gray-50 sm:p-4 sm:text-sm'
      >
        <Info className='h-3 w-3 text-blue-500 sm:h-4 sm:w-4' />
        <span>{infoText}</span>
      </Link>
    </div>
  )
}

interface LocationLinkProps {
  name: string
  href: string
}

export function LocationLinks({
  locations,
}: {
  locations: LocationLinkProps[]
}) {
  return (
    <div className='rounded-2xl border border-gray-200/75 bg-white p-4 sm:p-6 lg:p-8'>
      <div className='mb-6 grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-4'>
        {locations.map((location) => (
          <Link
            key={location.name}
            href={location.href}
            className='group flex items-center justify-between border-b border-gray-100 py-2'
          >
            <span className='text-sm font-medium text-gray-700 sm:text-base'>
              {location.name}
            </span>
            <ArrowRight className='h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-blue-500' />
          </Link>
        ))}
      </div>
      <div className='text-center'>
        <Link
          href='/locations'
          className='inline-flex items-center gap-2 rounded-lg bg-green-100 px-4 py-2 text-sm font-semibold text-green-800 transition-colors hover:bg-green-200 sm:px-6 sm:py-3 sm:text-base'
        >
          View All Locations <ArrowRight className='h-4 w-4' />
        </Link>
      </div>
    </div>
  )
}
