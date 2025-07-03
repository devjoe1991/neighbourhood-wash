import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ModernCard } from '@/components/ui/modern-card'

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
    <Link href={href} className='group block'>
      <ModernCard
        hover
        padding='lg'
        className={cn('flex items-center justify-between', className)}
      >
        <span className='font-semibold text-gray-800'>{title}</span>
        <ArrowRight className='h-5 w-5 text-pink-500 transition-transform group-hover:translate-x-1' />
      </ModernCard>
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
    <div className={cn('flex flex-col rounded-3xl p-8', bgColor, className)}>
      {children}
      <div className='flex-grow'>
        <h3 className='mb-4 text-2xl font-bold text-gray-900'>{title}</h3>
        <p className='mb-8 leading-relaxed text-gray-700'>{description}</p>
      </div>
      <Button
        asChild
        className='self-start rounded-lg bg-gray-900 px-6 py-3 text-white hover:bg-gray-800'
      >
        <Link href={ctaLink}>
          {ctaText} <ArrowRight className='ml-2 h-4 w-4' />
        </Link>
      </Button>
    </div>
  )
}
