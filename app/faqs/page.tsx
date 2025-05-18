import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { MailIcon, SearchIcon, LifeBuoyIcon, ShieldCheckIcon } from 'lucide-react'; // Using lucide-react for consistency

const generalFaqs = [
  {
    q: "What is Neighbourhood Wash?",
    a: "Neighbourhood Wash is a community marketplace that connects people who need laundry services with local individuals (Washers) who offer their washing machines and time to do laundry for others."
  },
  {
    q: "How do I get started?",
    a: "Simply sign up as a User to find a Washer, or apply to become a Washer to start earning. Browse through our platform and check out the How It Works page for more details."
  },
  {
    q: "Is Neighbourhood Wash available in my area?",
    a: "We are expanding rapidly! Currently, you can check available service areas during the sign-up process or by searching for Washers near your location. We aim to cover more neighbourhoods soon."
  }
];

const userFaqs = [
  {
    q: "How do I book a laundry service?",
    a: "Once you&apos;ve signed up and found a Washer you like, you can select their available time slots, choose your service preferences (detergents, fabric softeners, etc.), and confirm your booking. You&apos;ll receive a confirmation and a PIN for drop-off."
  },
  {
    q: "What if I have allergies or specific detergent preferences?",
    a: "You can specify your preferences, including allergies and detergent choices, when making a booking. Washers will do their best to accommodate your requests."
  },
  {
    q: "How is payment handled?",
    a: "Payments are handled securely through our platform. You&apos;ll pay when you book the service, and the Washer receives their payment after the service is completed successfully."
  }
];

const washerFaqs = [
  {
    q: "How do I become a Washer?",
    a: "You can apply to become a Washer through our platform. We have a vetting process to ensure safety and quality. Once approved, you can set up your profile, availability, and services."
  },
  {
    q: "What are the benefits of being a Washer?",
    a: "Being a Washer allows you to earn extra income flexibly, help your local community, and work from home. We provide support and tools to manage your bookings and earnings."
  },
  {
    q: "Do I need to provide my own laundry supplies?",
    a: "Typically, Washers use their own preferred detergents and supplies. However, you can also offer options or allow users to provide their own. This can be specified in your service offerings."
  }
];

const securityFaqs = [
  {
    q: "How is my personal information protected?",
    a: "We take your privacy and security very seriously. All personal data is encrypted, and we follow strict data protection policies. Please refer to our Privacy Policy for detailed information."
  },
  {
    q: "What is the PIN verification system?",
    a: "For every booking, unique PINs are generated for drop-off and pick-up. This ensures that laundry is securely exchanged between the correct User and Washer, creating a verified chain of custody."
  }
];

export default function FAQsPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section for FAQs */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <LifeBuoyIcon className="w-20 h-20 text-purple-300 mx-auto mb-6" />
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="mt-6 text-lg text-indigo-100 max-w-2xl mx-auto">
            Find answers to common questions about Neighbourhood Wash. If you can't find what you're looking for, feel free to contact us.
          </p>
          {/* Placeholder for Search Bar */}
          <div className="mt-8 max-w-md mx-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                id="search-faq"
                name="search-faq"
                className="block w-full pl-10 pr-3 py-2.5 border border-transparent rounded-md leading-5 bg-white bg-opacity-20 text-purple-100 placeholder-purple-200 focus:outline-none focus:bg-opacity-30 focus:border-white focus:ring-white focus:text-white sm:text-sm transition"
                placeholder="Search FAQs (Coming Soon)"
                type="search"
                disabled
              />
            </div>
          </div>
        </div>
      </section>

      {/* FAQs Accordion Section */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">Explore by Category</h2>

          <Accordion type="single" collapsible className="w-full space-y-6">
            {/* General FAQs */}
            <AccordionItem value="general">
              <AccordionTrigger className="text-xl font-semibold hover:no-underline bg-white p-6 rounded-lg shadow-md data-[state=open]:rounded-b-none data-[state=open]:shadow-lg">
                General Questions
              </AccordionTrigger>
              <AccordionContent className="pt-0 bg-white p-6 rounded-b-lg shadow-md">
                <div className="space-y-4">
                  {generalFaqs.map((faq, index) => (
                    <div key={`general-${index}`}>
                      <h4 className="font-semibold text-gray-800 text-md">{faq.q}</h4>
                      <p className="text-gray-600 text-sm mt-1">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* User FAQs */}
            <AccordionItem value="user">
              <AccordionTrigger className="text-xl font-semibold hover:no-underline bg-white p-6 rounded-lg shadow-md data-[state=open]:rounded-b-none data-[state=open]:shadow-lg">
                For Users
              </AccordionTrigger>
              <AccordionContent className="pt-0 bg-white p-6 rounded-b-lg shadow-md">
                <div className="space-y-4">
                  {userFaqs.map((faq, index) => {
                    return (
                      <div key={`user-faq-${index}`}>
                        <h4 className="font-semibold text-gray-800 text-md">{faq.q}</h4>
                        <p className="text-gray-600 text-sm mt-1">{faq.a}</p>
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Washer FAQs */}
            <AccordionItem value="washer">
              <AccordionTrigger className="text-xl font-semibold hover:no-underline bg-white p-6 rounded-lg shadow-md data-[state=open]:rounded-b-none data-[state=open]:shadow-lg">
                For Washers
              </AccordionTrigger>
              <AccordionContent className="pt-0 bg-white p-6 rounded-b-lg shadow-md">
                <div className="space-y-4">
                  {washerFaqs.map((faq, index) => (
                    <div key={`washer-${index}`}>
                      <h4 className="font-semibold text-gray-800 text-md">{faq.q}</h4>
                      <p className="text-gray-600 text-sm mt-1">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Security FAQs */}
            <AccordionItem value="security">
              <AccordionTrigger className="text-xl font-semibold hover:no-underline bg-white p-6 rounded-lg shadow-md data-[state=open]:rounded-b-none data-[state=open]:shadow-lg">
                <div className="flex items-center">
                  <ShieldCheckIcon className="w-6 h-6 mr-3 text-green-600" />
                  Privacy & Security
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-0 bg-white p-6 rounded-b-lg shadow-md">
                <div className="space-y-4">
                  {securityFaqs.map((faq, index) => (
                    <div key={`security-${index}`}>
                      <h4 className="font-semibold text-gray-800 text-md">{faq.q}</h4>
                      <p className="text-gray-600 text-sm mt-1">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 md:py-20 bg-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
          <MailIcon className="w-16 h-16 text-blue-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900">Still Have Questions?</h2>
          <p className="mt-4 text-lg text-gray-600">
            If you couldn&apos;t find the answer you were looking for in our FAQs, please don&apos;t hesitate to reach out to our support team.
          </p>
          <div className="mt-8">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white" asChild>
              <Link href="mailto:support@neighbourhoodwash.com">
                <MailIcon className="w-5 h-5 mr-2" /> Contact Support
              </Link>
            </Button>
            {/* Placeholder for a link to a more comprehensive contact page/form */}
            {/* <p className="mt-4 text-sm text-gray-500">Or visit our <Link href="/contact" className="text-blue-600 hover:underline">Contact Page</Link> for more options.</p> */}
          </div>
        </div>
      </section>

    </div>
  );
} 