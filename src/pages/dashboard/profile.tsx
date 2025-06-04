import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../components/DashboardLayout';
import { supabase } from '../../utils/supabase';

const Profile: React.FC = () => {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
      } else {
        const { data: customer } = await supabase.from('customers').select('*').eq('id', user.id).single();
        const { data: vendor } = await supabase.from('vendors').select('*').eq('id', user.id).single();
        const { data: rider } = await supabase.from('riders').select('*').eq('id', user.id).single();
        const { data: affiliate } = await supabase.from('affiliates').select('*').eq('id', user.id).single();

        setProfile(customer || vendor || rider || affiliate);
      }
    };

    fetchProfile();
  }, [router]);

  if (!profile) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout title="Profile">
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Your Profile</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-semibold">Name:</p>
            <p>{profile.name}</p>
          </div>
          <div>
            <p className="font-semibold">Email:</p>
            <p>{profile.email}</p>
          </div>
          {/* Add more profile fields based on user type */}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;