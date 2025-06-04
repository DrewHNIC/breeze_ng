import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface OrdersTimelineProps {
  data: Array<{
    hour: string;
    orders: number;
  }>;
}

const OrdersTimeline: React.FC<OrdersTimelineProps> = ({ data }) => {
  return (
    <div className="bg-black-900 rounded-lg p-6">
      <h3 className="text-secondary text-lg font-semibold mb-6">Orders by Hour</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="hour" stroke="#FFFFFF" />
            <YAxis stroke="#FFFFFF" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: 'none', color: '#FFFFFF' }}
              labelStyle={{ color: '#FFFFFF' }}
            />
            <Bar dataKey="orders" fill="#FF0000" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default OrdersTimeline;