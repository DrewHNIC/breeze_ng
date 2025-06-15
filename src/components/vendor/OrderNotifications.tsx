"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/utils/supabase"
import { Bell, X } from "lucide-react"

interface OrderNotificationsProps {
  onNewOrder: () => void
}

interface Notification {
  id: string
  message: string
  type: "new_order" | "status_update" | "payment"
  timestamp: string
  read: boolean
}

export default function OrderNotifications({ onNewOrder }: OrderNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // Set up real-time subscription for new orders
    const setupSubscription = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session) return

        const vendorId = session.user.id

        const subscription = supabase
          .channel("order-notifications")
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "orders",
              filter: `vendor_id=eq.${vendorId}`,
            },
            (payload) => {
              // Add new order notification
              const newNotification: Notification = {
                id: `new-order-${payload.new.id}`,
                message: `New order received from ${payload.new.customer_name || "Customer"}`,
                type: "new_order",
                timestamp: new Date().toISOString(),
                read: false,
              }

              setNotifications((prev) => [newNotification, ...prev])
              setUnreadCount((prev) => prev + 1)
              onNewOrder()

              // Show browser notification if permission granted
              if (Notification.permission === "granted") {
                new Notification("New Order Received!", {
                  body: newNotification.message,
                  icon: "/favicon.ico",
                })
              }
            },
          )
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "orders",
              filter: `vendor_id=eq.${vendorId}`,
            },
            (payload) => {
              // Add status update notification
              const statusNotification: Notification = {
                id: `status-update-${payload.new.id}-${Date.now()}`,
                message: `Order status updated to ${payload.new.status}`,
                type: "status_update",
                timestamp: new Date().toISOString(),
                read: false,
              }

              setNotifications((prev) => [statusNotification, ...prev])
              setUnreadCount((prev) => prev + 1)
            },
          )
          .subscribe()

        return () => {
          supabase.removeChannel(subscription)
        }
      } catch (error) {
        console.error("Error setting up notifications:", error)
      }
    }

    setupSubscription()

    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [onNewOrder])

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === notificationId ? { ...notification, read: true } : notification)),
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
    setUnreadCount(0)
  }

  const removeNotification = (notificationId: string) => {
    const notification = notifications.find((n) => n.id === notificationId)
    if (notification && !notification.read) {
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "new_order":
        return "🛒"
      case "status_update":
        return "📋"
      case "payment":
        return "💳"
      default:
        return "📢"
    }
  }

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 text-[#8f8578] hover:text-[#b9c6c8] transition-colors duration-200"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-gradient-to-br from-[#1d2c36] to-[#243642] border border-[#b9c6c8]/20 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
          <div className="p-4 border-b border-[#b9c6c8]/20">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#b9c6c8]">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-[#8f8578] hover:text-[#b9c6c8] transition-colors"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-[#8f8578] hover:text-[#b9c6c8] transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-[#8f8578]">No notifications yet</div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 border-b border-[#b9c6c8]/10 hover:bg-gradient-to-r hover:from-[#b9c6c8]/10 hover:to-transparent transition-all duration-200 ${
                    !notification.read ? "bg-gradient-to-r from-[#b9c6c8]/5 to-transparent" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2 flex-1">
                      <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                      <div className="flex-1">
                        <p
                          className={`text-sm ${!notification.read ? "text-[#b9c6c8] font-medium" : "text-[#8f8578]"}`}
                        >
                          {notification.message}
                        </p>
                        <p className="text-xs text-[#8f8578] mt-1">{formatTime(notification.timestamp)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="w-2 h-2 bg-[#b9c6c8] rounded-full"
                          title="Mark as read"
                        />
                      )}
                      <button
                        onClick={() => removeNotification(notification.id)}
                        className="text-[#8f8578] hover:text-red-400 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
