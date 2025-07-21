/**
 * Tests for Smart Matching Engine
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SmartMatchingEngine, type MatchingCriteria, type BookingRequest } from '../matching-engine'

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              not: vi.fn(() => ({
                // Mock successful response
                data: [
                  {
                    id: 'washer-1',
                    user_id: 'user-1',
                    onboarding_status: 'completed',
                    approval_status: 'approved',
                    is_online: true,
                    rating: 4.5,
                    total_jobs: 25,
                    completed_jobs: 23,
                    service_types: ['standard', 'delicate'],
                    primary_location: { lat: 51.5074, lng: -0.1278 },
                    max_concurrent_bookings: 3
                  },
                  {
                    id: 'washer-2',
                    user_id: 'user-2',
                    onboarding_status: 'completed',
                    approval_status: 'approved',
                    is_online: true,
                    rating: 4.8,
                    total_jobs: 50,
                    completed_jobs: 48,
                    service_types: ['standard', 'premium'],
                    primary_location: { lat: 51.5074, lng: -0.1278 },
                    max_concurrent_bookings: 5
                  }
                ],
                error: null
              }))
            }))
          }))
        }))
      }))
    }))
  }))
}

// Mock the Supabase client
vi.mock('@/utils/supabase/server', () => ({
  createClient: () => mockSupabase
}))

describe('SmartMatchingEngine', () => {
  let matchingEngine: SmartMatchingEngine
  let mockBooking: BookingRequest
  let mockCriteria: MatchingCriteria

  beforeEach(() => {
    matchingEngine = new SmartMatchingEngine()
    
    mockBooking = {
      id: 1,
      customerId: 'customer-1',
      serviceType: 'standard',
      requestedDate: new Date('2024-01-15'),
      pickupAddress: {
        lat: 51.5074,
        lng: -0.1278,
        address: '123 Test Street, London'
      },
      basePrice: 25.00
    }

    mockCriteria = {
      location: {
        customerLocation: { lat: 51.5074, lng: -0.1278 },
        maxDistance: 10
      },
      timing: {
        requestedDate: new Date('2024-01-15'),
        flexibility: 2
      },
      service: {
        serviceType: ['standard']
      },
      preferences: {
        ratingThreshold: 3.0
      }
    }

    // Reset mocks
    vi.clearAllMocks()
  })

  describe('findBestMatches', () => {
    it('should return matches sorted by score', async () => {
      // Mock availability check
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'washer_availability') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    data: [{ id: '1', is_available: true }],
                    error: null
                  }))
                }))
              }))
            }))
          }
        }
        if (table === 'bookings') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                in: vi.fn(() => ({
                  data: [],
                  error: null
                }))
              }))
            }))
          }
        }
        // Default washer profiles response
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  gte: vi.fn(() => ({
                    not: vi.fn(() => ({
                      data: [
                        {
                          id: 'washer-1',
                          user_id: 'user-1',
                          rating: 4.5,
                          total_jobs: 25,
                          service_types: ['standard'],
                          primary_location: { lat: 51.5074, lng: -0.1278 },
                          max_concurrent_bookings: 3
                        },
                        {
                          id: 'washer-2',
                          user_id: 'user-2',
                          rating: 4.8,
                          total_jobs: 50,
                          service_types: ['standard'],
                          primary_location: { lat: 51.5074, lng: -0.1278 },
                          max_concurrent_bookings: 5
                        }
                      ],
                      error: null
                    }))
                  }))
                }))
              }))
            }))
          }))
        }
      })

      const matches = await matchingEngine.findBestMatches(mockBooking, mockCriteria)

      expect(matches).toHaveLength(2)
      expect(matches[0].totalScore).toBeGreaterThanOrEqual(matches[1].totalScore)
      expect(matches[0].washerId).toBeDefined()
      expect(matches[0].breakdown).toHaveProperty('distance')
      expect(matches[0].breakdown).toHaveProperty('rating')
      expect(matches[0].breakdown).toHaveProperty('experience')
    })

    it('should return empty array when no washers available', async () => {
      // Mock empty response
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                gte: vi.fn(() => ({
                  not: vi.fn(() => ({
                    data: [],
                    error: null
                  }))
                }))
              }))
            }))
          }))
        }))
      })

      const matches = await matchingEngine.findBestMatches(mockBooking, mockCriteria)

      expect(matches).toHaveLength(0)
    })

    it('should filter washers by service type', async () => {
      // Mock washers with different service types
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                gte: vi.fn(() => ({
                  not: vi.fn(() => ({
                    data: [
                      {
                        id: 'washer-1',
                        service_types: ['premium'], // Doesn't match 'standard'
                        primary_location: { lat: 51.5074, lng: -0.1278 },
                        rating: 4.5,
                        total_jobs: 25
                      },
                      {
                        id: 'washer-2',
                        service_types: ['standard'], // Matches
                        primary_location: { lat: 51.5074, lng: -0.1278 },
                        rating: 4.8,
                        total_jobs: 50
                      }
                    ],
                    error: null
                  }))
                }))
              }))
            }))
          }))
        }))
      })

      const matches = await matchingEngine.findBestMatches(mockBooking, mockCriteria)

      // Should only return washer-2 who has 'standard' service
      expect(matches).toHaveLength(1)
      expect(matches[0].washerId).toBe('washer-2')
    })

    it('should calculate distance correctly', async () => {
      // Mock washer at different location
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'washer_availability') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    data: [{ id: '1', is_available: true }],
                    error: null
                  }))
                }))
              }))
            }))
          }
        }
        if (table === 'bookings') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                in: vi.fn(() => ({
                  data: [],
                  error: null
                }))
              }))
            }))
          }
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  gte: vi.fn(() => ({
                    not: vi.fn(() => ({
                      data: [
                        {
                          id: 'washer-1',
                          service_types: ['standard'],
                          primary_location: { lat: 51.5074, lng: -0.1278 }, // Same location
                          rating: 4.5,
                          total_jobs: 25,
                          max_concurrent_bookings: 3
                        }
                      ],
                      error: null
                    }))
                  }))
                }))
              }))
            }))
          }))
        }
      })

      const matches = await matchingEngine.findBestMatches(mockBooking, mockCriteria)

      expect(matches).toHaveLength(1)
      expect(matches[0].distanceKm).toBeLessThan(1) // Should be very close (same coordinates)
      expect(matches[0].breakdown.distance).toBeGreaterThan(90) // High distance score for close proximity
    })
  })

  describe('score calculations', () => {
    it('should give higher rating score to higher rated washers', () => {
      const engine = new SmartMatchingEngine()
      
      // Access private method for testing (TypeScript hack)
      const calculateRatingScore = (engine as any).calculateRatingScore.bind(engine)
      
      expect(calculateRatingScore(5.0)).toBe(100)
      expect(calculateRatingScore(4.0)).toBe(80)
      expect(calculateRatingScore(3.0)).toBe(60)
      expect(calculateRatingScore(0)).toBe(0)
    })

    it('should give higher experience score to more experienced washers', () => {
      const engine = new SmartMatchingEngine()
      
      // Access private method for testing
      const calculateExperienceScore = (engine as any).calculateExperienceScore.bind(engine)
      
      expect(calculateExperienceScore(50)).toBe(100) // 50+ jobs = max score
      expect(calculateExperienceScore(25)).toBe(50)  // 25 jobs = 50% score
      expect(calculateExperienceScore(0)).toBe(0)    // No jobs = 0 score
      expect(calculateExperienceScore(100)).toBe(100) // Capped at 100
    })

    it('should calculate distance score correctly', () => {
      const engine = new SmartMatchingEngine()
      
      // Access private method for testing
      const calculateDistanceScore = (engine as any).calculateDistanceScore.bind(engine)
      
      expect(calculateDistanceScore(0, 10)).toBe(100)    // 0km distance = max score
      expect(calculateDistanceScore(5, 10)).toBe(50)     // 5km out of 10km max = 50% score
      expect(calculateDistanceScore(10, 10)).toBe(0)     // At max distance = 0 score
      expect(calculateDistanceScore(15, 10)).toBe(0)     // Beyond max distance = 0 score
    })
  })
})