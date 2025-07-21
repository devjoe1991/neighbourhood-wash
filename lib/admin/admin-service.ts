import { createSupabaseServerClient } from '@/utils/supabase/server'
import { ServiceResult } from '@/lib/types'

export interface PlatformAnalytics {
  totalUsers: number
  totalWashers: number
  totalCustomers: number
  activeWashers: number
  pendingWasherApplications: number
  totalBookings: number
  completedBookings: number
  totalRevenue: number
  monthlyGrowth: {
    users: number
    bookings: number
    revenue: number
  }
  topMetrics: {
    averageBookingValue: number
    customerRetentionRate: number
    washerUtilizationRate: number
    platformCommissionRate: number
  }
}

export interface UserManagementData {
  users: Array<{
    id: string
    email: string
    fullName: string | null
    roles: string[]
    status: string
    createdAt: string
    lastSeenAt: string | null
  }>
  totalCount: number
}

export interface BookingOversight {
  bookings: Array<{
    id: string
    customerName: string
    washerName: string | null
    status: string
    totalPrice: number
    createdAt: string
    scheduledAt: string | null
    issues: string[]
  }>
  totalCount: number
  statusCounts: Record<string, number>
}

export interface FinancialReport {
  totalRevenue: number
  totalPayouts: number
  platformFees: number
  pendingPayouts: number
  monthlyBreakdown: Array<{
    month: string
    revenue: number
    payouts: number
    fees: number
  }>
  topWashers: Array<{
    id: string
    name: string
    earnings: number
    jobsCompleted: number
  }>
}

export interface QualityControlData {
  reviews: Array<{
    id: string
    bookingId: string
    reviewerName: string
    revieweeName: string
    rating: number
    comment: string | null
    flagged: boolean
    createdAt: string
  }>
  flaggedContent: Array<{
    id: string
    type: 'review' | 'message' | 'profile'
    content: string
    reportedBy: string
    status: 'pending' | 'resolved' | 'dismissed'
    createdAt: string
  }>
  averageRatings: {
    overall: number
    washers: number
    customers: number
  }
}

export class AdminService {
  private supabase = createSupabaseServerClient()

