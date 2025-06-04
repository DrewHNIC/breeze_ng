// components/customer/OrderDetails.tsx
import { ShoppingBag } from 'lucide-react'

interface OrderItem {
  id: string
  menu_item_id: string
  name: string
  price: number
  quantity: number
}

interface Order {
  id: string
  status: string
  total_amount: number
  items: OrderItem[]
  payment_method: string
}

interface OrderDetailsProps {
  order: Order
}

const OrderDetails = ({ order }: OrderDetailsProps) => {
  // Calculate subtotal
  const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  
  // Estimate delivery fee and service fee
  const deliveryFee = 500 // Default delivery fee
  const serviceFee = Math.min(200 + (order.items.reduce((sum, item) => sum + item.quantity, 0) * 50), 500)
  
  // Calculate VAT (7.5% in Nigeria)
  const vat = Math.round(subtotal * 0.075)

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <ShoppingBag className="h-5 w-5 mr-2 text-red-500" />
        Order Summary
      </h2>

      <div className="mb-4">
        <h3 className="font-medium text-gray-700 mb-2">Order Items</h3>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between items-center">
              <div className="flex items-center">
                <span className="bg-red-100 text-red-500 rounded-full w-6 h-6 flex items-center justify-center mr-2">
                  {item.quantity}
                </span>
                <span className="text-sm">{item.name}</span>
              </div>
              <span className="text-sm font-medium">₦{(item.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4 space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Subtotal</span>
          <span>₦{subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Delivery Fee</span>
          <span>₦{deliveryFee.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Service Fee</span>
          <span>₦{serviceFee.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>VAT (7.5%)</span>
          <span>₦{vat.toLocaleString()}</span>
        </div>
        <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
          <span>Total</span>
          <span>₦{order.total_amount.toLocaleString()}</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Payment Method</span>
          <span className="font-medium capitalize">{order.payment_method}</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-gray-600">Payment Status</span>
          <span className={`font-medium ${
            order.status === 'cancelled' ? 'text-red-500' : 'text-green-500'
          }`}>
            {order.status === 'cancelled' ? 'Refunded' : 'Paid'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default OrderDetails