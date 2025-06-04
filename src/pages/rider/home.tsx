// pages/rider/home.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { supabase } from "@/utils/supabase"
import { Package, Clock, Star, Calendar, MapPin, Loader2, AlertCircle, ArrowRight, CheckCircle, Bike, ToggleLeft, ToggleRight } from 'lucide-react'
import RiderLayout from "@/components/RiderLayout"

// Create a simple toast implementation since we don't have the hook
const toast = (props: { title: string; description: string; variant?: string }) => {
  alert(`${props.title}: ${props.description}`)
}

interface RiderStats {
  id: string
  name: string
  is_available: boolean
  is_active: boolean
  rating: number | null
  total_deliveries: number
  total_earnings: number
  created_at: string
}

interface RecentDelivery {
  id: string
  completed_at: string
  total_amount: number
  delivery_address: string
  vendor: {
    store_name: string
  }
  earnings: {
    amount: number
  }
}

interface CurrentOrder {
  id: string
  created_at: string
  status: string
  vendor: {
    store_name: string
  }
}

const RiderHomePage = () => {
  const router = useRouter()
  const [riderStats, setRiderStats] = useState<RiderStats | null>(null)
  const [recentDeliveries, setRecentDeliveries] = useState<RecentDelivery[]>([])
  const [currentOrder, setCurrentOrder] = useState<CurrentOrder | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [riderId, setRiderId] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (riderId) {
      fetchRiderData()
    }
  }, [riderId])

  const checkAuth = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      
      if (!session) {
        router.push("/login")
        return
      }

      // Check if user is a rider
      const { data, error } = await supabase
        .from("riders")
        .select("id")
        .eq("id", session.user.id)
        .single()
      
      if (error || !data) {
        router.push("/login")
        return
      }

      setRiderId(data.id)
    } catch (error) {
      console.error("Error in checkAuth:", error)
      setError("Authentication failed. Please try logging in again.")
    }
  }

  const fetchRiderData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch rider stats
      const { data: riderData, error: riderError } = await supabase
        .from("riders")
        .select("id, name, is_available, is_active, rating, total_deliveries, total_earnings, created_at")
        .eq("id", riderId)
        .single()

      if (riderError) {
        console.error("Error fetching rider stats:", riderError)
        setError("Failed to load rider data. Please try again.")
        return
      }

      setRiderStats(riderData)

      // Fetch recent deliveries
      const { data: deliveriesData, error: deliveriesError } = await supabase
        .from("orders")
        .select(`
          id, 
          updated_at,
          total_amount, 
          delivery_address,
          vendor:vendors(store_name),
          earnings:rider_earnings(amount)
        `)
        .eq("rider_id", riderId)
        .eq("status", "delivered")
        .order("updated_at", { ascending: false })
        .limit(5)

      if (deliveriesError) {
        console.error("Error fetching recent deliveries:", deliveriesError)
      } else {
        // Process the data to fix nested structure from Supabase
        const processedDeliveries: RecentDelivery[] = deliveriesData.map(order => ({
          id: order.id,
          completed_at: order.updated_at,
          total_amount: order.total_amount,
          delivery_address: order.delivery_address,
          vendor: {
            store_name: order.vendor[0]?.store_name || "Unknown Restaurant"
          },
          earnings: order.earnings[0] || { amount: 0 }
        }))

        setRecentDeliveries(processedDeliveries)
      }

      // Check for current active order
      const { data: currentOrderData, error: currentOrderError } = await supabase
        .from("orders")
        .select(`
          id, 
          created_at,
          status,
          vendor:vendors(store_name)
        `)
        .eq("rider_id", riderId)
        .in("status", ["preparing", "picked_up", "on_the_way"])
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (currentOrderError) {
        if (currentOrderError.code !== 'PGRST116') { // No results error
          console.error("Error fetching current order:", currentOrderError)
        }
      } else {
        // Process the data to fix nested structure from Supabase
        const processedOrder: CurrentOrder = {
          id: currentOrderData.id,
          created_at: currentOrderData.created_at,
          status: currentOrderData.status,
          vendor: {
            store_name: currentOrderData.vendor[0]?.store_name || "Unknown Restaurant"
          }
        }

        setCurrentOrder(processedOrder)
      }
    } catch (error) {
      console.error("Error in fetchRiderData:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleAvailability = async () => {
    if (!riderStats) return
    
    try {
      setIsUpdatingStatus(true)
      
      const newStatus = !riderStats.is_available
      
      const { error } = await supabase
        .from("riders")
        .update({ 
          is_available: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", riderStats.id)
      
      if (error) {
        console.error("Error updating availability:", error)
        toast({
          title: "Failed to update status",
          description: "Please try again.",
          variant: "destructive",
        })
        return
      }
      
      // Update local state
      setRiderStats({
        ...riderStats,
        is_available: newStatus
      })
      
      toast({
        title: "Status updated",
        description: `You are now ${newStatus ? 'available' : 'unavailable'} for deliveries.`,
      })
    } catch (error) {
      console.error("Error in toggleAvailability:", error)
      toast({
        title: "An error occurred",
        description: "Failed to update your status.",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        hour: 'numeric', 
        minute: 'numeric',
        hour12: true
      })
    } catch (e) {
      return dateString
    }
  }

  const formatJoinDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
      })
    } catch (e) {
      return dateString
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "preparing":
        return "Preparing at restaurant"
      case "picked_up":
        return "Picked up from restaurant"
      case "on_the_way":
        return "On the way to customer"
      default:
        return status.replace('_', ' ')
    }
  }

  if (isLoading) {
    return (
      <RiderLayout title="Home">
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-red-500" />
        </div>
      </RiderLayout>
    )
  }

  if (error) {
    return (
      <RiderLayout title="Home">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-red-700 mb-2">Error Loading Dashboard</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={fetchRiderData} 
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Try Again
            </button>
          </div>
        </div>
      </RiderLayout>
    )
  }

  if (!riderStats) return null

  return (
    <RiderLayout title="Home">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Welcome, {riderStats.name.split(' ')[0]}</h1>
          <button
            onClick={toggleAvailability}
            disabled={isUpdatingStatus}
            className={`flex items-center px-4 py-2 rounded-full ${
              riderStats.is_available 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {isUpdatingStatus ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : riderStats.is_available ? (
              <ToggleRight className="h-5 w-5 mr-2" />
            ) : (
              <ToggleLeft className="h-5 w-5 mr-2" />
            )}
            {riderStats.is_available ? 'Available' : 'Unavailable'}
          </button>
        </div>
        
        {/* Current Delivery Card */}
        {currentOrder ? (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6 border-l-4 border-red-500">
            <div className="flex items-start justify-between">
              <div className="flex">
                <Bike className="h-10 w-10 text-red-500 mr-3 flex-shrink-0" />
                <div>
                  <h2 className="font-bold text-lg">Current Delivery</h2>
                  <p className="text-gray-500">{currentOrder.vendor.store_name}</p>
                  <p className="text-sm text-gray-500">Status: {getStatusText(currentOrder.status)}</p>
                </div>
              </div>
              <button
                onClick={() => router.push('/rider/current-delivery')}
                className="flex items-center text-red-600 hover:text-red-800"
              >
                View Details
                <ArrowRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        ) : riderStats.is_available ? (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <CheckCircle className="h-10 w-10 text-green-500 mr-3" />
              <div>
                <h2 className="font-bold text-lg">You're Available for Deliveries</h2>
                <p className="text-gray-500">Check available orders to start earning</p>
              </div>
              <button
                onClick={() => router.push('/rider/available-orders')}
                className="ml-auto flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Find Orders
                <ArrowRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6 border-l-4 border-gray-300">
            <div className="flex items-center">
              <AlertCircle className="h-10 w-10 text-gray-400 mr-3" />
              <div>
                <h2 className="font-bold text-lg">You're Currently Unavailable</h2>
                <p className="text-gray-500">Toggle your status to start receiving orders</p>
              </div>
              <button
                onClick={toggleAvailability}
                className="ml-auto flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                disabled={isUpdatingStatus}
              >
                {isUpdatingStatus ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ToggleLeft className="h-4 w-4 mr-2" />
                )}
                Go Online
              </button>
            </div>
          </div>
        )}
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex flex-col items-center">
              <Package className="h-8 w-8 text-blue-500 mb-2" />
              <p className="text-sm text-gray-500">Total Deliveries</p>
              <p className="text-xl font-bold">{riderStats.total_deliveries}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex flex-col items-center">
              <Clock className="h-8 w-8 text-green-500 mb-2" />
              <p className="text-sm text-gray-500">Total Earnings</p>
              <p className="text-xl font-bold">₦{riderStats.total_earnings.toLocaleString()}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex flex-col items-center">
              <Star className="h-8 w-8 text-yellow-500 mb-2" />
              <p className="text-sm text-gray-500">Rating</p>
              <p className="text-xl font-bold">{riderStats.rating ? riderStats.rating.toFixed(1) : 'N/A'}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex flex-col items-center">
              <Calendar className="h-8 w-8 text-purple-500 mb-2" />
              <p className="text-sm text-gray-500">Member Since</p>
              <p className="text-sm font-medium">{formatJoinDate(riderStats.created_at).split(',')[0]}</p>
            </div>
          </div>
        </div>
        
        {/* Recent Deliveries */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">Recent Deliveries</h2>
              {recentDeliveries.length > 0 && (
                <button
                  onClick={() => router.push('/rider/delivery-history')}
                  className="text-sm text-red-600 hover:text-red-800 flex items-center"
                >
                  View All
                  <ArrowRight className="h-4 w-4 ml-1" />
                </button>
              )}
            </div>
          </div>
          
          {recentDeliveries.length > 0 ? (
            <div className="divide-y">
              {recentDeliveries.map((delivery) => (
                <div key={delivery.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex">
                      <Clock className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-medium">{delivery.vendor.store_name}</h3>
                        <p className="text-sm text-gray-500">{formatDate(delivery.completed_at)}</p>
                        <div className="flex items-center mt-1">
                          <MapPin className="h-3 w-3 text-gray-400 mr-1" />
                          <p className="text-xs text-gray-500 truncate max-w-[200px]">
                            {delivery.delivery_address}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">₦{delivery.earnings.amount.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Order: ₦{delivery.total_amount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium mb-1">No Deliveries Yet</h3>
              <p className="text-gray-500 mb-4">
                You haven't completed any deliveries yet.
              </p>
              <button 
                onClick={() => router.push('/rider/available-orders')}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Find Available Orders
              </button>
            </div>
          )}
        </div>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => router.push('/rider/available-orders')}
            className="bg-white rounded-lg shadow-md p-4 hover:bg-gray-50 flex flex-col items-center"
          >
            <Package className="h-8 w-8 text-red-500 mb-2" />
            <p className="font-medium">Available Orders</p>
          </button>
          <button
            onClick={() => router.push('/rider/earnings')}
            className="bg-white rounded-lg shadow-md p-4 hover:bg-gray-50 flex flex-col items-center"
          >
            <Clock className="h-8 w-8 text-green-500 mb-2" />
            <p className="font-medium">Earnings</p>
          </button>
          <button
            onClick={() => router.push('/rider/delivery-history')}
            className="bg-white rounded-lg shadow-md p-4 hover:bg-gray-50 flex flex-col items-center"
          >
            <Clock className="h-8 w-8 text-blue-500 mb-2" />
            <p className="font-medium">Delivery History</p>
          </button>
          <button
            onClick={() => router.push('/rider/profile')}
            className="bg-white rounded-lg shadow-md p-4 hover:bg-gray-50 flex flex-col items-center"
          >
            <Star className="h-8 w-8 text-yellow-500 mb-2" />
            <p className="font-medium">Profile</p>
          </button>
        </div>
      </div>
    </RiderLayout>
  )
}

export default RiderHomePage