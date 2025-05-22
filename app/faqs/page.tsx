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
} from 'lucide-react' // Using lucide-react for consistency

const generalFaqs = [
  {
    q: 'What is Neighbourhood Wash?',
    a: 'Neighbourhood Wash is a community marketplace that connects people who need laundry services with local individuals (Washers) who offer their washing machines and time to do laundry for others.',
  },
  {
    q: 'How do I get started?',
    a: 'Simply sign up as a User to find a Washer, or apply to become a Washer to start earning. Browse through our platform and check out the How It Works page for more details.',
  },
  {
    q: 'Is Neighbourhood Wash available in my area?',
    a: 'We are expanding rapidly! Currently, you can check available service areas during the sign-up process or by searching for Washers near your location. We aim to cover more neighbourhoods soon.',
  },
]

const userFaqs = [
  {
    q: 'How do I book a laundry service?',
    a: 'Once you&apos;ve signed up and found a Washer you like, you can select their available time slots, choose your service preferences (detergents, fabric softeners, etc.), and confirm your booking. You&apos;ll receive a confirmation and a PIN for drop-off.',
  },
  {
    q: 'What if I have allergies or specific detergent preferences?',
    a: 'You can specify your preferences, including allergies and detergent choices, when making a booking. Washers will do their best to accommodate your requests.',
  },
  {
    q: 'How is payment handled?',
    a: 'Payments are handled securely through our platform. You&apos;ll pay when you book the service, and the Washer receives their payment after the service is completed successfully.',
  },
]

const washerFaqs = [
  {
    q: 'How do I become a Washer?',
    a: 'You can apply to become a Washer through our platform. We have a vetting process to ensure safety and quality. Once approved, you can set up your profile, availability, and services.',
  },
  {
    q: 'What are the benefits of being a Washer?',
    a: 'Being a Washer allows you to earn extra income flexibly, help your local community, and work from home. We provide support and tools to manage your bookings and earnings.',
  },
  {
    q: 'Do I need to provide my own laundry supplies?',
    a: 'Typically, Washers use their own preferred detergents and supplies. However, you can also offer options or allow users to provide their own. This can be specified in your service offerings.',
  },
]

const securityFaqs = [
  {
    q: 'How is my personal information protected?',
    a: 'We take your privacy and security very seriously. All personal data is encrypted, and we follow strict data protection policies. Please refer to our Privacy Policy for detailed information.',
  },
  {
    q: 'What is the PIN verification system?',
    a: 'For every booking, unique PINs are generated for drop-off and pick-up. This ensures that laundry is securely exchanged between the correct User and Washer, creating a verified chain of custody.',
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
            Frequently Asked Questions
          </h1>
          <p className='mx-auto mt-6 max-w-2xl text-lg text-indigo-100'>
            Find answers to common questions about Neighbourhood Wash. If you
            can&apos;t find what you&apos;re looking for, feel free to contact
            us.
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
                placeholder='Search FAQs (Coming Soon)'
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
          <h2 className='mb-10 text-center text-3xl font-bold text-gray-900'>
            Explore by Category
          </h2>

          <Accordion type='single' collapsible className='w-full space-y-6'>
            {/* General FAQs */}
            <AccordionItem value='general'>
              <AccordionTrigger className='rounded-lg bg-white p-6 text-xl font-semibold shadow-md hover:no-underline data-[state=open]:rounded-b-none data-[state=open]:shadow-lg'>
                General Questions
              </AccordionTrigger>
              <AccordionContent className='rounded-b-lg bg-white p-6 pt-0 shadow-md'>
                <div className='space-y-4'>
                  {generalFaqs.map((faq, index) => (
                    <div key={`general-${index}`}>
                      <h4 className='text-md font-semibold text-gray-800'>
                        {faq.q}
                      </h4>
                      <p className='mt-1 text-sm text-gray-600'>{faq.a}</p>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* User FAQs */}
            <AccordionItem value='user'>
              <AccordionTrigger className='rounded-lg bg-white p-6 text-xl font-semibold shadow-md hover:no-underline data-[state=open]:rounded-b-none data-[state=open]:shadow-lg'>
                For Users
              </AccordionTrigger>
              <AccordionContent className='rounded-b-lg bg-white p-6 pt-0 shadow-md'>
                <div className='space-y-4'>
                  {userFaqs.map((faq, index) => {
                    return (
                      <div key={`user-faq-${index}`}>
                        <h4 className='text-md font-semibold text-gray-800'>
                          {faq.q}
                        </h4>
                        <p className='mt-1 text-sm text-gray-600'>{faq.a}</p>
                      </div>
                    )
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Washer FAQs */}
            <AccordionItem value='washer'>
              <AccordionTrigger className='rounded-lg bg-white p-6 text-xl font-semibold shadow-md hover:no-underline data-[state=open]:rounded-b-none data-[state=open]:shadow-lg'>
                For Washers
              </AccordionTrigger>
              <AccordionContent className='rounded-b-lg bg-white p-6 pt-0 shadow-md'>
                <div className='space-y-4'>
                  {washerFaqs.map((faq, index) => (
                    <div key={`washer-${index}`}>
                      <h4 className='text-md font-semibold text-gray-800'>
                        {faq.q}
                      </h4>
                      <p className='mt-1 text-sm text-gray-600'>{faq.a}</p>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Security FAQs */}
            <AccordionItem value='security'>
              <AccordionTrigger className='rounded-lg bg-white p-6 text-xl font-semibold shadow-md hover:no-underline data-[state=open]:rounded-b-none data-[state=open]:shadow-lg'>
                <div className='flex items-center'>
                  <ShieldCheckIcon className='mr-3 h-6 w-6 text-green-600' />
                  Privacy & Security
                </div>
              </AccordionTrigger>
              <AccordionContent className='rounded-b-lg bg-white p-6 pt-0 shadow-md'>
                <div className='space-y-4'>
                  {securityFaqs.map((faq, index) => (
                    <div key={`security-${index}`}>
                      <h4 className='text-md font-semibold text-gray-800'>
                        {faq.q}
                      </h4>
                      <p className='mt-1 text-sm text-gray-600'>{faq.a}</p>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Contact Section */}
      <section className='bg-gray-100 py-16 md:py-20'>
        <div className='container mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8'>
          <MailIcon className='mx-auto mb-6 h-16 w-16 text-blue-500' />
          <h2 className='text-3xl font-bold text-gray-900'>
            Still Have Questions?
          </h2>
          <p className='mt-4 text-lg text-gray-600'>
            If you couldn&apos;t find the answer you were looking for in our
            FAQs, please don&apos;t hesitate to reach out to our support team.
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
            {/* Placeholder for a link to a more comprehensive contact page/form */}
            {/* <p className="mt-4 text-sm text-gray-500">Or visit our <Link href="/contact" className="text-blue-600 hover:underline">Contact Page</Link> for more options.</p> */}
          </div>
        </div>
      </section>
    </div>
  )
}
