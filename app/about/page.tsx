import Link from 'next/link'
// import Image from 'next/image'; // Removed unused import
import { Button } from '@/components/ui/button'
import {
  HeartIcon,
  UsersIcon,
  LightBulbIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline' // Using outline icons for a slightly softer feel

const values = [
  {
    icon: HeartIcon,
    name: 'Community First',
    description:
      'We believe in the power of local connections and strive to foster a supportive network of neighbours helping neighbours.',
  },
  {
    icon: LightBulbIcon,
    name: 'Simplicity & Convenience',
    description:
      'Our goal is to make laundry hassle-free, providing an easy-to-use platform that saves you time and effort.',
  },
  {
    icon: UsersIcon,
    name: 'Trust & Safety',
    description:
      'We are committed to creating a secure and reliable environment for everyone through careful vetting and transparent processes.',
  },
  {
    icon: BuildingStorefrontIcon, // Placeholder for an eco/sustainability icon if available
    name: 'Sustainable Living',
    description:
      'By utilizing existing resources within the community, we aim to promote more eco-friendly laundry practices.',
  },
]

export default function AboutUsPage() {
  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Hero Section */}
      <section className='bg-gradient-to-r from-sky-600 to-cyan-500 py-16 text-white md:py-24'>
        <div className='container mx-auto px-4 text-center sm:px-6 lg:px-8'>
          <UsersIcon className='mx-auto mb-6 h-20 w-20 text-cyan-300' />
          <h1 className='text-4xl font-bold tracking-tight sm:text-5xl'>
            About Neighbourhood Wash
          </h1>
          <p className='mx-auto mt-6 max-w-3xl text-lg text-sky-100'>
            Connecting communities, one load at a time. Discover our story, our
            values, and the people dedicated to making laundry simpler and more
            neighbourly.
          </p>
        </div>
      </section>

      {/* Our Story Section */}
      <section className='py-16 md:py-20'>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='grid items-center gap-12 md:grid-cols-1'>
            <div>
              <h2 className='mb-4 text-3xl font-bold text-gray-900'>
                Our Story: More Than Just Laundry
              </h2>
              <p className='mb-4 text-lg text-gray-700'>
                Neighbourhood Wash was born from a simple idea: what if we could
                make laundry less of a chore and more of a community-building
                opportunity? In today&apos;s fast-paced world, time is precious,
                and local connections matter more than ever.
              </p>
              <p className='mb-4 text-gray-600'>
                We envisioned a platform where people could easily find trusted
                neighbours to help with their laundry, and where individuals
                with underused washing machines could earn a little extra by
                offering a valuable service. It&apos;s about sharing resources,
                supporting local economies, and fostering a sense of belonging
                right in your own neighbourhood.
              </p>
              <p className='text-gray-600'>
                From busy professionals and families to students and anyone
                looking for a convenient laundry solution, Neighbourhood Wash
                aims to lighten your load and strengthen community ties.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className='bg-white py-16 md:py-20'>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
          <h2 className='mb-12 text-center text-3xl font-bold text-gray-900'>
            Our Core Values
          </h2>
          <div className='grid gap-8 sm:grid-cols-2 lg:grid-cols-4'>
            {values.map((value) => (
              <div
                key={value.name}
                className='rounded-lg border border-gray-200 p-6 text-center transition-shadow hover:shadow-xl'
              >
                <value.icon className='mx-auto mb-4 h-12 w-12 text-blue-600' />
                <h3 className='mb-2 text-xl font-semibold text-gray-800'>
                  {value.name}
                </h3>
                <p className='text-sm text-gray-600'>{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Join Our Community Section */}
      <section className='bg-blue-600 py-16 text-white md:py-24'>
        <div className='container mx-auto px-4 text-center sm:px-6 lg:px-8'>
          <h2 className='mb-6 text-3xl font-bold'>
            Join the Neighbourhood Wash Movement!
          </h2>
          <p className='mx-auto mb-8 max-w-2xl text-lg text-blue-100'>
            Whether you need a helping hand with your laundry or you&apos;re
            looking to offer your services and earn, become a part of our
            growing community today.
          </p>
          <div className='flex flex-col items-center justify-center gap-4 sm:flex-row'>
            <Button
              size='lg'
              className='w-full bg-white text-blue-600 hover:bg-blue-50 sm:w-auto'
              asChild
            >
              <Link href='/join'>Become a Washer</Link>
            </Button>
            <Button
              size='lg'
              variant='outline'
              className='w-full border-white text-white hover:bg-white hover:text-blue-700 sm:w-auto'
              asChild
            >
              <Link href='/how-it-works'>Find a Laundry Service</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
