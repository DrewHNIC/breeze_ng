// pages/rider/delivery-history.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { supabase } from "@/utils/supabase"
import { MapPin, Package, Clock, DollarSign, AlertCircle, Loader2, Search, Calendar, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"
import RiderLayout from "@/components/RiderLayout"

interface DeliveryHistoryItem {
  id: string
  created_at: string
  completed_at: string
  total_amount: number
  delivery_address: string
  vendor_id: string
  vendor: {
    store_name: string
  }
  earnings: {
    amount: number
    status: string
  }
}

const DeliveryHistoryPage = () => {
  const router = useRouter()
  const [deliveries, setDeliveries] = useState<DeliveryHistoryItem[]>([])
  const [filteredDeliveries, setFilteredDeliveries] = useState<DeliveryHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [riderId, setRiderId] = useState<string | null>(null)
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
  const [riderStatus, setRiderStatus] = useState<boolean>(false)
  const [statusUpdateTime, setStatusUpdateTime] = useState<string | null>(null)
  
  // Stats
  const [totalDeliveries, setTotalDeliveries] = useState(0)
  const [totalEarnings, setTotalEarnings] = useState(0)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (riderId) {
      fetchDeliveryHistory()
      fetchRiderStatus()
    }
  }, [riderId, dateFilter, sortOrder])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredDeliveries(deliveries)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = deliveries.filter(
        (delivery) =>
          delivery.vendor.store_name.toLowerCase().includes(query) ||
          delivery.delivery_address.toLowerCase().includes(query) ||
          delivery.id.toLowerCase().includes(query)
      )
      setFilteredDeliveries(filtered)
    }
  }, [searchQuery, deliveries])

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

  const fetchRiderStatus = async () => {
    if (!riderId) return
    
    try {
      const { data, error } = await supabase
        .from("riders")
        .select("is_available")
        .eq("id", riderId)
        .single()
        
      if (error) {
        console.error("Error fetching rider status:", error)
        return
      }
      
      setRiderStatus(data.is_available)
    } catch (error) {
      console.error("Error in fetchRiderStatus:", error)
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

  const fetchDeliveryHistory = async () => {
    try {
      setIsLoading(true)
      setError(null)

      console.log("Fetching delivery history...");

      // Build the query based on date filter
      let query = supabase
        .from("orders")
        .select(`
          id, 
          created_at, 
          updated_at,
          total_amount, 
          delivery_address,
          vendor_id,
          earnings:rider_earnings(amount, status)
        `)
        .eq("rider_id", riderId)
        .eq("status", "delivered");
        
      // Apply date filter
      const now = new Date()
      if (dateFilter === "today") {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
        query = query.gte("updated_at", today)
      } else if (dateFilter === "week") {
        const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString()
        query = query.gte("updated_at", weekAgo)
      } else if (dateFilter === "month") {
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString()
        query = query.gte("updated_at", monthAgo)
      }
      
      // Apply sort order
      query = query.order("updated_at", { ascending: sortOrder === "asc" });

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching delivery history:", error)
        setError("Failed to load delivery history. Please try again.")
        return
      }

      console.log("Delivery history data:", data);

      // Process the data to fix nested structure from Supabase
      const processedData: DeliveryHistoryItem[] = await Promise.all(
        data.map(async (order) => {
          // Get vendor details
          const { data: vendorData, error: vendorError } = await supabase
            .from("vendors")
            .select("store_name")
            .eq("id", order.vendor_id)
            .single();

          console.log("Vendor data for order", order.id, ":", vendorData);

          if (vendorError) {
            console.error("Error fetching vendor for order", order.id, ":", vendorError);
          }

          return {
            id: order.id,
            created_at: order.created_at,
            completed_at: order.updated_at,
            total_amount: order.total_amount,
            delivery_address: order.delivery_address,
            vendor_id: order.vendor_id,
            vendor: {
              store_name: vendorData?.store_name || "Unknown Restaurant"
            },
            earnings: order.earnings[0] || { amount: 0, status: "pending" }
          };
        })
      );

      console.log("Processed delivery history:", processedData);

      setDeliveries(processedData)
      setFilteredDeliveries(processedData)
      
      // Calculate stats
      setTotalDeliveries(processedData.length)
      setTotalEarnings(processedData.reduce((sum, order) => sum + (order.earnings?.amount || 0), 0))
    } catch (error) {
      console.error("Error in fetchDeliveryHistory:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
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

  const toggleOrderExpand = (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null)
    } else {
      setExpandedOrderId(orderId)
    }
  }

  if (isLoading) {
    return (
      <RiderLayout title="Delivery History">
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-red-500" />
        </div>
      </RiderLayout>
    )
  }

  if (error) {
    return (
      <RiderLayout title="Delivery History">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-red-700 mb-2">Error Loading History</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <Button 
              onClick={() => fetchDeliveryHistory()} 
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
    <RiderLayout title="Delivery History">
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
        
        <h1 className="text-2xl font-bold mb-6">Delivery History</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm text-gray-500 mb-1">Total Deliveries</h3>
              <div className="flex items-center">
                <Package className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-2xl font-bold">{totalDeliveries}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm text-gray-500 mb-1">Total Earnings</h3>
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-2xl font-bold">₦{totalEarnings.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="bg-gray-100 text-gray-700 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                </div>
                
                <Button
                  onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                  variant="outline"
                  size="sm"
                  className="flex items-center"
                >
                  {sortOrder === "desc" ? (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Newest First
                    </>
                  ) : (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      Oldest First
                    </>
                  )}
                </Button>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search deliveries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {filteredDeliveries.length > 0 ? (
          <div className="space-y-4">
            {filteredDeliveries.map((delivery) => (
              <Card key={delivery.id}>
                <CardContent className="p-0">
                  <div 
                    className="p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleOrderExpand(delivery.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-medium">{delivery.vendor.store_name}</h3>
                        <p className="text-sm text-gray-500">Order #{delivery.id.substring(0, 8)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-600">
                          +₦{delivery.earnings?.amount.toLocaleString() || "0"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {delivery.earnings?.status === "paid" ? "Paid" : "Pending"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDate(delivery.completed_at)}
                      </div>
                      <Button variant="ghost" size="sm" className="p-0 h-auto">
                        {expandedOrderId === delivery.id ? (
                          <ChevronUp className="h-4 w-4 text-red-600" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-red-600" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {expandedOrderId === delivery.id && (
                    <div className="p-4 bg-gray-50 border-t border-gray-100">
                      <div className="space-y-3">
                        <div className="flex">
                          <MapPin className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Delivery Address</p>
                            <p className="text-sm text-gray-500">{delivery.delivery_address}</p>
                          </div>
                        </div>
                        <div className="flex">
                          <DollarSign className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Order Amount</p>
                            <p className="text-sm text-gray-500">₦{delivery.total_amount.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex">
                          <Clock className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Order Time</p>
                            <p className="text-sm text-gray-500">{formatDate(delivery.created_at)}</p>
                          </div>
                        </div>
                        <div className="flex">
                          <Clock className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Delivery Time</p>
                            <p className="text-sm text-gray-500">{formatDate(delivery.completed_at)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium mb-1">No Delivery History</h3>
              <p className="text-gray-500 mb-4">
                You haven't completed any deliveries yet.
              </p>
              <Button 
                onClick={() => router.push("/rider/available-orders")}
              >
                Find Available Orders
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </RiderLayout>
  )
}

export default DeliveryHistoryPage