'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield,
  Star,
  MessageCircle,
  MapPin,
  Clock,
  Smartphone,
  Heart,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const features = [
  {
    title: 'Verified Washers',
    description:
      'Every Washer is vetted with background checks and references.',
    icon: <Shield className='h-8 w-8' />,
    color: 'blue',
  },
  {
    title: 'Quality Guaranteed',
    description:
      'Our rating system ensures consistent quality and excellent service.',
    icon: <Star className='h-8 w-8' />,
    color: 'yellow',
  },
  {
    title: 'Secure Communication',
    description: 'Built-in messaging with PIN verification for safe handovers.',
    icon: <MessageCircle className='h-8 w-8' />,
    color: 'green',
  },
  {
    title: 'Location-Based Search',
    description:
      'Find the closest, most convenient Washers in your neighbourhood.',
    icon: <MapPin className='h-8 w-8' />,
    color: 'purple',
  },
  {
    title: 'Real-Time Booking',
    description:
      'Check Washer availability and book your laundry service instantly.',
    icon: <Clock className='h-8 w-8' />,
    color: 'red',
  },
  {
    title: 'Mobile Friendly',
    description: 'Easily manage your bookings and communicate from any device.',
    icon: <Smartphone className='h-8 w-8' />,
    color: 'indigo',
  },
  {
    title: 'Community First',
    description: 'We are built by the community, for the community.',
    icon: <Heart className='h-8 w-8' />,
    color: 'pink',
  },
]

const colorClasses: {
  [key: string]: { bg: string; text: string; border: string }
} = {
  blue: {
    bg: 'bg-blue-100',
    text: 'text-blue-600',
    border: 'border-blue-200',
  },
  yellow: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-600',
    border: 'border-yellow-200',
  },
  green: {
    bg: 'bg-green-100',
    text: 'text-green-600',
    border: 'border-green-200',
  },
  purple: {
    bg: 'bg-purple-100',
    text: 'text-purple-600',
    border: 'border-purple-200',
  },
  red: {
    bg: 'bg-red-100',
    text: 'text-red-600',
    border: 'border-red-200',
  },
  indigo: {
    bg: 'bg-indigo-100',
    text: 'text-indigo-600',
    border: 'border-indigo-200',
  },
  pink: {
    bg: 'bg-pink-100',
    text: 'text-pink-600',
    border: 'border-pink-200',
  },
}

const CircularFeatures = () => {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isMounted, setIsMounted] = useState(false)
  const radius = 200 // Radius of the circle in pixels

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    // Return a placeholder with the same dimensions to avoid layout shift
    return (
      <div className='flex h-[450px] w-full items-center justify-center md:h-[500px]' />
    )
  }

  return (
    <div className='flex h-[450px] w-full items-center justify-center md:h-[500px]'>
      <div className='relative flex h-full w-full max-w-[450px] items-center justify-center'>
        {/* Central Text Box */}
        <AnimatePresence mode='wait'>
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className='flex h-[200px] w-[200px] flex-col items-center justify-center rounded-full bg-white p-6 text-center shadow-lg md:h-[220px] md:w-[220px]'
          >
            <h3 className='mb-2 text-xl font-bold text-gray-900'>
              {features[activeIndex].title}
            </h3>
            <p className='text-sm leading-relaxed text-gray-600'>
              {features[activeIndex].description}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Feature Icons */}
        {features.map((feature, index) => {
          const angle = (index / features.length) * 2 * Math.PI - Math.PI / 2
          const x = radius * Math.cos(angle)
          const y = radius * Math.sin(angle)
          const featureColor = colorClasses[feature.color] || colorClasses.blue

          return (
            <button
              key={feature.title}
              onMouseEnter={() => setActiveIndex(index)}
              style={{
                transform: `translate(${x}px, ${y}px)`,
              }}
              className={cn(
                'absolute flex h-20 w-20 items-center justify-center rounded-full border-2 transition-all duration-300',
                activeIndex === index
                  ? `${featureColor.bg} ${featureColor.text} ${featureColor.border} scale-110 shadow-xl`
                  : 'border-gray-200 bg-white text-gray-500 hover:scale-105 hover:shadow-md'
              )}
            >
              {feature.icon}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default CircularFeatures
