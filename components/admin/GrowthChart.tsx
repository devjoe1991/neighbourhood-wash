'use client'

import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'

interface MonthlyGrowth {
  year: number
  month: number
  monthlyCommission: number
  previousMonth: number | null
  growthPercentage: number | null
}

interface GrowthChartProps {
  data: MonthlyGrowth[]
}

const GrowthChart: React.FC<GrowthChartProps> = ({ data }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(value)
  }

  const formatMonth = (year: number, month: number) => {
    const date = new Date(year, month - 1)
    return date.toLocaleDateString('en-GB', { 
      month: 'short', 
      year: '2-digit' 
    })
  }

  const formatPercentage = (percentage: number | null) => {
    if (percentage === null) return 'N/A'
    const sign = percentage >= 0 ? '+' : ''
    return `${sign}${percentage.toFixed(1)}%`
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-sm">
          <p className="font-medium text-gray-900">
            {formatMonth(data.year, data.month)}
          </p>
          <p className="text-blue-600">
            Revenue: {formatCurrency(payload[0].value)}
          </p>
          {data.growthPercentage !== null && (
            <p className={`text-sm ${data.growthPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              Growth: {formatPercentage(data.growthPercentage)}
            </p>
          )}
        </div>
      )
    }
    return null
  }

  // Prepare data for chart with month labels
  const chartData = data.map(item => ({
    ...item,
    monthLabel: formatMonth(item.year, item.month)
  }))

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        <div className="text-center">
          <p className="text-lg font-medium">No growth data available</p>
          <p className="text-sm">Growth trends will appear here as revenue accumulates</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="monthLabel" 
            className="text-xs"
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            tickFormatter={(value) => formatCurrency(value)}
            className="text-xs"
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="monthlyCommission" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={
                  entry.growthPercentage === null 
                    ? '#94a3b8' 
                    : entry.growthPercentage >= 0 
                      ? '#10b981' 
                      : '#ef4444'
                } 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default GrowthChart 