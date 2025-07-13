import * as React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Users,
  Handshake,
  Smile,
  Search,
  CalendarCheck,
  WashingMachine,
  Briefcase,
  CreditCard,
  Leaf,
  Clock,
  Home as HomeIcon,
  Award,
  PoundSterling,
} from 'lucide-react'

const userSteps = [
  {
    icon: <Search className='h-7 w-7 text-blue-600' />,
    title: '1. Scout Your Local Laundry Legend',
    description:
      'Use our map to find a vetted washer closer than your corner shop. Read their reviews, see their vibe.',
  },
  {
    icon: <CalendarCheck className='h-7 w-7 text-blue-600' />,
    title: '2. Bag a Slot',
    description:
      "Pick a time that suits you. No more waiting for a machine to be free. It's all yours.",
  },
  {
    icon: <Handshake className='h-7 w-7 text-blue-600' />,
    title: '3. The Handoff',
    description:
      "Meet your washer, share the secret PIN, and hand over the goods. It's more secure than a Swiss bank.",
  },
  {
    icon: <WashingMachine className='h-7 w-7 text-blue-600' />,
    title: '4. Put Your Feet Up',
    description:
      "Your washer's on it. They'll wash, dry, and fold with the care of a laundry ninja. Go on, have a cuppa.",
  },
  {
    icon: <Smile className='h-7 w-7 text-blue-600' />,
    title: '5. The Glorious Return',
    description:
      'Collect your impeccably clean, fresh-smelling laundry. The hardest part is putting it away.',
  },
]

const washerSteps = [
  {
    icon: <Briefcase className='h-7 w-7 text-green-600' />,
    title: '1. Plant Your Flag',
    description:
      'Sign up, tell us about your laundry powers, and set your prices. This is your turf now.',
  },
  {
    icon: <Users className='h-7 w-7 text-green-600' />,
    title: '2. Get the Stamp of Approval',
    description:
      "A quick check to prove you're you. It's how we keep things safe and sound for everyone.",
  },
  {
    icon: <CalendarCheck className='h-7 w-7 text-green-600' />,
    title: '3. Let the Bookings Roll In',
    description:
      "Jobs pop up on your dashboard. Grab the ones you want. You're the boss.",
  },
  {
    icon: <WashingMachine className='h-7 w-7 text-green-600' />,
    title: '4. Work Your Magic',
    description:
      'Do what you do best. Turn that mountain of laundry into a neatly folded work of art.',
  },
  {
    icon: <CreditCard className='h-7 w-7 text-green-600' />,
    title: '5. Cha-Ching!',
    description:
      'Money lands in your account after each job. No chasing invoices, no awkward chats. Just pure profit.',
  },
]

const faqItems = [
  {
    value: 'item-1',
    question: 'Are there actually people doing this near me?',
    answer:
      "You'd be surprised! Sign up, pop in your postcode, and discover the laundry heroes living just around the corner. It's like a secret society of clean clothes.",
  },
  {
    value: 'item-2',
    question: "I'm fussy about my fabrics. Can I make demands?",
    answer:
      "Absolutely. You're the customer! Leave specific instructions for your washer during booking. They're pros at handling delicate situations (and delicates).",
  },
  {
    value: 'item-3',
    question: 'Is this all cash-in-hand under the table?',
    answer:
      "Not a chance. Everything's above board. We handle all payments securely through the platform. You pay, they wash, we make sure the money gets to the right place. Simple and safe.",
  },
]

const benefits = [
  {
    icon: <Clock className='h-7 w-7 text-blue-600' />,
    title: 'For the Time-Poor',
    description:
      'Get your laundry done while you do... literally anything else. Reclaim your weekends from the spin cycle.',
    bgColor: 'bg-blue-50',
    iconBgColor: 'bg-blue-100',
  },
  {
    icon: <PoundSterling className='h-7 w-7 text-green-600' />,
    title: 'For the House-Proud',
    description:
      'Your washing machine is a money-making machine. Earn on your schedule, from your own home. Easy peasy.',
    bgColor: 'bg-green-50',
    iconBgColor: 'bg-green-100',
  },
  {
    icon: <Award className='h-7 w-7 text-blue-600' />,
    title: 'Built on Trust',
    description:
      "Everyone's vetted, and PINs keep things secure. It's your neighbours, after all. We just make the introductions.",
    bgColor: 'bg-blue-50',
    iconBgColor: 'bg-blue-100',
  },
  {
    icon: <Briefcase className='h-7 w-7 text-green-600' />,
    title: 'Your Own Small Biz',
    description:
      'No overheads, no commutes. Just you, your washer, and a stream of grateful customers.',
    bgColor: 'bg-green-50',
    iconBgColor: 'bg-green-100',
  },
  {
    icon: <HomeIcon className='h-7 w-7 text-purple-600' />,
    title: 'Properly Local',
    description:
      "Keep money in your community and get to know the folks down the road. It's a win-win.",
    bgColor: 'bg-purple-50',
    iconBgColor: 'bg-purple-100',
  },
  {
    icon: <Leaf className='h-7 w-7 text-teal-600' />,
    title: 'A Greener Spin',
    description:
      "Sharing resources means less energy wasted. You're not just getting clean clothes, you're doing a bit for the planet.",
    bgColor: 'bg-teal-50',
    iconBgColor: 'bg-teal-100',
  },
]

