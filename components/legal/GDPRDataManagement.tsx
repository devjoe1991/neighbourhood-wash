'use client'

import { useState } from 'react'
import { Download, Trash2, Edit, Shield, AlertTriangle, X } from 'lucide-react'

interface GDPRRequest {
  type: 'export' | 'delete' | 'rectify' | 'portability'
  status: 'pending' | 'processing' | 'completed' | 'rejected'
  requestDate: string
  completionDate?: string
  reason?: string
}

interface GDPRDataManagementProps {
  className?: string
}

export default function GDPRDataManagement({
  className = '',
}: GDPRDataManagementProps) {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'export' | 'delete' | 'rectify'
  >('overview')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json')
  const [rectifyData, setRectifyData] = useState({
    field: '',
    currentValue: '',
    newValue: '',
    reason: '',
  })

  // Mock data - would come from backend
  const [recentRequests] = useState<GDPRRequest[]>([
    {
      type: 'export',
      status: 'completed',
      requestDate: '2024-12-01',
      completionDate: '2024-12-02',
    },
  ])

  const handleDataExport = async () => {
    try {
      // Mock API call - would integrate with backend
      console.log(`Requesting data export in ${exportFormat} format`)

      // Simulate API response
      setTimeout(() => {
        alert(
          `Data export request submitted successfully. You will receive an email when your data is ready for download.`
        )
      }, 1000)
    } catch (error) {
      console.error('Export request failed:', error)
      alert('Export request failed. Please try again or contact support.')
    }
  }

  const handleDataDeletion = async () => {
    if (deleteConfirmText !== 'DELETE MY ACCOUNT') {
      alert('Please type "DELETE MY ACCOUNT" to confirm account deletion.')
      return
    }

    try {
      // Mock API call - would integrate with backend
      console.log('Requesting account deletion')

      // Simulate API response
      setTimeout(() => {
        alert(
          'Account deletion request submitted. You will receive a confirmation email within 24 hours.'
        )
        setShowDeleteConfirm(false)
        setDeleteConfirmText('')
      }, 1000)
    } catch (error) {
      console.error('Deletion request failed:', error)
      alert('Deletion request failed. Please try again or contact support.')
    }
  }

  const handleDataRectification = async () => {
    if (!rectifyData.field || !rectifyData.newValue || !rectifyData.reason) {
      alert('Please fill in all required fields.')
      return
    }

    try {
      // Mock API call - would integrate with backend
      console.log('Requesting data rectification:', rectifyData)

      // Simulate API response
      setTimeout(() => {
        alert(
          'Data rectification request submitted successfully. We will review your request within 72 hours.'
        )
        setRectifyData({
          field: '',
          currentValue: '',
          newValue: '',
          reason: '',
        })
      }, 1000)
    } catch (error) {
      console.error('Rectification request failed:', error)
      alert(
        'Rectification request failed. Please try again or contact support.'
      )
    }
  }

  const tabs = [
    { id: 'overview', label: 'Your Rights', icon: Shield },
    { id: 'export', label: 'Export Data', icon: Download },
    { id: 'delete', label: 'Delete Account', icon: Trash2 },
    { id: 'rectify', label: 'Correct Data', icon: Edit },
  ]

  return (
    <div
      className={`rounded-lg bg-white shadow-lg dark:bg-gray-900 ${className}`}
    >
      {/* Header */}
      <div className='border-b border-gray-200 px-6 py-4 dark:border-gray-700'>
        <h2 className='text-2xl font-semibold text-gray-900 dark:text-white'>
          GDPR Data Management
        </h2>
        <p className='mt-2 text-gray-600 dark:text-gray-400'>
          Manage your personal data and exercise your rights under GDPR
        </p>
      </div>

      {/* Tabs */}
      <div className='border-b border-gray-200 dark:border-gray-700'>
        <nav className='flex space-x-8 px-6' aria-label='Tabs'>
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() =>
                  setActiveTab(
                    tab.id as 'overview' | 'export' | 'delete' | 'rectify'
                  )
                }
                className={`flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon className='h-4 w-4' />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className='p-6'>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className='space-y-6'>
            <div className='rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/20'>
              <h3 className='mb-4 text-lg font-semibold text-blue-900 dark:text-blue-100'>
                Your Rights Under GDPR
              </h3>
              <div className='grid gap-4 md:grid-cols-2'>
                <div className='space-y-3'>
                  <div className='flex items-start gap-3'>
                    <Download className='mt-1 h-5 w-5 text-blue-600 dark:text-blue-400' />
                    <div>
                      <h4 className='font-medium text-blue-900 dark:text-blue-100'>
                        Right to Access
                      </h4>
                      <p className='text-sm text-blue-800 dark:text-blue-200'>
                        Export all your personal data
                      </p>
                    </div>
                  </div>
                  <div className='flex items-start gap-3'>
                    <Edit className='mt-1 h-5 w-5 text-blue-600 dark:text-blue-400' />
                    <div>
                      <h4 className='font-medium text-blue-900 dark:text-blue-100'>
                        Right to Rectification
                      </h4>
                      <p className='text-sm text-blue-800 dark:text-blue-200'>
                        Correct inaccurate personal data
                      </p>
                    </div>
                  </div>
                </div>
                <div className='space-y-3'>
                  <div className='flex items-start gap-3'>
                    <Trash2 className='mt-1 h-5 w-5 text-blue-600 dark:text-blue-400' />
                    <div>
                      <h4 className='font-medium text-blue-900 dark:text-blue-100'>
                        Right to Erasure
                      </h4>
                      <p className='text-sm text-blue-800 dark:text-blue-200'>
                        Delete your account and data
                      </p>
                    </div>
                  </div>
                  <div className='flex items-start gap-3'>
                    <Shield className='mt-1 h-5 w-5 text-blue-600 dark:text-blue-400' />
                    <div>
                      <h4 className='font-medium text-blue-900 dark:text-blue-100'>
                        Right to Portability
                      </h4>
                      <p className='text-sm text-blue-800 dark:text-blue-200'>
                        Transfer data to another service
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Requests */}
            <div>
              <h3 className='mb-4 text-lg font-semibold text-gray-900 dark:text-white'>
                Recent Requests
              </h3>
              {recentRequests.length > 0 ? (
                <div className='space-y-3'>
                  {recentRequests.map((request, index) => (
                    <div
                      key={index}
                      className='rounded-lg border border-gray-200 p-4 dark:border-gray-700'
                    >
                      <div className='flex items-center justify-between'>
                        <div>
                          <div className='flex items-center gap-2'>
                            <span className='font-medium text-gray-900 capitalize dark:text-white'>
                              {request.type} Request
                            </span>
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-medium ${
                                request.status === 'completed'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                                  : request.status === 'processing'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                              }`}
                            >
                              {request.status}
                            </span>
                          </div>
                          <p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
                            Requested:{' '}
                            {new Date(request.requestDate).toLocaleDateString()}
                            {request.completionDate && (
                              <span>
                                {' '}
                                • Completed:{' '}
                                {new Date(
                                  request.completionDate
                                ).toLocaleDateString()}
                              </span>
                            )}
                          </p>
                        </div>
                        {request.status === 'completed' &&
                          request.type === 'export' && (
                            <button className='rounded-md bg-blue-600 px-3 py-1 text-sm text-white transition-colors hover:bg-blue-700'>
                              Download
                            </button>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className='text-gray-600 dark:text-gray-400'>
                  No recent requests
                </p>
              )}
            </div>

            {/* Contact Information */}
            <div className='rounded-lg bg-gray-50 p-6 dark:bg-gray-800'>
              <h3 className='mb-3 text-lg font-semibold text-gray-900 dark:text-white'>
                Need Help?
              </h3>
              <p className='mb-4 text-gray-700 dark:text-gray-300'>
                If you have questions about your data or need assistance with
                GDPR requests, contact our Data Protection Officer:
              </p>
              <div className='space-y-2 text-gray-700 dark:text-gray-300'>
                <p>
                  <strong>Email:</strong> dpo@neighbourhoodwash.com
                </p>
                <p>
                  <strong>Response Time:</strong> Within 72 hours for most
                  requests
                </p>
                <p>
                  <strong>Processing Time:</strong> Up to 30 days as required by
                  GDPR
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Export Tab */}
        {activeTab === 'export' && (
          <div className='space-y-6'>
            <div>
              <h3 className='mb-4 text-lg font-semibold text-gray-900 dark:text-white'>
                Export Your Data
              </h3>
              <p className='mb-6 text-gray-700 dark:text-gray-300'>
                Download a copy of all personal data we have about you. This
                includes your profile information, booking history, messages,
                and preferences.
              </p>

              <div className='mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20'>
                <div className='flex items-start gap-3'>
                  <AlertTriangle className='mt-1 h-5 w-5 text-yellow-600 dark:text-yellow-400' />
                  <div>
                    <h4 className='mb-1 font-medium text-yellow-800 dark:text-yellow-200'>
                      Important Information
                    </h4>
                    <ul className='space-y-1 text-sm text-yellow-700 dark:text-yellow-300'>
                      <li>
                        • Data export includes all personal information
                        associated with your account
                      </li>
                      <li>• Processing time: 24-48 hours</li>
                      <li>
                        • You will receive an email with a secure download link
                      </li>
                      <li>• Download link expires after 7 days for security</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className='rounded-lg border border-gray-200 p-6 dark:border-gray-700'>
                <h4 className='mb-4 font-medium text-gray-900 dark:text-white'>
                  Export Format
                </h4>
                <div className='space-y-3'>
                  <label className='flex items-center'>
                    <input
                      type='radio'
                      name='export-format'
                      value='json'
                      checked={exportFormat === 'json'}
                      onChange={(e) =>
                        setExportFormat(e.target.value as 'json' | 'csv')
                      }
                      className='mr-3'
                    />
                    <div>
                      <span className='font-medium text-gray-900 dark:text-white'>
                        JSON Format
                      </span>
                      <p className='text-sm text-gray-600 dark:text-gray-400'>
                        Machine-readable format, preserves data structure
                      </p>
                    </div>
                  </label>
                  <label className='flex items-center'>
                    <input
                      type='radio'
                      name='export-format'
                      value='csv'
                      checked={exportFormat === 'csv'}
                      onChange={(e) =>
                        setExportFormat(e.target.value as 'json' | 'csv')
                      }
                      className='mr-3'
                    />
                    <div>
                      <span className='font-medium text-gray-900 dark:text-white'>
                        CSV Format
                      </span>
                      <p className='text-sm text-gray-600 dark:text-gray-400'>
                        Spreadsheet-friendly format, easy to read
                      </p>
                    </div>
                  </label>
                </div>

                <button
                  onClick={handleDataExport}
                  className='mt-6 flex items-center gap-2 rounded-md bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700'
                >
                  <Download className='h-4 w-4' />
                  Request Data Export
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Tab */}
        {activeTab === 'delete' && (
          <div className='space-y-6'>
            <div>
              <h3 className='mb-4 text-lg font-semibold text-gray-900 dark:text-white'>
                Delete Your Account
              </h3>
              <p className='mb-6 text-gray-700 dark:text-gray-300'>
                Permanently delete your account and all associated data. This
                action cannot be undone.
              </p>

              <div className='mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20'>
                <div className='flex items-start gap-3'>
                  <AlertTriangle className='mt-1 h-5 w-5 text-red-600 dark:text-red-400' />
                  <div>
                    <h4 className='mb-1 font-medium text-red-800 dark:text-red-200'>
                      Before You Delete Your Account
                    </h4>
                    <ul className='space-y-1 text-sm text-red-700 dark:text-red-300'>
                      <li>
                        • All your booking history will be permanently deleted
                      </li>
                      <li>• Active bookings will be cancelled</li>
                      <li>• Your washer reviews and ratings will be removed</li>
                      <li>• This action is irreversible</li>
                      <li>• Processing time: 24-48 hours</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className='rounded-lg border border-gray-200 p-6 dark:border-gray-700'>
                <h4 className='mb-4 font-medium text-gray-900 dark:text-white'>
                  Confirm Account Deletion
                </h4>
                <p className='mb-4 text-gray-700 dark:text-gray-300'>
                  Type <strong>"DELETE MY ACCOUNT"</strong> in the field below
                  to confirm:
                </p>
                <input
                  type='text'
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder='DELETE MY ACCOUNT'
                  className='w-full rounded-md border border-gray-300 bg-white p-3 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white'
                />

                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={deleteConfirmText !== 'DELETE MY ACCOUNT'}
                  className='mt-4 flex items-center gap-2 rounded-md bg-red-600 px-6 py-2 text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-400'
                >
                  <Trash2 className='h-4 w-4' />
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rectify Tab */}
        {activeTab === 'rectify' && (
          <div className='space-y-6'>
            <div>
              <h3 className='mb-4 text-lg font-semibold text-gray-900 dark:text-white'>
                Correct Your Data
              </h3>
              <p className='mb-6 text-gray-700 dark:text-gray-300'>
                Request correction of inaccurate or incomplete personal data in
                your account.
              </p>

              <div className='rounded-lg border border-gray-200 p-6 dark:border-gray-700'>
                <div className='space-y-4'>
                  <div>
                    <label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
                      Data Field to Correct *
                    </label>
                    <select
                      value={rectifyData.field}
                      onChange={(e) =>
                        setRectifyData((prev) => ({
                          ...prev,
                          field: e.target.value,
                        }))
                      }
                      className='w-full rounded-md border border-gray-300 bg-white p-3 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white'
                    >
                      <option value=''>Select a field</option>
                      <option value='name'>Full Name</option>
                      <option value='email'>Email Address</option>
                      <option value='phone'>Phone Number</option>
                      <option value='address'>Address</option>
                      <option value='other'>Other</option>
                    </select>
                  </div>

                  <div>
                    <label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
                      Current Value
                    </label>
                    <input
                      type='text'
                      value={rectifyData.currentValue}
                      onChange={(e) =>
                        setRectifyData((prev) => ({
                          ...prev,
                          currentValue: e.target.value,
                        }))
                      }
                      placeholder='What is currently shown'
                      className='w-full rounded-md border border-gray-300 bg-white p-3 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white'
                    />
                  </div>

                  <div>
                    <label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
                      Correct Value *
                    </label>
                    <input
                      type='text'
                      value={rectifyData.newValue}
                      onChange={(e) =>
                        setRectifyData((prev) => ({
                          ...prev,
                          newValue: e.target.value,
                        }))
                      }
                      placeholder='What it should be'
                      className='w-full rounded-md border border-gray-300 bg-white p-3 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white'
                    />
                  </div>

                  <div>
                    <label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
                      Reason for Correction *
                    </label>
                    <textarea
                      value={rectifyData.reason}
                      onChange={(e) =>
                        setRectifyData((prev) => ({
                          ...prev,
                          reason: e.target.value,
                        }))
                      }
                      placeholder='Explain why this correction is needed'
                      rows={3}
                      className='w-full rounded-md border border-gray-300 bg-white p-3 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white'
                    />
                  </div>

                  <button
                    onClick={handleDataRectification}
                    className='flex items-center gap-2 rounded-md bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700'
                  >
                    <Edit className='h-4 w-4' />
                    Submit Correction Request
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className='fixed inset-0 z-50 overflow-y-auto'>
          <div className='flex min-h-screen items-center justify-center p-4'>
            <div
              className='bg-opacity-50 fixed inset-0 bg-black'
              onClick={() => setShowDeleteConfirm(false)}
            />

            <div className='relative w-full max-w-md rounded-lg bg-white shadow-xl dark:bg-gray-900'>
              <div className='border-b border-gray-200 px-6 py-4 dark:border-gray-700'>
                <div className='flex items-center justify-between'>
                  <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                    Confirm Account Deletion
                  </h3>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  >
                    <X className='h-6 w-6' />
                  </button>
                </div>
              </div>

              <div className='px-6 py-6'>
                <div className='mb-4 flex items-center gap-3'>
                  <AlertTriangle className='h-8 w-8 text-red-600 dark:text-red-400' />
                  <div>
                    <p className='font-medium text-gray-900 dark:text-white'>
                      Are you absolutely sure?
                    </p>
                    <p className='text-sm text-gray-600 dark:text-gray-400'>
                      This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>

              <div className='flex justify-end gap-3 bg-gray-50 px-6 py-4 dark:bg-gray-800'>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className='rounded-md border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                >
                  Cancel
                </button>
                <button
                  onClick={handleDataDeletion}
                  className='rounded-md bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700'
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
