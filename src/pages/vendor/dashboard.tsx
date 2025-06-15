"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import DashboardLayout from "../../components/DashboardLayout"
import StatCard from "../../components/dashboard-widgets/StatCard"
import RevenueChart from "../../components/dashboard-widgets/RevenueChart"
import OrdersTimeline from "../../components/dashboard-widgets/OrdersTimeline"
import TopProducts from "../../components/dashboard-widgets/TopProducts"
import { supabase } from "../../utils/supabase"

interface DashboardData {
  stats: {
    revenue: { value: number; change: number; trend: "up" | "down" }
    orders: { value: number; change: number; trend: "up" | "down" }
    customers: { value: number; change: number; trend: "up" | "down" }
    avgOrder: { value: number; change: number; trend: "up" | "down" }
  }
  revenueData: Array<{ date: string; revenue: number }>
  ordersTimelineData: Array<{ hour: string; orders: number }>
  topProducts: Array<{
    id: string
    name: string
    image: string
    orders: number
    revenue: number
  }>
}

const VendorDashboard: React.FC = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          router.push("/login")
          return
        }

        // Fetch vendor data
        const { data: vendor, error } = await supabase.from("vendors").select("*").eq("id", user.id).single()

        if (error || !vendor) {
          router.push("/login")
          return
        }

        // Fetch real dashboard statistics
        const stats = await fetchRealStats(user.id)
        const revenueData = await fetchRevenueData(user.id)
        const ordersTimelineData = await fetchOrdersTimelineData(user.id)
        const topProducts = await fetchTopProducts(user.id)

        setDashboardData({
          stats,
          revenueData,
          ordersTimelineData,
          topProducts,
        })

        setLoading(false)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [router])

  const fetchRealStats = async (vendorId: string) => {
    try {
      // Get current month and previous month dates
      const now = new Date()
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

      // Fetch current month orders
      const { data: currentOrders, error: currentError } = await supabase
        .from("orders")
        .select("total_amount, customer_id, status")
        .eq("vendor_id", vendorId)
        .gte("created_at", currentMonthStart.toISOString())

      if (currentError) throw currentError

      // Fetch previous month orders for comparison
      const { data: previousOrders, error: previousError } = await supabase
        .from("orders")
        .select("total_amount, customer_id, status")
        .eq("vendor_id", vendorId)
        .gte("created_at", previousMonthStart.toISOString())
        .lte("created_at", previousMonthEnd.toISOString())

      if (previousError) throw previousError

      // Calculate current month stats
      const currentRevenue = currentOrders
        .filter((order) => order.status === "delivered")
        .reduce((sum, order) => sum + Number.parseFloat(order.total_amount), 0)

      const currentOrdersCount = currentOrders.length
      const currentCustomers = new Set(currentOrders.map((order) => order.customer_id)).size
      const currentAvgOrder = currentOrdersCount > 0 ? currentRevenue / currentOrdersCount : 0

      // Calculate previous month stats
      const previousRevenue = previousOrders
        .filter((order) => order.status === "delivered")
        .reduce((sum, order) => sum + Number.parseFloat(order.total_amount), 0)

      const previousOrdersCount = previousOrders.length
      const previousCustomers = new Set(previousOrders.map((order) => order.customer_id)).size
      const previousAvgOrder = previousOrdersCount > 0 ? previousRevenue / previousOrdersCount : 0

      // Calculate percentage changes
      const revenueChange = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0
      const ordersChange =
        previousOrdersCount > 0 ? ((currentOrdersCount - previousOrdersCount) / previousOrdersCount) * 100 : 0
      const customersChange =
        previousCustomers > 0 ? ((currentCustomers - previousCustomers) / previousCustomers) * 100 : 0
      const avgOrderChange = previousAvgOrder > 0 ? ((currentAvgOrder - previousAvgOrder) / previousAvgOrder) * 100 : 0

      return {
        revenue: {
          value: currentRevenue,
          change: Math.round(revenueChange * 10) / 10,
          trend: revenueChange >= 0 ? ("up" as const) : ("down" as const),
        },
        orders: {
          value: currentOrdersCount,
          change: Math.round(ordersChange * 10) / 10,
          trend: ordersChange >= 0 ? ("up" as const) : ("down" as const),
        },
        customers: {
          value: currentCustomers,
          change: Math.round(customersChange * 10) / 10,
          trend: customersChange >= 0 ? ("up" as const) : ("down" as const),
        },
        avgOrder: {
          value: Math.round(currentAvgOrder * 100) / 100,
          change: Math.round(avgOrderChange * 10) / 10,
          trend: avgOrderChange >= 0 ? ("up" as const) : ("down" as const),
        },
      }
    } catch (error) {
      console.error("Error fetching real stats:", error)
      // Return default values on error
      return {
        revenue: { value: 0, change: 0, trend: "up" as const },
        orders: { value: 0, change: 0, trend: "up" as const },
        customers: { value: 0, change: 0, trend: "up" as const },
        avgOrder: { value: 0, change: 0, trend: "up" as const },
      }
    }
  }

  const fetchRevenueData = async (vendorId: string) => {
    try {
      // Get last 30 days of revenue data
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: orders, error } = await supabase
        .from("orders")
        .select("total_amount, created_at")
        .eq("vendor_id", vendorId)
        .eq("status", "delivered")
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: true })

      if (error) throw error

      // Group orders by date
      const revenueByDate: { [key: string]: number } = {}

      orders.forEach((order) => {
        const date = new Date(order.created_at).toISOString().split("T")[0]
        revenueByDate[date] = (revenueByDate[date] || 0) + Number.parseFloat(order.total_amount)
      })

      // Generate array for last 30 days
      const data = []
      for (let i = 30; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split("T")[0]
        data.push({
          date: date.toISOString(),
          revenue: revenueByDate[dateStr] || 0,
        })
      }

      return data
    } catch (error) {
      console.error("Error fetching revenue data:", error)
      return []
    }
  }

  const fetchOrdersTimelineData = async (vendorId: string) => {
    try {
      // Get today's orders grouped by hour
      const today = new Date()
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const todayEnd = new Date(todayStart)
      todayEnd.setDate(todayEnd.getDate() + 1)

      const { data: orders, error } = await supabase
        .from("orders")
        .select("created_at")
        .eq("vendor_id", vendorId)
        .gte("created_at", todayStart.toISOString())
        .lt("created_at", todayEnd.toISOString())

      if (error) throw error

      // Group orders by hour
      const ordersByHour: { [key: number]: number } = {}

      orders.forEach((order) => {
        const hour = new Date(order.created_at).getHours()
        ordersByHour[hour] = (ordersByHour[hour] || 0) + 1
      })

      // Generate array for 24 hours
      return Array.from({ length: 24 }, (_, i) => ({
        hour: `${i.toString().padStart(2, "0")}:00`,
        orders: ordersByHour[i] || 0,
      }))
    } catch (error) {
      console.error("Error fetching orders timeline data:", error)
      return Array.from({ length: 24 }, (_, i) => ({
        hour: `${i.toString().padStart(2, "0")}:00`,
        orders: 0,
      }))
    }
  }

  const fetchTopProducts = async (vendorId: string) => {
    try {
      // Get menu items with order counts and revenue
      const { data: orderItems, error } = await supabase
        .from("order_items")
        .select(`
          menu_item_id,
          quantity,
          total_price,
          order:orders!inner(vendor_id, status)
        `)
        .eq("order.vendor_id", vendorId)
        .eq("order.status", "delivered")

      if (error) throw error

      // Group by menu item
      const itemStats: { [key: string]: { orders: number; revenue: number } } = {}

      orderItems.forEach((item) => {
        const menuItemId = item.menu_item_id
        if (!itemStats[menuItemId]) {
          itemStats[menuItemId] = { orders: 0, revenue: 0 }
        }
        itemStats[menuItemId].orders += item.quantity
        itemStats[menuItemId].revenue += Number.parseFloat(item.total_price)
      })

      // Get menu item details
      const menuItemIds = Object.keys(itemStats)
      if (menuItemIds.length === 0) return []

      const { data: menuItems, error: menuError } = await supabase
        .from("menu_items")
        .select("id, name, image_url")
        .in("id", menuItemIds)

      if (menuError) throw menuError

      // Combine data and sort by revenue
      const topProducts = menuItems
        .map((item) => ({
          id: item.id,
          name: item.name,
          image: item.image_url || "/placeholder.svg",
          orders: itemStats[item.id].orders,
          revenue: itemStats[item.id].revenue,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 4)

      return topProducts
    } catch (error) {
      console.error("Error fetching top products:", error)
      return []
    }
  }

  if (loading || !dashboardData) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#b9c6c8]"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Total Revenue"
          value={`₦${dashboardData.stats.revenue.value.toLocaleString()}`}
          change={dashboardData.stats.revenue.change}
          trend={dashboardData.stats.revenue.trend}
        />
        <StatCard
          title="Total Orders"
          value={dashboardData.stats.orders.value}
          change={dashboardData.stats.orders.change}
          trend={dashboardData.stats.orders.trend}
        />
        <StatCard
          title="Total Customers"
          value={dashboardData.stats.customers.value}
          change={dashboardData.stats.customers.change}
          trend={dashboardData.stats.customers.trend}
        />
        <StatCard
          title="Average Order Value"
          value={`₦${dashboardData.stats.avgOrder.value.toLocaleString()}`}
          change={dashboardData.stats.avgOrder.change}
          trend={dashboardData.stats.avgOrder.trend}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart data={dashboardData.revenueData} />
        </div>
        <div>
          <TopProducts products={dashboardData.topProducts} />
        </div>
      </div>

      <div className="mt-6">
        <OrdersTimeline data={dashboardData.ordersTimelineData} />
      </div>
    </DashboardLayout>
  )
}

export default VendorDashboard
