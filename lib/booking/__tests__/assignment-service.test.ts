/**
 * Tests for Job Assignment Service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { JobAssignmentService } from '../assignment-service'

// Mock the matching engine
vi.mock('../matching-engine', () => ({
  SmartMatchingEngine: vi.fn().mockImplementation(() => ({
    findBestMatches: vi.fn().mockResolvedValue([
      {
        washerId: 'washer-1',
        totalScore: 85.5,
        distanceKm: 2.5,
        estimatedTravelTime: 15,
        estimatedCost: 27.50,
        breakdown: {
          distance: 90,
          availability: 85,
          rating: 80,
          experience: 75,
          specialization: 100
        }
      },
      {
        washerId: 'washer-2',
        totalScore: 78.2,
        distanceKm: 4.1,
        estimatedTravelTime: 22,
        estimatedCost: 29.00,
        breakdown: {
          distance: 75,
          availability: 80,
          rating: 85,
          experience: 90,
          specialization: 100
        }
      }
    ])
  }))
}))

// Mock Supabase client
const mockSupabase = {
  from: vi.fn((table: string) => {
    const mockChain = {
      select: vi.fn(() => mockChain),
      eq: vi.fn(() => mockChain),
      single: vi.fn(() => ({
        data: table === 'bookings' ? {
          id: 1,
          status: 'pending',
          service_type: 'standard',
          requested_date: '2024-01-15',
          pickup_address: { lat: 51.5074, lng: -0.1278, address: '123 Test St' },
          base_price: 25.00,
          customer_profiles: { user_id: 'customer-1' }
        } : table === 'washer_assignments' ? {
          id: 'assignment-1',
          booking_id: 1,
          washer_id: 'washer-1',
          status: 'offered'
        } : null,
        error: null
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { id: 'assignment-1' },
            error: null
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: null,
          error: null
        }))
      })),
      lt: vi.fn(() => ({
        data: [],
        error: null
      }))
    }
    return mockChain
  })
}

// Mock the Supabase client
vi.mock('@/utils/supabase/server', () => ({
  createClient: () => mockSupabase
}))

describe('JobAssignmentService', () => {
  let assignmentService: JobAssignmentService

  beforeEach(() => {
    assignmentService = new JobAssignmentService()
    vi.clearAllMocks()
  })

  describe('assignBooking', () => {
    it('should successfully assign booking to best match', async () => {
      const result = await assignmentService.assignBooking(1)

      expect(result.success).toBe(true)
      expect(result.assignmentId).toBe('assignment-1')
      expect(result.matchScore).toBe(85.5)

      // Verify booking status was updated
      expect(mockSupabase.from).toHaveBeenCalledWith('bookings')
      
      // Verify assignment was created
      expect(mockSupabase.from).toHaveBeenCalledWith('washer_assignments')
    })

    it('should return error when booking not found', async () => {
      // Mock booking not found
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({
              data: null,
              error: { message: 'Not found' }
            }))
          }))
        }))
      })

      const result = await assignmentService.assignBooking(999)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Booking not found')
    })

    it('should return error when booking is not in pending status', async () => {
      // Mock booking with non-pending status
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({
              data: {
                id: 1,
                status: 'confirmed', // Not pending
                customer_profiles: { user_id: 'customer-1' }
              },
              error: null
            }))
          }))
        }))
      })

      const result = await assignmentService.assignBooking(1)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Booking is not in pending status')
    })

    it('should return error when no washers available', async () => {
      // Mock empty matches
      const { SmartMatchingEngine } = await import('../matching-engine')
      const mockEngine = new SmartMatchingEngine()
      vi.mocked(mockEngine.findBestMatches).mockResolvedValueOnce([])

      const result = await assignmentService.assignBooking(1)

      expect(result.success).toBe(false)
      expect(result.error).toBe('No available washers found')
    })
  })

  describe('handleWasherResponse', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should handle accepted assignment', async () => {
      const result = await assignmentService.handleWasherResponse(
        'assignment-1',
        'washer-1',
        'accepted'
      )

      expect(result.success).toBe(true)
      expect(result.assignmentId).toBe('assignment-1')

      // Verify assignment status was updated
      expect(mockSupabase.from).toHaveBeenCalledWith('washer_assignments')
    })

    it('should handle declined assignment', async () => {
      const result = await assignmentService.handleWasherResponse(
        'assignment-1',
        'washer-1',
        'declined'
      )

      expect(result.success).toBe(true)

      // Should trigger reassignment process
      expect(mockSupabase.from).toHaveBeenCalledWith('washer_assignments')
    })

    it('should return error for invalid assignment', async () => {
      // Mock assignment not found
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({
                  data: null,
                  error: { message: 'Not found' }
                }))
              }))
            }))
          }))
        }))
      })

      const result = await assignmentService.handleWasherResponse(
        'invalid-assignment',
        'washer-1',
        'accepted'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Assignment not found or already responded')
    })
  })

  describe('handleExpiredAssignments', () => {
    it('should process expired assignments', async () => {
      // Mock expired assignments
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            lt: vi.fn(() => ({
              data: [
                {
                  id: 'assignment-1',
                  booking_id: 1,
                  status: 'offered'
                }
              ],
              error: null
            }))
          }))
        }))
      })

      await assignmentService.handleExpiredAssignments()

      // Should update expired assignments
      expect(mockSupabase.from).toHaveBeenCalledWith('washer_assignments')
    })

    it('should handle no expired assignments gracefully', async () => {
      // Mock no expired assignments
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            lt: vi.fn(() => ({
              data: [],
              error: null
            }))
          }))
        }))
      })

      await expect(assignmentService.handleExpiredAssignments()).resolves.not.toThrow()
    })
  })
})