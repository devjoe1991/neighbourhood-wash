import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Star, ShieldCheck, CalendarDays, Award, Users, DollarSign, Zap } from 'lucide-react';

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="py-12 md:py-20 lg:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="space-y-6">
              <p className="text-sm font-medium text-blue-600 tracking-wide">
                Join the laundry revolution
              </p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900">
                Your Neighbourhood
                <br />
                <span className="text-blue-600">Laundry Solution</span>
              </h1>
              <p className="text-lg text-gray-600">
                Our community of trusted neighbours offer their washing machines
                and expertise to help with your laundry needs. Perfect when your
                appliance breaks down or if you don't have one - simply book a
                neighbour and get your laundry done at their place!
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white" asChild>
                  <Link href="/join">Join Neighbourhood Wash &rarr;</Link>
                </Button>
                <Button size="lg" variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50" asChild>
                  <Link href="/how-it-works">Learn More &rarr;</Link>
                </Button>
              </div>
            </div>
            <div className="relative mt-10 md:mt-0">
              <Image
                src="/images/family-wash.jpg"
                alt="Family doing laundry"
                width={600}
                height={400}
                className="rounded-lg shadow-xl object-cover aspect-[3/2]"
              />
              <div className="absolute bottom-4 right-4 bg-white bg-opacity-90 p-3 rounded-lg shadow-md flex items-center space-x-2">
                <div className="flex text-yellow-400">
                  {[...Array(4)].map((_, i) => <Star key={`star-${i}`} fill="currentColor" className="w-5 h-5" />)}
                  <Star fill="currentColor" className="w-5 h-5 opacity-70" /> {/* For the 4.9 effect, one star slightly different */}
                </div>
                <p className="text-sm font-semibold text-gray-700">4.9/5 Average Rating</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* End Hero Section */}

      {/* Why Choose Us Section */}
      <section className="py-12 md:py-20 lg:py-28 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
              Why Choose Neighbourhood Wash?
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Experience the perfect blend of convenience, quality, and community
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <ShieldCheck className="w-8 h-8 text-blue-600" />,
                title: 'Trusted & Verified',
                description: 'Every washer is thoroughly vetted and background-checked for your peace of mind.',
              },
              {
                icon: <CalendarDays className="w-8 h-8 text-blue-600" />,
                title: 'Flexible Scheduling',
                description: 'Book services at your convenience, with real-time availability and instant confirmation.',
              },
              {
                icon: <Award className="w-8 h-8 text-blue-600" />,
                title: 'Quality Guaranteed',
                description: 'Professional care for your garments with satisfaction guaranteed.',
              },
              {
                icon: <Users className="w-8 h-8 text-blue-600" />,
                title: 'Community-Driven',
                description: 'Support local entrepreneurs while getting exceptional service.',
              },
              {
                icon: <DollarSign className="w-8 h-8 text-blue-600" />,
                title: 'Competitive Pricing',
                description: 'Average earnings of £1500+/month for washers, great value for users.',
              },
              {
                icon: <Zap className="w-8 h-8 text-blue-600" />,
                title: 'Easy to Use',
                description: 'Simple booking, secure payments, and seamless communication.',
              },
            ].map((feature) => (
              <div key={feature.title} className="bg-white p-6 rounded-lg shadow-lg">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* End Why Choose Us Section */}

      {/* Testimonials Placeholder Section */}
      <section className="py-12 md:py-20 lg:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
              What Our Users Say
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Placeholder for testimonials. Real stories coming soon!
            </p>
          </div>
          {/* Placeholder content - replace with actual testimonial cards later */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-lg">
                <p className="text-gray-600 italic mb-4">
                  "This service is amazing! So convenient and my clothes came back perfect. Placeholder testimonial {i}."
                </p>
                <p className="text-sm font-semibold text-gray-900">User {i}</p>
                <p className="text-xs text-gray-500">Location {i}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* End Testimonials Placeholder Section */}

      {/* CTA Section */}
      <section className="py-12 md:py-20 lg:py-28 bg-blue-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Ready to Transform Your Laundry Experience?
          </h2>
          <p className="mt-4 text-lg text-blue-100 max-w-2xl mx-auto">
            Join thousands of satisfied users and washers in your neighbourhood. Start your journey today!
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 w-full sm:w-auto" asChild>
              <Link href="/join">Join Neighbourhood Wash &rarr;</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-blue-700 hover:border-blue-700 w-full sm:w-auto" asChild>
              <Link href="/our-washers">Meet Our Washers &rarr;</Link>
            </Button>
          </div>
        </div>
      </section>
      {/* End CTA Section */}
    </>
  );
}
