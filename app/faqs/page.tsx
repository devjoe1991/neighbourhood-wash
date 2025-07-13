import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  MailIcon,
  SearchIcon,
  LifeBuoyIcon,
  ShieldCheckIcon,
} from 'lucide-react'

const generalFaqs = [
  {
    q: "So, what's the big idea here?",
    a: "Simple. We connect people who hate doing laundry with their neighbours who don't. It's a hyper-local marketplace for getting your clothes washed, by real people, in your community.",
  },
  {
    q: "Alright, I'm intrigued. How do I jump in?",
    a: "Easy. Sign up as a User to find someone to do your laundry, or apply to be a Washer to start making a bit of cash. Have a poke around the 'How It Works' page if you want the full scoop.",
  },
  {
    q: 'Is this a London-only thing or can my nan in Scunthorpe join?',
    a: "We're spreading like a good bit of gossip! The best way to know is to sign up and pop in your postcode. If we're not there yet, we will be soon. Tell your nan to get ready.",
  },
]

const userFaqs = [
  {
    q: 'How do I actually get someone to wash my pants?',
    a: "Once you've signed up and found a Washer you fancy, you can select their available time slots, choose your service preferences (we all have them), and confirm your booking. You'll receive a confirmation and a PIN for drop-off.",
  },
  {
    q: "I'm allergic to everything and only use unicorn-tear detergent. Help?",
    a: "We've got you. There's a spot in the booking form to list all your specific needs. Our Washers are a resourceful bunch and will do their best to cater to your every whim.",
  },
  {
    q: 'How do you take my money?',
    a: 'Securely and digitally. You pay via the platform when you book. We hold it safely and only release it to the Washer after the service is completed successfully. No dodgy cash exchanges here.',
  },
]

const washerFaqs = [
  {
    q: 'How do I start earning money from my washing machine?',
    a: 'You can apply to become a Washer through our platform. We have a vetting process to ensure safety and quality. Once approved, you can set up your profile, availability, and services.',
  },
  {
    q: "Is it worth my time to wash other people's clothes?",
    a: "That depends. Do you like making money from home on your own schedule? Do you enjoy being a local legend? If yes, then it's definitely worth it.",
  },
  {
    q: 'Do I have to buy all the fancy detergents?',
    a: "It's your business, you set the rules. Most Washers use their own preferred detergents and factor that into their price. You can also give users the option to supply their own. Be upfront about it on your profile.",
  },
]

const securityFaqs = [
  {
    q: 'Are you going to sell my data to the highest bidder?',
    a: "Absolutely not. Your privacy is paramount. We use top-notch encryption and follow data protection laws to the letter. We're in the laundry business, not the data business. Check our Privacy Policy if you want the nitty-gritty.",
  },
  {
    q: "What's all this PIN code business about?",
    a: "It's our digital handshake. A unique PIN for drop-off and another for pick-up ensures your laundry is only handed between you and your chosen Washer. It's a simple, secure way to create a chain of trust.",
  },
]

