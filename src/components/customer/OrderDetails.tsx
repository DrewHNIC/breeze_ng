"use client"

import { ShoppingBag, Gift, Truck, Calculator } from 'lucide-react'

interface OrderItem {
  id: string
  menu_item_id: string
  name: string
  price: number
  quantity: number
}

interface Order {
  id: string
  order_code?: string
  status: string
  total_amount: number
  original_amount?: number
  discount_amount?: number
  delivery_fee?: number
  distance_km?: number
  loyalty_points_redeemed?: number
  items: OrderItem[]
  payment_method: string
  payment_status?: string
}

interface OrderDetailsProps {
  order: Order
}

// Function to generate 3-digit order code from order ID
const generateOrderCode = (orderId: string): string => {
  // Use the first 8 characters of the UUID and convert to a 3-digit number
  const hashCode = orderId.substring(0, 8)
  let hash = 0
  for (let i = 0; i < hashCode.length; i++) {
    const char = hashCode.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  // Ensure it's a positive 3-digit number (100-999)
  const code = Math.abs(hash) % 900 + 100
  return code.toString().padStart(3, '0')
}

const OrderDetails = ({ order }: OrderDetailsProps) => {
  // Calculate subtotal from items
  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  // Get actual values from order or calculate fallbacks
  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0)

  // Use actual delivery fee from order or calculate fallback
  const deliveryFee = order.delivery_fee || 1000 // Default minimum delivery fee

  // Calculate service fee (same logic as checkout)
  const serviceFee = Math.min(300 + Math.max(0, totalItems - 1) * 135, 500)

  // Calculate VAT (7.5% in Nigeria)
  const vat = Math.round(subtotal * 0.075)

  // Calculate what the total should be before discount
  const calculatedTotal = subtotal + deliveryFee + serviceFee + vat

  // Use original_amount if available, otherwise use calculated total
  const originalAmount = order.original_amount || calculatedTotal

  // Get discount information
  const discountAmount = order.discount_amount || 0
  const loyaltyPointsRedeemed = order.loyalty_points_redeemed || 0

  // Final total should match order.total_amount
  const finalTotal = order.total_amount

  // Get order code (generate if not available)
  const orderCode = order.order_code || generateOrderCode(order.id)

  return (
    <div className="bg-[#8f8578] rounded-lg shadow-md border border-[#1d2c36] p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center text-[#1d2c36]">
        <ShoppingBag className="h-5 w-5 mr-2 text-[#1d2c36]" />
        Order Summary
      </h2>

      {/* Order Items */}
      <div className="mb-6">
        <h3 className="font-medium text-[#1d2c36] mb-3">Order Items</h3>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between items-center py-2 border-b border-[#1d2c36]/20">
              <div className="flex items-center">
                <span className="bg-[#1d2c36] text-[#8f8578] rounded-full w-6 h-6 flex items-center justify-center mr-3 text-sm font-medium">
                  {item.quantity}
                </span>
                <span className="text-[#1d2c36] font-medium">{item.name}</span>
              </div>
              <span className="text-[#1d2c36] font-medium">₦{(item.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Order Breakdown */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-[#1d2c36]">
          <span>Subtotal ({totalItems} items)</span>
          <span className="font-medium">₦{subtotal.toLocaleString()}</span>
        </div>

        <div className="flex justify-between text-[#1d2c36]">
          <span className="flex items-center">
            <Truck className="h-4 w-4 mr-1" />
            Delivery Fee
            {order.distance_km && <span className="text-xs ml-1 opacity-75">({order.distance_km.toFixed(1)}km)</span>}
          </span>
          <span className="font-medium">₦{deliveryFee.toLocaleString()}</span>
        </div>

        <div className="flex justify-between text-[#1d2c36]">
          <span className="flex items-center">
            <Calculator className="h-4 w-4 mr-1" />
            Service Fee
          </span>
          <span className="font-medium">₦{serviceFee.toLocaleString()}</span>
        </div>

        <div className="flex justify-between text-[#1d2c36]">
          <span>VAT (7.5%)</span>
          <span className="font-medium">₦{vat.toLocaleString()}</span>
        </div>

        {/* Loyalty Discount */}
        {discountAmount > 0 && (
          <div className="flex justify-between text-[#b9c6c8] bg-[#1d2c36] p-3 rounded-lg">
            <span className="flex items-center">
              <Gift className="h-4 w-4 mr-1" />
              Loyalty Discount ({loyaltyPointsRedeemed} pts)
            </span>
            <span className="font-medium">-₦{discountAmount.toLocaleString()}</span>
          </div>
        )}

        {/* Total */}
        <div className="border-t border-[#1d2c36] pt-3 mt-3">
          <div className="flex justify-between font-bold text-lg text-[#1d2c36]">
            <span>Total Paid</span>
            <span>₦{finalTotal.toLocaleString()}</span>
          </div>

          {discountAmount > 0 && (
            <div className="text-right text-sm mt-1 text-[#1d2c36] opacity-75">
              You saved ₦{discountAmount.toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* Payment Information */}
      <div className="pt-4 border-t border-[#1d2c36] space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-[#1d2c36]">Payment Method</span>
          <span className="font-medium text-[#1d2c36] capitalize">{order.payment_method}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-[#1d2c36]">Payment Status</span>
          <span
            className={`font-medium ${
              order.status === "cancelled"
                ? "text-red-500"
                : order.payment_status === "paid" || order.status === "delivered"
                  ? "text-[#b9c6c8]"
                  : "text-yellow-600"
            }`}
          >
            {order.status === "cancelled"
              ? "Refunded"
              : order.payment_status === "paid" || order.status === "delivered"
                ? "Paid"
                : "Processing"}
          </span>
        </div>

        {/* Order ID and Code for reference */}
        <div className="flex justify-between text-sm pt-2 border-t border-[#1d2c36]/30">
          <span className="text-[#1d2c36]">Order Code</span>
          <span className="font-mono text-lg font-bold text-[#1d2c36]">#{orderCode}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-[#1d2c36]">Order ID</span>
          <span className="font-mono text-xs text-[#1d2c36] opacity-75">#{order.id.substring(0, 8)}</span>
        </div>
      </div>
    </div>
  )
}

export default OrderDetails