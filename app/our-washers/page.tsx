import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { CheckBadgeIcon, UserGroupIcon, CurrencyPoundIcon, SparklesIcon, ShieldCheckIcon, RocketLaunchIcon, StarIcon as SolidStarIcon } from '@heroicons/react/24/solid'; // Using Heroicons for a bit more visual variety if appropriate
import { LightBulbIcon, ClipboardDocumentCheckIcon, PresentationChartLineIcon } from '@heroicons/react/24/outline';
import { Star } from 'lucide-react'; // Added Star from lucide-react

// Placeholder data for featured washers
const featuredWashers = [
  {
    name: "Sarah M.",
    location: "Manchester",
    rating: 4.9,
    reviews: 120,
    specialty: "Delicate fabrics, Eco-friendly detergents",
    imageUrl: "/images/placeholder-washer-1.jpg", // Ensure you have placeholder images
    story: "Sarah turned her meticulous laundry skills into a thriving local business, helping dozens of families weekly."
  },
  {
    name: "David K.",
    location: "Bristol",
    rating: 4.8,
    reviews: 95,
    specialty: "Quick turnaround, Large loads",
    imageUrl: "/images/placeholder-washer-2.jpg",
    story: "A former hospitality worker, David brings professionalism and efficiency to every wash."
  },
  {
    name: "Chloe R.",
    location: "London",
    rating: 5.0,
    reviews: 150,
    specialty: "Baby clothes, Stain removal expert",
    imageUrl: "/images/placeholder-washer-3.jpg",
    story: "Chloe offers a gentle touch for sensitive items and has become a go-to for new parents."
  }
];

