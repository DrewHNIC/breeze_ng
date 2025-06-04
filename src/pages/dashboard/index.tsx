import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../components/DashboardLayout';
import { supabase } from '../../utils/supabase';

const Dashboard: React.FC = () => {
  const router = useRouter();
  const [userType, setUserType] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
      } else {
        const { data: customer } = await supabase.from('customers').select('*').eq('id', user.id).single();
        const { data: vendor } = await supabase.from('vendors').select('*').eq('id', user.id).single();
        const { data: rider } = await supabase.from('riders').select('*').eq('id', user.id).single();
        const { data: affiliate } = await supabase.from('affiliates').select('*').eq('id', user.id).single();

        if (customer) setUserType('customer');
        else if (vendor) setUserType('vendor');
        else if (rider) setUserType('rider');
        else if (affiliate) setUserType('affiliate');
      }
    };

    checkUser();
  }, [router]);

  if (!userType) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout title="Dashboard">
      <h3 className="text-xl mb-4">Welcome, {userType}!</h3>
      {/* Add user-specific dashboard content here */}
    </DashboardLayout>
  );
};

export default Dashboard;