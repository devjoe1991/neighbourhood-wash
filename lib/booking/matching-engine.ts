/**
 * Smart Booking Matching Algorithm
 * Implements intelligent washer matching based on location, rating, availability, and other factors
 */

import { createSupabaseServerClient } from '@/utils/supabase/server'
import type { Database } from '@/lib/database.types'

type Tables = Database['public']['Tables']
// TODO: Update database types to include new tables
// type WasherProfile = Tables['washer_profiles']['Row']
type WasherProfile = any
type Booking = Tables['bookings']['Row']

export interface Coordinates {
  lat: number
  lng: number
}

export interface TimeSlot {
  start: string // HH:MM format
  end: string   // HH:MM format
}

export interface MatchingCriteria {
  location: {
    customerLocation: Coordinates
    maxDistance: number // in kilometers
  }
  timing: {
    requestedDate: Date
    preferredTimeSlot?: TimeSlot
    flexibility: number // hours of flexibility
  }
  service: {
    serviceType: string[]
    specialRequirements?: string[]
  }
  preferences: {
    preferredWashers?: string[]
    blockedWashers?: string[]
    ratingThreshold: number // minimum rating (0-5)
  }
}

export interface BookingRequest {
  id: string
  customer_id: string
  service_type: string
  service_description?: string
  requested_date: string
  requested_time_start?: string
  requested_time_end?: string
  pickup_address: any
  delivery_address?: any
  total_price: number
  status: string
  created_at: string
  // Legacy compatibility fields
  customerId: string
  serviceType: string
  requestedDate: Date
  pickupAddress: any
  basePrice: number
  specialRequirements?: string[]
}

export interface MatchingScore {
  washerId: string
  totalScore: number
  breakdown: {
    distance: number        // 0-100
    availability: number    // 0-100
    rating: number         // 0-100
    experience: number     // 0-100
    specialization: number // 0-100
  }
  estimatedTravelTime: number // minutes
  estimatedCost: number
  distanceKm: number
}

// BookingRequest interface moved to top of file

export class SmartMatchingEngine {
  private supabase = createSupabaseServerClient()

  /**
   * Find the best washer matches for a booking request
   */
  async findBestMatches(
    booking: BookingRequest, 
    criteria: MatchingCriteria
  ): Promise<MatchingScore[]> {
    try {
      // 1. Get available washers based on basic criteria
      const availableWashers = await this.getAvailableWashers(criteria)
      
      if (availableWashers.length === 0) {
        return []
      }

      // 2. Calculate match scores for each washer
      const scoredMatches = await Promise.all(
        availableWashers.map(washer => 
          this.calculateMatchScore(washer, booking, criteria)
        )
      )

      // 3. Filter out null scores and sort by total score
      const validMatches = scoredMatches
        .filter((score): score is MatchingScore => score !== null)
        .sort((a, b) => b.totalScore - a.totalScore)

      // 4. Return top 5 matches
      return validMatches.slice(0, 5)
    } catch (error) {
      console.error('Error in findBestMatches:', error)
      throw new Error('Failed to find washer matches')
    }
  }

  /**
   * Get available washers based on basic filtering criteria
   */
  private async getAvailableWashers(criteria: MatchingCriteria): Promise<WasherProfile[]> {
    const { data: washers, error } = await this.supabase
      .from('washer_profiles')
      .select('*')
      .eq('onboarding_status', 'completed')
      .eq('approval_status', 'approved')
      .eq('is_online', true)
      .gte('rating', criteria.preferences.ratingThreshold)
      .not('id', 'in', `(${criteria.preferences.blockedWashers?.join(',') || ''})`)

    if (error) {
      console.error('Error fetching available washers:', error)
      throw new Error('Failed to fetch available washers')
    }

    // Filter by service type
    const filteredWashers = washers.filter((washer: any) => {
      const washerServiceTypes = washer.service_types || []
      return criteria.service.serviceType.some(serviceType => 
        washerServiceTypes.includes(serviceType)
      )
    })

    // Filter by location (basic distance check)
    const washersInRange = filteredWashers.filter((washer: any) => {
      if (!washer.primary_location) return false
      
      const washerLocation = washer.primary_location as { lat: number; lng: number }
      const distance = this.calculateDistance(
        criteria.location.customerLocation,
        washerLocation
      )
      
      return distance <= criteria.location.maxDistance
    })

    return washersInRange
  }

