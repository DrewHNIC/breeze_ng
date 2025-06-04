import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Order } from './OrderManagement';

interface OrderNotificationsProps {
  onNewOrder: () => void;
}

export default function OrderNotifications({ onNewOrder }: OrderNotificationsProps) {
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
  }>({
    show: false,
    message: '',
  });

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    // Set up real-time subscription for new orders
    const setupSubscription = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        const vendorId = session.user.id;
        
        // Subscribe to new orders for this vendor
        const subscription = supabase
          .channel('orders-channel')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'orders',
              filter: `vendor_id=eq.${vendorId}`,
            },
            (payload) => {
              // Show notification
              setNotification({
                show: true,
                message: 'New order received!',
              });
              
              // Trigger refresh
              onNewOrder();
              
              // Hide notification after 5 seconds
              clearTimeout(timeout);
              timeout = setTimeout(() => {
                setNotification(prev => ({ ...prev, show: false }));
              }, 5000);
            }
          )
          .subscribe();
          
        // Clean up subscription
        return () => {
          supabase.removeChannel(subscription);
          clearTimeout(timeout);
        };
      } catch (error) {
        console.error('Error setting up real-time subscription:', error);
      }
    };
    
    setupSubscription();
    
    return () => {
      clearTimeout(timeout);
    };
  }, [onNewOrder]);

  if (!notification.show) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg z-50 animate-bounce">
      <div className="flex items-center">
        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <p>{notification.message}</p>
      </div>
      <button
        className="absolute top-0 right-0 mt-1 mr-1 text-green-700 hover:text-green-900"
        onClick={() => setNotification(prev => ({ ...prev, show: false }))}
      >
        <span className="text-xl">&times;</span>
      </button>
    </div>
  );
}