import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { HeartIcon, UsersIcon, LightBulbIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline'; // Using outline icons for a slightly softer feel

const values = [
  {
    icon: HeartIcon,
    name: "Community First",
    description: "We believe in the power of local connections and strive to foster a supportive network of neighbours helping neighbours."
  },
  {
    icon: LightBulbIcon,
    name: "Simplicity & Convenience",
    description: "Our goal is to make laundry hassle-free, providing an easy-to-use platform that saves you time and effort."
  },
  {
    icon: UsersIcon,
    name: "Trust & Safety",
    description: "We are committed to creating a secure and reliable environment for everyone through careful vetting and transparent processes."
  },
  {
    icon: BuildingStorefrontIcon, // Placeholder for an eco/sustainability icon if available
    name: "Sustainable Living",
    description: "By utilizing existing resources within the community, we aim to promote more eco-friendly laundry practices."
  }
];

export default function AboutUsPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-sky-600 to-cyan-500 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <UsersIcon className="w-20 h-20 text-cyan-300 mx-auto mb-6" />
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            About Neighbourhood Wash
          </h1>
          <p className="mt-6 text-lg text-sky-100 max-w-3xl mx-auto">
            Connecting communities, one load at a time. Discover our story, our values, and the people dedicated to making laundry simpler and more neighbourly.
          </p>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Story: More Than Just Laundry</h2>
              <p className="text-lg text-gray-700 mb-4">
                Neighbourhood Wash was born from a simple idea: what if we could make laundry less of a chore and more of a community-building opportunity? In today's fast-paced world, time is precious, and local connections matter more than ever.
              </p>
              <p className="text-gray-600 mb-4">
                We envisioned a platform where people could easily find trusted neighbours to help with their laundry, and where individuals with underused washing machines could earn a little extra by offering a valuable service. It's about sharing resources, supporting local economies, and fostering a sense of belonging right in your own neighbourhood.
              </p>
              <p className="text-gray-600">
                From busy professionals and families to students and anyone looking for a convenient laundry solution, Neighbourhood Wash aims to lighten your load and strengthen community ties.
              </p>
            </div>
            <div className="order-first md:order-last">
              {/* Placeholder for an engaging image, maybe a collage of community interactions or diverse people */}
              <Image 
                src="/images/community-collage.jpg" // Replace with an actual relevant image
                alt="Neighbourhood Wash Community"
                width={600}
                height={450}
                className="rounded-xl shadow-2xl object-cover w-full h-auto md:h-[450px]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Core Values</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value) => (
              <div key={value.name} className="text-center p-6 border border-gray-200 rounded-lg hover:shadow-xl transition-shadow">
                <value.icon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{value.name}</h3>
                <p className="text-gray-600 text-sm">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Join Our Community Section */}
      <section className="py-16 md:py-24 bg-blue-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">Join the Neighbourhood Wash Movement!</h2>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto mb-8">
            Whether you need a helping hand with your laundry or you're looking to offer your services and earn, become a part of our growing community today.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 w-full sm:w-auto" asChild>
              <Link href="/join">Become a Washer</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-700 w-full sm:w-auto" asChild>
              <Link href="/how-it-works">Find a Laundry Service</Link>
            </Button>
          </div>
        </div>
      </section>

    </div>
  );
} 