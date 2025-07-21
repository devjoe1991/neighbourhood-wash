'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  CreditCard,
  Download,
  RefreshCw,
  Calendar
} from 'lucide-react'

interface FinancialReport {
  period: {
    start: string
    end: string
  }
  summary: {
    totalRevenue: number
    totalPayouts: number
    platformFees: number
    netRevenue: number
    transactionCount: number
  }
  breakdown: {
    payments: number
    payouts: number
    refunds: number
    fees: number
  }
}

interface EarningsStats {
  total_periods: number
  pending_payouts: number
  processing_payouts: number
  completed_payouts: number
  failed_payouts: number
}

export const FinancialDashboard: React.FC = () => {
  const [report, setReport] = useState<FinancialReport | null>(null)
  const [earningsStats, setEarningsStats] = useState<EarningsStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [startDate, setStartDate] = useState(() => {
    const date = new Date()
    date.setMonth(date.getMonth() - 1)
    return date.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })

  const fetchFinancialReport = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/admin/financial-report?startDate=${startDate}&endDate=${endDate}`
      )
      const result = await response.json()

      if (result.success) {
        setReport(result.report)
      } else {
        setError(result.error || 'Failed to fetch financial report')
      }
    } catch (error) {
      setError('Failed to fetch financial report')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchEarningsStats = async () => {
    try {
      const response = await fetch('/api/admin/process-earnings')
      const result = await response.json()

      if (result.success) {
        setEarningsStats(result.stats)
      }
    } catch (error) {
      console.error('Failed to fetch earnings stats:', error)
    }
  }

  const processEarnings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/process-earnings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate,
          endDate
        })
      })

      const result = await response.json()

      if (result.success) {
        await fetchEarningsStats()
        alert(`Processed earnings for ${result.result.processed} washers`)
      } else {
        setError(result.error || 'Failed to process earnings')
      }
    } catch (error) {
      setError('Failed to process earnings')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchFinancialReport()
    fetchEarningsStats()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Financial Dashboard</h2>
        <div className="flex gap-2">
          <Button
            onClick={fetchFinancialReport}
            disabled={isLoading}
            variant="outline"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={processEarnings}
            disabled={isLoading}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Process Earnings
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Report Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button onClick={fetchFinancialReport} disabled={isLoading}>
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Financial Summary Cards */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Revenue
                  </p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(report.summary.totalRevenue)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Payouts
                  </p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(report.summary.totalPayouts)}
                  </p>
                </div>
                <TrendingDown className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Platform Fees
                  </p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(report.summary.platformFees)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Net Revenue
                  </p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(report.summary.netRevenue)}
                  </p>
                </div>
                <CreditCard className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Earnings Processing Stats */}
      {earningsStats && (
        <Card>
          <CardHeader>
            <CardTitle>Earnings Processing Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{earningsStats.total_periods}</div>
                <div className="text-sm text-muted-foreground">Total Periods</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {earningsStats.pending_payouts}
                </div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {earningsStats.processing_payouts}
                </div>
                <div className="text-sm text-muted-foreground">Processing</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {earningsStats.completed_payouts}
                </div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {earningsStats.failed_payouts}
                </div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction Breakdown */}
      {report && (
        <Card>
          <CardHeader>
            <CardTitle>Transaction Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Customer Payments</span>
                <Badge variant="secondary">
                  {formatCurrency(report.breakdown.payments)}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Washer Payouts</span>
                <Badge variant="secondary">
                  {formatCurrency(report.breakdown.payouts)}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Refunds</span>
                <Badge variant="destructive">
                  {formatCurrency(report.breakdown.refunds)}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Platform Fees</span>
                <Badge variant="default">
                  {formatCurrency(report.breakdown.fees)}
                </Badge>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center font-semibold">
                  <span>Total Transactions</span>
                  <span>{report.summary.transactionCount}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default FinancialDashboard