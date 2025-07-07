import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ModernHero } from '@/components/ui/modern-hero'
import { ModernSection, SectionHeader } from '@/components/ui/modern-section'
import { TestimonialCard } from '@/components/ui/testimonial-card'
import { BenefitCard } from '@/components/ui/benefit-card'
import {
  ArrowRight,
  Filter,
  Home,
  PoundSterling,
  Star,
  Sparkles,
  Users,
  MapPin,
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
import { SearchCategoryCard, LocationLinks } from '@/components/ui/search-cards'
import { CategoryLinkCard, ActionCard } from '@/components/ui/promo-cards'
import CircularFeatures from '@/components/ui/CircularFeatures'

const testimonials = [
  {
    review:
      "I really didn't know where to turn a few days ago but now I'm so hopeful. Found a local washer in minutes!",
    author: 'Cat, Islington',
    rating: 5,
  },
  {
    review:
      'A fantastic service which I would highly recommend. My clothes came back perfect.',
    author: 'Nikki, Hackney',
    rating: 5,
  },
  {
    review:
      'Honestly, this service is a godsend! So convenient and affordable.',
    author: 'Martin, Camden',
    rating: 5,
  },
  {
    review:
      'As a washer, this has been a great way to earn extra income. The app is so easy to use.',
    author: 'Sarah B (Washer)',
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
            Find trusted laundry help in your{' '}
            <span className='bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'>
              neighbourhood
            </span>
          </>
        }
        subtitle='Connect with verified local Washers for convenient, affordable laundry services. Or become a Washer and earn extra income from your laundry facilities.'
        showSearch={true}
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
        padding='sm'
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

      {/* New Promo Section */}
      <ModernSection
        background='white'
        padding='md'
        className='border-b border-gray-100'
      >
        <div className='mb-8 grid gap-4 sm:mb-10 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3'>
          <CategoryLinkCard title='Find a Washer' href='/dashboard' />
          <CategoryLinkCard title='Our Services' href='/how-it-works' />
          <CategoryLinkCard
            title='Become a Washer'
            href='/signup?role=washer'
            className='sm:col-span-2 lg:col-span-1'
          />
        </div>

        <div className='grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-2'>
          <div className='flex flex-col gap-6 sm:gap-8'>
            <ActionCard
              title='Book a Wash Instantly'
              description='Need laundry done today? Find Washers with immediate availability and book in minutes.'
              ctaText='Arrange a Wash'
              ctaLink='/dashboard'
              bgColor='bg-yellow-100'
            />
            <ActionCard
              title='Natural & Hypoallergenic'
              description='Many of our Washers offer services using natural, eco-friendly, and hypoallergenic products. Find the perfect match for your needs.'
              ctaText='Find Specialist Washers'
              ctaLink='/dashboard'
              bgColor='bg-blue-100'
            />
          </div>
          <ActionCard
            title='Discover the Neighbourhood Difference'
            description='Get your laundry search off to a great start by seeing how our seamless, app-based experience works.'
            ctaText='See How It Works'
            ctaLink='/how-it-works'
            bgColor='bg-green-100'
            className='min-h-[350px] sm:min-h-[400px]'
          >
            <div className='relative mb-6 h-48 w-full overflow-hidden rounded-2xl sm:mb-8 sm:h-64'>
              <Image
                src='/images/colourful-pegs.jpg'
                alt='Colourful pegs with a heart-shaped one'
                layout='fill'
                objectFit='cover'
                className='transition-transform duration-300 group-hover:scale-105'
              />
            </div>
          </ActionCard>
        </div>
      </ModernSection>

      {/* Community Staple Section */}
      <ModernSection
        background='gray'
        padding='md'
        className='border-b border-gray-200/50'
      >
        <div className='text-center'>
          <h4 className='mb-6 text-xs font-bold tracking-wider text-gray-500 uppercase sm:mb-8 sm:text-sm'>
            A TRUSTED COMMUNITY STAPLE
          </h4>
          <div className='flex flex-wrap items-center justify-center gap-x-4 gap-y-3 sm:gap-x-6 sm:gap-y-4 lg:gap-x-8 lg:gap-y-6'>
            <div className='flex items-center gap-2 text-sm font-medium text-gray-600 sm:text-base'>
              <HeartHandshake className='h-5 w-5 text-gray-500 sm:h-6 sm:w-6' />
              <span className='whitespace-nowrap'>Community First</span>
            </div>
            <div className='flex items-center gap-2 text-sm font-medium text-gray-600 sm:text-base'>
              <ShieldCheck className='h-5 w-5 text-gray-500 sm:h-6 sm:w-6' />
              <span className='whitespace-nowrap'>Safety Verified</span>
            </div>
            <div className='flex items-center gap-2 text-sm font-medium text-gray-600 sm:text-base'>
              <MapPin className='h-5 w-5 text-gray-500 sm:h-6 sm:w-6' />
              <span className='whitespace-nowrap'>Proudly Local</span>
            </div>
            <div className='flex items-center gap-2 text-sm font-medium text-gray-600 sm:text-base'>
              <Leaf className='h-5 w-5 text-gray-500 sm:h-6 sm:w-6' />
              <span className='whitespace-nowrap'>Eco-Friendly</span>
            </div>
            <div className='flex items-center gap-2 text-sm font-medium text-gray-600 sm:text-base'>
              <Award className='h-5 w-5 text-gray-500 sm:h-6 sm:w-6' />
              <span className='whitespace-nowrap'>Top Rated</span>
            </div>
          </div>
        </div>
      </ModernSection>

      {/* Why Community Loves Us Section */}
      <ModernSection
        background='white'
        padding='md'
        className='border-t border-b border-gray-100'
      >
        <SectionHeader
          title='Why Our Community Loves Us'
          description="Proudly rated 'Excellent' on Trustpilot, Neighbourhood Wash is creating cleaner, more connected communities."
        />
        <div className='grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-3'>
          {/* Left Column: Large Image Card */}
          <div className='group relative min-h-[300px] overflow-hidden rounded-3xl sm:min-h-[400px] lg:col-span-1 lg:min-h-[500px]'>
            <Image
              src='/images/green-wash.jpeg'
              alt='A happy person with their clean laundry'
              layout='fill'
              objectFit='cover'
              className='transition-transform duration-300 group-hover:scale-105'
            />
            <div className='absolute inset-0 bg-gradient-to-t from-black/60 to-transparent' />
            <div className='absolute bottom-0 left-0 p-4 sm:p-6 lg:p-8'>
              <h3 className='mb-3 text-lg font-bold text-white sm:mb-4 sm:text-xl lg:text-2xl'>
                What are the benefits of Neighbourhood Wash?
              </h3>
              <div className='flex items-center gap-2 text-sm font-semibold text-white sm:gap-3 sm:text-base'>
                <ArrowRight className='h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6' />
                <span>Learn More</span>
              </div>
            </div>
          </div>
          {/* Right Column: 2x2 Grid of Benefits + CTA */}
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:col-span-2'>
            <BenefitCard
              icon={<Star className='h-6 w-6 text-blue-600 sm:h-8 sm:w-8' />}
              title='5-Star Community Support'
              description='Need a helping hand? Benefit from free guides and on-demand support from our team.'
            />
            <BenefitCard
              icon={
                <PoundSterling className='h-6 w-6 text-blue-600 sm:h-8 sm:w-8' />
              }
              title='Pricing Transparency'
              description='Benefit from full transparency with detailed pricing information for every service listed.'
            />
            <BenefitCard
              icon={<Filter className='h-6 w-6 text-blue-600 sm:h-8 sm:w-8' />}
              title='Advanced Search Filters'
              description='On a budget? Have a pet? Our filters allow you to quickly find the perfect washer.'
            />
            <BenefitCard
              icon={<Home className='h-6 w-6 text-blue-600 sm:h-8 sm:w-8' />}
              title='The Whole Neighbourhood'
              description='Confidently search your whole borough including every registered washer in your area.'
            />
            <div className='flex flex-col items-center justify-center rounded-2xl bg-blue-100 p-6 text-center sm:col-span-2 sm:p-8'>
              <h3 className='mb-3 text-lg font-bold text-gray-900 sm:mb-4 sm:text-xl lg:text-2xl'>
                Find the perfect wash today!
              </h3>
              <Button
                asChild
                className='w-full rounded-lg bg-gray-900 text-white hover:bg-gray-800 sm:w-auto'
              >
                <Link href='/dashboard'>Start your search</Link>
              </Button>
            </div>
          </div>
        </div>
      </ModernSection>

      {/* Meet the Community Section */}
      <ModernSection
        background='white'
        padding='lg'
        className='border-b border-gray-100'
      >
        <SectionHeader
          title='Meet the Neighbourhood'
          description="A family's trusted (and free) guide to easy, local, and reliable laundry care."
        />
        <div className='relative mx-auto mb-8 max-w-4xl sm:mb-12'>
          <div className='overflow-hidden rounded-3xl bg-blue-100 p-2 sm:p-3 md:p-4'>
            <Image
              src='/images/neighbourhood-image.jpg'
              alt='A child playfully peeking over a washing machine door'
              width={1200}
              height={600}
              className='rounded-2xl object-cover'
            />
          </div>
        </div>
        <div className='flex gap-4 overflow-x-auto pb-4 sm:gap-6 lg:grid lg:grid-cols-4 lg:space-x-0'>
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.author}
              className='w-[280px] flex-shrink-0 sm:w-[320px] md:w-[350px] lg:w-auto'
            >
              <TestimonialCard {...testimonial} />
            </div>
          ))}
        </div>
      </ModernSection>

      {/* NEW Combined Features Section */}
      <ModernSection
        background='gradient'
        padding='lg'
        className='border-b border-gray-200/30'
      >
        <SectionHeader
          subtitle='One Platform, Every Feature'
          title='Everything you need for seamless laundry'
          description='Our platform is designed with modern features to make laundry simple, secure, and stress-free for everyone involved.'
        />
        <CircularFeatures />
      </ModernSection>

      {/* Search By Needs Section */}
      <ModernSection
        background='gray'
        padding='lg'
        className='border-b border-gray-200/50'
      >
        <SectionHeader
          title='Search by Your Needs'
          description='Find washers who cater to your specific laundry requirements.'
        />
        <div className='mb-12 grid grid-cols-1 gap-6 sm:mb-16 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4'>
          <SearchCategoryCard
            icon={
              <Sparkles className='h-16 w-16 text-blue-600 sm:h-20 sm:w-20' />
            }
            title='Special Care'
            description='For delicate items'
            infoText='What is special care?'
            infoLink='#'
            bgColor='bg-pink-100'
          />
          <SearchCategoryCard
            icon={<Wind className='h-16 w-16 text-green-500 sm:h-20 sm:w-20' />}
            title='Allergy-Friendly'
            description='Hypoallergenic options'
            infoText='What are allergy needs?'
            infoLink='#'
            bgColor='bg-green-100'
          />
          <SearchCategoryCard
            icon={<Leaf className='h-16 w-16 text-blue-500 sm:h-20 sm:w-20' />}
            title='Eco-Wash'
            description='Sustainable detergents'
            infoText='What is an eco-wash?'
            infoLink='#'
            bgColor='bg-blue-100'
          />
          <SearchCategoryCard
            icon={
              <Users className='h-16 w-16 text-yellow-500 sm:h-20 sm:w-20' />
            }
            title='Family-Sized Loads'
            description='For bulk laundry'
            infoText='What are bulk options?'
            infoLink='#'
            bgColor='bg-yellow-100'
          />
        </div>

        <SectionHeader
          title='Searching in a specific location?'
          description='Find trusted, local washers right in your neighbourhood.'
        />
        <LocationLinks locations={locations} />
      </ModernSection>

      {/* CTA Section */}
      <ModernSection background='white' padding='lg'>
        <div className='rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 p-8 text-center text-white sm:p-12 lg:p-16'>
          <h2 className='mb-4 text-2xl font-bold sm:mb-6 sm:text-3xl lg:text-4xl'>
            Ready to revolutionise your laundry experience?
          </h2>
          <p className='mx-auto mb-6 max-w-2xl text-base text-blue-100 sm:mb-8 sm:text-lg lg:text-xl'>
            Join thousands of satisfied customers and Washers who've made
            laundry simple, affordable, and community-focused.
          </p>
          <div className='flex flex-col justify-center gap-3 sm:flex-row sm:gap-4'>
            <Button
              asChild
              size='lg'
              className='rounded-xl bg-white px-6 py-3 text-sm font-semibold text-blue-600 shadow-lg transition-all duration-300 hover:bg-gray-100 hover:shadow-xl sm:px-8 sm:py-4 sm:text-base'
            >
              <Link href='/signup?role=user'>
                Get Started Today
                <ArrowRight className='ml-2 h-4 w-4 sm:h-5 sm:w-5' />
              </Link>
            </Button>
            <Button
              asChild
              size='lg'
              variant='outline'
              className='rounded-xl border-2 border-white px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:bg-white hover:text-blue-600 hover:shadow-xl sm:px-8 sm:py-4 sm:text-base'
            >
              <Link href='/how-it-works'>Learn More</Link>
            </Button>
          </div>
        </div>
      </ModernSection>
    </div>
  )
}
