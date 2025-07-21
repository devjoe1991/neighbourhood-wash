'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle, XCircle, Clock, RefreshCw, Eye } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

interface WasherApplication {
  id: string
  userId: string
  fullName: string | null
  email: string
  onboardingStatus: string
  approvalStatus: string
  bio: string | null
  serviceAreas: string[]
  serviceTypes: string[]
  stripeAccountStatus: string | null
  createdAt: string
  onboardingCompletedAt: string | null
}

export function WasherApprovals() {
  const [applications, setApplications] = useState<WasherApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApplication, setSelectedApplication] = useState<WasherApplication | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('washer_profiles')
        .select(`
          id,
          user_id,
          onboarding_status,
          approval_status,
          bio,
          service_areas,
          service_types,
          stripe_account_status,
          created_at,
          onboarding_completed_at,
          profiles!inner (
            full_name,
            email
          )
        `)
        .in('approval_status', ['pending', 'approved', 'rejected'])
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedApplications = data?.map(app => ({
        id: app.id,
        userId: app.user_id,
        fullName: app.profiles?.full_name || null,
        email: app.profiles?.email || '',
        onboardingStatus: app.onboarding_status,
        approvalStatus: app.approval_status,
        bio: app.bio,
        serviceAreas: app.service_areas || [],
        serviceTypes: app.service_types || [],
        stripeAccountStatus: app.stripe_account_status,
        createdAt: app.created_at,
        onboardingCompletedAt: app.onboarding_completed_at
      })) || []

      setApplications(formattedApplications)
    } catch (error) {
      console.error('Error fetching washer applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveWasher = async (washerId: string) => {
    try {
      setActionLoading(washerId)
      const response = await fetch('/api/admin/washers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'approve',
          washerId
        })
      })

      if (response.ok) {
        fetchApplications() // Refresh the list
      }
    } catch (error) {
      console.error('Error approving washer:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejectWasher = async (washerId: string) => {
    if (!rejectionReason.trim()) return

    try {
      setActionLoading(washerId)
      const response = await fetch('/api/admin/washers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reject',
          washerId,
          reason: rejectionReason
        })
      })

      if (response.ok) {
        setSelectedApplication(null)
        setRejectionReason('')
        fetchApplications() // Refresh the list
      }
    } catch (error) {
      console.error('Error rejecting washer:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getOnboardingStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'not_started': return 'bg-gray-100 text-gray-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Washer Applications</CardTitle>
              <CardDescription>Review and approve washer applications</CardDescription>
            </div>
            <Button onClick={fetchApplications} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Washer</TableHead>
                    <TableHead>Onboarding</TableHead>
                    <TableHead>Approval Status</TableHead>
                    <TableHead>Service Areas</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((application) => (
                    <TableRow key={application.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{application.fullName || 'No name'}</div>
                          <div className="text-sm text-gray-500">{application.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getOnboardingStatusColor(application.onboardingStatus)}>
                          {application.onboardingStatus.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(application.approvalStatus)}>
                          {application.approvalStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {application.serviceAreas.length > 0 
                            ? application.serviceAreas.slice(0, 2).join(', ') + 
                              (application.serviceAreas.length > 2 ? '...' : '')
                            : 'Not specified'
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(application.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedApplication(application)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          
                          {application.approvalStatus === 'pending' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleApproveWasher(application.id)}
                                disabled={actionLoading === application.id}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Reject Application</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to reject {application.fullName || application.email}'s application?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <div className="py-4">
                                    <label className="text-sm font-medium mb-2 block">
                                      Reason for rejection
                                    </label>
                                    <Textarea
                                      placeholder="Enter reason for rejection..."
                                      value={rejectionReason}
                                      onChange={(e) => setRejectionReason(e.target.value)}
                                    />
                                  </div>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setRejectionReason('')}>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleRejectWasher(application.id)}
                                      disabled={!rejectionReason.trim() || actionLoading === application.id}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Reject Application
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Application Detail Modal */}
      {selectedApplication && (
        <AlertDialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
          <AlertDialogContent className="max-w-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Washer Application Details</AlertDialogTitle>
              <AlertDialogDescription>
                Review the complete application for {selectedApplication.fullName || selectedApplication.email}
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <p className="text-sm text-gray-600">{selectedApplication.fullName || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p className="text-sm text-gray-600">{selectedApplication.email}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Bio</label>
                <p className="text-sm text-gray-600">{selectedApplication.bio || 'Not provided'}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Service Areas</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedApplication.serviceAreas.map((area, index) => (
                      <Badge key={index} variant="secondary">{area}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Service Types</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedApplication.serviceTypes.map((type, index) => (
                      <Badge key={index} variant="secondary">{type}</Badge>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Onboarding Status</label>
                  <Badge className={getOnboardingStatusColor(selectedApplication.onboardingStatus)}>
                    {selectedApplication.onboardingStatus.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">Stripe Status</label>
                  <Badge variant="secondary">
                    {selectedApplication.stripeAccountStatus || 'Not connected'}
                  </Badge>
                </div>
              </div>
            </div>
            
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}