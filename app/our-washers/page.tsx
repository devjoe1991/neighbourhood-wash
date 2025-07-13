import Link from 'next/link'
// import Image from 'next/image'; // Removed unused Image import
import { Button } from '@/components/ui/button'
import {
  CheckBadgeIcon,
  UserGroupIcon,
  CurrencyPoundIcon,
  SparklesIcon,
  ShieldCheckIcon,
  RocketLaunchIcon,
  StarIcon as SolidStarIcon,
} from '@heroicons/react/24/solid' // Using Heroicons for a bit more visual variety if appropriate
import {
  LightBulbIcon,
  ClipboardDocumentCheckIcon,
  PresentationChartLineIcon,
} from '@heroicons/react/24/outline'
import { Star } from 'lucide-react' // Added Star from lucide-react

// Placeholder data for featured washers
const featuredWashers = [
  {
    id: 'washer-1',
    name: 'Sarah M.',
    location: 'Camden',
    rating: 4.9,
    reviews: 120,
    specialty: 'Delicate fabrics, Eco-friendly detergents',
    imageUrl: '/images/placeholder-washer-1.jpg', // Ensure you have placeholder images
    story:
      'Sarah turned her meticulous laundry skills into a thriving local business, helping dozens of families weekly.',
  },
  {
    id: 'washer-2',
    name: 'David K.',
    location: 'Kensington and Chelsea',
    rating: 4.8,
    reviews: 95,
    specialty: 'Quick turnaround, Large loads',
    imageUrl: '/images/placeholder-washer-2.jpg',
    story:
      'A former hospitality worker, David brings professionalism and efficiency to every wash.',
  },
  {
    id: 'washer-3',
    name: 'Chloe R.',
    location: 'London',
    rating: 5.0,
    reviews: 150,
    specialty: 'Baby clothes, Stain removal expert',
    imageUrl: '/images/placeholder-washer-3.jpg',
    story:
      'Chloe offers a gentle touch for sensitive items and has become a go-to for new parents.',
  },
]

interface WasherProfileProps {
  rating: number
  reviews: number
  specialty: string
  quote: string
  washer: {
    id: string
    name: string
    imageUrl?: string
    location: string
  }
}

const WasherProfileCard: React.FC<WasherProfileProps> = ({
  rating,
  reviews,
  specialty,
  quote,
  washer,
}) => {
  return (
    <div className='flex h-full flex-col items-center rounded-xl bg-white p-6 text-center shadow-lg transition-all duration-300 hover:shadow-2xl'>
      <div className='flex w-full flex-grow flex-col items-center'>
        <h3 className='text-2xl font-bold text-blue-600'>{washer.name}</h3>
        <p className='mb-3 text-sm text-slate-500'>{washer.location}</p>
        <div className='mb-3 flex items-center justify-center'>
          {[...Array(Math.floor(rating))].map((_, i) => (
            <SolidStarIcon key={i} className='h-5 w-5 text-yellow-400' />
          ))}
          {
            rating % 1 !== 0 && (
              <SolidStarIcon
                key='half'
                className='h-5 w-5 text-yellow-400 opacity-60'
              />
            ) /* Simple half star */
          }
          <span className='ml-2 text-sm text-gray-600'>
            {rating.toFixed(1)} ({reviews} reviews)
          </span>
        </div>
        <p className='mb-3 text-sm font-medium text-gray-700'>
          Specialty: {specialty}
        </p>
        <p className='mb-4 flex-grow text-sm text-gray-600'>
          <em>&quot;{quote}&quot;</em>
        </p>
        <Button
          variant='outline'
          size='sm'
          className='w-full border-blue-500 text-blue-500 hover:bg-blue-50'
        >
          View Profile (Coming Soon)
        </Button>
      </div>
    </div>
  )
}

