import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ModernHero } from '@/components/ui/modern-hero'
import { ModernSection, SectionHeader } from '@/components/ui/modern-section'
import { TestimonialCard } from '@/components/ui/testimonial-card'
import { BenefitCard } from '@/components/ui/benefit-card'
import {
  ArrowRight,
  Home,
  PoundSterling,
  Heart,
  PiggyBank,
  BadgeCheck,
  Check,
  ThumbsUp,
  HeartHandshake,
  ShieldCheck,
  Leaf,
  Award,
  Wind,
} from 'lucide-react'
import { LocationLinks } from '@/components/ui/search-cards'
import { PromoCarousel } from '@/components/landing/PromoCarousel'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel'

const testimonials = [
  {
    review:
      'Tried this once and now my neighbours keep asking who my “laundry plug” is. Stay out of my business, Linda.',
    author: 'Anonymous, London',
    rating: 1,
  },
  {
    review:
      'Told my parents I finally used the washing machine. Truth is, I used Neighbourhood Wash. Now they’ve invited me over to do their laundry. I’ve never even touched a detergent bottle.',
    author: 'Sam, Hackney',
    rating: 1,
  },
  {
    review:
      'Folded. Pressed. Organised by colour. Now I have to do the same to my life. Unbelievable.',
    author: 'Martin, Camden',
    rating: 1,
  },
  {
    review: 'All jokes aside, a top-notch service',
    author: 'Chloe, Islington',
    rating: 5,
  },
]

const locations = [
  { name: 'Washers in Islington', href: '#' },
  { name: 'Washers in Hackney', href: '#' },
  { name: 'Washers in Camden', href: '#' },
  { name: 'Washers in Tower Hamlets', href: '#' },
  { name: 'Washers in Lambeth', href: '#' },
  { name: 'Washers in Southwark', href: '#' },
  { name: 'Washers in Lewisham', href: '#' },
  { name: 'Washers in Greenwich', href: '#' },
]

