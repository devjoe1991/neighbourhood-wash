'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Download,
  CreditCard,
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

interface EarningsData {
  today: {
    gross_earnings: number
    net_earnings: number
    jobs_completed: number
    hours_worked: number
  }
  week: {
    gross_earnings: number
    net_earnings: number
    jobs_completed: number
    hours_worked: number
  }
  month: {
    gross_earnings: number
    net_earnings: number
    jobs_completed: number
    hours_worked: number
  }
  pending_payout: number
  last_payout: {
    amount: number
    date: string
  } | null
  recent_transactions: Array<{
    id: string
    type: 'payment' | 'payout' | 'fee'
    amount: number
    description: string
    date: string
    status: string
  }>
}

interface EarningsOverviewProps {
  washerId: string
  compact?: boolean
}

export function EarningsOverview({ washerId, compact = false }: EarningsOverviewProps) {
  const [earnings, setEarnings] = useState<EarningsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('week')

  useEffect(() => {
    fetchEarningsData()
  }, [washerId])

  const fetchEarningsData = async () => {
    try {
      const response = await fetch(`/api/washer/earnings?washerId=${washerId}`)
      if (response.ok) {
        const data = await response.json()
        setEarnings(data)
      }
    } catch (error) {
      console.error('Failed to fetch earnings:', error)
    } finally {
      setLoading(false)
    }
  }

  const requestPayout = async () => {
    try {
      const response = await fetch('/api/washer/request-payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ washerId })
      })
      
      if (response.ok) {
        fetchEarningsData() // Refresh data
      }
    } catch (error) {
      console.error('Failed to request payout:', error)
    }
  }

  if (loading || !earnings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5" />
            <span>Earnings Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentPeriodData = earnings[selectedPeriod]
  const hourlyRate = currentPeriodData.hours_worked > 0 
    ? currentPeriodData.net_earnings / currentPeriodData.hours_worked 
    : 0

  return (
    <div className="space-y-6">
      {/* Main Earnings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5" />
              <span>Earnings Overview</span>
            </div>
            {!compact && (
              <Button variant="outline" size="sm" onClick={fetchEarningsData}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">This Week</TabsTrigger>
              <TabsTrigger value="month">This Month</TabsTrigger>
            </TabsList>
            
            <TabsContent value={selectedPeriod} className="space-y-4 mt-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    £{currentPeriodData.net_earnings.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">Net Earnings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    £{currentPeriodData.gross_earnings.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">Gross Earnings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {currentPeriodData.jobs_completed}
                  </div>
                  <div className="text-sm text-gray-500">Jobs Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    £{hourlyRate.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">Per Hour</div>
                </div>
              </div>

              {/* Hours Worked */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Hours Worked</span>
                </div>
                <span className="font-medium">
                  {currentPeriodData.hours_worked.toFixed(1)}h
                </span>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Payout Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5" />
            <span>Payouts</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Pending Payout */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <div className="font-medium">Available for Payout</div>
              <div className="text-sm text-gray-500">
                Ready to transfer to your bank account
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-green-600">
                £{earnings.pending_payout.toFixed(2)}
              </div>
              <Button 
                size="sm" 
                onClick={requestPayout}
                disabled={earnings.pending_payout <= 0}
                className="mt-2"
              >
                Request Payout
              </Button>
            </div>
          </div>

          {/* Last Payout */}
          {earnings.last_payout && (
            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <div>
                <div className="font-medium text-green-800">Last Payout</div>
                <div className="text-sm text-green-600">
                  {new Date(earnings.last_payout.date).toLocaleDateString()}
                </div>
              </div>
              <div className="text-lg font-bold text-green-700">
                £{earnings.last_payout.amount.toFixed(2)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      {!compact && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest earnings and payouts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {earnings.recent_transactions.slice(0, 5).map((transaction) => (
                <div 
                  key={transaction.id} 
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      transaction.type === 'payment' ? 'bg-green-100' :
                      transaction.type === 'payout' ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      {transaction.type === 'payment' ? (
                        <ArrowUpRight className="w-4 h-4 text-green-600" />
                      ) : transaction.type === 'payout' ? (
                        <ArrowDownRight className="w-4 h-4 text-blue-600" />
                      ) : (
                        <DollarSign className="w-4 h-4 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{transaction.description}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(transaction.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-medium ${
                      transaction.type === 'payment' ? 'text-green-600' :
                      transaction.type === 'payout' ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                      {transaction.type === 'payout' ? '-' : '+'}£{transaction.amount.toFixed(2)}
                    </div>
                    <Badge 
                      variant={transaction.status === 'completed' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}