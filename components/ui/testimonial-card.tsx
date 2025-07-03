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
        'flex h-full flex-col rounded-2xl p-6',
        'border border-green-200/50 bg-green-100/70',
        className
      )}
    >
      <div className='mb-4 flex items-center'>
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={cn(
              'h-5 w-5',
              i < rating ? 'fill-green-500 text-green-500' : 'text-green-300'
            )}
          />
        ))}
      </div>
      <p className='mb-4 flex-grow leading-relaxed font-bold text-gray-900'>
        "{review}"
      </p>
      <p className='text-sm font-medium text-gray-700'>- {author}</p>
    </div>
  )
}