export default function HomePage() {
  return (
    <div className='bg-white'>
      {/* Modern Hero Section */}
      <ModernHero
        title={
          <>
            Join the{' '}
            <span className='bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'>
              Neighbourhood
            </span>{' '}
            Laundry Revolution
          </>
        }
        subtitle='Connect with verified local Washers for convenient, affordable laundry services. Or become a Washer and earn extra income from your laundry facilities.'
        showSearch={false}
        ctaButtons={
          <>
            <Button
              asChild
              size='lg'
              className='rounded-xl bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg transition-all duration-300 hover:bg-blue-700 hover:shadow-xl'
            >
              <Link href='/signup?role=user'>
                Find a Washer
                <ArrowRight className='ml-2 h-5 w-5' />
              </Link>
            </Button>
            <Button
              asChild
              size='lg'
              variant='outline'
              className='rounded-xl border-2 border-blue-600 px-8 py-4 text-base font-semibold text-blue-600 shadow-lg transition-all duration-300 hover:bg-blue-50 hover:shadow-xl'
            >
              <Link href='/signup?role=washer'>
                Become a Washer
                <ArrowRight className='ml-2 h-5 w-5' />
              </Link>
            </Button>
          </>
        }
      />

      {/* Key Benefits Bar */}
      <ModernSection
        background='light-blue'
        padding='xs'
        className='border-y border-gray-200/75'
      >
        <div className='grid gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3'>
          <div className='flex items-start gap-3 sm:gap-4'>
            <div className='relative mt-1 flex-shrink-0'>
              <PiggyBank
                className='h-8 w-8 text-gray-700 sm:h-10 sm:w-10'
                strokeWidth={1}
              />
              <div className='absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-blue-50 bg-pink-500 sm:h-5 sm:w-5'>
                <Check
                  className='h-2.5 w-2.5 text-white sm:h-3 sm:w-3'
                  strokeWidth={3}
                />
              </div>
            </div>
            <div className='flex-1'>
              <h3 className='text-sm leading-tight font-bold text-gray-900 sm:text-base'>
                Availability & Pricing
              </h3>
              <p className='mt-1 text-xs text-gray-600 sm:text-sm'>
                Confirmed availability and detailed pricing.
              </p>
            </div>
          </div>
          <div className='flex items-start gap-3 sm:gap-4'>
            <div className='relative mt-1 flex-shrink-0'>
              <BadgeCheck
                className='h-8 w-8 text-gray-700 sm:h-10 sm:w-10'
                strokeWidth={1}
              />
              <div className='absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-blue-50 bg-pink-500 sm:h-5 sm:w-5'>
                <ThumbsUp
                  className='h-2.5 w-2.5 text-white sm:h-3 sm:w-3'
                  strokeWidth={2}
                  fill='white'
                />
              </div>
            </div>
            <div className='flex-1'>
              <h3 className='text-sm leading-tight font-bold text-gray-900 sm:text-base'>
                Quality Assured
              </h3>
              <p className='mt-1 text-xs text-gray-600 sm:text-sm'>
                Every Washer is vetted, reviewed, and regulated.
              </p>
            </div>
          </div>
          <div className='flex items-start gap-3 sm:col-span-2 sm:gap-4 lg:col-span-1'>
            <div className='relative mt-1 flex-shrink-0'>
              <Home
                className='h-8 w-8 text-gray-700 sm:h-10 sm:w-10'
                strokeWidth={1}
              />
              <div className='absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-blue-50 bg-pink-500 sm:h-5 sm:w-5'>
                <Heart
                  className='h-2.5 w-2.5 text-white sm:h-3 sm:w-3'
                  strokeWidth={2}
                  fill='white'
                />
              </div>
            </div>
            <div className='flex-1'>
              <h3 className='text-sm leading-tight font-bold text-gray-900 sm:text-base'>
                Your Whole Borough
              </h3>
              <p className='mt-1 text-xs text-gray-600 sm:text-sm'>
                Search every registered Washer in your area.
              </p>
            </div>
          </div>
        </div>
      </ModernSection>

      {/* Testimonials Section */}
      <ModernSection background='primary-deep-blue' padding='lg'>
        <div className='mb-12 text-center'>
          <h2 className='text-3xl font-bold tracking-tighter text-gray-900 sm:text-4xl md:text-5xl dark:text-gray-50'>
            Neighbourhood Watch
          </h2>
          <p className='mt-4 text-lg text-gray-600 md:text-xl dark:text-gray-400'>
            Some of our favourite reviews. And yes, we're fully aware of what a
            1-star rating means.
          </p>
        </div>
        <Carousel
          opts={{
            align: 'start',
            loop: true,
          }}
          className='w-full'
        >
          <CarouselContent>
            {testimonials.map((testimonial, index) => (
              <CarouselItem
                key={index}
                className='md:basis-1/2 lg:basis-1/3 xl:basis-1/4'
              >
                <TestimonialCard
                  review={testimonial.review}
                  author={testimonial.author}
                  rating={testimonial.rating}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className='ml-12' />
          <CarouselNext className='mr-12' />
        </Carousel>
      </ModernSection>

      {/* Community Staple Section */}
      <ModernSection
        background='gray'
        padding='md'
        className='border-b border-gray-200/50'
      >
        <div className='text-center'>
          <h2 className='font-display text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl'>
            A new<span className='text-blue-600'> community staple</span>
          </h2>
          <p className='mx-auto mt-5 max-w-2xl text-lg text-gray-600 sm:mt-6'>
            Tired of faceless laundromats and corporate apps that couldn't find
            your neighbourhood on a map? It's time to do laundry the local way.
            Get started and have a real neighbour sort you out.
          </p>
          <div className='mt-8 flex justify-center gap-4'>
            <Button
              asChild
              size='lg'
              className='rounded-xl bg-gray-900 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:bg-gray-800 hover:shadow-xl'
            >
              <Link href='/user/dashboard/new-booking'>Book Now</Link>
            </Button>
          </div>
        </div>
      </ModernSection>

      {/* Carousel Promo Section */}
      <ModernSection
        background='white'
        padding='md'
        className='border-b border-gray-100'
      >
        <PromoCarousel />
      </ModernSection>

      {/* Benefits Section */}
      <ModernSection background='white' padding='lg'>
        <SectionHeader
          title='The Neighbourhood Wash Difference'
          subtitle='We built our platform to be safe, simple, and supportive for everyone involved.'
        />

        <div className='mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-y-16'>
          <BenefitCard
            icon={<ShieldCheck className='h-8 w-8 text-blue-600' />}
            title='Vetted & Trusted Washers'
            description='Every Washer on our platform undergoes a verification process, including ID checks, to ensure your peace of mind.'
          />
          <BenefitCard
            icon={<HeartHandshake className='h-8 w-8 text-blue-600' />}
            title='Community-Centric'
            description='By using our service, you are directly supporting individuals in your local community. It’s a win-win.'
          />
          <BenefitCard
            icon={<PoundSterling className='h-8 w-8 text-blue-600' />}
            title='Transparent Pricing'
            description='No hidden fees. You see the full price upfront, so you can book with confidence every time.'
          />
          <BenefitCard
            icon={<Leaf className='h-8 w-8 text-blue-600' />}
            title='Eco-Friendly Options'
            description='Many of our Washers offer eco-friendly and hypoallergenic detergent options. Just filter for your preference.'
          />
          <BenefitCard
            icon={<Award className='h-8 w-8 text-blue-600' />}
            title='High-Quality Service'
            description='Our community rates their experiences, ensuring that high standards are maintained across the platform.'
          />
          <BenefitCard
            icon={<Wind className='h-8 w-8 text-blue-600' />}
            title='Seamless Experience'
            description='From booking to payment to communication, our app makes the entire process smooth and hassle-free.'
          />
        </div>
      </ModernSection>

      {/* Locations Section */}
      <ModernSection padding='lg'>
        <SectionHeader
          title='Find Washers Across London'
          subtitle='We are rapidly expanding our network. Find a trusted Neighbourhood Washer in your area today.'
        />
        <LocationLinks locations={locations} />
      </ModernSection>

      {/* Final CTA */}
      <div className='relative overflow-hidden bg-gray-900 py-20 sm:py-24'>
        <div className='absolute inset-0'>
          <Image
            src='/images/neighbourhood-image.jpg'
            alt='Abstract neighbourhood background'
            layout='fill'
            objectFit='cover'
            className='opacity-40'
          />
          <div className='absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent' />
        </div>
        <div className='relative mx-auto max-w-2xl px-6 text-center lg:px-8'>
          <h2 className='font-display text-4xl font-bold tracking-tight text-white sm:text-5xl'>
            Ready to get started?
          </h2>
          <p className='mt-4 text-lg leading-8 text-gray-300'>
            Join the thousands of people simplifying their lives with
            Neighbourhood Wash. Sign up as a customer or a Washer today.
          </p>
          <div className='mt-10 flex items-center justify-center gap-x-6'>
            <Button
              asChild
              size='lg'
              className='rounded-md bg-white px-6 py-3 text-base font-semibold text-gray-900 shadow-sm hover:bg-gray-100'
            >
              <Link href='/signup?role=user'>Find a Washer</Link>
            </Button>
            <Button
              asChild
              size='lg'
              className='rounded-md border-2 border-white bg-transparent px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-white hover:text-gray-900'
            >
              <Link href='/signup?role=washer'>Become a Washer</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
