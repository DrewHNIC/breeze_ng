import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../components/DashboardLayout';
import StatCard from '../../components/dashboard-widgets/StatCard';
import RevenueChart from '../../components/dashboard-widgets/RevenueChart';
import OrdersTimeline from '../../components/dashboard-widgets/OrdersTimeline';
import TopProducts from '../../components/dashboard-widgets/TopProducts';
import { supabase } from '../../utils/supabase';

interface DashboardData {
  stats: {
    revenue: { value: number; change: number; trend: 'up' | 'down' };
    orders: { value: number; change: number; trend: 'up' | 'down' };
    customers: { value: number; change: number; trend: 'up' | 'down' };
    avgOrder: { value: number; change: number; trend: 'up' | 'down' };
  };
  revenueData: Array<{ date: string; revenue: number }>;
  ordersTimelineData: Array<{ hour: string; orders: number }>;
  topProducts: Array<{
    id: string;
    name: string;
    image: string;
    orders: number;
    revenue: number;
  }>;
}

const VendorDashboard: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        // Fetch vendor data
        const { data: vendor, error } = await supabase
          .from('vendors')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error || !vendor) {
          router.push('/login');
          return;
        }

        // Fetch dashboard data
        // This is mock data for now - replace with real data fetching
        setDashboardData({
          stats: {
            revenue: { value: 93012.02, change: 23.1, trend: 'up' },
            orders: { value: 3002, change: -5.2, trend: 'down' },
            customers: { value: 21230, change: 8.1, trend: 'up' },
            avgOrder: { value: 16.50, change: 12.3, trend: 'up' },
          },
          revenueData: generateRevenueData(),
          ordersTimelineData: generateOrdersTimelineData(),
          topProducts: generateTopProductsData(),
        });

        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  if (loading || !dashboardData) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black-900"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Total Revenue"
          value={`₦${dashboardData.stats.revenue.value.toLocaleString()}`}
          change={dashboardData.stats.revenue.change}
          trend={dashboardData.stats.revenue.trend}
        />
        <StatCard
          title="Total Orders"
          value={dashboardData.stats.orders.value}
          change={dashboardData.stats.orders.change}
          trend={dashboardData.stats.orders.trend}
        />
        <StatCard
          title="Total Customers"
          value={dashboardData.stats.customers.value}
          change={dashboardData.stats.customers.change}
          trend={dashboardData.stats.customers.trend}
        />
        <StatCard
          title="Average Order Value"
          value={`₦${dashboardData.stats.avgOrder.value}`}
          change={dashboardData.stats.avgOrder.change}
          trend={dashboardData.stats.avgOrder.trend}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart data={dashboardData.revenueData} />
        </div>
        <div>
          <TopProducts products={dashboardData.topProducts} />
        </div>
      </div>

      <div className="mt-6">
        <OrdersTimeline data={dashboardData.ordersTimelineData} />
      </div>
    </DashboardLayout>
  );
};

// Helper functions to generate mock data
function generateRevenueData(): Array<{ date: string; revenue: number }> {
  // Generate last 30 days of revenue data
  const data = [];
  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString(),
      revenue: Math.floor(Math.random() * 10000) + 5000,
    });
  }
  return data;
}

function generateOrdersTimelineData(): Array<{ hour: string; orders: number }> {
  // Generate 24 hours of order data
  return Array.from({ length: 24 }, (_, i) => ({
    hour: `${i.toString().padStart(2, '0')}:00`,
    orders: Math.floor(Math.random() * 50) + 10,
  }));
}

function generateTopProductsData(): Array<{
  id: string;
  name: string;
  image: string;
  orders: number;
  revenue: number;
}> {
  // Generate mock top products
  return [
    {
      id: '1',
      name: 'Jollof Rice Special',
      image: '/placeholder.svg',
      orders: 145,
      revenue: 725000,
    },
    {
      id: '2',
      name: 'Chicken Suya',
      image: '/placeholder.svg',
      orders: 132,
      revenue: 660000,
    },
    {
      id: '3',
      name: 'Pepper Soup',
      image: '/placeholder.svg',
      orders: 97,
      revenue: 485000,
    },
    {
      id: '4',
      name: 'Fried Rice Combo',
      image: '/placeholder.svg',
      orders: 89,
      revenue: 445000,
    },
  ];
}

export default VendorDashboard;