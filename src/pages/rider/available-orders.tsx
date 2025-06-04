// pages/rider/available-orders.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { supabase } from "@/utils/supabase"
import { MapPin, Package, Clock, AlertCircle, Loader2, RefreshCw, Search, CheckCircle, Bell } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"
import RiderLayout from "@/components/RiderLayout"

interface AvailableOrder {
  id: string
  created_at: string
  total_amount: number
  delivery_address: string
  contact_number: string
  special_instructions: string | null
  vendor: {
    id: string
    store_name: string
    address: string
  }
  estimated_delivery_time: string | null
  items_count: number
}

const AvailableOrdersPage = () => {
  const router = useRouter()
  const [orders, setOrders] = useState<AvailableOrder[]>([])
  const [filteredOrders, setFilteredOrders] = useState<AvailableOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [riderId, setRiderId] = useState<string | null>(null)
  const [riderStatus, setRiderStatus] = useState<boolean>(false)
  const [statusUpdateTime, setStatusUpdateTime] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (riderId) {
      fetchAvailableOrders()
      
      // Set up polling for new orders
      const interval = setInterval(() => {
        if (!isRefreshing) {
          fetchAvailableOrders(false)
        }
      }, 30000) // Check for new orders every 30 seconds
      
      return () => clearInterval(interval)
    }
  }, [riderId])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredOrders(orders)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = orders.filter(
        (order) =>
          order.vendor.store_name.toLowerCase().includes(query) ||
          order.delivery_address.toLowerCase().includes(query) ||
          order.id.toLowerCase().includes(query)
      )
      setFilteredOrders(filtered)
    }
  }, [searchQuery, orders])

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
        .select("id, is_available")
        .eq("id", session.user.id)
        .single()
      
      if (error || !data) {
        router.push("/login")
        return
      }

      setRiderId(data.id)
      setRiderStatus(data.is_available)

      // If rider is not available, update status
      if (!data.is_available) {
        await supabase
          .from("riders")
          .update({ is_available: true })
          .eq("id", data.id)
        
        setRiderStatus(true)
        setStatusUpdateTime(new Date().toLocaleTimeString())
        
        toast({
          title: "Status updated",
          description: "You are now available for deliveries.",
        })
      }
    } catch (error) {
      console.error("Error in checkAuth:", error)
      setError("Authentication failed. Please try logging in again.")
    }
  }

  const toggleRiderStatus = async () => {
    if (!riderId) return
    
    try {
      const newStatus = !riderStatus
      
      const { error } = await supabase
        .from("riders")
        .update({ is_available: newStatus })
        .eq("id", riderId)
        
      if (error) {
        console.error("Error updating rider status:", error)
        toast({
          title: "Status update failed",
          description: "Could not update your availability status.",
          variant: "destructive",
        })
        return
      }
      
      setRiderStatus(newStatus)
      setStatusUpdateTime(new Date().toLocaleTimeString())
      
      toast({
        title: "Status updated",
        description: newStatus 
          ? "You are now available for deliveries." 
          : "You are now unavailable for deliveries.",
      })
    } catch (error) {
      console.error("Error in toggleRiderStatus:", error)
      toast({
        title: "An error occurred",
        description: "Failed to update your status.",
        variant: "destructive",
      })
    }
  }

  const fetchAvailableOrders = async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true)
      }
      setIsRefreshing(true)
      setError(null)

      console.log("Fetching available orders...");

      // Get orders that are confirmed but don't have a rider assigned
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id, 
          created_at, 
          total_amount, 
          delivery_address,
          contact_number,
          special_instructions,
          estimated_delivery_time,
          vendor_id,
          items_count:order_items(count)
        `)
        .eq("status", "confirmed")
        .is("rider_id", null)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching available orders:", error)
        setError("Failed to load available orders. Please try again.")
        return
      }

      console.log("Orders data:", data);

      // Fetch vendor details separately for each order
      const processedData: AvailableOrder[] = await Promise.all(
        data.map(async (order) => {
          // Get vendor details
          const { data: vendorData, error: vendorError } = await supabase
            .from("vendors")
            .select(`
              id, 
              store_name
            `)
            .eq("id", order.vendor_id)
            .single();

          console.log("Vendor data for order", order.id, ":", vendorData);

          if (vendorError) {
            console.error("Error fetching vendor for order", order.id, ":", vendorError);
          }

          // Get vendor profile for address
          const { data: profileData, error: profileError } = await supabase
            .from("vendor_profiles")
            .select("address")
            .eq("vendor_id", order.vendor_id)
            .single();

          console.log("Profile data for vendor", order.vendor_id, ":", profileData);

          if (profileError) {
            console.error("Error fetching vendor profile for vendor", order.vendor_id, ":", profileError);
          }

          return {
            id: order.id,
            created_at: order.created_at,
            total_amount: order.total_amount,
            delivery_address: order.delivery_address,
            contact_number: order.contact_number,
            special_instructions: order.special_instructions,
            estimated_delivery_time: order.estimated_delivery_time,
            vendor: {
              id: vendorData?.id || "",
              store_name: vendorData?.store_name || "Restaurant",
              address: profileData?.address || "Address not available"
            },
            items_count: order.items_count.length
          };
        })
      );

      console.log("Processed data:", processedData);

      setOrders(processedData)
      setFilteredOrders(processedData)
    } catch (error) {
      console.error("Error in fetchAvailableOrders:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const refreshOrders = () => {
    setIsRefreshing(true)
    fetchAvailableOrders()
  }

  const acceptOrder = async (orderId: string) => {
    try {
      if (!riderId) return

      const { error } = await supabase
        .from("orders")
        .update({ 
          rider_id: riderId,
          status: "preparing",
          updated_at: new Date().toISOString()
        })
        .eq("id", orderId)
        .eq("status", "confirmed")
        .is("rider_id", null)
      
      if (error) {
        console.error("Error accepting order:", error)
        toast({
          title: "Failed to accept order",
          description: "This order may have been taken by another rider.",
          variant: "destructive",
        })
        return
      }
      
      toast({
        title: "Order accepted",
        description: "You have successfully accepted this delivery.",
      })
      
      // Redirect to current delivery page
      router.push(`/rider/current-delivery`)
    } catch (error) {
      console.error("Error in acceptOrder:", error)
      toast({
        title: "An error occurred",
        description: "Failed to accept the order.",
        variant: "destructive",
      })
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

  const calculateDeliveryFee = (amount: number) => {
    // This is a placeholder calculation - adjust based on your business logic
    const baseFee = 500 // ₦500 base fee
    const percentageFee = amount * 0.05 // 5% of order amount
    return Math.min(Math.max(baseFee + percentageFee, 700), 2000) // Between ₦700 and ₦2000
  }

  if (isLoading) {
    return (
      <RiderLayout title="Available Orders">
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-red-500" />
        </div>
      </RiderLayout>
    )
  }

  if (error) {
    return (
      <RiderLayout title="Available Orders">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-red-700 mb-2">Error Loading Orders</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <Button 
              onClick={() => fetchAvailableOrders()} 
              variant="destructive"
            >
              Try Again
            </Button>
          </div>
        </div>
      </RiderLayout>
    )
  }

  return (
    <RiderLayout title="Available Orders">
      <div className="container mx-auto px-4 py-6">
        {/* Rider Status Banner */}
        <div className={`mb-4 p-3 rounded-lg flex items-center justify-between ${
          riderStatus ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="flex items-center">
            {riderStatus ? (
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
            )}
            <div>
              <span className={riderStatus ? 'text-green-700' : 'text-yellow-700'}>
                {riderStatus 
                  ? 'You are currently available for deliveries' 
                  : 'You are currently unavailable for deliveries'}
              </span>
              {statusUpdateTime && (
                <p className="text-xs text-gray-500 mt-0.5">
                  Status updated at {statusUpdateTime}
                </p>
              )}
            </div>
          </div>
          <Button
            onClick={() => toggleRiderStatus()} 
            variant="ghost"
            size="sm"
            className={riderStatus 
              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
              : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
            }
          >
            {riderStatus ? 'Go Offline' : 'Go Online'}
          </Button>
        </div>
        
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Available Orders</h1>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshOrders}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by restaurant or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {filteredOrders.length > 0 ? (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-medium">{order.vendor.store_name}</h3>
                        <p className="text-sm text-gray-500">Order #{order.id.substring(0, 8)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₦{order.total_amount.toLocaleString()}</p>
                        <p className="text-sm text-green-600">
                          +₦{calculateDeliveryFee(order.total_amount).toLocaleString()} fee
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex">
                        <Clock className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-500">
                          Ordered {formatDate(order.created_at)}
                        </p>
                      </div>
                      <div className="flex">
                        <Package className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-500">
                          {order.items_count} {order.items_count === 1 ? 'item' : 'items'}
                        </p>
                      </div>
                      <div className="flex">
                        <MapPin className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500 font-medium">Pickup:</p>
                          <p className="text-sm text-gray-500">{order.vendor.address || "Address not available"}</p>
                        </div>
                      </div>
                      <div className="flex">
                        <MapPin className="h-4 w-4 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500 font-medium">Delivery:</p>
                          <p className="text-sm text-gray-500">{order.delivery_address}</p>
                        </div>
                      </div>
                    </div>
                    
                    {order.special_instructions && (
                      <div className="bg-yellow-50 p-3 rounded-md mb-3">
                        <p className="text-sm text-yellow-800">
                          <span className="font-medium">Note: </span>
                          {order.special_instructions}
                        </p>
                      </div>
                    )}
                    
                    <Button 
                      className="w-full" 
                      onClick={() => acceptOrder(order.id)}
                    >
                      Accept Order
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium mb-1">No Available Orders</h3>
            <p className="text-gray-500 mb-4">
              There are no orders available for delivery at the moment.
            </p>
            <Button 
              variant="outline" 
              onClick={refreshOrders}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </RiderLayout>
  )
}

export default AvailableOrdersPage