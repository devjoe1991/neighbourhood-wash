import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  ShieldCheck,
  HeartHandshake,
  Leaf,
  Rocket,
  Search,
  Calendar,
  Sparkles,
  PoundSterling,
  Users,
} from 'lucide-react'

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns='http://www.w3.org/2000/svg'
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <polyline points='20 6 9 17 4 12' />
    </svg>
  )
}

export default function HomePage() {
  return (
    <div className='bg-white text-gray-800'>
      {/* Hero Section */}
      <section className='relative bg-gradient-to-br from-blue-50 to-indigo-100 pt-16 pb-20 md:pt-28 md:pb-32'>
        <div className='container mx-auto px-4 text-center'>
          <div className='mb-6'>
            <Link href='/signup' passHref>
              <span className='inline-block rounded-full bg-blue-200 bg-opacity-50 px-4 py-2 text-sm font-semibold text-blue-800 transition-transform hover:scale-105 hover:bg-blue-200'>
                🚀 Soft Launch Now Live! Join the revolution &rarr;
              </span>
            </Link>
          </div>
          <h1 className='text-4xl font-extrabold tracking-tighter text-gray-900 sm:text-5xl md:text-6xl lg:text-7xl'>
            The Future of Laundry is{' '}
            <span className='bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'>
              Local.
            </span>
          </h1>
          <p className='mx-auto mt-6 max-w-2xl text-lg text-gray-600 md:text-xl'>
            Get your laundry done by a trusted neighbour, or earn by sharing
            your washer. Simple, affordable, and eco-friendly.
          </p>
          <div className='mt-10 flex flex-col justify-center gap-4 sm:flex-row'>
            <Button
              asChild
              size='lg'
              className='bg-blue-600 text-white shadow-lg transition-transform hover:scale-105 hover:bg-blue-700'
            >
              <Link href='/signup?role=user'>
                Find a Washer <ArrowRight className='ml-2 h-5 w-5' />
              </Link>
            </Button>
            <Button
              asChild
              size='lg'
              variant='outline'
              className='border-2 border-blue-600 bg-white text-blue-600 shadow-lg transition-transform hover:scale-105 hover:bg-blue-50'
            >
              <Link href='/signup?role=washer'>
                Become a Washer <ArrowRight className='ml-2 h-5 w-5' />
              </Link>
            </Button>
          </div>
        </div>
        <div
          aria-hidden='true'
          className='absolute inset-x-0 top-0 z-0 h-48 bg-gradient-to-b from-blue-100 to-transparent'
        />
      </section>

      {/* How It Works Section */}
      <section className='py-16 sm:py-20 md:py-24'>
        <div className='container mx-auto px-4'>
          <div className='mb-12 text-center'>
            <h2 className='text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl'>
              Three Simple Steps
            </h2>
            <p className='mx-auto mt-4 max-w-2xl text-lg text-gray-600'>
              Laundry day has never been this easy.
            </p>
          </div>
          <div className='grid gap-8 md:grid-cols-3'>
            <div className='text-center'>
              <div className='mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600'>
                <Search className='h-8 w-8' />
              </div>
              <h3 className='text-xl font-semibold'>1. Find a Local Washer</h3>
              <p className='mt-2 text-gray-600'>
                Browse trusted washers in your neighbourhood.
              </p>
            </div>
            <div className='text-center'>
              <div className='mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600'>
                <Calendar className='h-8 w-8' />
              </div>
              <h3 className='text-xl font-semibold'>2. Book a Time</h3>
              <p className='mt-2 text-gray-600'>
                Pick a slot that works for you, and for them.
              </p>
            </div>
            <div className='text-center'>
              <div className='mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600'>
                <Sparkles className='h-8 w-8' />
              </div>
              <h3 className='text-xl font-semibold'>3. Enjoy Fresh Laundry</h3>
              <p className='mt-2 text-gray-600'>
                Drop off your clothes and pick them up clean!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dual Benefit Section */}
      <section className='bg-gray-50 py-16 sm:py-20 md:py-24'>
        <div className='container mx-auto px-4'>
          <div className='grid gap-12 md:grid-cols-2'>
            {/* For Users */}
            <div className='h-full rounded-xl bg-white p-8 shadow-lg'>
              <div className='mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600'>
                <Users className='h-7 w-7' />
              </div>
              <h3 className='text-2xl font-bold'>For Laundry Lovers</h3>
              <p className='mt-2 text-gray-600'>
                Enjoy a seamless laundry experience with a neighbourly touch.
              </p>
              <ul className='mt-6 space-y-4 text-gray-700'>
                <li className='flex items-start'>
                  <CheckIcon className='mr-3 mt-1 h-5 w-5 flex-shrink-0 text-green-500' />
                  <span>
                    <strong>Convenience:</strong> Find help next door, especially
                    when your machine fails.
                  </span>
                </li>
                <li className='flex items-start'>
                  <CheckIcon className='mr-3 mt-1 h-5 w-5 flex-shrink-0 text-green-500' />
                  <span>
                    <strong>Affordable:</strong> Save money compared to
                    traditional laundry services.
                  </span>
                </li>
                <li className='flex items-start'>
                  <CheckIcon className='mr-3 mt-1 h-5 w-5 flex-shrink-0 text-green-500' />
                  <span>
                    <strong>Community:</strong> Support your neighbours and build
                    local connections.
                  </span>
                </li>
              </ul>
            </div>
            {/* For Washers */}
            <div className='h-full rounded-xl bg-white p-8 shadow-lg'>
              <div className='mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600'>
                <PoundSterling className='h-7 w-7' />
              </div>
              <h3 className='text-2xl font-bold'>For Earning Washers</h3>
              <p className='mt-2 text-gray-600'>
                Turn your laundry machine into a source of income.
              </p>
              <ul className='mt-6 space-y-4 text-gray-700'>
                <li className='flex items-start'>
                  <CheckIcon className='mr-3 mt-1 h-5 w-5 flex-shrink-0 text-purple-500' />
                  <span>
                    <strong>Earn Extra:</strong> Potential to earn over £1500 per
                    month.
                  </span>
                </li>
                <li className='flex items-start'>
                  <CheckIcon className='mr-3 mt-1 h-5 w-5 flex-shrink-0 text-purple-500' />
                  <span>
                    <strong>Flexible:</strong> You set your own schedule and
                    availability.
                  </span>
                </li>
                <li className='flex items-start'>
                  <CheckIcon className='mr-3 mt-1 h-5 w-5 flex-shrink-0 text-purple-500' />
                  <span>
                    <strong>Be a Hero:</strong> Provide a valuable service to
                    your local community.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Green Initiative Section */}
      <section className='py-16 sm:py-20 md:py-24'>
        <div className='container mx-auto grid items-center gap-12 px-4 md:grid-cols-2'>
          <div className='text-center md:text-left'>
            <div className='mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600'>
              <Leaf className='h-8 w-8' />
            </div>
            <h2 className='text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl'>
              Good for Your Wallet,
              <br />
              Great for Your Planet.
            </h2>
            <p className='mt-4 text-lg text-gray-600'>
              By using washing machines already in homes, we reduce the
              environmental impact of manufacturing and transporting new
              appliances. It&apos;s a shared economy that saves energy, money,
              and builds a greener neighbourhood.
            </p>
          </div>
          <div className='relative flex justify-center'>
            <Image
              src='/images/green-wash.jpeg'
              alt='A stylish person in green posing with a washing machine, representing the eco-friendly washer community'
              width={425}
              height={300}
              className='rounded-xl object-cover shadow-2xl'
            />
          </div>
        </div>
      </section>

      {/* Trust & Community Section */}
      <section className='bg-gray-50 py-16 sm:py-20 md:py-24'>
        <div className='container mx-auto px-4'>
          <div className='mb-12 text-center'>
            <h2 className='text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl'>
              Built on Trust and Community
            </h2>
            <p className='mx-auto mt-4 max-w-2xl text-lg text-gray-600'>
              Your peace of mind is our top priority.
            </p>
          </div>
          <div className='mx-auto grid max-w-4xl gap-8 md:grid-cols-2'>
            <div className='flex flex-col items-center text-center md:flex-row md:items-start md:text-left'>
              <div className='mb-4 flex-shrink-0 md:mb-0 md:mr-4'>
                <div className='flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600'>
                  <ShieldCheck className='h-6 w-6' />
                </div>
              </div>
              <div>
                <h3 className='text-xl font-semibold'>Vetted & Verified</h3>
                <p className='mt-1 text-gray-600'>
                  Every washer undergoes a background check and verification
                  process to ensure a safe and reliable experience for all.
                </p>
              </div>
            </div>
            <div className='flex flex-col items-center text-center md:flex-row md:items-start md:text-left'>
              <div className='mb-4 flex-shrink-0 md:mb-0 md:mr-4'>
                <div className='flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600'>
                  <HeartHandshake className='h-6 w-6' />
                </div>
              </div>
              <div>
                <h3 className='text-xl font-semibold'>Neighbourly Respect</h3>
                <p className='mt-1 text-gray-600'>
                  We foster a community of respect and support, connecting you
                  with people who care about their neighbourhood.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='bg-blue-600'>
        <div className='container mx-auto px-4 py-16 text-center text-white sm:py-20'>
          <h2 className='text-3xl font-bold tracking-tight sm:text-4xl'>
            Don&apos;t Miss Out on the Laundry Revolution
          </h2>
          <p className='mx-auto mt-4 max-w-2xl text-lg text-blue-100'>
            Whether you need a wash or want to earn, now is the time to join.
          </p>
          <div className='mx-auto mt-10 flex max-w-xs flex-col justify-center gap-4 sm:max-w-none sm:flex-row'>
            <Button
              asChild
              size='lg'
              className='bg-white text-blue-600 shadow-lg transition-transform hover:scale-105 hover:bg-gray-100'
            >
              <Link href='/signup?role=user'>Sign Up to Wash</Link>
            </Button>
            <Button
              asChild
              size='lg'
              variant='outline'
              className='border-2 border-white bg-transparent text-white shadow-lg transition-transform hover:scale-105 hover:bg-white hover:text-blue-600'
            >
              <Link href='/signup?role=washer'>Apply to Earn</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
