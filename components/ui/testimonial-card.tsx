import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TestimonialCardProps {
  review: string
  author: string
  rating: number
  className?: string
}

export function TestimonialCard({
  review,
  author,
  rating,
  className,
}: TestimonialCardProps) {
  return (
    <div
      className={cn(
        'flex h-full flex-col rounded-2xl p-4 sm:p-6',
        'border border-green-200/50 bg-green-100/70',
        className
      )}
    >
      <div className='mb-3 flex items-center sm:mb-4'>
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={cn(
              'h-4 w-4 sm:h-5 sm:w-5',
              i < rating ? 'fill-green-500 text-green-500' : 'text-green-300'
            )}
          />
        ))}
      </div>
      <p className='mb-3 flex-grow text-sm leading-relaxed font-bold text-gray-900 sm:mb-4 sm:text-base'>
        "{review}"
      </p>
      <p className='text-xs font-medium text-gray-700 sm:text-sm'>- {author}</p>
    </div>
  )
}
