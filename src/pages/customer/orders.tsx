// pages/customer/orders.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import Link from "next/link"
import { supabase } from "@/utils/supabase"
import CustomerLayout from "@/components/CustomerLayout"
import { Loader2, AlertCircle, ShoppingBag, Clock, CheckCircle, XCircle, ChevronRight, Search, RefreshCw } from 'lucide-react'

interface Order {
  id: string
  status: string
  total_amount: number
  created_at: string
  vendor: {
    store_name: string
  }
  item_count: number
}

// Define the raw data structure from Supabase
interface RawOrderData {
  id: string
  status: string
  total_amount: number
  created_at: string
  vendor: {
    store_name: string
  } | {
    store_name: string
  }[]
}

const OrdersPage = () => {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active')
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [activeTab])

  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/login")
        return
      }

      // Determine status filter based on active tab
      // IMPORTANT: Added 'pending' to the active tab filter to show newly created orders
      const statusFilter = activeTab === 'active' 
        ? ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery']
        : ['delivered', 'cancelled']

      console.log("Fetching orders with status filter:", statusFilter)

      // Fetch orders with vendor details
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(`
          id, 
          status, 
          total_amount, 
          created_at,
          vendor:vendor_id(store_name)
        `)
        .eq("customer_id", session.user.id)
        .in("status", statusFilter)
        .order("created_at", { ascending: false })

      if (ordersError) {
        console.error("Error fetching orders:", ordersError)
        setError("Could not load your orders. Please try again.")
        return
      }

      console.log("Raw orders data:", ordersData)

      // Fetch order items count for each order
      const ordersWithItemCount = await Promise.all(
        ordersData.map(async (order: RawOrderData) => {
          const { count, error: countError } = await supabase
            .from("order_items")
            .select("id", { count: "exact" })
            .eq("order_id", order.id)

          // Extract vendor data safely
          let vendorName = "Unknown Restaurant"
          
          if (order.vendor) {
            if (Array.isArray(order.vendor) && order.vendor.length > 0) {
              vendorName = order.vendor[0].store_name || vendorName
            } else if (typeof order.vendor === 'object' && 'store_name' in order.vendor) {
              vendorName = order.vendor.store_name || vendorName
            }
          }

          return {
            id: order.id,
            status: order.status,
            total_amount: order.total_amount,
            created_at: order.created_at,
            vendor: {
              store_name: vendorName
            },
            item_count: count || 0
          } as Order
        })
      )

      console.log("Processed orders data:", ordersWithItemCount)
      setOrders(ordersWithItemCount)
    } catch (error) {
      console.error("Error in fetchOrders:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchOrders()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </span>
        )
      case 'confirmed':
        return (
          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium flex items-center">
            <CheckCircle className="h-3 w-3 mr-1" />
            Confirmed
          </span>
        )
      case 'preparing':
        return (
          <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            Preparing
          </span>
        )
      case 'ready':
        return (
          <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium flex items-center">
            <CheckCircle className="h-3 w-3 mr-1" />
            Ready
          </span>
        )
      case 'out_for_delivery':
        return (
          <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs font-medium flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            Out for Delivery
          </span>
        )
      case 'delivered':
        return (
          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium flex items-center">
            <CheckCircle className="h-3 w-3 mr-1" />
            Delivered
          </span>
        )
      case 'cancelled':
        return (
          <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium flex items-center">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </span>
        )
      default:
        return (
          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
            {status}
          </span>
        )
    }
  }
  
  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    return (
      order.id.toLowerCase().includes(searchLower) ||
      order.vendor.store_name.toLowerCase().includes(searchLower) ||
      order.status.toLowerCase().includes(searchLower)
    )
  })

  return (
    <CustomerLayout title="My Orders">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center">
            <ShoppingBag className="h-6 w-6 mr-2" />
            My Orders
          </h1>
          
          <button 
            onClick={handleRefresh}
            className="flex items-center text-gray-600 hover:text-red-500"
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-5 w-5 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Search and Filter */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search orders by ID, restaurant or status..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`py-2 px-4 font-medium text-sm ${
              activeTab === 'active'
                ? 'text-red-500 border-b-2 border-red-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('active')}
          >
            Active Orders
          </button>
          <button
            className={`py-2 px-4 font-medium text-sm ${
              activeTab === 'completed'
                ? 'text-red-500 border-b-2 border-red-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('completed')}
          >
            Order History
          </button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-red-500" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-red-700 mb-2">Error Loading Orders</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchOrders}
              className="bg-red-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="bg-gray-100 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="h-10 w-10 text-gray-500" />
            </div>
            <h2 className="text-xl font-bold mb-2">No orders found</h2>
            <p className="text-gray-600 mb-6">
              {activeTab === 'active' 
                ? "You don't have any active orders at the moment." 
                : searchTerm 
                  ? "No orders match your search criteria." 
                  : "You haven't completed any orders yet."}
            </p>
            <Link
              href="/customer/search"
              className="bg-red-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-600 transition-colors inline-block"
            >
              Browse Restaurants
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Link 
                key={order.id} 
                href={`/customer/order-tracking?id=${order.id}`}
                className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100 p-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div className="mb-2 md:mb-0">
                    <div className="flex items-center">
                      <h3 className="font-bold">Order #{order.id.substring(0, 8)}</h3>
                      <span className="mx-2 text-gray-300">•</span>
                      <span className="text-sm text-gray-600">{new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-gray-700">{order.vendor.store_name}</p>
                    <p className="text-sm text-gray-500">{order.item_count} items</p>
                  </div>
                  
                  <div className="flex items-center justify-between md:justify-end w-full md:w-auto">
                    <div className="flex flex-col items-end">
                      <span className="font-bold">₦{order.total_amount.toLocaleString()}</span>
                      {getStatusBadge(order.status)}
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 ml-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </CustomerLayout>
  )
}

export default OrdersPage