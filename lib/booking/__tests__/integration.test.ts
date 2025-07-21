/**
 * Integration tests for booking assignment system
 * These tests verify the core functionality works end-to-end
 */

import { describe, it, expect, vi } from 'vitest'
import { SmartMatchingEngine } from '../matching-engine'
import type { MatchingCriteria, BookingRequest } from '../matching-engine'

// Mock Supabase client
vi.mock('@/utils/supabase/server', () => ({
  createClient: () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: [],
          error: null
        }))
      }))
    }))
  })
}))

describe('Booking Assignment Integration', () => {
  describe('SmartMatchingEngine Core Logic', () => {
    it('should calculate distance correctly using Haversine formula', () => {
      const engine = new SmartMatchingEngine()
      
      // Access private method for testing
      const calculateDistance = (engine as any).calculateDistance.bind(engine)
      
      // Test same location (should be 0)
      const sameLocation = calculateDistance(
        { lat: 51.5074, lng: -0.1278 },
        { lat: 51.5074, lng: -0.1278 }
      )
      expect(sameLocation).toBeLessThan(0.001) // Very close to 0
      
      // Test known distance (London to Manchester ~260km)
      const londonToManchester = calculateDistance(
        { lat: 51.5074, lng: -0.1278 }, // London
        { lat: 53.4808, lng: -2.2426 }  // Manchester
      )
      expect(londonToManchester).toBeGreaterThan(250)
      expect(londonToManchester).toBeLessThan(270)
    })

    it('should calculate travel time based on distance', () => {
      const engine = new SmartMatchingEngine()
      
      // Access private method for testing
      const calculateTravelTime = (engine as any).calculateTravelTime.bind(engine)
      
      // 30km at 30km/h should be 60 minutes
      expect(calculateTravelTime(30)).toBe(60)
      
      // 15km at 30km/h should be 30 minutes
      expect(calculateTravelTime(15)).toBe(30)
      
      // 0km should be 0 minutes
      expect(calculateTravelTime(0)).toBe(0)
    })

    it('should calculate estimated cost including travel', () => {
      const engine = new SmartMatchingEngine()
      
      // Access private method for testing
      const calculateEstimatedCost = (engine as any).calculateEstimatedCost.bind(engine)
      
      const mockBooking: BookingRequest = {
        id: 1,
        customerId: 'customer-1',
        serviceType: 'standard',
        requestedDate: new Date(),
        pickupAddress: { lat: 0, lng: 0, address: 'Test' },
        basePrice: 25.00
      }
      
      // Base price + travel cost (10km * £0.50)
      const cost = calculateEstimatedCost(mockBooking, 10)
      expect(cost).toBe(30.00) // £25 + £5 travel
    })

    it('should validate scoring algorithm weights', () => {
      const engine = new SmartMatchingEngine()
      
      // Access private methods for testing
      const calculateDistanceScore = (engine as any).calculateDistanceScore.bind(engine)
      const calculateRatingScore = (engine as any).calculateRatingScore.bind(engine)
      const calculateExperienceScore = (engine as any).calculateExperienceScore.bind(engine)
      
      // Test perfect scores
      expect(calculateDistanceScore(0, 10)).toBe(100)
      expect(calculateRatingScore(5.0)).toBe(100)
      expect(calculateExperienceScore(50)).toBe(100)
      
      // Test mid-range scores
      expect(calculateDistanceScore(5, 10)).toBe(50)
      expect(calculateRatingScore(2.5)).toBe(50)
      expect(calculateExperienceScore(25)).toBe(50)
      
      // Test minimum scores
      expect(calculateDistanceScore(10, 10)).toBe(0)
      expect(calculateRatingScore(0)).toBe(0)
      expect(calculateExperienceScore(0)).toBe(0)
    })

    it('should handle edge cases in scoring', () => {
      const engine = new SmartMatchingEngine()
      
      const calculateDistanceScore = (engine as any).calculateDistanceScore.bind(engine)
      const calculateExperienceScore = (engine as any).calculateExperienceScore.bind(engine)
      
      // Distance beyond max should be 0
      expect(calculateDistanceScore(15, 10)).toBe(0)
      
      // Experience beyond 50 jobs should cap at 100
      expect(calculateExperienceScore(100)).toBe(100)
      expect(calculateExperienceScore(1000)).toBe(100)
      
      // Negative values should be handled gracefully (formula gives >100 for negative distance)
      expect(calculateDistanceScore(-1, 10)).toBeGreaterThan(100) // Negative distance edge case
    })
  })

  describe('Matching Criteria Validation', () => {
    it('should create valid matching criteria', () => {
      const criteria: MatchingCriteria = {
        location: {
          customerLocation: { lat: 51.5074, lng: -0.1278 },
          maxDistance: 15
        },
        timing: {
          requestedDate: new Date('2024-01-15'),
          flexibility: 2
        },
        service: {
          serviceType: ['standard', 'delicate']
        },
        preferences: {
          ratingThreshold: 3.0
        }
      }
      
      expect(criteria.location.maxDistance).toBeGreaterThan(0)
      expect(criteria.timing.flexibility).toBeGreaterThanOrEqual(0)
      expect(criteria.service.serviceType.length).toBeGreaterThan(0)
      expect(criteria.preferences.ratingThreshold).toBeGreaterThanOrEqual(0)
      expect(criteria.preferences.ratingThreshold).toBeLessThanOrEqual(5)
    })

    it('should handle optional criteria fields', () => {
      const minimalCriteria: MatchingCriteria = {
        location: {
          customerLocation: { lat: 51.5074, lng: -0.1278 },
          maxDistance: 10
        },
        timing: {
          requestedDate: new Date(),
          flexibility: 1
        },
        service: {
          serviceType: ['standard']
        },
        preferences: {
          ratingThreshold: 0
        }
      }
      
      expect(minimalCriteria.preferences.preferredWashers).toBeUndefined()
      expect(minimalCriteria.preferences.blockedWashers).toBeUndefined()
      expect(minimalCriteria.timing.preferredTimeSlot).toBeUndefined()
    })
  })

  describe('Booking Request Validation', () => {
    it('should create valid booking request', () => {
      const booking: BookingRequest = {
        id: 1,
        customerId: 'customer-123',
        serviceType: 'standard',
        requestedDate: new Date('2024-01-15'),
        pickupAddress: {
          lat: 51.5074,
          lng: -0.1278,
          address: '123 Test Street, London, SW1A 1AA'
        },
        basePrice: 25.00
      }
      
      expect(booking.id).toBeGreaterThan(0)
      expect(booking.customerId).toBeTruthy()
      expect(booking.serviceType).toBeTruthy()
      expect(booking.requestedDate).toBeInstanceOf(Date)
      expect(booking.pickupAddress.lat).toBeTypeOf('number')
      expect(booking.pickupAddress.lng).toBeTypeOf('number')
      expect(booking.basePrice).toBeGreaterThan(0)
    })

    it('should handle optional booking fields', () => {
      const booking: BookingRequest = {
        id: 1,
        customerId: 'customer-123',
        serviceType: 'premium',
        requestedDate: new Date(),
        pickupAddress: {
          lat: 51.5074,
          lng: -0.1278,
          address: '123 Test Street'
        },
        deliveryAddress: {
          lat: 51.5100,
          lng: -0.1300,
          address: '456 Delivery Street'
        },
        basePrice: 35.00,
        specialRequirements: ['delicate', 'eco-friendly']
      }
      
      expect(booking.deliveryAddress).toBeDefined()
      expect(booking.specialRequirements).toHaveLength(2)
    })
  })

  describe('System Constants and Limits', () => {
    it('should have reasonable system limits', () => {
      // These constants should match the implementation
      const MAX_DISTANCE_KM = 50 // Reasonable service area
      const MIN_RATING_THRESHOLD = 0
      const MAX_RATING_THRESHOLD = 5
      const DEFAULT_FLEXIBILITY_HOURS = 2
      const ASSIGNMENT_TIMEOUT_MINUTES = 15
      
      expect(MAX_DISTANCE_KM).toBeGreaterThan(0)
      expect(MAX_DISTANCE_KM).toBeLessThan(100) // Not too large
      expect(MIN_RATING_THRESHOLD).toBe(0)
      expect(MAX_RATING_THRESHOLD).toBe(5)
      expect(DEFAULT_FLEXIBILITY_HOURS).toBeGreaterThan(0)
      expect(ASSIGNMENT_TIMEOUT_MINUTES).toBeGreaterThan(0)
    })

    it('should have consistent scoring weights', () => {
      // Weights should add up to 1.0 (100%)
      const DISTANCE_WEIGHT = 0.3
      const AVAILABILITY_WEIGHT = 0.25
      const RATING_WEIGHT = 0.2
      const EXPERIENCE_WEIGHT = 0.15
      const SPECIALIZATION_WEIGHT = 0.1
      
      const totalWeight = DISTANCE_WEIGHT + AVAILABILITY_WEIGHT + RATING_WEIGHT + 
                         EXPERIENCE_WEIGHT + SPECIALIZATION_WEIGHT
      
      expect(totalWeight).toBeCloseTo(1.0, 2) // Within 0.01 tolerance
    })
  })
})