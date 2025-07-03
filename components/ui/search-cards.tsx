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
          'flex flex-grow flex-col items-center rounded-t-2xl p-6 text-center',
          bgColor
        )}
      >
        <div className='mb-4 flex h-32 w-full items-center justify-center'>
          {icon}
        </div>
        <div className='w-full rounded-xl bg-white/70 p-4 backdrop-blur-sm'>
          <h3 className='font-bold text-gray-900'>{title}</h3>
          <p className='text-sm text-gray-600'>{description}</p>
        </div>
      </div>
      <Link
        href={infoLink}
        className='flex items-center justify-center gap-2 rounded-b-2xl border-t border-gray-200/75 bg-white p-4 text-sm font-medium text-gray-700 hover:bg-gray-50'
      >
        <Info className='h-4 w-4 text-blue-500' />
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
    <div className='rounded-2xl border border-gray-200/75 bg-white p-8'>
      <div className='mb-6 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2'>
        {locations.map((location) => (
          <Link
            key={location.name}
            href={location.href}
            className='group flex items-center justify-between border-b border-gray-100 py-2'
          >
            <span className='font-medium text-gray-700'>{location.name}</span>
            <ArrowRight className='h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-blue-500' />
          </Link>
        ))}
      </div>
      <div className='text-center'>
        <Link
          href='/locations'
          className='inline-flex items-center gap-2 rounded-lg bg-green-100 px-6 py-3 font-semibold text-green-800 transition-colors hover:bg-green-200'
        >
          View All Locations <ArrowRight className='h-4 w-4' />
        </Link>
      </div>
    </div>
  )
}