export default function OurWashersPage() {
  return (
    <div className="bg-gray-50">
      {/* Hero Section for Our Washers */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-blue-600 to-blue-500 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Meet Our Trusted Neighbourhood Washers
          </h1>
          <p className="mt-6 text-lg text-blue-100 max-w-2xl mx-auto">
            Our platform is powered by dedicated individuals from your community, committed to providing top-notch laundry services with a personal touch.
          </p>
        </div>
      </section>

      {/* Vetting Process Section */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <ShieldCheckIcon className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
              Our Commitment to Trust & Safety
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              We take the safety and trust of our community seriously. Every washer on our platform goes through a comprehensive vetting process.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 text-center">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <UserGroupIcon className="w-12 h-12 text-blue-500 mx-auto mb-3" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Identity Verification</h3>
              <p className="text-gray-600 text-sm">Washers verify their identity to ensure transparency and accountability.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <ClipboardDocumentCheckIcon className="w-12 h-12 text-blue-500 mx-auto mb-3" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Profile Review</h3>
              <p className="text-gray-600 text-sm">Our team reviews each washer profile for completeness and clarity of services offered.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <Star className="w-12 h-12 text-blue-500 mx-auto mb-3" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Community Ratings</h3>
              <p className="text-gray-600 text-sm">Continuous monitoring through user ratings and feedback helps maintain high standards.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Washers Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <UserGroupIcon className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
              Meet Some of Our Star Washers
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Get to know the amazing individuals ready to take care of your laundry needs.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredWashers.map((washer) => (
              <div key={washer.name} className="bg-gray-50 rounded-xl shadow-lg overflow-hidden flex flex-col">
                <div className="relative h-56 w-full">
                  <Image src={washer.imageUrl} alt={washer.name} layout="fill" objectFit="cover" />
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="text-2xl font-semibold text-blue-600 mb-1">{washer.name}</h3>
                  <p className="text-sm text-gray-500 mb-2">{washer.location}</p>
                  <div className="flex items-center mb-3">
                    {[...Array(Math.floor(washer.rating))].map((_, i) => <SolidStarIcon key={i} className="w-5 h-5 text-yellow-400" />)}
                    {washer.rating % 1 !== 0 && <SolidStarIcon key="half" className="w-5 h-5 text-yellow-400 opacity-60" /> /* Simple half star */}
                    <span className="ml-2 text-sm text-gray-600">{washer.rating.toFixed(1)} ({washer.reviews} reviews)</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-3 font-medium">Specialty: {washer.specialty}</p>
                  <p className="text-gray-600 text-sm mb-4 flex-grow"><em>"{washer.story}"</em></p>
                  <Button variant="outline" size="sm" className="mt-auto w-full border-blue-500 text-blue-500 hover:bg-blue-50">
                    View Profile (Coming Soon)
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits of Becoming a Washer Section */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <SparklesIcon className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
              Why Become a Neighbourhood Washer?
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Joining our platform offers a fantastic way to earn, connect, and make a difference in your community.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center text-center">
              <CurrencyPoundIcon className="w-12 h-12 text-green-500 mb-3" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Earn Extra Income</h3>
              <p className="text-gray-600 text-sm">Utilize your washing machine and skills to make money on your own schedule. Set your own prices and watch your earnings grow.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center text-center">
              <LightBulbIcon className="w-12 h-12 text-yellow-500 mb-3" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Flexible & Convenient</h3>
              <p className="text-gray-600 text-sm">Work from the comfort of your home. Choose when you want to work and how many laundry orders you take on.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center text-center">
              <UserGroupIcon className="w-12 h-12 text-purple-500 mb-3" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Support Your Community</h3>
              <p className="text-gray-600 text-sm">Help out your neighbours and build connections within your local area. Be a valued part of the community fabric.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center text-center">
              <PresentationChartLineIcon className="w-12 h-12 text-blue-500 mb-3" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Easy-to-Use Platform</h3>
              <p className="text-gray-600 text-sm">Our app makes it simple to manage bookings, communicate with users, and track your earnings.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center text-center">
              <CheckBadgeIcon className="w-12 h-12 text-indigo-500 mb-3" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Minimal Startup</h3>
              <p className="text-gray-600 text-sm">No major investment needed. If you have a washing machine and dryer, you're almost set!</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center text-center">
              <RocketLaunchIcon className="w-12 h-12 text-red-500 mb-3" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Grow Your Reputation</h3>
              <p className="text-gray-600 text-sm">Build a base of happy customers and earn positive reviews to attract more bookings.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Application Process Overview Section */}
      <section className="py-16 md:py-20 bg-white">
         <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <ClipboardDocumentCheckIcon className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
              Becoming a Washer is Easy
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Follow these simple steps to start offering your laundry services to your community.
            </p>
          </div>
          <div className="max-w-3xl mx-auto">
            <ol className="space-y-6 relative border-l border-gray-300 dark:border-gray-700 ml-6">
              <li className="mb-10 ml-10">
                <span className="absolute flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full -left-5 ring-4 ring-white dark:ring-gray-900 dark:bg-blue-900">
                  <UserGroupIcon className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                </span>
                <h3 className="flex items-center mb-1 text-xl font-semibold text-gray-900">1. Sign Up & Create Profile</h3>
                <p className="text-gray-600">Fill out our simple application form. Tell us about yourself, your equipment, and the services you'll offer.</p>
              </li>
              <li className="mb-10 ml-10">
                <span className="absolute flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full -left-5 ring-4 ring-white dark:ring-gray-900 dark:bg-blue-900">
                  <ShieldCheckIcon className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                </span>
                <h3 className="mb-1 text-xl font-semibold text-gray-900">2. Verification Process</h3>
                <p className="text-gray-600">We'll review your application and guide you through our quick identity and address verification.</p>
              </li>
              <li className="mb-10 ml-10">
                <span className="absolute flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full -left-5 ring-4 ring-white dark:ring-gray-900 dark:bg-blue-900">
                  <LightBulbIcon className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                </span>
                <h3 className="mb-1 text-xl font-semibold text-gray-900">3. Set Up Your Services</h3>
                <p className="text-gray-600">Define your service area, pricing, and availability. Get your profile ready to shine!</p>
              </li>
              <li className="ml-10">
                <span className="absolute flex items-center justify-center w-10 h-10 bg-green-100 rounded-full -left-5 ring-4 ring-white dark:ring-gray-900 dark:bg-green-900">
                  <RocketLaunchIcon className="w-5 h-5 text-green-600 dark:text-green-300" />
                </span>
                <h3 className="mb-1 text-xl font-semibold text-gray-900">4. Go Live & Start Earning!</h3>
                <p className="text-gray-600">Once approved, your profile goes live. Start accepting bookings and providing a great service to your neighbours.</p>
              </li>
            </ol>
          </div>
        </div>
      </section>

      {/* Washer Testimonials Section - Placeholder */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <SparklesIcon className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
              Hear From Our Washers
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Real stories from individuals earning and connecting through Neighbourhood Wash.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {[1, 2].map((i) => (
              <blockquote key={i} className="p-6 bg-white rounded-lg shadow-lg">
                <p className="text-gray-600 italic mb-4">
                  "Joining Neighbourhood Wash was the best decision! I love the flexibility and earning extra money doing something I enjoy. Placeholder testimonial {i}."
                </p>
                <footer className="text-sm">
                  <p className="font-semibold text-gray-900">Washer Name {i}</p>
                  <p className="text-gray-500">Location {i}</p>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 md:py-24 bg-blue-600">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Ready to Join Our Network of Washers?
          </h2>
          <p className="mt-6 text-lg text-blue-100 max-w-xl mx-auto">
            Start your journey as a Neighbourhood Washer today. It's simple to sign up and begin offering your services.
          </p>
          <div className="mt-10">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 px-10 py-3 text-lg" asChild>
              <Link href="/join?role=washer">Become a Washer Today &rarr;</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
} 