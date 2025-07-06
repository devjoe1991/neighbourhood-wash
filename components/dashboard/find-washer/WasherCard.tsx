import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Star, ShieldCheck, Heart } from 'lucide-react'
import { Washer } from '@/lib/types'

interface WasherCardProps {
  washer: Washer
  isFavorited: boolean
  onToggleFavorite: (id: string) => void
}

export default function WasherCard({
  washer,
  isFavorited,
  onToggleFavorite,
}: WasherCardProps) {
  // Generate initials from first and last name
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`
  }

  // Format the name as "First L."
  const formatName = (firstName: string, lastName: string) => {
    return `${firstName} ${lastName.charAt(0).toUpperCase()}.`
  }

  return (
    <Card className='relative transition-shadow hover:shadow-md'>
      {/* Favorite Button */}
      <button
        onClick={() => onToggleFavorite(washer.id)}
        className='absolute top-3 right-3 z-10 rounded-full p-1 transition-colors hover:bg-gray-100'
        aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Heart
          className={`h-5 w-5 ${
            isFavorited
              ? 'fill-red-500 text-red-500'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        />
      </button>

      <CardContent className='p-4'>
        {/* Top Section */}
        <div className='mb-3 flex items-start gap-3'>
          {/* Profile Image/Initials */}
          <Avatar className='h-12 w-12'>
            {washer.profile_image_url ? (
              <AvatarImage
                src={washer.profile_image_url}
                alt={`${washer.first_name} ${washer.last_name}`}
              />
            ) : null}
            <AvatarFallback className='bg-blue-100 font-semibold text-blue-800'>
              {getInitials(washer.first_name, washer.last_name)}
            </AvatarFallback>
          </Avatar>

          {/* Name, Rating, and Distance */}
          <div className='min-w-0 flex-1'>
            <div className='mb-1 flex items-center gap-2'>
              <h3 className='truncate font-semibold text-gray-900'>
                {formatName(washer.first_name, washer.last_name)}
              </h3>
              {washer.is_verified && (
                <ShieldCheck className='h-4 w-4 flex-shrink-0 text-green-600' />
              )}
            </div>

            <div className='mb-1 flex items-center gap-1'>
              <Star className='h-4 w-4 fill-yellow-400 text-yellow-400' />
              <span className='text-sm font-medium text-gray-700'>
                {washer.rating}
              </span>
              <span className='text-sm text-gray-500'>
                ({washer.review_count} reviews)
              </span>
            </div>

            <p className='text-sm text-gray-600'>
              Approx. {washer.distance} miles away
            </p>
          </div>

          {/* Price Tier */}
          <div className='flex-shrink-0'>
            <span className='text-lg font-semibold text-green-600'>
              {washer.price_tier}
            </span>
          </div>
        </div>

        {/* Middle Section - Service Badges */}
        {washer.specialties.length > 0 && (
          <div className='mb-3 flex flex-wrap gap-1'>
            {washer.specialties.map((specialty, index) => (
              <Badge key={index} variant='secondary' className='text-xs'>
                {specialty}
              </Badge>
            ))}
          </div>
        )}

        {/* Bottom Section - Availability */}
        <div className='text-sm text-gray-600'>
          <span className='font-medium'>Next available:</span>{' '}
          {washer.next_available_slot}
        </div>
      </CardContent>
    </Card>
  )
}
