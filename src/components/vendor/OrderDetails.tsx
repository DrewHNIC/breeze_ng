"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { CheckCircle, AlertCircle, Clock, X } from "lucide-react"
import type { Order, OrderStatus } from "./OrderManagement"
import OrderReceipt from "./OrderReceipt"

interface OrderDetailsProps {
  order: Order
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => Promise<boolean>
  onUpdateEstimatedTime: (orderId: string, estimatedTime: string) => Promise<boolean>
  onRefresh: () => void
}

interface Notification {
  id: string
  type: "success" | "warning" | "info" | "error"
  title: string
  message: string
  timestamp: Date
}

export default function OrderDetails({ order, onUpdateStatus, onUpdateEstimatedTime, onRefresh }: OrderDetailsProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    order.estimated_delivery_time
      ? Math.round((new Date(order.estimated_delivery_time).getTime() - new Date().getTime()) / (1000 * 60))
      : 15,
  )

  const [timeAdjustmentCount, setTimeAdjustmentCount] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [timerActive, setTimerActive] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])

  // Add notification function
  const addNotification = (type: Notification["type"], title: string, message: string) => {
    const notification: Notification = {
      id: Date.now().toString(),
      type,
      title,
      message,
      timestamp: new Date(),
    }
    setNotifications((prev) => [notification, ...prev])

    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      removeNotification(notification.id)
    }, 5000)
  }

  // Remove notification function
  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }

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

  // Format time remaining for display
  const formatTimeRemaining = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
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
        addNotification("success", "Status Updated", `Order status has been changed to ${formatStatus(newStatus)}`)
        onRefresh()
      } else {
        addNotification("error", "Update Failed", "Failed to update order status. Please try again.")
      }
    } finally {
      setIsUpdating(false)
    }
  }

  // Handle estimated time update
  const handleEstimatedTimeUpdate = async () => {
    if (!estimatedMinutes || estimatedMinutes < 1 || estimatedMinutes > 1440) return

    // Check if this is the second adjustment
    if (timeAdjustmentCount >= 1) {
      addNotification(
        "warning",
        "Final Time Adjustment",
        "This is your last time adjustment. After this, the timer will countdown until it expires.",
      )
    }

    // Convert minutes to full datetime (now + minutes)
    const estimatedDateTime = new Date()
    estimatedDateTime.setMinutes(estimatedDateTime.getMinutes() + estimatedMinutes)

    setIsUpdating(true)
    try {
      const success = await onUpdateEstimatedTime(order.id, estimatedDateTime.toISOString())
      if (success) {
        // Update adjustment count
        setTimeAdjustmentCount((prev) => prev + 1)

        // Update timer
        const remainingSeconds = estimatedMinutes * 60
        setTimeRemaining(remainingSeconds)
        setTimerActive(true)

        addNotification(
          "success",
          "Timer Updated",
          `Preparation time set to ${estimatedMinutes} minutes. Timer is now active.`,
        )

        onRefresh()
      } else {
        addNotification("error", "Update Failed", "Failed to update estimated time. Please try again.")
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

  // Calculate delivery fee - use actual delivery fee if available
  const calculateDeliveryFee = () => {
    // If we have delivery fee in the order data, use it
    if (order.delivery_fee && order.delivery_fee > 0) {
      return order.delivery_fee
    }
    // Otherwise calculate based on subtotal
    const subtotal = calculateSubtotal()
    const fee = subtotal * 0.1
    return Math.min(Math.max(fee, 200), 1000)
  }

  // Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (timerActive && timeRemaining !== null && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev === null || prev <= 1) {
            setTimerActive(false)
            addNotification(
              "warning",
              "Timer Expired",
              "The estimated preparation time has expired. Please update the customer if needed.",
            )
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else if (timeRemaining === 0) {
      setTimerActive(false)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [timerActive, timeRemaining])

  // Initialize timer when order status changes to confirmed or preparing
  useEffect(() => {
    if (
      order.estimated_delivery_time &&
      (order.status === "confirmed" || order.status === "preparing" || order.status === "ready")
    ) {
      const estimatedTime = new Date(order.estimated_delivery_time).getTime()
      const currentTime = new Date().getTime()
      const remainingSeconds = Math.max(0, Math.floor((estimatedTime - currentTime) / 1000))

      setTimeRemaining(remainingSeconds)
      setTimerActive(remainingSeconds > 0)
    } else {
      setTimeRemaining(null)
      setTimerActive(false)
    }
  }, [order.estimated_delivery_time, order.status])

  // Get notification icon
  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case "info":
        return <Clock className="h-5 w-5 text-blue-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  // Get notification colors
  const getNotificationColors = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return "border-green-200 bg-green-50"
      case "error":
        return "border-red-200 bg-red-50"
      case "warning":
        return "border-yellow-200 bg-yellow-50"
      case "info":
        return "border-blue-200 bg-blue-50"
      default:
        return "border-gray-200 bg-gray-50"
    }
  }

  return (
    <div className="p-6 relative">
      {/* Notification Container */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`border rounded-lg p-4 shadow-lg backdrop-blur-sm transition-all duration-300 ${getNotificationColors(
                notification.type,
              )}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900">{notification.title}</h4>
                    <p className="text-sm text-gray-700 mt-1">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-2">{notification.timestamp.toLocaleTimeString()}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
              <p className="font-medium mb-2 text-[#b9c6c8]">Estimated Preparation Time:</p>

              {/* Digital Timer Display */}
              {timeRemaining !== null && timerActive && (
                <div className="mb-4 p-4 bg-gradient-to-r from-[#1d2c36] to-[#243642] rounded-lg border border-[#b9c6c8]/20">
                  <div className="text-center">
                    <div className="text-3xl font-mono font-bold text-[#b9c6c8] mb-2">
                      {formatTimeRemaining(timeRemaining)}
                    </div>
                    <div className="text-sm text-[#8f8578]">
                      {timeRemaining > 0 ? "Time Remaining" : "Time Expired"}
                    </div>
                    {timeRemaining === 0 && (
                      <div className="text-red-400 text-sm font-medium mt-1">⚠️ Estimated time has expired</div>
                    )}
                  </div>
                </div>
              )}

              {/* Time Adjustment Controls */}
              <div className="flex items-end gap-2 mb-2">
                <div className="flex-1">
                  <label className="block text-sm text-[#8f8578] mb-1">Minutes:</label>
                  <input
                    type="number"
                    min="1"
                    max="1440"
                    className="border border-[#b9c6c8]/20 rounded-md px-3 py-2 bg-gradient-to-r from-[#1d2c36] to-[#243642] text-[#b9c6c8] focus:ring-2 focus:ring-[#b9c6c8]/50 focus:outline-none w-full"
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                    disabled={timeAdjustmentCount >= 2}
                  />
                </div>
                <button
                  onClick={handleEstimatedTimeUpdate}
                  disabled={
                    isUpdating ||
                    !estimatedMinutes ||
                    estimatedMinutes < 1 ||
                    estimatedMinutes > 1440 ||
                    timeAdjustmentCount >= 2
                  }
                  className={`px-4 py-2 rounded-md text-sm font-medium bg-gradient-to-r from-[#b9c6c8] to-[#8f8578] text-[#1d2c36] hover:from-[#8f8578] hover:to-[#b9c6c8] transition-all duration-200 ${
                    isUpdating ||
                    !estimatedMinutes ||
                    estimatedMinutes < 1 ||
                    estimatedMinutes > 1440 ||
                    timeAdjustmentCount >= 2
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {timeAdjustmentCount >= 2 ? "Max Adjustments" : "Update"}
                </button>
              </div>

              {/* Timer Status and Adjustment Info */}
              <div className="text-xs text-[#8f8578] space-y-1">
                <p>Current: {formatTime(order.estimated_delivery_time)} | Range: You have a minimum of 1 minute, and a maximum of 24 minutes for your orders!</p>
                <p>
                  Time adjustments: {timeAdjustmentCount}/2
                  {timeAdjustmentCount === 0 && " (You can adjust the time twice)"}
                  {timeAdjustmentCount === 1 && " (One more adjustment allowed)"}
                  {timeAdjustmentCount >= 2 && " (No more adjustments allowed - timer will countdown to expiry)"}
                </p>
                {(order.status === "confirmed" || order.status === "preparing" || order.status === "ready") &&
                  !timerActive &&
                  timeRemaining === null && (
                    <p className="text-yellow-400">⏰ Set an estimated time to start the countdown timer</p>
                  )}
              </div>
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
              <div className="min-w-full">
                <table className="w-full divide-y divide-[#b9c6c8]/20" style={{ minWidth: "600px" }}>
                  <thead className="bg-gradient-to-r from-[#b9c6c8]/10 to-transparent">
                    <tr>
                      <th
                        scope="col"
                        className="px-4 py-4 text-left text-xs font-medium text-[#8f8578] uppercase tracking-wider"
                        style={{ minWidth: "200px" }}
                      >
                        Item
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-4 text-left text-xs font-medium text-[#8f8578] uppercase tracking-wider"
                        style={{ minWidth: "80px" }}
                      >
                        Quantity
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-4 text-left text-xs font-medium text-[#8f8578] uppercase tracking-wider"
                        style={{ minWidth: "100px" }}
                      >
                        Price
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-4 text-left text-xs font-medium text-[#8f8578] uppercase tracking-wider"
                        style={{ minWidth: "120px" }}
                      >
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gradient-to-r from-[#1d2c36] to-[#243642] divide-y divide-[#b9c6c8]/10">
                    {order.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-4" style={{ minWidth: "200px" }}>
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
                              <div className="font-medium text-[#b9c6c8] text-sm">{item.menu_item_name}</div>
                              {item.special_requests && (
                                <div className="text-xs text-[#8f8578] mt-1">Note: {item.special_requests}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-[#8f8578]" style={{ minWidth: "80px" }}>
                          {item.quantity}
                        </td>
                        <td
                          className="px-4 py-4 whitespace-nowrap text-sm text-[#b9c6c8]"
                          style={{ minWidth: "100px" }}
                        >
                          ₦{(item.price_per_item || 0).toLocaleString()}
                        </td>
                        <td
                          className="px-4 py-4 whitespace-nowrap text-sm text-[#b9c6c8] font-medium"
                          style={{ minWidth: "120px" }}
                        >
                          ₦{((item.quantity || 0) * (item.price_per_item || 0)).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
            <span>₦{Math.round(calculateSubtotal()).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-[#8f8578]">
            <span>Delivery Fee:</span>
            <span>₦{Math.round(calculateDeliveryFee()).toLocaleString()}</span>
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
