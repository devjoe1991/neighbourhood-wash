import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { StarIcon as SolidStarIcon, CheckBadgeIcon, ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/solid';
import { StarIcon as OutlineStarIcon, AdjustmentsHorizontalIcon, TagIcon } from '@heroicons/react/24/outline';

// Placeholder data for reviews
const sampleReviews = [
  {
    id: 1,
    author: "Alice P.",
    location: "London",
    rating: 5,
    title: "Absolutely fantastic service!",
    text: "My clothes came back smelling amazing and perfectly folded. The washer was so friendly and communicative. Will definitely use again!",
    date: "2024-07-15",
    isVerified: true,
    userType: "user", // 'user' or 'washer'
    washerReply: "Thanks so much, Alice! It was a pleasure doing your laundry."
  },
  {
    id: 2,
    author: "Mark R. (Washer)",
    location: "Manchester",
    rating: 5,
    title: "Great platform for earning extra!",
    text: "I've been a Neighbourhood Washer for 3 months now and it's been a great experience. The app is easy to use and I've met some lovely people.",
    date: "2024-07-10",
    isVerified: true,
    userType: "washer"
  },
  {
    id: 3,
    author: "Sophie T.",
    location: "Birmingham",
    rating: 4,
    title: "Very convenient, good quality",
    text: "Really happy with the service. My only suggestion would be more availability on weekends, but the quality was top-notch.",
    date: "2024-07-05",
    isVerified: true,
    userType: "user"
  },
  {
    id: 4,
    author: "James B. (Washer)",
    location: "Bristol",
    rating: 5,
    title: "Helping my neighbours and earning!",
    text: "Love being able to help out my local community and make some extra money. The support from Neighbourhood Wash has been great too.",
    date: "2024-06-28",
    isVerified: true,
    userType: "washer"
  }
];

// Dummy overall rating and distribution
const overallRating = 4.8;
const totalReviews = 258;
const ratingDistribution = [
  { stars: 5, count: 180, percentage: (180/258)*100 },
  { stars: 4, count: 60, percentage: (60/258)*100 },
  { stars: 3, count: 10, percentage: (10/258)*100 },
  { stars: 2, count: 5, percentage: (5/258)*100 },
  { stars: 1, count: 3, percentage: (3/258)*100 },
];

export default function ReviewsPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section for Reviews */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-blue-600 to-teal-500 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <SolidStarIcon className="w-20 h-20 text-yellow-400 mx-auto mb-6" />
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Real Experiences from Our Community
          </h1>
          <p className="mt-6 text-lg text-blue-100 max-w-2xl mx-auto">
            Hear what users and washers are saying about Neighbourhood Wash. Genuine reviews, genuine satisfaction.
          </p>
        </div>
      </section>

      {/* Overall Rating & Distribution Section */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8 items-center bg-white p-8 rounded-xl shadow-xl">
            <div className="lg:col-span-1 text-center lg:text-left">
              <h2 className="text-2xl font-semibold text-gray-700 mb-1">Overall Rating</h2>
              <div className="flex items-center justify-center lg:justify-start mb-2">
                <p className="text-6xl font-bold text-blue-600 mr-3">{overallRating.toFixed(1)}</p>
                <div className="flex flex-col">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <SolidStarIcon 
                        key={i} 
                        className={`w-7 h-7 ${i < Math.round(overallRating) ? 'text-yellow-400' : 'text-gray-300'}`} 
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-500">Based on {totalReviews} reviews</p>
                </div>
              </div>
            </div>
            <div className="lg:col-span-2">
              <h3 className="text-xl font-semibold text-gray-700 mb-3 text-center lg:text-left">Rating Distribution</h3>
              <div className="space-y-1.5">
                {ratingDistribution.map((dist) => (
                  <div key={dist.stars} className="flex items-center">
                    <span className="text-sm text-gray-600 w-12">{dist.stars} star{dist.stars > 1 ? 's' : ''}</span>
                    <div className="flex-grow bg-gray-200 rounded-full h-3 mx-2">
                      <div 
                        className="bg-yellow-400 h-3 rounded-full"
                        style={{ width: `${dist.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-10 text-right">{dist.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter & Reviews Section */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 md:mb-0">Featured Reviews</h2>
            {/* Placeholder for Filter Button/Dropdown */}
            <Button variant="outline">
              <AdjustmentsHorizontalIcon className="w-5 h-5 mr-2" />
              Filter Reviews (Coming Soon)
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-x-8 gap-y-10">
            {sampleReviews.map((review) => (
              <div key={review.id} className="bg-white p-6 rounded-xl shadow-lg flex flex-col">
                <div className="flex items-center mb-3">
                  {[...Array(5)].map((_, i) => (
                    <SolidStarIcon 
                      key={i} 
                      className={`w-5 h-5 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`} 
                    />
                  ))}
                  {review.isVerified && (
                    <CheckBadgeIcon className="w-5 h-5 text-blue-500 ml-2" title="Verified Review" />
                  )}
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-1">{review.title}</h3>
                <p className="text-sm text-gray-500 mb-3">
                  By {review.author} from {review.location} - <time dateTime={review.date}>{new Date(review.date).toLocaleDateString()}</time>
                </p>
                <p className="text-gray-600 mb-4 leading-relaxed flex-grow">{review.text}</p>
                {review.userType === 'user' && review.washerReply && (
                  <div className="mt-auto pt-4 border-t border-gray-200">
                    <div className="flex items-start space-x-3">
                      <ChatBubbleLeftEllipsisIcon className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-blue-600">Washer's Reply:</p>
                        <p className="text-sm text-gray-600 italic">{review.washerReply}</p>
                      </div>
                    </div>
                  </div>
                )}
                {review.userType === 'washer' && (
                  <div className="mt-auto pt-3">
                     <p className="text-xs text-green-600 font-semibold flex items-center"><TagIcon className="w-4 h-4 mr-1"/> Washer Testimonial</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
              Load More Reviews (Coming Soon)
            </Button>
          </div>
        </div>
      </section>

      {/* Placeholder for User Success Stories / Washer Testimonials specific sections if needed */}
      {/* These could be separate carousels or highlighted areas */}

    </div>
  );
} 