  async getPlatformAnalytics(): Promise<ServiceResult<PlatformAnalytics>> {
    try {
      // Get user counts
      const { count: totalUsers } = await this.supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      const { count: totalWashers } = await this.supabase
        .from('washer_profiles')
        .select('*', { count: 'exact', head: true })

      const { count: totalCustomers } = await this.supabase
        .from('customer_profiles')
        .select('*', { count: 'exact', head: true })

      const { count: activeWashers } = await this.supabase
        .from('washer_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_online', true)

      const { count: pendingApplications } = await this.supabase
        .from('washer_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('approval_status', 'pending')

      // Get booking counts
      const { count: totalBookings } = await this.supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })

      const { count: completedBookings } = await this.supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')

      // Get revenue data
      const { data: revenueData } = await this.supabase
        .from('transactions')
        .select('amount')
        .eq('type', 'payment')
        .eq('status', 'completed')

      const totalRevenue = revenueData?.reduce((sum: number, t: any) => sum + Number(t.amount), 0) || 0

      // Calculate monthly growth (simplified - would implement proper date-based calculation)
      const analytics: PlatformAnalytics = {
        totalUsers: totalUsers || 0,
        totalWashers: totalWashers || 0,
        totalCustomers: totalCustomers || 0,
        activeWashers: activeWashers || 0,
        pendingWasherApplications: pendingApplications || 0,
        totalBookings: totalBookings || 0,
        completedBookings: completedBookings || 0,
        totalRevenue,
        monthlyGrowth: {
          users: 12.5, // Placeholder - would calculate from actual data
          bookings: 8.3,
          revenue: 15.2
        },
        topMetrics: {
          averageBookingValue: totalRevenue / (completedBookings || 1),
          customerRetentionRate: 78.5, // Placeholder
          washerUtilizationRate: 65.2, // Placeholder
          platformCommissionRate: 15.0
        }
      }

      return { success: true, data: analytics }
    } catch (error) {
      console.error('Error fetching platform analytics:', error)
      return { 
        success: false, 
        error: { message: 'Failed to fetch platform analytics' }
      }
    }
  }

  async getUserManagement(page = 1, limit = 20, search?: string): Promise<ServiceResult<UserManagementData>> {
    try {
      let query = this.supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          created_at,
          user_roles (
            role,
            status
          )
        `)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1)

      if (search) {
        query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
      }

      const { data: users, error, count } = await query

      if (error) throw error

      const formattedUsers = users?.map((user: any) => ({
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        roles: user.user_roles?.map((r: any) => r.role) || [],
        status: user.user_roles?.[0]?.status || 'inactive',
        createdAt: user.created_at,
        lastSeenAt: null // Would need to track this separately
      })) || []

      return {
        success: true,
        data: {
          users: formattedUsers,
          totalCount: count || 0
        }
      }
    } catch (error) {
      console.error('Error fetching user management data:', error)
      return {
        success: false,
        error: { message: 'Failed to fetch user management data' }
      }
    }
  }

  async getBookingOversight(page = 1, limit = 20, status?: string): Promise<ServiceResult<BookingOversight>> {
    try {
      let query = this.supabase
        .from('bookings')
        .select(`
          id,
          status,
          total_price,
          created_at,
          scheduled_at,
          customer_profiles!inner (
            profiles!inner (
              full_name
            )
          ),
          washer_profiles (
            profiles!inner (
              full_name
            )
          )
        `)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1)

      if (status) {
        query = query.eq('status', status)
      }

      const { data: bookings, error, count } = await query

      if (error) throw error

      // Get status counts
      const { data: statusData } = await this.supabase
        .from('bookings')
        .select('status')

      const statusCounts = statusData?.reduce((acc: any, booking: any) => {
        acc[booking.status] = (acc[booking.status] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

      const formattedBookings = bookings?.map((booking: any) => ({
        id: booking.id,
        customerName: booking.customer_profiles?.profiles?.full_name || 'Unknown',
        washerName: booking.washer_profiles?.profiles?.full_name || null,
        status: booking.status,
        totalPrice: Number(booking.total_price),
        createdAt: booking.created_at,
        scheduledAt: booking.scheduled_at,
        issues: [] // Would implement issue detection logic
      })) || []

      return {
        success: true,
        data: {
          bookings: formattedBookings,
          totalCount: count || 0,
          statusCounts
        }
      }
    } catch (error) {
      console.error('Error fetching booking oversight data:', error)
      return {
        success: false,
        error: { message: 'Failed to fetch booking oversight data' }
      }
    }
  }

  async getFinancialReport(): Promise<ServiceResult<FinancialReport>> {
    try {
      // Get total revenue
      const { data: revenueData } = await this.supabase
        .from('transactions')
        .select('amount, created_at')
        .eq('type', 'payment')
        .eq('status', 'completed')

      const totalRevenue = revenueData?.reduce((sum: number, t: any) => sum + Number(t.amount), 0) || 0

      // Get total payouts
      const { data: payoutData } = await this.supabase
        .from('transactions')
        .select('amount')
        .eq('type', 'payout')
        .eq('status', 'completed')

      const totalPayouts = payoutData?.reduce((sum: number, t: any) => sum + Number(t.amount), 0) || 0

      // Calculate platform fees
      const platformFees = totalRevenue * 0.15 // 15% commission

      // Get pending payouts
      const { data: pendingData } = await this.supabase
        .from('transactions')
        .select('amount')
        .eq('type', 'payout')
        .eq('status', 'pending')

      const pendingPayouts = pendingData?.reduce((sum: number, t: any) => sum + Number(t.amount), 0) || 0

      // Get top washers
      const { data: topWashersData } = await this.supabase
        .from('washer_profiles')
        .select(`
          id,
          profiles!inner (
            full_name
          ),
          completed_jobs
        `)
        .order('completed_jobs', { ascending: false })
        .limit(10)

      const topWashers = topWashersData?.map((washer: any) => ({
        id: washer.id,
        name: washer.profiles?.full_name || 'Unknown',
        earnings: 0, // Would calculate from transactions
        jobsCompleted: washer.completed_jobs || 0
      })) || []

      const report: FinancialReport = {
        totalRevenue,
        totalPayouts,
        platformFees,
        pendingPayouts,
        monthlyBreakdown: [], // Would implement monthly breakdown
        topWashers
      }

      return { success: true, data: report }
    } catch (error) {
      console.error('Error fetching financial report:', error)
      return {
        success: false,
        error: { message: 'Failed to fetch financial report' }
      }
    }
  }

  async getQualityControlData(): Promise<ServiceResult<QualityControlData>> {
    try {
      // Get reviews
      const { data: reviews } = await this.supabase
        .from('reviews')
        .select(`
          id,
          booking_id,
          rating,
          comment,
          created_at,
          reviewer:profiles!reviewer_id (
            full_name
          ),
          reviewee:profiles!reviewee_id (
            full_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      const formattedReviews = reviews?.map(review => ({
        id: review.id,
        bookingId: review.booking_id,
        reviewerName: review.reviewer?.full_name || 'Anonymous',
        revieweeName: review.reviewee?.full_name || 'Unknown',
        rating: review.rating,
        comment: review.comment,
        flagged: review.rating <= 2, // Simple flagging logic
        createdAt: review.created_at
      })) || []

      // Calculate average ratings
      const avgRating = reviews?.reduce((sum, r) => sum + r.rating, 0) / (reviews?.length || 1) || 0

      const qualityData: QualityControlData = {
        reviews: formattedReviews,
        flaggedContent: [], // Would implement flagged content system
        averageRatings: {
          overall: avgRating,
          washers: avgRating,
          customers: avgRating
        }
      }

      return { success: true, data: qualityData }
    } catch (error) {
      console.error('Error fetching quality control data:', error)
      return {
        success: false,
        error: { message: 'Failed to fetch quality control data' }
      }
    }
  }

  async approveWasher(washerId: string, adminId: string): Promise<ServiceResult<void>> {
    try {
      const { error } = await this.supabase
        .from('washer_profiles')
        .update({
          approval_status: 'approved',
          approved_by: adminId,
          approved_at: new Date().toISOString()
        })
        .eq('id', washerId)

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Error approving washer:', error)
      return {
        success: false,
        error: { message: 'Failed to approve washer' }
      }
    }
  }

  async rejectWasher(washerId: string, adminId: string, reason: string): Promise<ServiceResult<void>> {
    try {
      const { error } = await this.supabase
        .from('washer_profiles')
        .update({
          approval_status: 'rejected',
          approved_by: adminId,
          approved_at: new Date().toISOString(),
          approval_notes: reason
        })
        .eq('id', washerId)

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Error rejecting washer:', error)
      return {
        success: false,
        error: { message: 'Failed to reject washer' }
      }
    }
  }

  async suspendUser(userId: string, adminId: string, reason: string): Promise<ServiceResult<void>> {
    try {
      const { error } = await this.supabase
        .from('user_roles')
        .update({
          status: 'suspended'
        })
        .eq('user_id', userId)

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Error suspending user:', error)
      return {
        success: false,
        error: { message: 'Failed to suspend user' }
      }
    }
  }

  async interveneBooking(bookingId: string, adminId: string, action: string, notes: string): Promise<ServiceResult<void>> {
    try {
      // Log the intervention
      const { error } = await this.supabase
        .from('booking_status_history')
        .insert({
          booking_id: bookingId,
          from_status: null,
          to_status: action,
          changed_by: adminId,
          notes: `Admin intervention: ${notes}`
        })

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Error intervening in booking:', error)
      return {
        success: false,
        error: { message: 'Failed to intervene in booking' }
      }
    }
  }
}

export const adminService = new AdminService()