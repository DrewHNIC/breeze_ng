import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface RevenueChartProps {
  data: Array<{
    date: string;
    revenue: number;
  }>;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  return (
    <div className="bg-black-900 rounded-lg p-6">
      <h3 className="text-secondary text-lg font-semibold mb-6">Revenue Overview</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF0000" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#FF0000" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="date"
              tickFormatter={(date) => format(new Date(date), 'MMM dd')}
              stroke="#FFFFFF"
            />
            <YAxis 
              stroke="#FFFFFF"
              tickFormatter={(value) => `₦${value.toLocaleString()}`}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: 'none', color: '#FFFFFF' }}
              labelStyle={{ color: '#FFFFFF' }}
              formatter={(value: number) => [`₦${value.toLocaleString()}`, 'Revenue']}
              labelFormatter={(date) => format(new Date(date), 'MMM dd, yyyy')}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#FF0000"
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueChart;