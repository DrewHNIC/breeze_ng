"use client"

import { useState } from "react"
import type { Order } from "./OrderManagement"

interface OrderListProps {
  orders: Order[]
  loading: boolean
  selectedOrderId?: string
  onSelectOrder: (order: Order) => void
}

export default function OrderList({ orders, loading, selectedOrderId, onSelectOrder }: OrderListProps) {
  const [page, setPage] = useState(1)
  const ordersPerPage = 10

  // Calculate pagination
  const totalPages = Math.ceil(orders.length / ordersPerPage)
  const startIndex = (page - 1) * ordersPerPage
  const paginatedOrders = orders.slice(startIndex, startIndex + ordersPerPage)

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "confirmed":
        return "bg-blue-100 text-blue-800"
      case "preparing":
        return "bg-purple-100 text-purple-800"
      case "ready":
        return "bg-green-100 text-green-800"
      case "picked_up":
        return "bg-indigo-100 text-indigo-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#b9c6c8]"></div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-[#8f8578]">No orders yet</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-[#b9c6c8]">Orders</h2>

      <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
        {paginatedOrders.map((order) => (
          <div
            key={order.id}
            className={`border rounded-lg p-3 cursor-pointer transition-all duration-200 ${
              selectedOrderId === order.id
                ? "border-[#b9c6c8] bg-gradient-to-r from-[#b9c6c8]/20 to-transparent"
                : "border-[#b9c6c8]/20 hover:border-[#b9c6c8]/40 hover:bg-gradient-to-r hover:from-[#b9c6c8]/10 hover:to-transparent"
            }`}
            onClick={() => onSelectOrder(order)}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-medium text-[#b9c6c8]">{order.customer_name}</p>
                <p className="text-sm text-[#8f8578]">Order #{order.order_code}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(order.status)}`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace("_", " ")}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-[#b9c6c8] font-medium">₦{(order.total_amount || 0).toLocaleString()}</span>
              <span className="text-[#8f8578]">{formatDate(order.created_at)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className={`px-3 py-1 rounded transition-all duration-200 ${
              page === 1
                ? "bg-gradient-to-r from-[#b9c6c8]/20 to-transparent text-[#8f8578] cursor-not-allowed"
                : "bg-gradient-to-r from-[#b9c6c8] to-[#8f8578] hover:from-[#8f8578] hover:to-[#b9c6c8] text-[#1d2c36]"
            }`}
          >
            Previous
          </button>

          <span className="text-sm text-[#8f8578]">
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className={`px-3 py-1 rounded transition-all duration-200 ${
              page === totalPages
                ? "bg-gradient-to-r from-[#b9c6c8]/20 to-transparent text-[#8f8578] cursor-not-allowed"
                : "bg-gradient-to-r from-[#b9c6c8] to-[#8f8578] hover:from-[#8f8578] hover:to-[#b9c6c8] text-[#1d2c36]"
            }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
