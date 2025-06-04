import React from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down';
  metric?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, trend, metric }) => {
  return (
    <div className="bg-black-900 rounded-lg p-6 hover:bg-gray-800 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-secondary text-sm font-medium">{title}</h3>
        {trend === 'up' ? (
          <ArrowUp className="w-4 h-4 text-green-500" />
        ) : (
          <ArrowDown className="w-4 h-4 text-red-500" />
        )}
      </div>
      <div className="flex items-baseline">
        <p className="text-2xl font-semibold text-secondary">{value}</p>
        {metric && <span className="ml-2 text-sm text-gray-400">{metric}</span>}
      </div>
      <p className={`mt-2 text-sm ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
        {change}% from last month
      </p>
    </div>
  );
};

export default StatCard;