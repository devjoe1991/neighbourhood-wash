'use client'

import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

interface DailyRevenue {
  date: string
  bookings: number
  grossRevenue: number
  commission: number
  averageCommission: number
}

interface RevenueChartProps {
  data: DailyRevenue[]
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', { 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-sm">
          <p className="font-medium text-gray-900">
            {label ? formatDate(label) : ''}
          </p>
          <p className="text-blue-600">
            Commission: {formatCurrency(payload[0].value)}
          </p>
          <p className="text-gray-600 text-sm">
            {payload[0].payload.bookings} bookings
          </p>
        </div>
      )
    }
    return null
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        <div className="text-center">
          <p className="text-lg font-medium">No revenue data available</p>
          <p className="text-sm">Revenue will appear here as bookings are completed</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatDate}
            className="text-xs"
          />
          <YAxis 
            tickFormatter={(value) => formatCurrency(value)}
            className="text-xs"
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="commission" 
            stroke="#3498db" 
            strokeWidth={2}
            dot={{ r: 4, fill: '#3498db' }}
            activeDot={{ r: 6, stroke: '#3498db', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default RevenueChart 