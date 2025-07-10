'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Heart,
  MessageSquare,
  Calendar,
  Clock,
  PoundSterling,
} from 'lucide-react'
import StarRating from '@/components/ui/star-rating'
import { CompletedBookingNeedingReview } from '@/app/user/dashboard/actions'
import {
  submitReview,
  addFavouriteWasher,
  checkIfWasherIsFavourite,
} from '@/app/user/dashboard/actions'
import { toast } from 'sonner'

interface PostBookingPromptProps {
  booking: CompletedBookingNeedingReview
}

export default function PostBookingPrompt({ booking }: PostBookingPromptProps) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [isAddingFavourite, setIsAddingFavourite] = useState(false)
  const [isAlreadyFavourite, setIsAlreadyFavourite] = useState(false)
  const [reviewSubmitted, setReviewSubmitted] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(price)
  }

  // Check if washer is already a favourite
  useEffect(() => {
    if (booking.washer_id) {
      checkIfWasherIsFavourite(booking.washer_id).then((result) => {
        if (result.success) {
          setIsAlreadyFavourite(result.isFavourite)
        }
      })
    }
  }, [booking.washer_id])

  const handleSubmitReview = async () => {
    if (!booking.washer_id) {
      toast.error('No washer assigned to this booking')
      return
    }

    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }

    setIsSubmittingReview(true)

    try {
      const result = await submitReview({
        bookingId: booking.id,
        washerId: booking.washer_id,
        rating,
        comment,
      })

      if (result.success) {
        toast.success(result.message)
        setReviewSubmitted(true)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      toast.error('Failed to submit review')
    } finally {
      setIsSubmittingReview(false)
    }
  }

  const handleAddFavourite = async () => {
    if (!booking.washer_id) {
      toast.error('No washer assigned to this booking')
      return
    }

    setIsAddingFavourite(true)

    try {
      const result = await addFavouriteWasher(booking.washer_id)

      if (result.success) {
        toast.success(result.message)
        setIsAlreadyFavourite(true)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error('Error adding favourite:', error)
      toast.error('Failed to add washer to favourites')
    } finally {
      setIsAddingFavourite(false)
    }
  }

  if (reviewSubmitted) {
    return (
      <Card className='border-green-200 bg-green-50'>
        <CardContent className='pt-6'>
          <div className='text-center'>
            <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100'>
              <MessageSquare className='h-6 w-6 text-green-600' />
            </div>
            <h3 className='mb-2 text-lg font-semibold text-green-900'>
              Thank you for your review!
            </h3>
            <p className='text-green-700'>
              Your feedback helps improve our service quality.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className='border-blue-200 bg-blue-50'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <MessageSquare className='h-5 w-5' />
          How was your service for Booking #{booking.id}?
        </CardTitle>
        <div className='flex flex-wrap items-center gap-4 text-sm text-gray-600'>
          <div className='flex items-center gap-1'>
            <Calendar className='h-4 w-4' />
            {formatDate(booking.collection_date)}
          </div>
          <div className='flex items-center gap-1'>
            <Clock className='h-4 w-4' />
            {booking.collection_time_slot}
          </div>
          <div className='flex items-center gap-1'>
            <PoundSterling className='h-4 w-4' />
            {formatPrice(booking.total_price)}
          </div>
          <Badge variant='outline' className='bg-green-100 text-green-800'>
            Completed
          </Badge>
        </div>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Review Section */}
        <div className='space-y-4'>
          <div>
            <h4 className='mb-3 font-semibold text-gray-900'>Leave a Review</h4>
            <div className='space-y-3'>
              <div>
                <label className='mb-2 block text-sm font-medium text-gray-700'>
                  Rating
                </label>
                <StarRating
                  rating={rating}
                  onRatingChange={setRating}
                  size='lg'
                />
              </div>
              <div>
                <label className='mb-2 block text-sm font-medium text-gray-700'>
                  Comment (Optional)
                </label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder='Share your experience with this washer...'
                  className='resize-none'
                  rows={3}
                />
              </div>
            </div>
          </div>

          <Button
            onClick={handleSubmitReview}
            disabled={isSubmittingReview || rating === 0}
            className='w-full'
          >
            {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
          </Button>
        </div>

        {/* Favourites Section */}
        <div className='border-t pt-4'>
          <div className='flex items-center justify-between'>
            <div>
              <h4 className='font-semibold text-gray-900'>
                Enjoyed the service from {booking.washer_name || 'this washer'}?
              </h4>
              <p className='text-sm text-gray-600'>
                Add them to your favourites for quick rebooking
              </p>
            </div>
            <Button
              onClick={handleAddFavourite}
              disabled={isAddingFavourite || isAlreadyFavourite}
              variant={isAlreadyFavourite ? 'secondary' : 'outline'}
              size='sm'
              className='gap-2'
            >
              <Heart
                className={`h-4 w-4 ${isAlreadyFavourite ? 'fill-red-500 text-red-500' : ''}`}
              />
              {isAlreadyFavourite
                ? 'Already Favourited'
                : isAddingFavourite
                  ? 'Adding...'
                  : 'Add to Favourites'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
