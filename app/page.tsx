import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Star,
  ShieldCheck,
  CalendarDays,
  Award,
  Users,
  PoundSterling,
  Zap,
} from 'lucide-react'

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className='py-12 md:py-20 lg:py-28'>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='grid items-center gap-8 md:grid-cols-2 lg:gap-16'>
            <div className='space-y-6'>
              <p className='text-sm font-medium tracking-wide text-blue-600'>
                Join the laundry revolution
              </p>
              <h1 className='text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl'>
                Your Neighbourhood
                <br />
                <span className='text-blue-600'>Laundry Solution</span>
              </h1>
              <p className='text-lg text-gray-600'>
                Our community of trusted neighbours offer their washing machines
                and expertise to help with your laundry needs. Perfect when your
                appliance breaks down or if you don&apos;t have one - simply
                book a neighbour and get your laundry done at their place!
              </p>
              <div className='flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4'>
                <Button
                  size='lg'
                  className='bg-blue-600 text-white hover:bg-blue-700'
                  asChild
                >
                  <Link href='/signup'>Join Neighbourhood Wash &rarr;</Link>
                </Button>
                <Button
                  size='lg'
                  variant='outline'
                  className='border-blue-600 text-blue-600 hover:bg-blue-50'
                  asChild
                >
                  <Link href='/how-it-works'>Learn More &rarr;</Link>
                </Button>
              </div>
            </div>
            <div className='relative mt-10 md:mt-0'>
              <Image
                src='/images/family-wash.jpg'
                alt='Family doing laundry'
                width={600}
                height={400}
                className='aspect-[3/2] rounded-lg object-cover shadow-xl'
              />
              <div className='bg-opacity-90 absolute right-4 bottom-4 flex items-center space-x-2 rounded-lg bg-white p-3 shadow-md'>
                <div className='flex text-yellow-400'>
                  {[...Array(4)].map((_, i) => (
                    <Star
                      key={`star-${i}`}
                      fill='currentColor'
                      className='h-5 w-5'
                    />
                  ))}
                  <Star fill='currentColor' className='h-5 w-5 opacity-70' />{' '}
                  {/* For the 4.9 effect, one star slightly different */}
                </div>
                <p className='text-sm font-semibold text-gray-700'>
                  4.9/5 Average Rating
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* End Hero Section */}

      {/* Why Choose Us Section */}
      <section className='bg-gray-50 py-12 md:py-20 lg:py-28'>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='mb-12 text-center md:mb-16'>
            <h2 className='text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl'>
              Why Choose Neighbourhood Wash?
            </h2>
            <p className='mx-auto mt-4 max-w-2xl text-lg text-gray-600'>
              Experience the perfect blend of convenience, quality, and
              community
            </p>
          </div>
          <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
            {[
              {
                icon: <ShieldCheck className='h-8 w-8 text-blue-600' />,
                title: 'Trusted & Verified',
                description:
                  'Every washer is thoroughly vetted and background-checked for your peace of mind.',
              },
              {
                icon: <CalendarDays className='h-8 w-8 text-blue-600' />,
                title: 'Flexible Scheduling',
                description:
                  'Book services at your convenience, with real-time availability and instant confirmation.',
              },
              {
                icon: <Award className='h-8 w-8 text-blue-600' />,
                title: 'Quality Guaranteed',
                description:
                  'Professional care for your garments with satisfaction guaranteed.',
              },
              {
                icon: <Users className='h-8 w-8 text-blue-600' />,
                title: 'Community-Driven',
                description:
                  'Support local entrepreneurs while getting exceptional service.',
              },
              {
                icon: <PoundSterling className='h-8 w-8 text-blue-600' />,
                title: 'Competitive Pricing',
                description:
                  'Average earnings of £1500+/month for washers, great value for users.',
              },
              {
                icon: <Zap className='h-8 w-8 text-blue-600' />,
                title: 'Easy to Use',
                description:
                  'Simple booking, secure payments, and seamless communication.',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className='rounded-lg bg-white p-6 shadow-lg'
              >
                <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100'>
                  {feature.icon}
                </div>
                <h3 className='mb-2 text-xl font-semibold text-gray-900'>
                  {feature.title}
                </h3>
                <p className='text-sm text-gray-600'>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* End Why Choose Us Section */}

      {/* Testimonials Placeholder Section */}
      <section className='py-12 md:py-20 lg:py-28'>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='mb-12 text-center md:mb-16'>
            <h2 className='text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl'>
              What Our Users Say
            </h2>
            <p className='mx-auto mt-4 max-w-2xl text-lg text-gray-600'>
              Placeholder for testimonials. Real stories coming soon!
            </p>
          </div>
          {/* Placeholder content - replace with actual testimonial cards later */}
          <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
            {[1, 2, 3].map((i) => (
              <div key={i} className='rounded-lg bg-white p-6 shadow-lg'>
                <p className='mb-4 text-gray-600 italic'>
                  &quot;This service is amazing! So convenient and my clothes
                  came back perfect. Placeholder testimonial {i}.&quot;
                </p>
                <p className='text-sm font-semibold text-gray-900'>User {i}</p>
                <p className='text-xs text-gray-500'>Location {i}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* End Testimonials Placeholder Section */}

      {/* CTA Section */}
      <section className='bg-blue-600 py-12 text-white md:py-20 lg:py-28'>
        <div className='container mx-auto px-4 text-center sm:px-6 lg:px-8'>
          <h2 className='text-3xl font-bold tracking-tight sm:text-4xl'>
            Ready to Transform Your Laundry Experience?
          </h2>
          <p className='mx-auto mt-4 max-w-2xl text-lg text-blue-100'>
            Join thousands of satisfied users and washers in your neighbourhood.
            Start your journey today!
          </p>
          <div className='mt-10 flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4'>
            <Button
              size='lg'
              className='w-full bg-white text-blue-600 hover:bg-blue-50 sm:w-auto'
              asChild
            >
              <Link href='/signup'>Join Neighbourhood Wash &rarr;</Link>
            </Button>
            <Button
              size='lg'
              variant='outline'
              className='w-full border-white text-white hover:border-blue-700 hover:bg-blue-700 sm:w-auto'
              asChild
            >
              <Link href='/our-washers'>Meet Our Washers &rarr;</Link>
            </Button>
          </div>
        </div>
      </section>
      {/* End CTA Section */}
    </>
  )
}
