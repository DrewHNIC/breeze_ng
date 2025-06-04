import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import OrderList from './OrderList';
import OrderDetails from './OrderDetails';
import OrderNotifications from './OrderNotifications';
import OrderAnalytics from './OrderAnalytics';

// Define types for our data
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'delivered' | 'cancelled';

export interface OrderItem {
  id: string;
  menu_item_id: string;
  menu_item_name: string;
  quantity: number;
  price_per_item: number;
  special_requests?: string;
  image_url?: string;
}

export interface Order {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  status: OrderStatus;
  total_amount?: number; // Mark as optional with the ? symbol
  delivery_address: string;
  contact_number: string;
  special_instructions?: string;
  created_at: string;
  updated_at: string;
  estimated_delivery_time?: string;
  actual_delivery_time?: string;
  payment_method: string;
  payment_status: string;
  items?: OrderItem[];
}

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Function to refresh orders
  const refreshOrders = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Fetch orders from Supabase
  useEffect(() => {
    async function fetchOrders() {
      setLoading(true);
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        let query = supabase
          .from('orders')
          .select(`
            *,
            customers:customer_id(email)
          `)                   
          .eq('vendor_id', session.user.id)
          .order('created_at', { ascending: false });

        // Apply status filter if not 'all'
        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter);
        }

        // Apply date range filter if provided
        if (dateRange.start) {
          query = query.gte('created_at', dateRange.start);
        }
        if (dateRange.end) {
          query = query.lte('created_at', dateRange.end);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching orders:', error);
          return;
        }

        // Transform the data to match our Order interface
        const formattedOrders: Order[] = data.map(order => ({
          id: order.id,
          customer_id: order.customer_id,
          customer_name: order.customers?.email || 'Unknown', // using email as fallback name
          customer_email: order.profiles?.email || 'Unknown',
          status: order.status,
          total_amount: order.total_amount,
          delivery_address: order.delivery_address,
          contact_number: order.contact_number,
          special_instructions: order.special_instructions,
          created_at: order.created_at,
          updated_at: order.updated_at,
          estimated_delivery_time: order.estimated_delivery_time,
          actual_delivery_time: order.actual_delivery_time,
          payment_method: order.payment_method,
          payment_status: order.payment_status
        }));

        // Filter by search query if provided
        const filteredOrders = searchQuery 
          ? formattedOrders.filter(order => 
              order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
              order.delivery_address.toLowerCase().includes(searchQuery.toLowerCase())
            )
          : formattedOrders;

        setOrders(filteredOrders);
      } catch (error) {
        console.error('Error in fetchOrders:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [statusFilter, searchQuery, dateRange, refreshTrigger]);

  // Fetch order details when an order is selected
  useEffect(() => {
    async function fetchOrderDetails() {
      if (!selectedOrder) return;

      try {
        // Fetch order items
        const { data: orderItems, error: itemsError } = await supabase
          .from('order_items')
          .select(`
            *,
            menu_items(id, name, image_url)
          `)
          .eq('order_id', selectedOrder.id);

        if (itemsError) {
          console.error('Error fetching order items:', itemsError);
          return;
        }

        // Format order items
        const formattedItems: OrderItem[] = orderItems.map(item => ({
          id: item.id,
          menu_item_id: item.menu_item_id,
          menu_item_name: item.menu_items?.name || 'Unknown Item',
          quantity: item.quantity,
          price_per_item: item.price_per_item,
          special_requests: item.special_requests,
          image_url: item.menu_items?.image_url
        }));

        // Update selected order with items
        setSelectedOrder(prev => prev ? { ...prev, items: formattedItems } : null);
      } catch (error) {
        console.error('Error in fetchOrderDetails:', error);
      }
    }

    fetchOrderDetails();
  }, [selectedOrder?.id]);

  // Handle order status update
  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order status:', error);
        return false;
      }

      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus, updated_at: new Date().toISOString() } 
            : order
        )
      );

      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus, updated_at: new Date().toISOString() } : null);
      }

      return true;
    } catch (error) {
      console.error('Error in updateOrderStatus:', error);
      return false;
    }
  };

  // Handle updating estimated delivery time
  const updateEstimatedDeliveryTime = async (orderId: string, estimatedTime: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          estimated_delivery_time: estimatedTime,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) {
        console.error('Error updating estimated delivery time:', error);
        return false;
      }

      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, estimated_delivery_time: estimatedTime, updated_at: new Date().toISOString() } 
            : order
        )
      );

      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => 
          prev ? { ...prev, estimated_delivery_time: estimatedTime, updated_at: new Date().toISOString() } : null
        );
      }

      return true;
    } catch (error) {
      console.error('Error in updateEstimatedDeliveryTime:', error);
      return false;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Order Management</h1>
      <div className="mb-8">
      <OrderAnalytics />

      <OrderNotifications onNewOrder={refreshOrders} />
    </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order List Section - Takes 1/3 of the screen on large devices */}
        <div className="lg:col-span-1 bg-black rounded-lg shadow-md p-4">
          <div className="mb-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
              <input
                type="text"
                placeholder="Search orders..."
                className="border rounded-md px-3 py-2 w-full bg-black text-white focus:ring-2 focus:ring-gray-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              
              <select
                className="border rounded-md px-3 py-2 w-full md:w-auto bg-black text-white focus:ring-2 focus:ring-gray-400"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
                <option value="picked_up">Picked Up</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="w-full md:w-1/2">
                <label className="block text-sm font-medium text-white mb-1">From</label>
                <input
                  type="date"
                  className="border rounded-md px-3 py-2 w-full"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                />
              </div>
              <div className="w-full md:w-1/2">
                <label className="block text-sm font-medium text-black mb-1">To</label>
                <input
                  type="date"
                  className="border rounded-md px-3 py-2 w-full"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                />
              </div>
            </div>
            
            <button
              className="bg-black hover:bg-red-900 text-white font-semibold py-2 px-4 rounded w-full"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setDateRange({ start: '', end: '' });
              }}
            >
              Clear Filters
            </button>
          </div>
          
          
          <OrderList
            orders={orders}
            loading={loading}
            selectedOrderId={selectedOrder?.id}
            onSelectOrder={(order) => setSelectedOrder(order)}
          />
        </div>
        
        {/* Order Details Section - Takes 2/3 of the screen on large devices */}
        <div className="lg:col-span-2 bg-black rounded-lg shadow-md p-4">
          {selectedOrder ? (
            <OrderDetails
              order={selectedOrder}
              onUpdateStatus={updateOrderStatus}
              onUpdateEstimatedTime={updateEstimatedDeliveryTime}
              onRefresh={refreshOrders}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-64">
              <p className="text-white-500 text-lg">Select an order to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}