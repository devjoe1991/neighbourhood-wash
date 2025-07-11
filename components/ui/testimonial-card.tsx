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
        'flex h-52 flex-col justify-between rounded-2xl bg-green-50 p-5',
        'border border-green-200/60',
        className
      )}
    >
      <div>
        <div className='mb-3 flex items-center'>
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={cn(
                'h-5 w-5',
                i < rating
                  ? 'fill-green-500 text-green-500'
                  : 'fill-green-200 text-green-200'
              )}
            />
          ))}
        </div>
        <p className='text-sm leading-normal font-medium text-gray-800'>
          "{review}"
        </p>
      </div>
      <p className='text-sm font-semibold text-gray-500'>- {author}</p>
    </div>
  )
}
