import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/DashboardLayout';
import VendorProfileManagement from '@/components/vendor/VendorProfileManagement';
import { supabase } from '@/utils/supabase';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isVendor, setIsVendor] = useState(false);

  useEffect(() => {
    async function checkUserRole() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/login');
          return;
        }
        
        // Check if user is a vendor
        const { data: vendor, error } = await supabase
          .from('vendors')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (error || !vendor) {
          console.error('Not a vendor or error:', error);
          router.push('/login');
          return;
        }
        
        setIsVendor(true);
      } catch (error) {
        console.error('Error checking user role:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    
    checkUserRole();
  }, [router]);

  if (loading) {
    return (
      <DashboardLayout title="Profile">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black-900"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isVendor) {
    return null; // Will redirect in useEffect
  }

  return (
    <DashboardLayout title="Profile">
      <VendorProfileManagement />
    </DashboardLayout>
  );
}