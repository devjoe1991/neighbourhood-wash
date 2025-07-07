'use client'

import { useState, useEffect } from 'react'

// Define the properties for a single bubble
interface Bubble {
  id: number
  size: number // width and height in pixels
  left: string // horizontal start position (e.g., '20%')
  animationDuration: string // how long it takes to float up (e.g., '15s')
  animationDelay: string // when it starts floating (e.g., '0.5s')
}

const FloatingBubbles = () => {
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const bubbleCount = 20 // How many bubbles you want

  useEffect(() => {
    const generatedBubbles: Bubble[] = Array.from({ length: bubbleCount }).map(
      (_, index) => ({
        id: index,
        // Random size between 20px and 80px
        size: Math.random() * (80 - 20) + 20,
        // Random horizontal position across the screen
        left: `${Math.random() * 100}%`,
        // Random duration between 10 and 25 seconds
        animationDuration: `${Math.random() * (25 - 10) + 10}s`,
        // Random delay up to 15 seconds
        animationDelay: `${Math.random() * 15}s`,
      })
    )

    setBubbles(generatedBubbles)
  }, []) // Empty dependency array means this runs only once on mount

  return (
    <div className='absolute top-0 left-0 h-full w-full overflow-hidden'>
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className='bubble'
          style={{
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            left: bubble.left,
            animationDuration: bubble.animationDuration,
            animationDelay: bubble.animationDelay,
          }}
        />
      ))}
    </div>
  )
}

export default FloatingBubbles
