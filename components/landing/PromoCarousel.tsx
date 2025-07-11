'use client'

import * as React from 'react'
import Link from 'next/link'

import { Card, CardContent, CardFooter } from '@/components/ui/card'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { Button } from '@/components/ui/button'

const promoData = [
  {
    title: 'Book a Wash Instantly',
    description:
      'Find Washers with immediate availability and book in minutes.',
    ctaText: 'Arrange a Wash',
    ctaLink: '/user/dashboard',
    bgColor: 'bg-yellow-100',
  },
  {
    title: 'Natural & Hypoallergenic',
    description:
      'Many of our Washers offer services using natural, eco-friendly, and hypoallergenic products.',
    ctaText: 'Find Specialist Washers',
    ctaLink: '/user/dashboard',
    bgColor: 'bg-blue-100',
  },
  {
    title: 'Discover the Difference',
    description:
      'See how our seamless, app-based experience makes laundry day a breeze.',
    ctaText: 'See How It Works',
    ctaLink: '/how-it-works',
    bgColor: 'bg-green-100',
  },
  {
    title: 'Become a Washer',
    description:
      'Earn money by turning your laundry room into a small business. Flexible hours, great earnings.',
    ctaText: 'Learn More',
    ctaLink: '/user/dashboard/become-washer',
    bgColor: 'bg-indigo-100',
  },
]

export function PromoCarousel() {
  return (
    <Carousel
      opts={{
        align: 'start',
        loop: true,
      }}
      className='w-full'
    >
      <CarouselContent>
        {promoData.map((promo, index) => (
          <CarouselItem key={index} className='md:basis-1/2 lg:basis-1/3'>
            <div className='p-1'>
              <Card
                className={`flex h-full flex-col justify-between overflow-hidden rounded-2xl ${promo.bgColor}`}
              >
                <CardContent className='flex-grow p-6'>
                  <h3 className='mb-3 text-xl font-bold text-gray-900'>
                    {promo.title}
                  </h3>
                  <p className='text-sm text-gray-700'>{promo.description}</p>
                </CardContent>
                <CardFooter className='p-6 pt-0'>
                  <Button asChild className='w-full rounded-xl'>
                    <Link href={promo.ctaLink}>{promo.ctaText}</Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className='ml-12' />
      <CarouselNext className='mr-12' />
    </Carousel>
  )
}