export default function OurWashersPage() {
  return (
    <div className='bg-gray-50'>
      {/* Hero Section for Our Washers */}
      <section className='bg-gradient-to-r from-blue-600 to-blue-500 py-16 text-white md:py-24'>
        <div className='container mx-auto px-4 text-center sm:px-6 lg:px-8'>
          <h1 className='text-4xl font-bold tracking-tight sm:text-5xl'>
            Meet Our Trusted Neighbourhood Washers
          </h1>
          <p className='mx-auto mt-6 max-w-2xl text-lg text-blue-100'>
            Our platform is powered by dedicated individuals from your
            community, committed to providing top-notch laundry services with a
            personal touch.
          </p>
        </div>
      </section>

      {/* Vetting Process Section */}
      <section className='py-16 md:py-20'>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='mb-12 text-center md:mb-16'>
            <ShieldCheckIcon className='mx-auto mb-4 h-16 w-16 text-blue-600' />
            <h2 className='text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl'>
              Our Commitment to Trust & Safety
            </h2>
            <p className='mx-auto mt-4 max-w-2xl text-lg text-gray-600'>
              We take the safety and trust of our community seriously. Every
              washer on our platform goes through a comprehensive vetting
              process.
            </p>
          </div>
          <div className='grid gap-8 text-center md:grid-cols-2 lg:grid-cols-3'>
            <div className='rounded-lg bg-white p-6 shadow-lg'>
              <UserGroupIcon className='mx-auto mb-3 h-12 w-12 text-blue-500' />
              <h3 className='mb-2 text-xl font-semibold text-gray-800'>
                Identity Verification
              </h3>
              <p className='text-sm text-gray-600'>
                Washers verify their identity to ensure transparency and
                accountability.
              </p>
            </div>
            <div className='rounded-lg bg-white p-6 shadow-lg'>
              <ClipboardDocumentCheckIcon className='mx-auto mb-3 h-12 w-12 text-blue-500' />
              <h3 className='mb-2 text-xl font-semibold text-gray-800'>
                Profile Review
              </h3>
              <p className='text-sm text-gray-600'>
                Our team reviews each washer profile for completeness and
                clarity of services offered.
              </p>
            </div>
            <div className='rounded-lg bg-white p-6 shadow-lg'>
              <Star className='mx-auto mb-3 h-12 w-12 text-blue-500' />
              <h3 className='mb-2 text-xl font-semibold text-gray-800'>
                Community Ratings
              </h3>
              <p className='text-sm text-gray-600'>
                Continuous monitoring through user ratings and feedback helps
                maintain high standards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Washers Section */}
      <section className='bg-white py-16 md:py-20'>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='mb-12 text-center md:mb-16'>
            <UserGroupIcon className='mx-auto mb-4 h-16 w-16 text-green-600' />
            <h2 className='text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl'>
              Meet Some of Our Star Washers
            </h2>
            <p className='mx-auto mt-4 max-w-2xl text-lg text-gray-600'>
              Get to know the amazing individuals ready to take care of your
              laundry needs.
            </p>
          </div>
          <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
            {featuredWashers.map((washerData) => (
              <WasherProfileCard
                key={washerData.id}
                rating={washerData.rating}
                reviews={washerData.reviews}
                specialty={washerData.specialty}
                quote={washerData.story}
                washer={washerData}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Benefits of Becoming a Washer Section */}
      <section className='bg-gray-50 py-16 md:py-20'>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='mb-12 text-center md:mb-16'>
            <SparklesIcon className='mx-auto mb-4 h-16 w-16 text-blue-600' />
            <h2 className='text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl'>
              Why Become a Neighbourhood Washer?
            </h2>
            <p className='mx-auto mt-4 max-w-2xl text-lg text-gray-600'>
              Joining our platform offers a fantastic way to earn, connect, and
              make a difference in your community.
            </p>
          </div>
          <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
            <div className='flex flex-col items-center rounded-lg bg-white p-6 text-center shadow-lg'>
              <CurrencyPoundIcon className='mb-3 h-12 w-12 text-green-500' />
              <h3 className='mb-2 text-xl font-semibold text-gray-800'>
                Earn Extra Income
              </h3>
              <p className='text-sm text-gray-600'>
                Utilize your washing machine and skills to make money on your
                own schedule. Set your own prices and watch your earnings grow.
              </p>
            </div>
            <div className='flex flex-col items-center rounded-lg bg-white p-6 text-center shadow-lg'>
              <LightBulbIcon className='mb-3 h-12 w-12 text-yellow-500' />
              <h3 className='mb-2 text-xl font-semibold text-gray-800'>
                Flexible & Convenient
              </h3>
              <p className='text-sm text-gray-600'>
                Work from the comfort of your home. Choose when you want to work
                and how many laundry orders you take on.
              </p>
            </div>
            <div className='flex flex-col items-center rounded-lg bg-white p-6 text-center shadow-lg'>
              <UserGroupIcon className='mb-3 h-12 w-12 text-purple-500' />
              <h3 className='mb-2 text-xl font-semibold text-gray-800'>
                Support Your Community
              </h3>
              <p className='text-sm text-gray-600'>
                Help out your neighbours and build connections within your local
                area while providing a valuable service.
              </p>
            </div>
            {/* New Benefit for Waived Fee */}
            <div className='flex flex-col items-center rounded-lg bg-white p-6 text-center shadow-lg'>
              <CheckBadgeIcon className='mb-3 h-12 w-12 text-blue-500' />
              <h3 className='mb-2 text-xl font-semibold text-gray-800'>
                Get Started for Free
              </h3>
              <p className='text-sm text-gray-600'>
                As a special welcome, we'll waive the processing fee on your
                first payout. It's our way of saying thanks for joining!
              </p>
            </div>
            <div className='flex flex-col items-center rounded-lg bg-white p-6 text-center shadow-lg'>
              <PresentationChartLineIcon className='mb-3 h-12 w-12 text-blue-500' />
              <h3 className='mb-2 text-xl font-semibold text-gray-800'>
                Easy-to-Use Platform
              </h3>
              <p className='text-sm text-gray-600'>
                Our app makes it simple to manage bookings, communicate with
                users, and track your earnings.
              </p>
            </div>
            <div className='flex flex-col items-center rounded-lg bg-white p-6 text-center shadow-lg'>
              <CheckBadgeIcon className='mb-3 h-12 w-12 text-indigo-500' />
              <h3 className='mb-2 text-xl font-semibold text-gray-800'>
                Minimal Startup
              </h3>
              <p className='text-sm text-gray-600'>
                No major investment needed. If you have a washing machine and
                dryer, you&apos;re almost set!
              </p>
            </div>
            <div className='flex flex-col items-center rounded-lg bg-white p-6 text-center shadow-lg'>
              <RocketLaunchIcon className='mb-3 h-12 w-12 text-red-500' />
              <h3 className='mb-2 text-xl font-semibold text-gray-800'>
                Grow Your Reputation
              </h3>
              <p className='text-sm text-gray-600'>
                Build a base of happy customers and earn positive reviews to
                attract more bookings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Application Process Overview Section */}
      <section className='bg-white py-16 md:py-20'>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='mb-12 text-center md:mb-16'>
            <ClipboardDocumentCheckIcon className='mx-auto mb-4 h-16 w-16 text-blue-600' />
            <h2 className='text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl'>
              Becoming a Washer is Easy
            </h2>
            <p className='mx-auto mt-4 max-w-2xl text-lg text-gray-600'>
              Follow these simple steps to start offering your laundry services
              to your community.
            </p>
          </div>
          <div className='mx-auto max-w-3xl'>
            <ol className='relative ml-6 space-y-6 border-l border-gray-300'>
              <li className='mb-10 ml-10'>
                <span className='absolute -left-5 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 ring-4 ring-white'>
                  <UserGroupIcon className='h-5 w-5 text-blue-600' />
                </span>
                <h3 className='mb-1 flex items-center text-xl font-semibold text-gray-900'>
                  1. Sign Up & Create Profile
                </h3>
                <p className='text-gray-600'>
                  Fill out our simple application form. Tell us about yourself,
                  your equipment, and the services you&apos;ll offer.
                </p>
              </li>
              <li className='mb-10 ml-10'>
                <span className='absolute -left-5 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 ring-4 ring-white'>
                  <ShieldCheckIcon className='h-5 w-5 text-blue-600' />
                </span>
                <h3 className='mb-1 text-xl font-semibold text-gray-900'>
                  2. Verification Process
                </h3>
                <p className='text-gray-600'>
                  We&apos;ll review your application and guide you through our
                  quick identity and address verification.
                </p>
              </li>
              <li className='mb-10 ml-10'>
                <span className='absolute -left-5 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 ring-4 ring-white'>
                  <LightBulbIcon className='h-5 w-5 text-blue-600' />
                </span>
                <h3 className='mb-1 text-xl font-semibold text-gray-900'>
                  3. Set Up Your Services
                </h3>
                <p className='text-gray-600'>
                  Define your service area, pricing, and availability. Get your
                  profile ready to shine!
                </p>
              </li>
              <li className='ml-10'>
                <span className='absolute -left-5 flex h-10 w-10 items-center justify-center rounded-full bg-green-100 ring-4 ring-white'>
                  <RocketLaunchIcon className='h-5 w-5 text-green-600' />
                </span>
                <h3 className='mb-1 text-xl font-semibold text-gray-900'>
                  4. Go Live & Start Earning!
                </h3>
                <p className='text-gray-600'>
                  Once approved, your profile goes live. Start accepting
                  bookings and providing a great service to your neighbours.
                </p>
              </li>
            </ol>
          </div>
        </div>
      </section>

      {/* Washer Testimonials Section - Placeholder */}
      <section className='bg-gray-50 py-16 md:py-20'>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='mb-12 text-center md:mb-16'>
            <SparklesIcon className='mx-auto mb-4 h-16 w-16 text-yellow-500' />
            <h2 className='text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl'>
              Hear From Our Washers
            </h2>
            <p className='mx-auto mt-4 max-w-2xl text-lg text-gray-600'>
              Real stories from individuals earning and connecting through
              Neighbourhood Wash.
            </p>
          </div>
          <div className='grid gap-8 md:grid-cols-2'>
            {[1, 2].map((i) => (
              <blockquote key={i} className='rounded-lg bg-white p-6 shadow-lg'>
                <p className='mb-4 text-gray-600 italic'>
                  &quot;Joining Neighbourhood Wash was the best decision! I love
                  the flexibility and earning extra money doing something I
                  enjoy. Placeholder testimonial {i}.&quot;
                </p>
                <footer className='text-sm'>
                  <p className='font-semibold text-gray-900'>Washer Name {i}</p>
                  <p className='text-gray-500'>Location {i}</p>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className='bg-blue-600 py-16 md:py-24'>
        <div className='container mx-auto px-4 text-center sm:px-6 lg:px-8'>
          <h2 className='text-3xl font-bold tracking-tight text-white sm:text-4xl'>
            Ready to Join Our Network of Washers?
          </h2>
          <p className='mx-auto mt-4 max-w-xl text-lg text-blue-100'>
            It&apos;s simple to get started and offers a rewarding way to
            connect with your community and earn.
          </p>
          <div className='mt-8'>
            <Button
              size='lg'
              className='bg-white px-10 py-3 text-lg text-blue-600 hover:bg-blue-50'
              asChild
            >
              <Link href='/join?role=washer'>Become a Washer Today &rarr;</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
