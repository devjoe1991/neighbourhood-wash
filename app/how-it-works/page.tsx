import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CheckCircle, Users, Zap, Handshake, MessageSquare, Smile, Search, CalendarCheck, WashingMachine, Briefcase, CreditCard, Leaf, Clock, Home as HomeIcon, Award, PoundSterling } from 'lucide-react'; // Changed DollarSignIcon to PoundSterling

const userSteps = [
  {
    icon: <Search className="w-7 h-7 text-blue-600" />,
    title: '1. Find a Local Washer',
    description: 'Browse profiles of trusted washers in your neighbourhood. Check their services, prices, and reviews.',
  },
  {
    icon: <CalendarCheck className="w-7 h-7 text-blue-600" />,
    title: '2. Book a Convenient Time',
    description: 'Select a date and time slot that works for you. Confirm your booking instantly.',
  },
  {
    icon: <Handshake className="w-7 h-7 text-blue-600" />,
    title: '3. Drop Off Your Laundry',
    description: 'Coordinate with your washer for a smooth drop-off. Use our secure PIN system for handovers.',
  },
  {
    icon: <WashingMachine className="w-7 h-7 text-blue-600" />,
    title: '4. Relax While We Wash',
    description: 'Your washer will take care of your laundry according to your preferences. Get updates if needed.',
  },
  {
    icon: <Smile className="w-7 h-7 text-blue-600" />,
    title: '5. Pick Up Fresh Laundry!',
    description: 'Collect your freshly cleaned and folded laundry. Enjoy more free time!',
  },
];

const washerSteps = [
  {
    icon: <Briefcase className="w-7 h-7 text-green-600" />,
    title: '1. Create Your Washer Profile',
    description: 'Sign up and showcase your laundry services, equipment, and availability. Set your own prices.',
  },
  {
    icon: <Users className="w-7 h-7 text-green-600" />,
    title: '2. Get Verified & Build Trust',
    description: 'Complete our verification process to become a trusted Neighbourhood Washer.',
  },
  {
    icon: <CalendarCheck className="w-7 h-7 text-green-600" />,
    title: '3. Receive Booking Requests',
    description: 'Get notified when users book your services. Manage your schedule easily through the dashboard.',
  },
  {
    icon: <WashingMachine className="w-7 h-7 text-green-600" />,
    title: '4. Provide Excellent Service',
    description: 'Wash, dry, and fold laundry with care. Communicate with users for any special instructions.',
  },
  {
    icon: <CreditCard className="w-7 h-7 text-green-600" />,
    title: '5. Get Paid Securely',
    description: 'Receive your earnings directly through our secure payment system after completing a job.',
  },
];

const faqItems = [
  {
    value: "item-1",
    question: "How do I find a washer in my area?",
    answer: "Once you sign up, you can use our search and filter functions to find available washers near your location. You'll see their profiles, services offered, pricing, and reviews from other users."
  },
  {
    value: "item-2",
    question: "What if I have specific detergent preferences or allergies?",
    answer: "During the booking process, there's a section where you can add special instructions for your washer. You can specify any detergent preferences, allergies, or particular ways you'd like your laundry handled."
  },
  {
    value: "item-3",
    question: "How does payment work?",
    answer: "Payments are handled securely through our platform. You'll add your payment method when booking, and the washer is paid automatically after the service is completed and confirmed. Washers receive their earnings through Stripe Connect."
  },
  {
    value: "item-4",
    question: "Is there a cancellation policy?",
    answer: "Yes, we have a cancellation policy that aims to be fair to both users and washers. Generally, you can cancel free of charge up to 24 hours before the scheduled service. Please refer to our detailed cancellation policy in the terms of service for specifics."
  },
  {
    value: "item-5",
    question: "What happens if my clothes are damaged or lost?",
    answer: "While our washers are vetted and aim to provide the best care, we understand concerns about belongings. We have a dispute resolution process in place. We recommend documenting your items and discussing any valuable or delicate items with your washer beforehand. Our platform also offers optional insurance for peace of mind."
  },
  {
    value: "item-6",
    question: "As a washer, how do I set my prices and availability?",
    answer: "Washers have full control over their pricing and availability. In your washer dashboard, you can set the prices for different services (e.g., per load, per kg) and manage your calendar to show when you're available to take bookings."
  }
];

