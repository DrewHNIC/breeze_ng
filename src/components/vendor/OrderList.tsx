import { useState } from 'react';
import { Order } from './OrderManagement';

interface OrderListProps {
  orders: Order[];
  loading: boolean;
  selectedOrderId?: string;
  onSelectOrder: (order: Order) => void;
}

export default function OrderList({ orders, loading, selectedOrderId, onSelectOrder }: OrderListProps) {
  const [page, setPage] = useState(1);
  const ordersPerPage = 10;
  
  // Calculate pagination
  const totalPages = Math.ceil(orders.length / ordersPerPage);
  const startIndex = (page - 1) * ordersPerPage;
  const paginatedOrders = orders.slice(startIndex, startIndex + ordersPerPage);
  
  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'bg-purple-100 text-purple-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'picked_up':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black-900"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-white">No orders yet</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Orders</h2>
      
      <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
        {paginatedOrders.map((order) => (
          <div
            key={order.id}
            className={`border rounded-lg p-3 cursor-pointer transition-all ${
              selectedOrderId === order.id
                ? 'border-blue-500 bg-blue-50'
                : 'hover:border-gray-400'
            }`}
            onClick={() => onSelectOrder(order)}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-medium">{order.customer_name}</p>
                <p className="text-sm text-gray-500">Order #{order.id.slice(0, 8)}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(order.status)}`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')}
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span>${order.total_amount.toFixed(2)}</span>
              <span>{formatDate(order.created_at)}</span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className={`px-3 py-1 rounded ${
              page === 1
                ? 'bg-gray-100 text-white-400 cursor-not-allowed'
                : 'bg-gray-200 hover:bg-black-300 text-gray-800'
            }`}
          >
            Previous
          </button>
          
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className={`px-3 py-1 rounded ${
              page === totalPages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}