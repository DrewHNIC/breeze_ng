import { useState } from 'react';
import Image from 'next/image';
import { Order, OrderStatus } from './OrderManagement';
import OrderReceipt from './OrderReceipt';

interface OrderDetailsProps {
  order: Order;
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => Promise<boolean>;
  onUpdateEstimatedTime: (orderId: string, estimatedTime: string) => Promise<boolean>;
  onRefresh: () => void;
}

export default function OrderDetails({ 
  order, 
  onUpdateStatus, 
  onUpdateEstimatedTime,
  onRefresh
}: OrderDetailsProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState(
    order.estimated_delivery_time || ''
  );
  
  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Get next status options based on current status
  const getNextStatusOptions = (currentStatus: OrderStatus): OrderStatus[] => {
    switch (currentStatus) {
      case 'pending':
        return ['confirmed', 'cancelled'];
      case 'confirmed':
        return ['preparing', 'cancelled'];
      case 'preparing':
        return ['ready', 'cancelled'];
      case 'ready':
        return ['picked_up', 'cancelled'];
      case 'picked_up':
        return ['delivered', 'cancelled'];
      case 'delivered':
        return ['delivered']; // No change possible
      case 'cancelled':
        return ['cancelled']; // No change possible
      default:
        return ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled'];
    }
  };
  
  // Handle status update
  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    setIsUpdating(true);
    try {
      const success = await onUpdateStatus(order.id, newStatus);
      if (success) {
        onRefresh();
      }
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Handle estimated time update
  const handleEstimatedTimeUpdate = async () => {
    if (!estimatedTime) return;
    
    setIsUpdating(true);
    try {
      const success = await onUpdateEstimatedTime(order.id, estimatedTime);
      if (success) {
        onRefresh();
      }
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Format status for display
  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };
  
  // Calculate order subtotal
  const calculateSubtotal = () => {
    if (!order.items || order.items.length === 0) return 0;
    return order.items.reduce((sum, item) => {
      const price = item.price_per_item || 0;
      const quantity = item.quantity || 0;
      return sum + (price * quantity);
    }, 0);
  };
  
  // Calculate delivery fee (assuming 10% of subtotal with min $2 and max $10)
  const calculateDeliveryFee = () => {
    const subtotal = calculateSubtotal();
    const fee = subtotal * 0.1;
    return Math.min(Math.max(fee, 2), 10);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Order #{order.id.slice(0, 8)}</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-white">
            {formatDate(order.created_at)}
          </span>
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${
            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
            order.status === 'preparing' ? 'bg-purple-100 text-purple-800' :
            order.status === 'ready' ? 'bg-green-100 text-green-800' :
            order.status === 'picked_up' ? 'bg-indigo-100 text-indigo-800' :
            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800'
          }`}>
            {formatStatus(order.status)}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Customer Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-lg mb-3">Customer Information</h3>
          <div className="space-y-2">
            <p><span className="font-medium">Name:</span> {order.customer_name}</p>
            <p><span className="font-medium">Email:</span> {order.customer_email}</p>
            <p><span className="font-medium">Phone:</span> {order.contact_number}</p>
            <p><span className="font-medium">Address:</span> {order.delivery_address}</p>
            {order.special_instructions && (
              <div>
                <p className="font-medium">Special Instructions:</p>
                <p className="text-sm bg-white p-2 rounded border mt-1">
                  {order.special_instructions}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Order Status Management */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-lg mb-3">Order Status</h3>
          <div className="space-y-4">
            <div>
              <p className="font-medium mb-2">Current Status:</p>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full font-medium ${
                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                  order.status === 'preparing' ? 'bg-purple-100 text-purple-800' :
                  order.status === 'ready' ? 'bg-green-100 text-green-800' :
                  order.status === 'picked_up' ? 'bg-indigo-100 text-indigo-800' :
                  order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {formatStatus(order.status)}
                </span>
                <span className="text-sm text-white">
                  Updated: {formatDate(order.updated_at)}
                </span>
              </div>
            </div>
            
            <div>
              <p className="font-medium mb-2">Update Status:</p>
              <div className="flex flex-wrap gap-2">
                {getNextStatusOptions(order.status).map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusUpdate(status)}
                    disabled={isUpdating || status === order.status}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      status === 'cancelled' 
                        ? 'bg-red-100 hover:bg-red-200 text-red-800' 
                        : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                    } ${
                      (isUpdating || status === order.status) 
                        ? 'opacity-50 cursor-not-allowed' 
                        : ''
                    }`}
                  >
                    {formatStatus(status)}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <p className="font-medium mb-2">Estimated Delivery Time:</p>
              <div className="flex items-end gap-2">
                <input
                  type="datetime-local"
                  className="border rounded-md px-3 py-2"
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(e.target.value)}
                />
                <button
                  onClick={handleEstimatedTimeUpdate}
                  disabled={isUpdating || !estimatedTime}
                  className={`px-3 py-2 rounded-md text-sm font-medium bg-blue-100 hover:bg-blue-200 text-blue-800 ${
                    (isUpdating || !estimatedTime) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  Update
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Current: {formatDate(order.estimated_delivery_time)}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Order Items */}
      <div className="mb-8">
        <h3 className="font-semibold text-lg mb-3">Order Items</h3>
        {!order.items || order.items.length === 0 ? (
          <p className="text-gray-500">No items found for this order</p>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {item.image_url && (
                          <div className="flex-shrink-0 h-10 w-10 mr-4">
                            <Image
                              src={item.image_url || "/placeholder.svg"}
                              alt={item.menu_item_name}
                              width={40}
                              height={40}
                              className="rounded-md object-cover"
                            />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{item.menu_item_name}</div>
                          {item.special_requests && (
                            <div className="text-xs text-gray-500 mt-1">
                              Note: {item.special_requests}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      ${(item.price_per_item || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black font-medium">
                      ${((item.quantity || 0) * (item.price_per_item || 0)).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Order Summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold text-lg mb-3">Order Summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>${calculateSubtotal().toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery Fee:</span>
            <span>${calculateDeliveryFee().toFixed(2)}</span>
          </div>
          <div className="border-t pt-2 mt-2 flex justify-between font-bold">
            <span>Total:</span>
            <span>${(order.total_amount || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Payment Method:</span>
            <span>{order.payment_method.charAt(0).toUpperCase() + order.payment_method.slice(1)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Payment Status:</span>
            <span className={`${
              order.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'
            }`}>
              {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
            </span>
          </div>
          <div className="mt-4">
            <OrderReceipt order={order} />
          </div>
        </div>
      </div>
    </div>
  );
}