  /**
   * Calculate comprehensive match score for a washer
   */
  private async calculateMatchScore(
    washer: WasherProfile, 
    booking: BookingRequest, 
    criteria: MatchingCriteria
  ): Promise<MatchingScore | null> {
    try {
      if (!washer.primary_location) return null

      const washerLocation = washer.primary_location as { lat: number; lng: number }
      
      // Calculate individual scores
      const distanceKm = this.calculateDistance(criteria.location.customerLocation, washerLocation)
      const distanceScore = this.calculateDistanceScore(distanceKm, criteria.location.maxDistance)
      const availabilityScore = await this.calculateAvailabilityScore(washer, criteria.timing)
      const ratingScore = this.calculateRatingScore(washer.rating || 0)
      const experienceScore = this.calculateExperienceScore(washer.total_jobs || 0)
      const specializationScore = this.calculateSpecializationScore(washer, criteria.service)

      // Apply preference bonuses
      let preferenceBonus = 0
      if (criteria.preferences.preferredWashers?.includes(washer.id)) {
        preferenceBonus = 10 // 10 point bonus for preferred washers
      }

      // Calculate weighted total score
      const totalScore = (
        distanceScore * 0.3 +
        availabilityScore * 0.25 +
        ratingScore * 0.2 +
        experienceScore * 0.15 +
        specializationScore * 0.1 +
        preferenceBonus
      )

      return {
        washerId: washer.id,
        totalScore: Math.min(totalScore, 100), // Cap at 100
        breakdown: {
          distance: distanceScore,
          availability: availabilityScore,
          rating: ratingScore,
          experience: experienceScore,
          specialization: specializationScore
        },
        estimatedTravelTime: this.calculateTravelTime(distanceKm),
        estimatedCost: this.calculateEstimatedCost(booking, distanceKm),
        distanceKm
      }
    } catch (error) {
      console.error('Error calculating match score for washer:', washer.id, error)
      return null
    }
  }

  /**
   * Calculate distance score (closer = higher score)
   */
  private calculateDistanceScore(distanceKm: number, maxDistance: number): number {
    if (distanceKm >= maxDistance) return 0
    return Math.max(0, 100 - (distanceKm / maxDistance) * 100)
  }

  /**
   * Calculate availability score based on washer's schedule
   */
  private async calculateAvailabilityScore(
    washer: WasherProfile, 
    timing: MatchingCriteria['timing']
  ): Promise<number> {
    try {
      // Check if washer has availability on the requested date
      const dayOfWeek = timing.requestedDate.getDay()
      
      const { data: availability, error } = await this.supabase
        .from('washer_availability')
        .select('*')
        .eq('washer_id', washer.id)
        .eq('day_of_week', dayOfWeek)
        .eq('is_available', true)

      if (error || !availability || availability.length === 0) {
        return 0 // No availability = 0 score
      }

      // Check for concurrent booking limits
      const { data: activeBookings, error: bookingError } = await this.supabase
        .from('bookings')
        .select('id')
        .eq('washer_id', washer.user_id)
        .in('status', ['assigned', 'confirmed', 'in_progress'])

      if (bookingError) {
        console.error('Error checking active bookings:', bookingError)
        return 50 // Default score if we can't check
      }

      const activeBookingCount = activeBookings?.length || 0
      const maxConcurrent = washer.max_concurrent_bookings || 3

      if (activeBookingCount >= maxConcurrent) {
        return 0 // At capacity
      }

      // Calculate availability score based on capacity
      const capacityUtilization = activeBookingCount / maxConcurrent
      return Math.max(0, 100 - (capacityUtilization * 50)) // Reduce score as capacity fills
    } catch (error) {
      console.error('Error calculating availability score:', error)
      return 50 // Default score on error
    }
  }

  /**
   * Calculate rating score (higher rating = higher score)
   */
  private calculateRatingScore(rating: number): number {
    return (rating / 5) * 100
  }

  /**
   * Calculate experience score based on completed jobs
   */
  private calculateExperienceScore(totalJobs: number): number {
    // Diminishing returns: first 50 jobs give full points, then levels off
    return Math.min(totalJobs / 50 * 100, 100)
  }

  /**
   * Calculate specialization score based on service type match
   */
  private calculateSpecializationScore(
    washer: WasherProfile, 
    service: MatchingCriteria['service']
  ): number {
    const washerServiceTypes = washer.service_types || []
    const requestedTypes = service.serviceType

    // Calculate percentage of requested services the washer can handle
    const matchingServices = requestedTypes.filter(type => 
      washerServiceTypes.includes(type)
    )

    const matchPercentage = matchingServices.length / requestedTypes.length
    return matchPercentage * 100
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.toRadians(coord2.lat - coord1.lat)
    const dLon = this.toRadians(coord2.lng - coord1.lng)
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(coord1.lat)) * Math.cos(this.toRadians(coord2.lat)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  /**
   * Estimate travel time based on distance
   */
  private calculateTravelTime(distanceKm: number): number {
    // Assume average speed of 30 km/h in urban areas
    const averageSpeedKmh = 30
    return Math.round((distanceKm / averageSpeedKmh) * 60) // Convert to minutes
  }

  /**
   * Calculate estimated cost including travel
   */
  private calculateEstimatedCost(booking: BookingRequest, distanceKm: number): number {
    const baseCost = booking.basePrice
    const travelCost = distanceKm * 0.5 // £0.50 per km travel cost
    return baseCost + travelCost
  }
}