'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Calendar,
  PoundSterling,
} from 'lucide-react'
import { getPayoutRequests } from '@/app/dashboard/payouts/actions'
import { format } from 'date-fns'

interface PayoutRequest {
  id: number
  requested_amount: number
  withdrawal_fee: number
  net_amount: number
  status: string
  request_notes: string | null
  admin_notes: string | null
  created_at: string
  processed_at: string | null
  stripe_transfer_id: string | null
}

interface PayoutHistoryProps {
  refreshTrigger?: number
}

export default function PayoutHistory({ refreshTrigger }: PayoutHistoryProps) {
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchPayoutRequests = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const result = await getPayoutRequests()
      if (result.success) {
        setPayoutRequests(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching payout requests:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchPayoutRequests()
  }, [refreshTrigger])

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: {
        variant: 'secondary' as const,
        icon: Clock,
        label: 'Pending Review',
        color: 'text-yellow-600',
      },
      approved: {
        variant: 'default' as const,
        icon: CheckCircle,
        label: 'Approved',
        color: 'text-blue-600',
      },
      processing: {
        variant: 'default' as const,
        icon: Loader2,
        label: 'Processing',
        color: 'text-blue-600',
      },
      completed: {
        variant: 'default' as const,
        icon: CheckCircle,
        label: 'Completed',
        color: 'text-green-600',
      },
      rejected: {
        variant: 'destructive' as const,
        icon: XCircle,
        label: 'Rejected',
        color: 'text-red-600',
      },
      failed: {
        variant: 'destructive' as const,
        icon: AlertCircle,
        label: 'Failed',
        color: 'text-red-600',
      },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || {
      variant: 'secondary' as const,
      icon: Clock,
      label: status,
      color: 'text-gray-600',
    }

    const Icon = config.icon

    return (
      <Badge variant={config.variant} className='flex items-center gap-1'>
        <Icon
          className={`h-3 w-3 ${status === 'processing' ? 'animate-spin' : ''}`}
        />
        {config.label}
      </Badge>
    )
  }

  const formatCurrency = (amount: number) => `£${amount.toFixed(2)}`

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy, HH:mm')
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className='h-16 w-full' />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <Calendar className='h-5 w-5' />
            Payout History
          </CardTitle>
          <Button
            variant='outline'
            size='sm'
            onClick={() => fetchPayoutRequests(true)}
            disabled={refreshing}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {payoutRequests.length === 0 ? (
          <div className='py-8 text-center'>
            <PoundSterling className='mx-auto mb-4 h-12 w-12 text-gray-400' />
            <h3 className='mb-2 text-lg font-medium text-gray-900'>
              No payout requests yet
            </h3>
            <p className='text-gray-500'>
              Your payout requests will appear here once you make them.
            </p>
          </div>
        ) : (
          <div className='space-y-4'>
            {/* Desktop Table View */}
            <div className='hidden md:block'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead>Net Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payoutRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className='font-medium'>
                        {formatDate(request.created_at)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(request.requested_amount)}
                      </TableCell>
                      <TableCell className='text-orange-600'>
                        -{formatCurrency(request.withdrawal_fee)}
                      </TableCell>
                      <TableCell className='font-medium text-green-600'>
                        {formatCurrency(request.net_amount)}
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell className='max-w-xs truncate'>
                        {request.admin_notes || request.request_notes || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className='space-y-4 md:hidden'>
              {payoutRequests.map((request) => (
                <Card key={request.id} className='p-4'>
                  <div className='space-y-3'>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-gray-500'>
                        {formatDate(request.created_at)}
                      </span>
                      {getStatusBadge(request.status)}
                    </div>

                    <div className='space-y-2'>
                      <div className='flex justify-between'>
                        <span>Requested:</span>
                        <span className='font-medium'>
                          {formatCurrency(request.requested_amount)}
                        </span>
                      </div>
                      <div className='flex justify-between text-orange-600'>
                        <span>Fee:</span>
                        <span>-{formatCurrency(request.withdrawal_fee)}</span>
                      </div>
                      <div className='flex justify-between font-medium'>
                        <span>Net amount:</span>
                        <span className='text-green-600'>
                          {formatCurrency(request.net_amount)}
                        </span>
                      </div>
                    </div>

                    {(request.admin_notes || request.request_notes) && (
                      <div className='border-t pt-2'>
                        <p className='text-xs text-gray-600'>
                          <strong>Notes:</strong>{' '}
                          {request.admin_notes || request.request_notes || '—'}
                        </p>
                      </div>
                    )}

                    {request.processed_at && (
                      <div className='text-xs text-gray-500'>
                        Processed: {formatDate(request.processed_at)}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {/* Summary Stats */}
            <div className='mt-6 grid grid-cols-2 gap-4 border-t pt-6 md:grid-cols-4'>
              <div className='text-center'>
                <div className='text-2xl font-bold text-green-600'>
                  {
                    payoutRequests.filter((r) => r.status === 'completed')
                      .length
                  }
                </div>
                <div className='text-sm text-gray-500'>Completed</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-yellow-600'>
                  {
                    payoutRequests.filter(
                      (r) => r.status === 'pending' || r.status === 'approved'
                    ).length
                  }
                </div>
                <div className='text-sm text-gray-500'>Pending</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-blue-600'>
                  {formatCurrency(
                    payoutRequests
                      .filter((r) => r.status === 'completed')
                      .reduce((sum, r) => sum + r.net_amount, 0)
                  )}
                </div>
                <div className='text-sm text-gray-500'>Total Paid</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-orange-600'>
                  {formatCurrency(
                    payoutRequests.reduce((sum, r) => sum + r.withdrawal_fee, 0)
                  )}
                </div>
                <div className='text-sm text-gray-500'>Total Fees</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
