'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Crown, TrendingUp } from 'lucide-react'

interface TopWasher {
  washerName: string
  bookingsCompleted: number
  commissionGenerated: number
  averageBookingValue: number
}

interface TopWashersTableProps {
  washers: TopWasher[]
}

const TopWashersTable: React.FC<TopWashersTableProps> = ({ washers }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(value)
  }

  if (!washers || washers.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        <div className="text-center">
          <TrendingUp className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-lg font-medium">No washer data available</p>
          <p className="text-sm">Top performing washers will appear here as bookings are completed</p>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rank
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Washer
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Bookings
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Commission Generated
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Avg Booking Value
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Performance
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {washers.map((washer, index) => (
            <tr key={`${washer.washerName}-${index}`} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {index === 0 && (
                    <Crown className="h-4 w-4 text-yellow-500 mr-2" />
                  )}
                  <span className="text-sm font-medium text-gray-900">
                    #{index + 1}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-8 w-8">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-800">
                        {washer.washerName.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {washer.washerName || 'Unknown Washer'}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {washer.bookingsCompleted}
                </div>
                <div className="text-sm text-gray-500">
                  bookings
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {formatCurrency(washer.commissionGenerated)}
                </div>
                <div className="text-sm text-gray-500">
                  platform revenue
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {formatCurrency(washer.averageBookingValue)}
                </div>
                <div className="text-sm text-gray-500">
                  per booking
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center space-x-2">
                  {index < 3 && (
                    <Badge 
                      variant={index === 0 ? "default" : "secondary"}
                      className={
                        index === 0 
                          ? "bg-yellow-100 text-yellow-800 border-yellow-300" 
                          : index === 1 
                            ? "bg-gray-100 text-gray-800 border-gray-300"
                            : "bg-orange-100 text-orange-800 border-orange-300"
                      }
                    >
                      {index === 0 ? "🥇 Top Performer" : index === 1 ? "🥈 Runner-up" : "🥉 Third Place"}
                    </Badge>
                  )}
                  {washer.averageBookingValue > 75 && (
                    <Badge variant="outline" className="border-green-300 text-green-700">
                      High Value
                    </Badge>
                  )}
                  {washer.bookingsCompleted > 10 && (
                    <Badge variant="outline" className="border-blue-300 text-blue-700">
                      Active
                    </Badge>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Summary footer */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>
            Showing top {washers.length} washers from the last 30 days
          </span>
          <span>
            Total Commission: {formatCurrency(washers.reduce((sum, w) => sum + w.commissionGenerated, 0))}
          </span>
        </div>
      </div>
    </div>
  )
}

export default TopWashersTable 