export default function HowItWorksPage() {
  return (
    <div className='bg-gray-50 py-12 md:py-16 lg:py-20'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='mb-12 text-center md:mb-16'>
          <h1 className='text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl'>
            The Not-So-Secret Art of Outsourcing Laundry
          </h1>
          <p className='mx-auto mt-4 max-w-3xl text-lg text-gray-600'>
            It's dead simple. Whether you're ditching the launderette or
            becoming one, here's the drill.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className='grid items-start gap-12 lg:grid-cols-2 lg:gap-16'>
          {/* For Users Section */}
          <div className='space-y-8 rounded-xl bg-white p-8 shadow-xl'>
            <h2 className='mb-8 text-center text-3xl font-semibold text-blue-600'>
              For Laundry Users
            </h2>
            <ol className='space-y-6'>
              {userSteps.map((step, index) => (
                <li key={`user-step-${index}`} className='flex items-start'>
                  <div className='mr-4 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100'>
                    {step.icon}
                  </div>
                  <div>
                    <h3 className='text-lg font-semibold text-gray-800'>
                      {step.title}
                    </h3>
                    <p className='text-gray-600'>{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className='mt-10 text-center'>
              <Button
                asChild
                size='lg'
                className='bg-blue-600 px-8 py-3 text-white hover:bg-blue-700'
              >
                <Link href='/user/dashboard/find-washer'>
                  Find My Laundry Hero
                </Link>
              </Button>
            </div>
          </div>

          {/* For Washers Section */}
          <div className='space-y-8 rounded-xl bg-white p-8 shadow-xl'>
            <h2 className='mb-8 text-center text-3xl font-semibold text-green-600'>
              For Washers
            </h2>
            <ol className='space-y-6'>
              {washerSteps.map((step, index) => (
                <li key={`washer-step-${index}`} className='flex items-start'>
                  <div className='mr-4 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100'>
                    {step.icon}
                  </div>
                  <div>
                    <h3 className='text-lg font-semibold text-gray-800'>
                      {step.title}
                    </h3>
                    <p className='text-gray-600'>{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className='mt-10 text-center'>
              <Button
                asChild
                size='lg'
                className='bg-green-600 px-8 py-3 text-white hover:bg-green-700'
              >
                <Link href='/user/dashboard/become-washer'>
                  Start Earning Now
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Visual Process Flow Placeholder */}
        <section className='mt-20 rounded-xl bg-white py-16 shadow-xl'>
          <div className='mb-12 text-center'>
            <h2 className='text-3xl font-semibold text-gray-800'>
              Our Simple Process
            </h2>
          </div>
          <div className='flex flex-col items-center justify-around space-y-8 px-4 text-gray-700 md:flex-row md:space-y-0 md:space-x-4'>
            {[
              {
                icon: <Search className='h-12 w-12 text-blue-500' />,
                label: '1. User Books a Pro',
                description: 'Finds a local hero and books a slot.',
              },
              {
                icon: <Handshake className='h-12 w-12 text-blue-500' />,
                label: '2. Secure PIN Handoff',
                description: 'User and Washer exchange PINs for drop-off.',
              },
              {
                icon: <WashingMachine className='h-12 w-12 text-blue-500' />,
                label: '3. Washer Works Magic',
                description: 'The laundry gets the five-star treatment.',
              },
              {
                icon: <Smile className='h-12 w-12 text-green-500' />,
                label: '4. Fresh Laundry, Happy User',
                description: 'User picks up, feeling fresh and free.',
              },
            ].map((item, index, arr) => (
              <React.Fragment key={item.label}>
                <div className='flex max-w-xs flex-col items-center text-center'>
                  <div className='mb-3 rounded-full bg-gray-100 p-3'>
                    {item.icon}
                  </div>
                  <h3 className='mb-1 font-semibold'>{item.label}</h3>
                  <p className='text-sm text-gray-600'>{item.description}</p>
                </div>
                {index < arr.length - 1 && (
                  <div className='mx-4 hidden text-3xl text-gray-300 md:block'>
                    &rarr;
                  </div>
                )}
                {index < arr.length - 1 && (
                  <div className='my-4 text-3xl text-gray-300 md:hidden'>
                    &darr;
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </section>

        {/* Benefits Section */}
        <section className='mt-20 rounded-xl bg-white py-16 shadow-xl'>
          <div className='mb-12 text-center'>
            <h2 className='text-3xl font-semibold text-gray-800'>
              The Perks of the Platform
            </h2>
            <p className='mx-auto mt-3 max-w-2xl text-gray-600'>
              It's not just about clean clothes. It's about building a better
              neighbourhood, one load at a time.
            </p>
          </div>
          <div className='grid gap-8 px-4 md:grid-cols-2 lg:grid-cols-3'>
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className={`rounded-lg p-6 shadow-md ${benefit.bgColor}`}
              >
                <div
                  className={`h-12 w-12 flex-shrink-0 rounded-full ${benefit.iconBgColor} mb-4 flex items-center justify-center`}
                >
                  {benefit.icon}
                </div>
                <h3 className='mb-2 text-xl font-semibold text-gray-800'>
                  {benefit.title}
                </h3>
                <p className='text-gray-600'>{benefit.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className='mt-20 rounded-xl bg-gray-50 py-16 shadow-xl'>
          <div className='mb-12 text-center'>
            <h2 className='text-3xl font-semibold text-gray-800'>
              Quick-Fire Questions
            </h2>
            <p className='mx-auto mt-3 max-w-2xl text-gray-600'>
              Just the essentials. For the full works,{' '}
              <Link
                href='/faqs'
                className='font-semibold text-blue-600 hover:underline'
              >
                check out our main FAQ page
              </Link>
              .
            </p>
          </div>
          <div className='mx-auto max-w-3xl px-4'>
            <Accordion type='single' collapsible className='w-full'>
              {faqItems.map((faq) => (
                <AccordionItem value={faq.value} key={faq.value}>
                  <AccordionTrigger className='text-left text-lg hover:no-underline'>
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className='text-base leading-relaxed text-gray-700'>
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      </div>
    </div>
  )
}
