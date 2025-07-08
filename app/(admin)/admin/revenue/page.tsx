import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  Users,
  Calendar,
  Download,
  AlertCircle
} from 'lucide-react'
import { 
  getRevenueMetrics, 
  getDailyRevenue, 
  getTopWashers, 
  getMonthlyGrowthData 
} from './actions'
// import RevenueChart from '@/components/admin/RevenueChart'
// import TopWashersTable from '@/components/admin/TopWashersTable'
// import GrowthChart from '@/components/admin/GrowthChart'

export const dynamic = 'force-dynamic'

export default async function AdminRevenueDashboard() {
  // Fetch all revenue data in parallel
  const [
    metrics,
    _dailyRevenue,
    _topWashers,
    _growthData
  ] = await Promise.all([
    getRevenueMetrics().catch(() => null),
    getDailyRevenue(30).catch(() => []),
    getTopWashers(10).catch(() => []),
    getMonthlyGrowthData(12).catch(() => [])
  ])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount)
  }

  const formatPercentage = (percentage: number) => {
    const sign = percentage >= 0 ? '+' : ''
    return `${sign}${percentage.toFixed(1)}%`
  }

  // Handle error state
  if (!metrics) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Revenue Dashboard</h1>
          <p className="text-gray-600">Platform commission tracking and financial analytics</p>
        </div>
        
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center p-6">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
            <div>
              <p className="text-red-700 font-medium">Unable to load revenue data</p>
              <p className="text-red-600 text-sm">Please check your database connection and try again.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Revenue Dashboard</h1>
          <p className="text-gray-600">Platform commission tracking and financial analytics</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Total Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Platform Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              From {metrics.totalBookings} completed bookings
            </p>
          </CardContent>
        </Card>

        {/* Monthly Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.monthlyRevenue)}</div>
            <div className="flex items-center text-xs">
              {metrics.monthlyGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={metrics.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatPercentage(metrics.monthlyGrowth)} from last month
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Average Commission */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Commission</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.averageCommissionPerBooking)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per booking (15% rate)
            </p>
          </CardContent>
        </Card>

        {/* Net Cash Position */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Cash Position</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.netCashPosition)}</div>
            <p className="text-xs text-muted-foreground">
              Available: {formatCurrency(metrics.availableBalance)}
            </p>
          </CardContent>
        </Card>

        {/* Withdrawal Fee Revenue */}
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Withdrawal Fees</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-800">
              {formatCurrency(metrics.totalWithdrawalFees)}
            </div>
            <div className="flex items-center text-xs">
              {metrics.withdrawalFeeGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={metrics.withdrawalFeeGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatPercentage(metrics.withdrawalFeeGrowth)} this month
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Revenue Streams */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">Booking Commission</CardTitle>
            <CardDescription className="text-blue-600">
              15% of every booking (£{((metrics.totalRevenue / (metrics.totalRevenue + metrics.totalWithdrawalFees)) * 100).toFixed(1)}% of total revenue)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">
              {formatCurrency(metrics.totalRevenue)}
            </div>
            <Badge variant="outline" className="mt-2 border-blue-300 text-blue-700">
              15% Automated
            </Badge>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="text-purple-800">Withdrawal Fees</CardTitle>
            <CardDescription className="text-purple-600">
              £2.50 per payout request (£{((metrics.totalWithdrawalFees / (metrics.totalRevenue + metrics.totalWithdrawalFees)) * 100).toFixed(1)}% of total revenue)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-800">
              {formatCurrency(metrics.totalWithdrawalFees)}
            </div>
            <Badge variant="outline" className="mt-2 border-purple-300 text-purple-700">
              £2.50 Fixed
            </Badge>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">Available Balance</CardTitle>
            <CardDescription className="text-green-600">
              Ready for company use
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">
              {formatCurrency(metrics.availableBalance + metrics.totalWithdrawalFees)}
            </div>
            <p className="text-xs text-green-600 mt-1">
              Commission: {formatCurrency(metrics.availableBalance)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">Outstanding Liabilities</CardTitle>
            <CardDescription className="text-yellow-600">
              Pending washer payouts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-800">
              {formatCurrency(metrics.outstandingLiabilities)}
            </div>
            <p className="text-xs text-yellow-600 mt-1">
              Net Position: {formatCurrency(metrics.netCashPosition + metrics.totalWithdrawalFees)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Revenue (Last 30 Days)</CardTitle>
            <CardDescription>
              Platform commission earned per day
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              <div className="text-center">
                <p className="text-lg font-medium">Revenue Chart</p>
                <p className="text-sm">Daily revenue trends will be displayed here</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Growth Trend</CardTitle>
            <CardDescription>
              Revenue growth over the last 12 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              <div className="text-center">
                <p className="text-lg font-medium">Growth Chart</p>
                <p className="text-sm">Monthly growth trends will be displayed here</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Washers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Revenue Generating Washers (Last 30 Days)</CardTitle>
          <CardDescription>
            Washers contributing the most platform commission
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12 text-gray-500">
            <div className="text-center">
              <p className="text-lg font-medium">Washers Table</p>
              <p className="text-sm">Top performing washers will be displayed here</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Bookings</span>
              <span className="font-medium">{metrics.totalBookings}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Average Booking Value</span>
              <span className="font-medium">
                {formatCurrency(metrics.totalBookings > 0 ? (metrics.totalRevenue / 0.15) / metrics.totalBookings : 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Commission Rate</span>
              <Badge variant="outline">15%</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">This Month Commission</span>
              <span className="font-medium text-blue-600">
                {formatCurrency(metrics.monthlyRevenue)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Withdrawal Fee Revenue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Withdrawal Fees</span>
              <span className="font-medium text-purple-600">
                {formatCurrency(metrics.totalWithdrawalFees)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">This Month Fees</span>
              <span className="font-medium">
                {formatCurrency(metrics.monthlyWithdrawalFees)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Requests</span>
              <span className="font-medium">{metrics.totalWithdrawalRequests}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Average per Request</span>
              <span className="font-medium">
                {formatCurrency(metrics.totalWithdrawalRequests > 0 ? metrics.totalWithdrawalFees / metrics.totalWithdrawalRequests : 2.50)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Cash Conversion Rate</span>
              <span className="font-medium">
                {((metrics.availableBalance / (metrics.totalRevenue + metrics.totalWithdrawalFees)) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Liability Ratio</span>
              <span className="font-medium">
                {((metrics.outstandingLiabilities / (metrics.totalRevenue + metrics.totalWithdrawalFees)) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Growth Status</span>
              <Badge variant={metrics.monthlyGrowth >= 0 ? "default" : "destructive"}>
                {metrics.monthlyGrowth >= 0 ? "Growing" : "Declining"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Platform Revenue</span>
              <span className="font-medium text-green-600">
                {formatCurrency(metrics.totalRevenue + metrics.totalWithdrawalFees)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 