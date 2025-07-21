'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  CreditCard,
  Plus,
  Trash2,
  Star,
  Shield,
  Calendar,
  DollarSign
} from 'lucide-react'
import { toast } from 'sonner'

interface PaymentMethod {
  id: string
  type: 'card' | 'paypal' | 'bank_account'
  last4?: string
  brand?: string
  exp_month?: number
  exp_year?: number
  is_default: boolean
  created_at: string
  billing_address?: {
    line1: string
    city: string
    postal_code: string
    country: string
  }
}

interface Transaction {
  id: string
  amount: number
  currency: string
  status: string
  description: string
  created_at: string
  payment_method_id: string
}

export default function PaymentMethods() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [addingPaymentMethod, setAddingPaymentMethod] = useState(false)

  // Fetch payment methods and recent transactions
  useEffect(() => {
    const fetchPaymentData = async () => {
      try {
        const [methodsResponse, transactionsResponse] = await Promise.all([
          fetch('/api/customer/payment-methods'),
          fetch('/api/customer/transactions?limit=5')
        ])

        if (methodsResponse.ok) {
          const methodsData = await methodsResponse.json()
          setPaymentMethods(methodsData.payment_methods || [])
        }

        if (transactionsResponse.ok) {
          const transactionsData = await transactionsResponse.json()
          setTransactions(transactionsData.transactions || [])
        }
      } catch (error) {
        console.error('Error fetching payment data:', error)
        toast.error('Failed to load payment information')
      } finally {
        setLoading(false)
      }
    }

    fetchPaymentData()
  }, [])

  const handleAddPaymentMethod = async () => {
    setAddingPaymentMethod(true)
    try {
      // In a real implementation, this would integrate with Stripe
      // For now, we'll simulate the process
      toast.info('Redirecting to secure payment setup...')
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Refresh payment methods
      const response = await fetch('/api/customer/payment-methods')
      if (response.ok) {
        const data = await response.json()
        setPaymentMethods(data.payment_methods || [])
        toast.success('Payment method added successfully!')
      }
    } catch (error) {
      console.error('Error adding payment method:', error)
      toast.error('Failed to add payment method')
    } finally {
      setAddingPaymentMethod(false)
    }
  }

  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      const response = await fetch(`/api/customer/payment-methods/${paymentMethodId}/set-default`, {
        method: 'POST'
      })

      if (response.ok) {
        setPaymentMethods(prev => prev.map(method => ({
          ...method,
          is_default: method.id === paymentMethodId
        })))
        toast.success('Default payment method updated')
      } else {
        throw new Error('Failed to update default payment method')
      }
    } catch (error) {
      console.error('Error setting default payment method:', error)
      toast.error('Failed to update default payment method')
    }
  }

  const handleDeletePaymentMethod = async (paymentMethodId: string) => {
    if (!confirm('Are you sure you want to remove this payment method?')) {
      return
    }

    try {
      const response = await fetch(`/api/customer/payment-methods/${paymentMethodId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setPaymentMethods(prev => prev.filter(method => method.id !== paymentMethodId))
        toast.success('Payment method removed')
      } else {
        throw new Error('Failed to remove payment method')
      }
    } catch (error) {
      console.error('Error removing payment method:', error)
      toast.error('Failed to remove payment method')
    }
  }

  const getCardIcon = (brand?: string) => {
    // In a real implementation, you'd have actual card brand icons
    return <CreditCard className="h-5 w-5" />
  }

  const formatTransactionStatus = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      'succeeded': { label: 'Completed', color: 'bg-green-100 text-green-800' },
      'pending': { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      'failed': { label: 'Failed', color: 'bg-red-100 text-red-800' },
      'canceled': { label: 'Canceled', color: 'bg-gray-100 text-gray-800' }
    }
    return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-6 bg-gray-200 rounded"></div>
                      <div className="space-y-1">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                      </div>
                    </div>
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Payment Methods</span>
            </CardTitle>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment Method
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Payment Method</DialogTitle>
                  <DialogDescription>
                    Add a new payment method to your account. All payment information is securely processed.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Shield className="h-4 w-4" />
                    <span>Secured by Stripe</span>
                  </div>
                  <Button 
                    onClick={handleAddPaymentMethod} 
                    disabled={addingPaymentMethod}
                    className="w-full"
                  >
                    {addingPaymentMethod ? 'Setting up...' : 'Add Card or Bank Account'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {paymentMethods.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No payment methods
              </h3>
              <p className="text-gray-600 mb-4">
                Add a payment method to start booking services
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center space-x-3">
                    {getCardIcon(method.brand)}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">
                          {method.brand?.toUpperCase()} •••• {method.last4}
                        </span>
                        {method.is_default && (
                          <Badge variant="secondary" className="text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Default
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {method.exp_month && method.exp_year && (
                          <span>Expires {method.exp_month}/{method.exp_year}</span>
                        )}
                        {method.billing_address && (
                          <span className="ml-2">
                            {method.billing_address.city}, {method.billing_address.country}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {!method.is_default && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSetDefault(method.id)}
                      >
                        Set Default
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeletePaymentMethod(method.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>Recent Transactions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-6">
              <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => {
                const statusInfo = formatTransactionStatus(transaction.status)
                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {transaction.description}
                        </span>
                        <span className="font-semibold">
                          £{transaction.amount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm text-gray-600">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </span>
                        <Badge className={`text-xs ${statusInfo.color}`}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )
              })}
              
              <Button variant="ghost" size="sm" className="w-full mt-4">
                View All Transactions
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}