export default function FAQsPage() {
  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Hero Section for FAQs */}
      <section className='bg-gradient-to-r from-indigo-600 to-purple-600 py-16 text-white md:py-24'>
        <div className='container mx-auto px-4 text-center sm:px-6 lg:px-8'>
          <LifeBuoyIcon className='mx-auto mb-6 h-20 w-20 text-purple-300' />
          <h1 className='text-4xl font-bold tracking-tight sm:text-5xl'>
            Everything You Were Too Afraid to Ask About Laundry
          </h1>
          <p className='mx-auto mt-6 max-w-2xl text-lg text-indigo-100'>
            We've heard it all. From the serious to the silly, here are the
            answers you're looking for. If it's not here, our support team is
            ready for you.
          </p>
          {/* Placeholder for Search Bar */}
          <div className='mx-auto mt-8 max-w-md'>
            <div className='relative'>
              <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
                <SearchIcon
                  className='h-5 w-5 text-gray-400'
                  aria-hidden='true'
                />
              </div>
              <input
                id='search-faq'
                name='search-faq'
                className='bg-opacity-20 focus:bg-opacity-30 block w-full rounded-md border border-transparent bg-white py-2.5 pr-3 pl-10 leading-5 text-purple-100 placeholder-purple-200 transition focus:border-white focus:text-white focus:ring-white focus:outline-none sm:text-sm'
                placeholder='Got a question? (Search is warming up)'
                type='search'
                disabled
              />
            </div>
          </div>
        </div>
      </section>

      {/* FAQs Accordion Section */}
      <section className='py-16 md:py-20'>
        <div className='container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8'>
          <h2 className='mb-12 text-center text-3xl font-bold text-gray-900'>
            Explore by Category
          </h2>

          <div className='space-y-10'>
            {/* General FAQs */}
            <div>
              <h3 className='mb-4 text-xl font-semibold text-gray-800 md:text-2xl'>
                The Basics: What's All This Then?
              </h3>
              <Accordion type='single' collapsible className='w-full space-y-3'>
                {generalFaqs.map((faq, index) => (
                  <AccordionItem
                    value={`general-${index}`}
                    key={`general-${index}`}
                    className='overflow-hidden rounded-lg border bg-white shadow-sm'
                  >
                    <AccordionTrigger className='p-4 text-left font-bold text-gray-900 hover:bg-gray-50 hover:no-underline sm:p-6'>
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className='px-4 pb-4 text-gray-700 sm:px-6 sm:pb-6'>
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            {/* User FAQs */}
            <div>
              <h3 className='mb-4 text-xl font-semibold text-gray-800 md:text-2xl'>
                For Those Who Need a Wash
              </h3>
              <Accordion type='single' collapsible className='w-full space-y-3'>
                {userFaqs.map((faq, index) => (
                  <AccordionItem
                    value={`user-${index}`}
                    key={`user-${index}`}
                    className='overflow-hidden rounded-lg border bg-white shadow-sm'
                  >
                    <AccordionTrigger className='p-4 text-left font-bold text-gray-900 hover:bg-gray-50 hover:no-underline sm:p-6'>
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className='px-4 pb-4 text-gray-700 sm:px-6 sm:pb-6'>
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            {/* Washer FAQs */}
            <div>
              <h3 className='mb-4 text-xl font-semibold text-gray-800 md:text-2xl'>
                For Those Who Provide the Wash
              </h3>
              <Accordion type='single' collapsible className='w-full space-y-3'>
                {washerFaqs.map((faq, index) => (
                  <AccordionItem
                    value={`washer-${index}`}
                    key={`washer-${index}`}
                    className='overflow-hidden rounded-lg border bg-white shadow-sm'
                  >
                    <AccordionTrigger className='p-4 text-left font-bold text-gray-900 hover:bg-gray-50 hover:no-underline sm:p-6'>
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className='px-4 pb-4 text-gray-700 sm:px-6 sm:pb-6'>
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            {/* Security FAQs */}
            <div>
              <h3 className='mb-4 flex items-center text-xl font-semibold text-gray-800 md:text-2xl'>
                <ShieldCheckIcon className='mr-3 h-7 w-7 text-green-600' />
                The Serious Bit: Trust & Safety
              </h3>
              <Accordion type='single' collapsible className='w-full space-y-3'>
                {securityFaqs.map((faq, index) => (
                  <AccordionItem
                    value={`security-${index}`}
                    key={`security-${index}`}
                    className='overflow-hidden rounded-lg border bg-white shadow-sm'
                  >
                    <AccordionTrigger className='p-4 text-left font-bold text-gray-900 hover:bg-gray-50 hover:no-underline sm:p-6'>
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className='px-4 pb-4 text-gray-700 sm:px-6 sm:pb-6'>
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className='bg-gray-100 py-16 md:py-20'>
        <div className='container mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8'>
          <MailIcon className='mx-auto mb-6 h-16 w-16 text-blue-500' />
          <h2 className='text-2xl font-bold text-gray-900 sm:text-3xl'>
            Still in a Spin?
          </h2>
          <p className='mt-4 text-base text-gray-600 sm:text-lg'>
            If you couldn't find the answer you were looking for in our FAQs,
            please don't hesitate to reach out to our support team.
          </p>
          <div className='mt-8'>
            <Button
              size='lg'
              className='bg-blue-600 text-white hover:bg-blue-700'
              asChild
            >
              <Link href='mailto:support@neighbourhoodwash.com'>
                <MailIcon className='mr-2 h-5 w-5' /> Contact Support
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
