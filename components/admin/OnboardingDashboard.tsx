'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import { 
  Users, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { OnboardingAnalytics } from '@/lib/onboarding-progress'

/**
 * Admin Dashboard for Onboarding Progress Monitoring
 * Requirements: 9.1, 9.2, 9.3, 9.4 - Admin interface for monitoring onboarding progress
 */

interface OnboardingStats {
  totalWashers: number
  completedOnboarding: number
  inProgress: number
  completionRate: number
  averageCompletionTime: number
  stepBreakdown: {
    step1: number
    step2: number
    step3: number
    step4: number
  }
  recentActivity: {
    last24Hours: number
    last7Days: number
    last30Days: number
  }
}

export function OnboardingDashboard() {
  const [stats, setStats] = useState<OnboardingStats | null>(null)
  const [analytics, setAnalytics] = useState<OnboardingAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = async () => {
    try {
      setError(null)
      
      // Fetch onboarding statistics
      const statsResponse = await fetch('/api/admin/onboarding/stats')
      if (!statsResponse.ok) {
        throw new Error('Failed to fetch onboarding statistics')
      }
      const statsData = await statsResponse.json()
      setStats(statsData)

      // Fetch analytics data for the last 30 days
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      
      const analyticsResponse = await fetch(`/api/admin/onboarding/analytics?startDate=${startDate}&endDate=${endDate}`)
      if (!analyticsResponse.ok) {
        throw new Error('Failed to fetch onboarding analytics')
      }
      const analyticsData = await analyticsResponse.json()
      setAnalytics(analyticsData)

    } catch (err) {
      console.error('Error fetching onboarding data:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-600">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          <p>Error loading onboarding data: {error}</p>
          <Button onClick={handleRefresh} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!stats) {
    return <div className="flex items-center justify-center h-64">No data available</div>
  }

  // Prepare chart data
  const stepData = [
    { name: 'Step 1: Profile Setup', completed: stats.stepBreakdown.step1, total: stats.totalWashers },
    { name: 'Step 2: Stripe KYC', completed: stats.stepBreakdown.step2, total: stats.totalWashers },
    { name: 'Step 3: Bank Connection', completed: stats.stepBreakdown.step3, total: stats.totalWashers },
    { name: 'Step 4: Payment', completed: stats.stepBreakdown.step4, total: stats.totalWashers },
  ]

  const completionData = [
    { name: 'Completed', value: stats.completedOnboarding, color: '#00C49F' },
    { name: 'In Progress', value: stats.inProgress, color: '#FFBB28' },
  ]

  const recentActivityData = [
    { period: 'Last 24 Hours', count: stats.recentActivity.last24Hours },
    { period: 'Last 7 Days', count: stats.recentActivity.last7Days },
    { period: 'Last 30 Days', count: stats.recentActivity.last30Days },
  ]

  return (
    <div className="space-y-6">
      {/* Header with Refresh Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Onboarding Overview</h2>
          <p className="text-gray-600">Monitor washer onboarding progress and completion rates</p>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Washers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWashers}</div>
            <p className="text-xs text-muted-foreground">
              Registered washers in system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Onboarding</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedOnboarding}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completionRate.toFixed(1)}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">
              Currently onboarding
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Completion Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(stats.averageCompletionTime)}m
            </div>
            <p className="text-xs text-muted-foreground">
              Average time to complete
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="steps">Step Analysis</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Completion Status Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Completion Status</CardTitle>
                <CardDescription>
                  Distribution of washers by onboarding status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={completionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {completionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  New washers starting onboarding
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={recentActivityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0088FE" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="steps" className="space-y-4">
          {/* Step Completion Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Step-by-Step Completion</CardTitle>
              <CardDescription>
                Number of washers who have completed each onboarding step
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={stepData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="completed" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Step Progress Details */}
          <Card>
            <CardHeader>
              <CardTitle>Step Progress Details</CardTitle>
              <CardDescription>
                Detailed breakdown of completion rates for each step
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stepData.map((step, index) => {
                  const completionRate = stats.totalWashers > 0 
                    ? (step.completed / stats.totalWashers) * 100 
                    : 0
                  
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{step.name}</span>
                        <span className="text-sm text-gray-600">
                          {step.completed}/{step.total} ({completionRate.toFixed(1)}%)
                        </span>
                      </div>
                      <Progress value={completionRate} className="h-2" />
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          {/* Analytics Trends */}
          {analytics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Completion Trends (Last 30 Days)</CardTitle>
                <CardDescription>
                  Daily onboarding completion rates over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={analytics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="totalCompleted" 
                      stroke="#00C49F" 
                      name="Completed"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="totalStarted" 
                      stroke="#0088FE" 
                      name="Started"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Error Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Error Analysis</CardTitle>
              <CardDescription>
                Common issues and bottlenecks in the onboarding process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>Error analysis data will be available once more onboarding attempts are recorded.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}