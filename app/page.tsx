import Link from 'next/link'

export default function Home() {
  return (
    <main className='bg-background flex min-h-screen flex-col items-center justify-center p-24'>
      <h1 className='text-primary mb-6 text-4xl font-bold'>
        Neighbourhood Wash
      </h1>
      <p className='text-text mb-10 text-xl'>
        Community-based laundry services marketplace
      </p>
      <div className='flex gap-4'>
        <Link
          href='/register'
          className='bg-primary hover:bg-primary-dark rounded-md px-6 py-2 text-white'
        >
          Get Started
        </Link>
        <Link
          href='/how-it-works'
          className='border-primary text-primary hover:bg-primary-light rounded-md border px-6 py-2 hover:text-white'
        >
          Learn More
        </Link>
      </div>
    </main>
  )
}
