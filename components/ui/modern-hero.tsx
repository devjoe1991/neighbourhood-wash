import { ReactNode } from 'react'
import { Search, Star, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import FloatingBubbles from './FloatingBubbles'

type ModernHeroProps = {
  title: ReactNode
  subtitle: string
  showSearch?: boolean
  ctaButtons?: ReactNode
  className?: string
}

export const ModernHero = ({
  title,
  subtitle,
  showSearch,
  ctaButtons,
  className,
}: ModernHeroProps) => {
  return (
    <section
      className={cn(
        'relative w-full overflow-hidden bg-gradient-to-b from-blue-50 to-white pt-24 pb-16 md:pt-32 md:pb-24',
        className
      )}
    >
      <FloatingBubbles />
      <div className='relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='mx-auto max-w-4xl text-center'>
          {/* Trust Indicator */}
          <div className='mb-8 flex justify-center'>
            <TrustBadge />
          </div>

          <h1 className='mb-4 text-3xl leading-tight font-bold text-gray-900 md:text-4xl lg:text-5xl'>
            {title}
          </h1>
          <p className='mb-8 text-lg text-gray-700'>{subtitle}</p>

          {showSearch && (
            <div className='mx-auto mb-10 max-w-2xl'>
              <SearchBox />
            </div>
          )}

          {ctaButtons && (
            <div className='flex flex-wrap items-center justify-center gap-4'>
              {ctaButtons}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export function TrustBadge() {
  return (
    <div className='inline-flex items-center rounded-full border border-gray-100 bg-white px-6 py-3 shadow-sm'>
      <div className='mr-3 flex items-center space-x-1'>
        {[...Array(5)].map((_, i) => (
          <Star key={i} className='h-4 w-4 fill-green-500 text-green-500' />
        ))}
      </div>
      <div className='text-sm'>
        <span className='font-semibold text-gray-900'>Excellent</span>
      </div>
    </div>
  )
}

export function SearchBox() {
  return (
    <div className='rounded-2xl border border-gray-100 bg-white p-2 shadow-lg'>
      <div className='flex flex-col gap-2 md:flex-row'>
        <div className='relative flex-1'>
          <MapPin className='absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 transform text-gray-400' />
          <Input
            placeholder='Search by town, postcode or home'
            className='h-12 rounded-xl border-0 bg-gray-50 pl-12 text-base focus:ring-2 focus:ring-blue-500'
          />
        </div>
        <Button
          size='lg'
          className='h-12 rounded-xl bg-blue-600 px-8 text-base font-semibold hover:bg-blue-700'
        >
          <Search className='mr-2 h-5 w-5' />
          Search
        </Button>
      </div>
    </div>
  )
}

export function ServiceCategoryButton({ title }: { title: string }) {
  return (
    <div className='min-w-[180px] cursor-pointer rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm transition-shadow hover:shadow-md'>
      <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100'>
        <div className='h-6 w-6 rounded bg-blue-600'></div>
      </div>
      <h3 className='font-semibold text-gray-900'>{title}</h3>
    </div>
  )
}

export function LottieStyleSearch() {
  return (
    <div className='rounded-2xl border border-gray-100 bg-white p-3 shadow-lg'>
      <div className='flex gap-3'>
        <div className='relative flex-1'>
          <MapPin className='absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 transform text-gray-400' />
          <Input
            placeholder='Search by town, postcode or home'
            className='h-14 rounded-xl border-0 bg-gray-50 pl-12 text-base focus:ring-2 focus:ring-blue-500'
          />
        </div>
        <Button
          size='lg'
          className='h-14 rounded-xl bg-pink-500 px-8 text-base font-semibold hover:bg-pink-600'
        >
          Search
        </Button>
      </div>
    </div>
  )
}

export function TrustFeature({
  icon,
  title,
  description,
}: {
  icon: string
  title: string
  description: string
}) {
  return (
    <div className='text-center'>
      <div className='mb-4 text-4xl'>{icon}</div>
      <h3 className='mb-3 text-xl font-bold text-gray-900'>{title}</h3>
      <p className='leading-relaxed text-gray-700'>{description}</p>
    </div>
  )
}
