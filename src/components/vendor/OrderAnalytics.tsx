"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/utils/supabase"

interface AnalyticsData {
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
  pendingOrders: number
  completedOrders: number
  cancelledOrders: number
  topSellingItems: {
    item_name: string
    quantity: number
  }[]
}

export default function OrderAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month" | "all">("week")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true)
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session) return

        const vendorId = session.user.id

        // Get date range
        let startDate: string | null = null
        const now = new Date()

        if (timeRange === "today") {
          startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString()
        } else if (timeRange === "week") {
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          startDate = weekAgo.toISOString()
        } else if (timeRange === "month") {
          const monthAgo = new Date()
          monthAgo.setMonth(monthAgo.getMonth() - 1)
          startDate = monthAgo.toISOString()
        }

        // Build query for orders
        let query = supabase
          .from("orders")
          .select(`
            id, status, total_amount
          `)
          .eq("vendor_id", vendorId)

        if (startDate) {
          query = query.gte("created_at", startDate)
        }

        const { data: orders, error } = await query

        if (error) {
          console.error("Error fetching orders for analytics:", error)
          return
        }

        // Get top selling items
        const itemsQuery = supabase
          .from("order_items")
          .select(`
            quantity,
            menu_item_id,
            menu_items:menu_item_id(name)
          `)
          .in(
            "order_id",
            orders.map((order) => order.id),
          )

        const { data: orderItems, error: itemsError } = await itemsQuery

        if (itemsError) {
          console.error("Error fetching order items for analytics:", itemsError)
          return
        }

        // Calculate analytics
        const totalOrders = orders.length
        const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
        const pendingOrders = orders.filter((order) =>
          ["pending", "confirmed", "preparing", "ready", "picked_up"].includes(order.status),
        ).length
        const completedOrders = orders.filter((order) => order.status === "delivered").length
        const cancelledOrders = orders.filter((order) => order.status === "cancelled").length

        // Calculate top selling items
        const itemCounts: Record<string, number> = {}

        // Process the order items
        orderItems.forEach((item: any) => {
          let itemName = "Unknown Item"

          // Handle menu_items which could be an object or array
          if (item.menu_items) {
            if (Array.isArray(item.menu_items)) {
              if (item.menu_items.length > 0 && item.menu_items[0].name) {
                itemName = item.menu_items[0].name
              }
            } else if (typeof item.menu_items === "object" && item.menu_items.name) {
              itemName = item.menu_items.name
            }
          }

          itemCounts[itemName] = (itemCounts[itemName] || 0) + item.quantity
        })

        const topSellingItems = Object.entries(itemCounts)
          .map(([item_name, quantity]) => ({ item_name, quantity }))
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 5)

        setAnalytics({
          totalOrders,
          totalRevenue,
          averageOrderValue,
          pendingOrders,
          completedOrders,
          cancelledOrders,
          topSellingItems,
        })
      } catch (error) {
        console.error("Error in fetchAnalytics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [timeRange])

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-[#1d2c36] to-[#243642] rounded-lg shadow-md p-4 h-64 flex items-center justify-center border border-[#b9c6c8]/20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#b9c6c8]"></div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="bg-gradient-to-br from-[#1d2c36] to-[#243642] rounded-lg shadow-md p-4 border border-[#b9c6c8]/20">
        <p className="text-[#8f8578]">No analytics data available</p>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-[#1d2c36] to-[#243642] rounded-lg shadow-md p-4 border border-[#b9c6c8]/20 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-[#b9c6c8]">Order Analytics</h3>
        <select
          className="border border-[#b9c6c8]/20 rounded-md px-3 py-2 bg-gradient-to-r from-[#1d2c36] to-[#243642] text-[#b9c6c8] focus:ring-2 focus:ring-[#b9c6c8]/50 focus:outline-none"
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as any)}
        >
          <option value="today">Today</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-[#b9c6c8]/10 to-transparent p-4 rounded-lg border border-[#b9c6c8]/20">
          <p className="text-sm text-[#8f8578] mb-1">Total Orders</p>
          <p className="text-2xl font-bold text-[#b9c6c8]">{analytics.totalOrders}</p>
        </div>
        <div className="bg-gradient-to-r from-[#b9c6c8]/10 to-transparent p-4 rounded-lg border border-[#b9c6c8]/20">
          <p className="text-sm text-[#8f8578] mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-[#b9c6c8]">₦{analytics.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-r from-[#b9c6c8]/10 to-transparent p-4 rounded-lg border border-[#b9c6c8]/20">
          <p className="text-sm text-[#8f8578] mb-1">Average Order Value</p>
          <p className="text-2xl font-bold text-[#b9c6c8]">
            ₦{Math.round(analytics.averageOrderValue).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-[#b9c6c8]/10 to-transparent p-4 rounded-lg border border-[#b9c6c8]/20">
          <p className="text-sm text-[#8f8578] mb-1">Pending Orders</p>
          <p className="text-2xl font-bold text-[#b9c6c8]">{analytics.pendingOrders}</p>
        </div>
        <div className="bg-gradient-to-r from-[#b9c6c8]/10 to-transparent p-4 rounded-lg border border-[#b9c6c8]/20">
          <p className="text-sm text-[#8f8578] mb-1">Completed Orders</p>
          <p className="text-2xl font-bold text-[#b9c6c8]">{analytics.completedOrders}</p>
        </div>
        <div className="bg-gradient-to-r from-[#b9c6c8]/10 to-transparent p-4 rounded-lg border border-[#b9c6c8]/20">
          <p className="text-sm text-[#8f8578] mb-1">Cancelled Orders</p>
          <p className="text-2xl font-bold text-[#b9c6c8]">{analytics.cancelledOrders}</p>
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-3 text-[#b9c6c8]">Top Selling Items</h4>
        {analytics.topSellingItems.length === 0 ? (
          <p className="text-[#8f8578]">No data available</p>
        ) : (
          <div className="bg-gradient-to-r from-[#b9c6c8]/5 to-transparent rounded-lg overflow-hidden border border-[#b9c6c8]/20">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-[#b9c6c8]/20">
                  <th className="px-4 py-2 text-left text-xs font-medium text-[#8f8578] uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[#8f8578] uppercase tracking-wider">
                    Quantity Sold
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#b9c6c8]/10">
                {analytics.topSellingItems.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 whitespace-nowrap text-[#b9c6c8]">{item.item_name}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-[#b9c6c8]">{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
