import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface CategoryLinkCardProps {
  title: string
  href: string
  className?: string
}

export function CategoryLinkCard({
  title,
  href,
  className,
}: CategoryLinkCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group flex items-center justify-between rounded-2xl border bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(0,0,0,0.06)] sm:p-6',
        className
      )}
    >
      <span className='text-sm font-semibold text-gray-800 sm:text-base'>
        {title}
      </span>
      <ArrowRight className='h-4 w-4 text-blue-600 transition-transform group-hover:translate-x-1 sm:h-5 sm:w-5' />
    </Link>
  )
}

type ActionCardProps = {
  title: string
  description: string
  ctaText: string
  ctaLink: string
  bgColor: string
  children?: React.ReactNode
  className?: string
}

export function ActionCard({
  title,
  description,
  ctaText,
  ctaLink,
  bgColor,
  children,
  className,
}: ActionCardProps) {
  return (
    <div
      className={cn('flex flex-col rounded-3xl p-6 sm:p-8', bgColor, className)}
    >
      {children}
      <div className='flex-grow'>
        <h3 className='mb-3 text-lg font-bold text-gray-900 sm:mb-4 sm:text-xl lg:text-2xl'>
          {title}
        </h3>
        <p className='mb-6 text-sm leading-relaxed text-gray-700 sm:mb-8 sm:text-base'>
          {description}
        </p>
      </div>
      <Button
        asChild
        className='self-start rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800 sm:px-6 sm:py-3 sm:text-base'
      >
        <Link href={ctaLink}>
          {ctaText} <ArrowRight className='ml-2 h-4 w-4' />
        </Link>
      </Button>
    </div>
  )
}
