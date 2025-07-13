import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  CurrencyPoundIcon,
  SparklesIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/solid'
import { RocketLaunchIcon } from '@heroicons/react/24/outline'

// Re-using the featured washers data
const featuredWashers = [
  {
    name: 'Sarah M.',
    location: 'Camden',
    story:
      'Sarah turned her meticulous laundry skills into a thriving local business, helping dozens of families weekly.',
  },
  {
    name: 'David K.',
    location: 'Kensington',
    story:
      'A former hospitality worker, David brings professionalism and efficiency to every wash.',
  },
  {
    name: 'Chloe R.',
    location: 'Islington',
    story:
      'Chloe offers a gentle touch for sensitive items and has become a go-to for new parents.',
  },
]

// --- NEW PAGE STRUCTURE ---

export default function OurWashersPage() {
  return (
    <div className='bg-gray-50 dark:bg-gray-900'>
      {/* 1. New Hero Section */}
      <section className='bg-gradient-to-br from-blue-600 to-indigo-700 py-20 text-white'>
        <div className='container mx-auto px-4 text-center'>
          <h1 className='text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl'>
            Your Laundry Room is Now Open for Business.
          </h1>
          <p className='mx-auto mt-6 max-w-3xl text-lg text-blue-100'>
            Join a community of local pioneers turning their washing machines
            into a source of income, and help your neighbours ditch the
            laundromat for good.
          </p>
          <div className='mt-8'>
            <Button
              asChild
              size='lg'
              className='rounded-full bg-white px-8 py-4 font-bold text-blue-600 shadow-lg transition-transform hover:scale-105'
            >
              <Link href='/user/dashboard/become-washer'>
                Start Your Application
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 2. "Why Join the Revolution?" Section */}
      <section className='py-16 md:py-20'>
        <div className='container mx-auto px-4'>
          <div className='mb-12 text-center'>
            <h2 className='text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white'>
              Ditch the Boss, Not the Boxer Shorts.
            </h2>
            <p className='mx-auto mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-300'>
              Becoming a Neighbourhood Washer means you call the shots. Finally.
            </p>
          </div>
          <div className='grid grid-cols-1 gap-8 md:grid-cols-3'>
            <BenefitCard
              icon={<CurrencyPoundIcon className='h-10 w-10 text-white' />}
              title='Coin-Operated Dreams'
              description="That washing machine you're not using? It's a cash machine waiting to happen. Earn real money on your own terms."
            />
            <BenefitCard
              icon={<RocketLaunchIcon className='h-10 w-10 text-white' />}
              title='Work When You Want'
              description="Forget 9-to-5. Accept jobs when you're free. The only boss you answer to is the spin cycle."
            />
            <BenefitCard
              icon={<SparklesIcon className='h-10 w-10 text-white' />}
              title='Local Hero Status'
              description='Become the go-to laundry guru for your neighbours. Earn their gratitude (and their cash).'
            />
          </div>
        </div>
      </section>

      {/* 3. Onboarding Mission Section */}
      <section className='bg-white py-16 md:py-20 dark:bg-gray-800'>
        <div className='container mx-auto px-4'>
          <div className='mb-12 text-center'>
            <h2 className='text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white'>
              Your Mission, Should You Choose to Accept It...
            </h2>
            <p className='mx-auto mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-300'>
              Alright, before you hand in your notice, there's a small but vital
              onboarding process. It's how we keep the community safe and set
              you up for success.
            </p>
          </div>
          <div className='relative mx-auto max-w-2xl'>
            <div className='absolute top-0 left-1/2 h-full w-0.5 -translate-x-1/2 bg-gray-200 dark:bg-gray-700' />
            <div className='relative space-y-12'>
              <OnboardingStep
                step='1'
                title='Express Your Interest'
                description="Fill out our simple sign-up form. It's quick, painless, and the first step to becoming your own boss."
                isLeft={true}
              />
              <OnboardingStep
                step='2'
                title='Complete Verification'
                description="We'll guide you through our secure identity and address verification. A crucial step for a trusted community."
                isLeft={false}
              />
              <OnboardingStep
                step='3'
                title='Set Up Your Profile'
                description='This is where you shine. Add your services, set your schedule, and connect your bank account for payouts.'
                isLeft={true}
              />
              <OnboardingStep
                step='4'
                title='Go Live & Earn!'
                description="Once approved, you're live! Start accepting jobs from the Bookings Bucket and watch the earnings roll in."
                isLeft={false}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4. FAQ Section */}
      <section className='py-16 md:py-20'>
        <div className='container mx-auto max-w-4xl px-4'>
          <div className='mb-12 text-center'>
            <QuestionMarkCircleIcon className='mx-auto h-12 w-12 text-blue-600' />
            <h2 className='mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white'>
              The Nitty-Gritty
            </h2>
            <p className='mx-auto mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-300'>
              Your burning questions, answered with refreshing honesty.
            </p>
          </div>
          <Accordion type='single' collapsible className='w-full'>
            <FaqItem
              question='How much can I actually earn?'
              answer="Look, we're not going to promise you a private island. But you're sitting on an appliance that could be paying for your next holiday, your bills, or just your weekly takeaway. It's simple: more loads, more dosh."
            />
            <FaqItem
              question='How do I get bookings?'
              answer="Magic, mostly. Our users book and pay, and the job lands in our 'Bookings Bucket'. It's first-come, first-served. As we grow, jobs get closer to your doorstep. You just need to be quick on the draw."
            />
            <FaqItem
              question='What about... awkward laundry?'
              answer="We get it. Underwear is weird. That's why we have a strict hygiene policy for everyone. Plus, once you accept a job, you can use our live chat to break the ice and confirm any special instructions directly with the user. No surprises."
            />
          </Accordion>
        </div>
      </section>

      {/* 5. Trust & Safety Pledge (Kept from original) */}
      <section className='bg-white py-16 md:py-20 dark:bg-gray-800'>
        <div className='container mx-auto px-4'>
          <div className='mb-12 text-center'>
            <ShieldCheckIcon className='mx-auto h-12 w-12 text-green-600' />
            <h2 className='text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white'>
              Our Trust & Safety Pledge
            </h2>
            <p className='mx-auto mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-300'>
              This isn't the wild west of washing. We take the safety and trust
              of our community seriously.
            </p>
          </div>
          <div className='grid grid-cols-1 gap-8 text-center md:grid-cols-3'>
            <PledgeCard
              title='Identity Verification'
              description="We confirm everyone's identity, so you know who you're dealing with. No anonymous sock-sorters here."
            />
            <PledgeCard
              title='Profile Reviews'
              description='Our team personally reviews every profile. We’re building a community of pros, not just people with washing machines.'
            />
            <PledgeCard
              title='Community Ratings'
              description='A transparent rating system keeps everyone honest and the quality high. Great service gets rewarded.'
            />
          </div>
        </div>
      </section>

      {/* 6. Featured Washers Section (Rebranded) */}
      <section className='py-16 md:py-20'>
        <div className='container mx-auto px-4'>
          <div className='mb-12 text-center'>
            <UserGroupIcon className='mx-auto h-12 w-12 text-purple-600' />
            <h2 className='text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white'>
              Faces of the Revolution
            </h2>
            <p className='mx-auto mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-300'>
              Meet some of the trailblazers already earning in your area.
            </p>
          </div>
          <div className='grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3'>
            {featuredWashers.map((washer) => (
              <FeaturedWasherCard key={washer.name} {...washer} />
            ))}
          </div>
        </div>
      </section>

      {/* 7. Final CTA */}
      <section className='bg-gray-800 py-20'>
        <div className='container mx-auto px-4 text-center'>
          <h2 className='text-3xl font-bold text-white sm:text-4xl'>
            Ready to Join the Spin Cycle?
          </h2>
          <p className='mx-auto mt-4 max-w-2xl text-lg text-gray-300'>
            Your washing machine is waiting. Your community is waiting. What are
            you waiting for?
          </p>
          <div className='mt-8'>
            <Button
              asChild
              size='lg'
              className='rounded-full bg-blue-500 px-8 py-4 font-bold text-white shadow-lg transition-transform hover:scale-105 hover:bg-blue-600'
            >
              <Link href='/user/dashboard/become-washer'>
                I'm In, Let's Do This
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