const benefits = [
  {
    icon: <Clock className="w-7 h-7 text-blue-600" />,
    title: "Ultimate Convenience for Users",
    description: "Save precious time and reclaim your weekends. Book local laundry services with a few clicks and let your neighbours handle the load.",
    bgColor: "bg-blue-50",
    iconBgColor: "bg-blue-100"
  },
  {
    icon: <PoundSterling className="w-7 h-7 text-green-600" />,
    title: "Flexible Earnings for Washers",
    description: "Turn your washing machine into an income source. Set your own schedule, work from home, and earn by helping your community.",
    bgColor: "bg-green-50",
    iconBgColor: "bg-green-100"
  },
  {
    icon: <Award className="w-7 h-7 text-blue-600" />,
    title: "Trusted Quality & Care",
    description: "Our washers are vetted community members who take pride in their service. Expect your clothes back clean, fresh, and handled with care.",
    bgColor: "bg-blue-50",
    iconBgColor: "bg-blue-100"
  },
  {
    icon: <Briefcase className="w-7 h-7 text-green-600" />,
    title: "Low-Barrier Entrepreneurship",
    description: "Start your own laundry service with minimal setup. Use your existing equipment and our platform to connect with customers.",
    bgColor: "bg-green-50",
    iconBgColor: "bg-green-100"
  },
  {
    icon: <HomeIcon className="w-7 h-7 text-purple-600" />,
    title: "Stronger Neighbourhood Ties",
    description: "Foster a sense of community by connecting with and supporting your neighbours. It's local people helping local people.",
    bgColor: "bg-purple-50",
    iconBgColor: "bg-purple-100"
  },
  {
    icon: <Leaf className="w-7 h-7 text-teal-600" />,
    title: "Greener Laundry Days",
    description: "Reduce your carbon footprint! By sharing local laundry resources, we optimize energy use, cutting down on electricity and water. It's like making green energy by saving it, one load at a time.",
    bgColor: "bg-teal-50",
    iconBgColor: "bg-teal-100"
  }
];

export default function HowItWorksPage() {
  return (
    <div className="py-12 md:py-16 lg:py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
            How Neighbourhood Wash Works
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
            Getting your laundry done or offering your washing services has never been easier. Follow these simple steps to get started.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* For Users Section */}
          <div className="space-y-8 p-8 bg-white rounded-xl shadow-xl">
            <h2 className="text-3xl font-semibold text-blue-600 text-center mb-8">For Laundry Users</h2>
            <ol className="space-y-6">
              {userSteps.map((step, index) => (
                <li key={`user-step-${index}`} className="flex items-start">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                    {step.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{step.title}</h3>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="text-center mt-10">
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
                <Link href="/join?role=user">Find a Washer Near You</Link>
              </Button>
            </div>
          </div>

          {/* For Washers Section */}
          <div className="space-y-8 p-8 bg-white rounded-xl shadow-xl">
            <h2 className="text-3xl font-semibold text-green-600 text-center mb-8">For Washers</h2>
            <ol className="space-y-6">
            {washerSteps.map((step, index) => (
                <li key={`washer-step-${index}`} className="flex items-start">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-4">
                    {step.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{step.title}</h3>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="text-center mt-10">
              <Button asChild size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-3">
                <Link href="/join?role=washer">Become a Washer</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Visual Process Flow Placeholder */}
        <section className="mt-20 py-16 bg-white rounded-xl shadow-xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold text-gray-800">Our Simple Process</h2>
          </div>
          <div className="flex flex-col md:flex-row justify-around items-center space-y-8 md:space-y-0 md:space-x-4 text-gray-700 px-4">
            {[ 
              { icon: <Search className="w-12 h-12 text-blue-500" />, label: '1. Search & Book', description: 'User finds a washer and books a slot.' },
              { icon: <Handshake className="w-12 h-12 text-blue-500" />, label: '2. Drop-off Laundry', description: 'User drops off laundry with Washer.' },
              { icon: <WashingMachine className="w-12 h-12 text-blue-500" />, label: '3. Wash & Care', description: 'Washer completes the laundry service.' },
              { icon: <Smile className="w-12 h-12 text-green-500" />, label: '4. Pick-up & Enjoy', description: 'User picks up fresh laundry.' },
            ].map((item, index, arr) => (
              <React.Fragment key={item.label}>
                <div className="flex flex-col items-center text-center max-w-xs">
                  <div className="p-3 bg-gray-100 rounded-full mb-3">
                    {item.icon}
                  </div>
                  <h3 className="font-semibold mb-1">{item.label}</h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
                {index < arr.length - 1 && <div className="text-3xl text-gray-300 hidden md:block mx-4">&rarr;</div>}
                {index < arr.length - 1 && <div className="text-3xl text-gray-300 md:hidden my-4">&darr;</div>}
              </React.Fragment>
            ))}
          </div>
        </section>

        {/* Benefits Section */}
        <section className="mt-20 py-16 bg-white rounded-xl shadow-xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold text-gray-800">Benefits for Everyone</h2>
            <p className="mt-3 text-gray-600 max-w-2xl mx-auto">Discover the advantages of joining the Neighbourhood Wash community, whether you need laundry done or want to earn by washing.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
            {benefits.map((benefit, index) => (
              <div key={index} className={`p-6 rounded-lg shadow-md ${benefit.bgColor}`}>
                <div className={`flex-shrink-0 w-12 h-12 rounded-full ${benefit.iconBgColor} flex items-center justify-center mb-4`}>
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mt-20 py-16 bg-gray-50 rounded-xl shadow-xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold text-gray-800">Frequently Asked Questions</h2>
            <p className="mt-3 text-gray-600 max-w-2xl mx-auto">Find answers to common questions about using Neighbourhood Wash.</p>
          </div>
          <div className="max-w-3xl mx-auto px-4">
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((faq) => (
                <AccordionItem value={faq.value} key={faq.value}>
                  <AccordionTrigger className="text-lg text-left hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-base text-gray-700 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

      </div>
    </div>
  );
} 