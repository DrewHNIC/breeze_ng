"use client"

import { useState } from "react"
import Image from "next/image"
import type { Order, OrderStatus } from "./OrderManagement"
import OrderReceipt from "./OrderReceipt"

interface OrderDetailsProps {
  order: Order
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => Promise<boolean>
  onUpdateEstimatedTime: (orderId: string, estimatedTime: string) => Promise<boolean>
  onRefresh: () => void
}

export default function OrderDetails({ order, onUpdateStatus, onUpdateEstimatedTime, onRefresh }: OrderDetailsProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    order.estimated_delivery_time
      ? Math.round((new Date(order.estimated_delivery_time).getTime() - new Date().getTime()) / (1000 * 60))
      : 15,
  )

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set"

    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  // Format time only
  const formatTime = (dateString?: string) => {
    if (!dateString) return "Not set"

    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  // Get next status options based on current status
  const getNextStatusOptions = (currentStatus: OrderStatus): OrderStatus[] => {
    switch (currentStatus) {
      case "pending":
        return ["confirmed", "cancelled"]
      case "confirmed":
        return ["preparing", "cancelled"]
      case "preparing":
        return ["ready", "cancelled"]
      case "ready":
        return ["picked_up", "cancelled"]
      case "picked_up":
        return ["delivered", "cancelled"]
      case "delivered":
        return ["delivered"] // No change possible
      case "cancelled":
        return ["cancelled"] // No change possible
      default:
        return ["pending", "confirmed", "preparing", "ready", "picked_up", "delivered", "cancelled"]
    }
  }

  // Handle status update
  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    setIsUpdating(true)
    try {
      const success = await onUpdateStatus(order.id, newStatus)
      if (success) {
        onRefresh()
      }
    } finally {
      setIsUpdating(false)
    }
  }

  // Handle estimated time update
  const handleEstimatedTimeUpdate = async () => {
    if (!estimatedMinutes || estimatedMinutes < 1 || estimatedMinutes > 24) return

    // Convert minutes to full datetime (now + minutes)
    const estimatedDateTime = new Date()
    estimatedDateTime.setMinutes(estimatedDateTime.getMinutes() + estimatedMinutes)

    setIsUpdating(true)
    try {
      const success = await onUpdateEstimatedTime(order.id, estimatedDateTime.toISOString())
      if (success) {
        onRefresh()
      }
    } finally {
      setIsUpdating(false)
    }
  }

  // Format status for display
  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")
  }

  // Calculate order subtotal
  const calculateSubtotal = () => {
    if (!order.items || order.items.length === 0) return 0
    return order.items.reduce((sum, item) => {
      const price = item.price_per_item || 0
      const quantity = item.quantity || 0
      return sum + price * quantity
    }, 0)
  }

  // Calculate delivery fee (assuming 10% of subtotal with min ₦200 and max ₦1000)
  const calculateDeliveryFee = () => {
    const subtotal = calculateSubtotal()
    const fee = subtotal * 0.1
    return Math.min(Math.max(fee, 200), 1000)
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-[#b9c6c8]">Order #{order.order_code}</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#8f8578]">{formatDate(order.created_at)}</span>
          <span
            className={`text-xs px-3 py-1 rounded-full font-medium ${
              order.status === "pending"
                ? "bg-yellow-100 text-yellow-800"
                : order.status === "confirmed"
                  ? "bg-blue-100 text-blue-800"
                  : order.status === "preparing"
                    ? "bg-purple-100 text-purple-800"
                    : order.status === "ready"
                      ? "bg-green-100 text-green-800"
                      : order.status === "picked_up"
                        ? "bg-indigo-100 text-indigo-800"
                        : order.status === "delivered"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
            }`}
          >
            {formatStatus(order.status)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Customer Information */}
        <div className="bg-gradient-to-r from-[#b9c6c8]/10 to-transparent p-6 rounded-lg border border-[#b9c6c8]/20">
          <h3 className="font-semibold text-lg mb-4 text-[#b9c6c8]">Customer Information</h3>
          <div className="space-y-3">
            <p className="text-[#8f8578]">
              <span className="font-medium text-[#b9c6c8]">Name:</span> {order.customer_name}
            </p>
            <p className="text-[#8f8578]">
              <span className="font-medium text-[#b9c6c8]">Phone:</span> {order.customer_phone}
            </p>
            <p className="text-[#8f8578]">
              <span className="font-medium text-[#b9c6c8]">Address:</span> {order.delivery_address}
            </p>
            {order.special_instructions && (
              <div>
                <p className="font-medium text-[#b9c6c8] mb-2">Special Instructions:</p>
                <p className="text-sm bg-gradient-to-r from-[#1d2c36] to-[#243642] p-3 rounded border border-[#b9c6c8]/20 text-[#8f8578]">
                  {order.special_instructions}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Order Status Management */}
        <div className="bg-gradient-to-r from-[#b9c6c8]/10 to-transparent p-6 rounded-lg border border-[#b9c6c8]/20">
          <h3 className="font-semibold text-lg mb-4 text-[#b9c6c8]">Order Status</h3>
          <div className="space-y-4">
            <div>
              <p className="font-medium mb-2 text-[#b9c6c8]">Current Status:</p>
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full font-medium ${
                    order.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : order.status === "confirmed"
                        ? "bg-blue-100 text-blue-800"
                        : order.status === "preparing"
                          ? "bg-purple-100 text-purple-800"
                          : order.status === "ready"
                            ? "bg-green-100 text-green-800"
                            : order.status === "picked_up"
                              ? "bg-indigo-100 text-indigo-800"
                              : order.status === "delivered"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                  }`}
                >
                  {formatStatus(order.status)}
                </span>
                <span className="text-sm text-[#8f8578]">Updated: {formatDate(order.updated_at)}</span>
              </div>
            </div>

            <div>
              <p className="font-medium mb-2 text-[#b9c6c8]">Update Status:</p>
              <div className="flex flex-wrap gap-2">
                {getNextStatusOptions(order.status).map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusUpdate(status)}
                    disabled={isUpdating || status === order.status}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                      status === "cancelled"
                        ? "bg-red-100 hover:bg-red-200 text-red-800"
                        : "bg-blue-100 hover:bg-blue-200 text-blue-800"
                    } ${isUpdating || status === order.status ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {formatStatus(status)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="font-medium mb-2 text-[#b9c6c8]">Estimated Preparation Time (minutes):</p>
              <div className="flex items-end gap-2">
                <input
                  type="number"
                  min="1"
                  max="24"
                  className="border border-[#b9c6c8]/20 rounded-md px-3 py-2 bg-gradient-to-r from-[#1d2c36] to-[#243642] text-[#b9c6c8] focus:ring-2 focus:ring-[#b9c6c8]/50 focus:outline-none w-20"
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                />
                <button
                  onClick={handleEstimatedTimeUpdate}
                  disabled={isUpdating || !estimatedMinutes || estimatedMinutes < 1 || estimatedMinutes > 24}
                  className={`px-3 py-2 rounded-md text-sm font-medium bg-gradient-to-r from-[#b9c6c8] to-[#8f8578] text-[#1d2c36] hover:from-[#8f8578] hover:to-[#b9c6c8] transition-all duration-200 ${
                    isUpdating || !estimatedMinutes || estimatedMinutes < 1 || estimatedMinutes > 24
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  Update
                </button>
              </div>
              <p className="text-sm text-[#8f8578] mt-1">
                Current: {formatTime(order.estimated_delivery_time)} | Range: 1-24 minutes
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="mb-8">
        <h3 className="font-semibold text-lg mb-4 text-[#b9c6c8]">Order Items</h3>
        {!order.items || order.items.length === 0 ? (
          <p className="text-[#8f8578]">No items found for this order</p>
        ) : (
          <div className="border border-[#b9c6c8]/20 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#b9c6c8]/20">
                <thead className="bg-gradient-to-r from-[#b9c6c8]/10 to-transparent">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-medium text-[#8f8578] uppercase tracking-wider"
                    >
                      Item
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-medium text-[#8f8578] uppercase tracking-wider"
                    >
                      Quantity
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-medium text-[#8f8578] uppercase tracking-wider"
                    >
                      Price
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-medium text-[#8f8578] uppercase tracking-wider"
                    >
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gradient-to-r from-[#1d2c36] to-[#243642] divide-y divide-[#b9c6c8]/10">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {item.image_url && (
                            <div className="flex-shrink-0 h-12 w-12 mr-4">
                              <Image
                                src={item.image_url || "/placeholder.svg"}
                                alt={item.menu_item_name}
                                width={48}
                                height={48}
                                className="rounded-md object-cover"
                              />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-medium text-[#b9c6c8] text-sm md:text-base">{item.menu_item_name}</div>
                            {item.special_requests && (
                              <div className="text-xs text-[#8f8578] mt-1">Note: {item.special_requests}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#8f8578]">{item.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#b9c6c8]">
                        ₦{(item.price_per_item || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#b9c6c8] font-medium">
                        ₦{((item.quantity || 0) * (item.price_per_item || 0)).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Order Summary */}
      <div className="bg-gradient-to-r from-[#b9c6c8]/10 to-transparent p-6 rounded-lg border border-[#b9c6c8]/20">
        <h3 className="font-semibold text-lg mb-4 text-[#b9c6c8]">Order Summary</h3>
        <div className="space-y-3">
          <div className="flex justify-between text-[#8f8578]">
            <span>Subtotal:</span>
            <span>₦{(calculateSubtotal() || 0).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-[#8f8578]">
            <span>Delivery Fee:</span>
            <span>₦{(calculateDeliveryFee() || 0).toLocaleString()}</span>
          </div>
          <div className="border-t border-[#b9c6c8]/20 pt-3 mt-3 flex justify-between font-bold text-[#b9c6c8] text-lg">
            <span>Total:</span>
            <span>₦{(order.total_amount || 0).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm text-[#8f8578]">
            <span>Payment Method:</span>
            <span>{order.payment_method.charAt(0).toUpperCase() + order.payment_method.slice(1)}</span>
          </div>
          <div className="flex justify-between text-sm text-[#8f8578]">
            <span>Payment Status:</span>
            <span className="text-green-400">Successful</span>
          </div>
          <div className="mt-6">
            <OrderReceipt order={order} />
          </div>
        </div>
      </div>
    </div>
  )
}