// --- HELPER COMPONENTS ---

const BenefitCard = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) => (
  <div className='rounded-lg bg-white p-6 text-center shadow-lg transition-shadow hover:shadow-xl dark:bg-gray-800'>
    <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600'>
      {icon}
    </div>
    <h3 className='mb-2 text-xl font-semibold text-gray-900 dark:text-white'>
      {title}
    </h3>
    <p className='text-gray-600 dark:text-gray-300'>{description}</p>
  </div>
)

const FaqItem = ({
  question,
  answer,
}: {
  question: string
  answer: string
}) => (
  <AccordionItem
    value={question}
    className='border-b border-gray-200 py-2 dark:border-gray-700'
  >
    <AccordionTrigger className='py-4 text-left text-lg font-medium text-gray-800 hover:no-underline dark:text-gray-100'>
      {question}
    </AccordionTrigger>
    <AccordionContent className='pt-2 text-base text-gray-600 dark:text-gray-300'>
      {answer}
    </AccordionContent>
  </AccordionItem>
)

const PledgeCard = ({
  title,
  description,
}: {
  title: string
  description: string
}) => (
  <div className='rounded-lg bg-white p-6 shadow-md dark:bg-gray-700'>
    <h3 className='mb-2 text-xl font-semibold text-gray-800 dark:text-white'>
      {title}
    </h3>
    <p className='text-sm text-gray-600 dark:text-gray-400'>{description}</p>
  </div>
)

const OnboardingStep = ({
  step,
  title,
  description,
  isLeft,
}: {
  step: string
  title: string
  description: string
  isLeft: boolean
}) => (
  <div
    className={`relative flex items-center ${
      isLeft ? 'justify-start' : 'justify-end'
    }`}
  >
    <div className={`w-1/2 ${isLeft ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
      <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'>
        <div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-bold text-white'>
          {step}
        </div>
      </div>
      <div className='rounded-lg bg-gray-100 p-4 shadow-md dark:bg-gray-700'>
        <h3 className='text-lg font-bold text-gray-900 dark:text-white'>
          {title}
        </h3>
        <p className='mt-1 text-sm text-gray-600 dark:text-gray-300'>
          {description}
        </p>
      </div>
    </div>
  </div>
)

const FeaturedWasherCard = ({
  name,
  location,
  story,
}: {
  name: string
  location: string
  story: string
}) => (
  <div className='group overflow-hidden rounded-lg bg-white p-6 shadow-lg transition-shadow hover:shadow-xl dark:bg-gray-800'>
    <h3 className='text-xl font-bold text-gray-900 dark:text-white'>{name}</h3>
    <p className='text-sm text-blue-600 dark:text-blue-400'>{location}</p>
    <p className='mt-2 text-sm text-gray-600 dark:text-gray-300'>{story}</p>
  </div>
)
