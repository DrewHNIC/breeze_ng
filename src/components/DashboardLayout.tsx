"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { supabase } from "../../utils/supabase"
import DashboardLayout from "../../components/DashboardLayout"
import {
  DollarSign,
  ShoppingBag,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Package,
  Calendar,
  ArrowUp,
  ArrowDown,
} from "lucide-react"

interface DashboardStats {
  totalRevenue: number
  totalOrders: number
  totalCustomers: number
  averageOrderValue: number
  pendingOrders: number
  completedOrders: number
  todayOrders: number
  monthlyRevenue: number
  revenueGrowth: number
  orderGrowth: number
}

interface RecentOrder {
  id: string
  customer_name: string
  total_amount: number
  status: string
  created_at: string
  items_count: number
}

const VendorDashboard = () => {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    averageOrderValue: 0,
    pendingOrders: 0,
    completedOrders: 0,
    todayOrders: 0,
    monthlyRevenue: 0,
    revenueGrowth: 0,
    orderGrowth: 0,
  })
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [vendorId, setVendorId] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (vendorId) {
      fetchDashboardData()
    }
  }, [vendorId])

  const checkAuth = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push("/login")
        return
      }

      // Check if user is a vendor
      const { data, error } = await supabase.from("vendors").select("id").eq("id", session.user.id).single()

      if (error || !data) {
        router.push("/login")
        return
      }

      setVendorId(data.id)
    } catch (error) {
      console.error("Error in checkAuth:", error)
      router.push("/login")
    }
  }

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)

      // Fetch all orders for this vendor
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select(`
          id,
          customer_id,
          total_amount,
          status,
          created_at,
          payment_status,
          order_items(count)
        `)
        .eq("vendor_id", vendorId)
        .order("created_at", { ascending: false })

      if (ordersError) {
        console.error("Error fetching orders:", ordersError)
        return
      }

      // Calculate statistics
      const totalOrders = orders.length
      const completedOrders = orders.filter((order) => order.status === "delivered").length
      const pendingOrders = orders.filter((order) =>
        ["pending", "confirmed", "preparing", "ready", "picked_up"].includes(order.status),
      ).length

      // Calculate total revenue from delivered orders
      const totalRevenue = orders
        .filter((order) => order.status === "delivered")
        .reduce((sum, order) => sum + Number.parseFloat(order.total_amount.toString()), 0)

      // Get unique customers
      const uniqueCustomers = new Set(orders.map((order) => order.customer_id)).size

      // Calculate average order value
      const averageOrderValue = totalOrders > 0 ? totalRevenue / completedOrders : 0

      // Today's orders
      const today = new Date()
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const todayOrders = orders.filter((order) => new Date(order.created_at) >= todayStart).length

      // Monthly revenue (current month)
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const monthlyRevenue = orders
        .filter((order) => {
          const orderDate = new Date(order.created_at)
          return (
            orderDate.getMonth() === currentMonth &&
            orderDate.getFullYear() === currentYear &&
            order.status === "delivered"
          )
        })
        .reduce((sum, order) => sum + Number.parseFloat(order.total_amount.toString()), 0)

      // Calculate growth (comparing to previous month)
      const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1
      const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear

      const previousMonthRevenue = orders
        .filter((order) => {
          const orderDate = new Date(order.created_at)
          return (
            orderDate.getMonth() === previousMonth &&
            orderDate.getFullYear() === previousYear &&
            order.status === "delivered"
          )
        })
        .reduce((sum, order) => sum + Number.parseFloat(order.total_amount.toString()), 0)

      const previousMonthOrders = orders.filter((order) => {
        const orderDate = new Date(order.created_at)
        return orderDate.getMonth() === previousMonth && orderDate.getFullYear() === previousYear
      }).length

      const currentMonthOrders = orders.filter((order) => {
        const orderDate = new Date(order.created_at)
        return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear
      }).length

      const revenueGrowth =
        previousMonthRevenue > 0 ? ((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 : 0

      const orderGrowth =
        previousMonthOrders > 0 ? ((currentMonthOrders - previousMonthOrders) / previousMonthOrders) * 100 : 0

      setStats({
        totalRevenue,
        totalOrders,
        totalCustomers: uniqueCustomers,
        averageOrderValue,
        pendingOrders,
        completedOrders,
        todayOrders,
        monthlyRevenue,
        revenueGrowth,
        orderGrowth,
      })

      // Fetch recent orders with customer details
      const recentOrdersData = await Promise.all(
        orders.slice(0, 5).map(async (order) => {
          const { data: customer } = await supabase
            .from("customers")
            .select("name")
            .eq("id", order.customer_id)
            .single()

          return {
            id: order.id,
            customer_name: customer?.name || "Unknown Customer",
            total_amount: Number.parseFloat(order.total_amount.toString()),
            status: order.status,
            created_at: order.created_at,
            items_count: order.order_items.length,
          }
        }),
      )

      setRecentOrders(recentOrdersData)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "#4ade80"
      case "pending":
        return "#f59e0b"
      case "confirmed":
        return "#3b82f6"
      case "preparing":
        return "#8b5cf6"
      case "ready":
        return "#06b6d4"
      case "picked_up":
        return "#10b981"
      default:
        return "#6b7280"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="h-4 w-4" />
      case "pending":
        return <Clock className="h-4 w-4" />
      case "confirmed":
      case "preparing":
      case "ready":
      case "picked_up":
        return <Package className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: "#b9c6c8" }}></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div
          className="rounded-lg p-6 shadow-lg"
          style={{ background: "linear-gradient(135deg, #b9c6c8 0%, #a8b5b7 100%)" }}
        >
          <h1 className="text-2xl font-bold mb-2" style={{ color: "#1d2c36" }}>
            Welcome to Your Dashboard
          </h1>
          <p style={{ color: "#1d2c36", opacity: 0.8 }}>Here's an overview of your restaurant's performance</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Revenue */}
          <div
            className="rounded-lg p-6 shadow-lg border"
            style={{
              background: "linear-gradient(135deg, rgba(185, 198, 200, 0.1) 0%, rgba(185, 198, 200, 0.05) 100%)",
              borderColor: "#b9c6c8",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: "#b9c6c8" }}>
                  Total Revenue
                </p>
                <p className="text-2xl font-bold" style={{ color: "#8f8578" }}>
                  {formatCurrency(stats.totalRevenue)}
                </p>
                <div className="flex items-center mt-2">
                  {stats.revenueGrowth >= 0 ? (
                    <ArrowUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <ArrowDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-sm ml-1 ${stats.revenueGrowth >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {Math.abs(stats.revenueGrowth).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div
                className="p-3 rounded-full"
                style={{ background: "linear-gradient(135deg, #b9c6c8 0%, #a8b5b7 100%)" }}
              >
                <DollarSign className="h-6 w-6" style={{ color: "#1d2c36" }} />
              </div>
            </div>
          </div>

          {/* Total Orders */}
          <div
            className="rounded-lg p-6 shadow-lg border"
            style={{
              background: "linear-gradient(135deg, rgba(185, 198, 200, 0.1) 0%, rgba(185, 198, 200, 0.05) 100%)",
              borderColor: "#b9c6c8",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: "#b9c6c8" }}>
                  Total Orders
                </p>
                <p className="text-2xl font-bold" style={{ color: "#8f8578" }}>
                  {stats.totalOrders.toLocaleString()}
                </p>
                <div className="flex items-center mt-2">
                  {stats.orderGrowth >= 0 ? (
                    <ArrowUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <ArrowDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-sm ml-1 ${stats.orderGrowth >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {Math.abs(stats.orderGrowth).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div
                className="p-3 rounded-full"
                style={{ background: "linear-gradient(135deg, #b9c6c8 0%, #a8b5b7 100%)" }}
              >
                <ShoppingBag className="h-6 w-6" style={{ color: "#1d2c36" }} />
              </div>
            </div>
          </div>

          {/* Total Customers */}
          <div
            className="rounded-lg p-6 shadow-lg border"
            style={{
              background: "linear-gradient(135deg, rgba(185, 198, 200, 0.1) 0%, rgba(185, 198, 200, 0.05) 100%)",
              borderColor: "#b9c6c8",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: "#b9c6c8" }}>
                  Total Customers
                </p>
                <p className="text-2xl font-bold" style={{ color: "#8f8578" }}>
                  {stats.totalCustomers.toLocaleString()}
                </p>
                <p className="text-sm mt-2" style={{ color: "#b9c6c8" }}>
                  Unique customers
                </p>
              </div>
              <div
                className="p-3 rounded-full"
                style={{ background: "linear-gradient(135deg, #b9c6c8 0%, #a8b5b7 100%)" }}
              >
                <Users className="h-6 w-6" style={{ color: "#1d2c36" }} />
              </div>
            </div>
          </div>

          {/* Average Order Value */}
          <div
            className="rounded-lg p-6 shadow-lg border"
            style={{
              background: "linear-gradient(135deg, rgba(185, 198, 200, 0.1) 0%, rgba(185, 198, 200, 0.05) 100%)",
              borderColor: "#b9c6c8",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: "#b9c6c8" }}>
                  Avg Order Value
                </p>
                <p className="text-2xl font-bold" style={{ color: "#8f8578" }}>
                  {formatCurrency(stats.averageOrderValue)}
                </p>
                <p className="text-sm mt-2" style={{ color: "#b9c6c8" }}>
                  Per completed order
                </p>
              </div>
              <div
                className="p-3 rounded-full"
                style={{ background: "linear-gradient(135deg, #b9c6c8 0%, #a8b5b7 100%)" }}
              >
                <TrendingUp className="h-6 w-6" style={{ color: "#1d2c36" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pending Orders */}
          <div
            className="rounded-lg p-6 shadow-lg border"
            style={{
              background: "linear-gradient(135deg, rgba(185, 198, 200, 0.1) 0%, rgba(185, 198, 200, 0.05) 100%)",
              borderColor: "#b9c6c8",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: "#b9c6c8" }}>
                  Pending Orders
                </p>
                <p className="text-xl font-bold" style={{ color: "#8f8578" }}>
                  {stats.pendingOrders}
                </p>
              </div>
              <AlertCircle className="h-5 w-5" style={{ color: "#f59e0b" }} />
            </div>
          </div>

          {/* Completed Orders */}
          <div
            className="rounded-lg p-6 shadow-lg border"
            style={{
              background: "linear-gradient(135deg, rgba(185, 198, 200, 0.1) 0%, rgba(185, 198, 200, 0.05) 100%)",
              borderColor: "#b9c6c8",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: "#b9c6c8" }}>
                  Completed Orders
                </p>
                <p className="text-xl font-bold" style={{ color: "#8f8578" }}>
                  {stats.completedOrders}
                </p>
              </div>
              <CheckCircle className="h-5 w-5" style={{ color: "#4ade80" }} />
            </div>
          </div>

          {/* Today's Orders */}
          <div
            className="rounded-lg p-6 shadow-lg border"
            style={{
              background: "linear-gradient(135deg, rgba(185, 198, 200, 0.1) 0%, rgba(185, 198, 200, 0.05) 100%)",
              borderColor: "#b9c6c8",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: "#b9c6c8" }}>
                  Today's Orders
                </p>
                <p className="text-xl font-bold" style={{ color: "#8f8578" }}>
                  {stats.todayOrders}
                </p>
              </div>
              <Calendar className="h-5 w-5" style={{ color: "#b9c6c8" }} />
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div
          className="rounded-lg p-6 shadow-lg border"
          style={{
            background: "linear-gradient(135deg, rgba(185, 198, 200, 0.1) 0%, rgba(185, 198, 200, 0.05) 100%)",
            borderColor: "#b9c6c8",
          }}
        >
          <h2 className="text-lg font-semibold mb-4" style={{ color: "#8f8578" }}>
            Recent Orders
          </h2>
          <div className="space-y-4">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                  style={{
                    background: "linear-gradient(135deg, rgba(29, 44, 54, 0.3) 0%, rgba(36, 54, 66, 0.3) 100%)",
                    borderColor: "#b9c6c8",
                  }}
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className="p-2 rounded-full"
                      style={{ backgroundColor: getStatusColor(order.status), opacity: 0.2 }}
                    >
                      <div style={{ color: getStatusColor(order.status) }}>{getStatusIcon(order.status)}</div>
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: "#8f8578" }}>
                        {order.customer_name}
                      </p>
                      <p className="text-sm" style={{ color: "#b9c6c8" }}>
                        {order.items_count} items • {formatDate(order.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold" style={{ color: "#8f8578" }}>
                      {formatCurrency(order.total_amount)}
                    </p>
                    <p className="text-sm capitalize" style={{ color: getStatusColor(order.status) }}>
                      {order.status.replace("_", " ")}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto mb-4" style={{ color: "#b9c6c8" }} />
                <p style={{ color: "#b9c6c8" }}>No recent orders found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default VendorDashboard
