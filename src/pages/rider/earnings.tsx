// pages/rider/earnings.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { supabase } from "@/utils/supabase"
import { DollarSign, Calendar, ChevronDown, ChevronUp, AlertCircle, Loader2, CheckCircle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import RiderLayout from "@/components/RiderLayout"

interface EarningItem {
  id: string
  created_at: string
  amount: number
  status: string
  order: {
    id: string
    vendor: {
      store_name: string
    }
  }
}

interface EarningsSummary {
  total: number
  paid: number
  pending: number
}

const EarningsPage = () => {
  const router = useRouter()
  const [earnings, setEarnings] = useState<EarningItem[]>([])
  const [filteredEarnings, setFilteredEarnings] = useState<EarningItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [riderId, setRiderId] = useState<string | null>(null)
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [summary, setSummary] = useState<EarningsSummary>({
    total: 0,
    paid: 0,
    pending: 0
  })
  const [riderStatus, setRiderStatus] = useState<boolean>(false)
  const [statusUpdateTime, setStatusUpdateTime] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (riderId) {
      fetchEarnings()
      fetchRiderStatus()
    }
  }, [riderId, dateFilter, statusFilter, sortOrder])

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

  const fetchEarnings = async () => {
    try {
      setIsLoading(true)
      setError(null)

      console.log("Fetching earnings...");

      // Build the query based on filters
      let query = supabase
        .from("rider_earnings")
        .select(`
          id, 
          created_at, 
          amount, 
          status,
          order_id
        `)
        .eq("rider_id", riderId);
        
      // Apply status filter
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter)
      }
        
      // Apply date filter
      const now = new Date()
      if (dateFilter === "today") {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
        query = query.gte("created_at", today)
      } else if (dateFilter === "week") {
        const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString()
        query = query.gte("created_at", weekAgo)
      } else if (dateFilter === "month") {
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString()
        query = query.gte("created_at", monthAgo)
      }
      
      // Apply sort order
      query = query.order("created_at", { ascending: sortOrder === "asc" });

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching earnings:", error)
        setError("Failed to load earnings. Please try again.")
        return
      }

      console.log("Earnings data:", data);

      // Process the data to include order and vendor details
      const processedData: EarningItem[] = await Promise.all(
        data.map(async (earning) => {
          // Get order details
          const { data: orderData, error: orderError } = await supabase
            .from("orders")
            .select("id, vendor_id")
            .eq("id", earning.order_id)
            .single();

          console.log("Order data for earning", earning.id, ":", orderData);

          if (orderError) {
            console.error("Error fetching order for earning", earning.id, ":", orderError);
            return {
              ...earning,
              order: {
                id: earning.order_id,
                vendor: {
                  store_name: "Unknown Restaurant"
                }
              }
            };
          }

          // Get vendor details
          const { data: vendorData, error: vendorError } = await supabase
            .from("vendors")
            .select("store_name")
            .eq("id", orderData.vendor_id)
            .single();

          console.log("Vendor data for order", orderData.id, ":", vendorData);

          if (vendorError) {
            console.error("Error fetching vendor for order", orderData.id, ":", vendorError);
            return {
              ...earning,
              order: {
                id: earning.order_id,
                vendor: {
                  store_name: "Unknown Restaurant"
                }
              }
            };
          }

          return {
            ...earning,
            order: {
              id: earning.order_id,
              vendor: {
                store_name: vendorData.store_name
              }
            }
          };
        })
      );

      console.log("Processed earnings:", processedData);

      setEarnings(processedData)
      setFilteredEarnings(processedData)
      
      // Calculate summary
      const total = processedData.reduce((sum, item) => sum + item.amount, 0)
      const paid = processedData
        .filter(item => item.status === "paid")
        .reduce((sum, item) => sum + item.amount, 0)
      const pending = processedData
        .filter(item => item.status === "pending")
        .reduce((sum, item) => sum + item.amount, 0)
        
      setSummary({
        total,
        paid,
        pending
      })
    } catch (error) {
      console.error("Error in fetchEarnings:", error)
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

  if (isLoading) {
    return (
      <RiderLayout title="Earnings">
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-red-500" />
        </div>
      </RiderLayout>
    )
  }

  if (error) {
    return (
      <RiderLayout title="Earnings">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-red-700 mb-2">Error Loading Earnings</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <Button 
              onClick={() => fetchEarnings()} 
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
    <RiderLayout title="Earnings">
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
        
        <h1 className="text-2xl font-bold mb-6">Earnings</h1>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm text-gray-500 mb-1">Total Earnings</h3>
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-2xl font-bold">₦{summary.total.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm text-gray-500 mb-1">Paid</h3>
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-2xl font-bold">₦{summary.paid.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm text-gray-500 mb-1">Pending</h3>
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-yellow-500 mr-2" />
                <span className="text-2xl font-bold">₦{summary.pending.toLocaleString()}</span>
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
                
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-gray-100 text-gray-700 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="all">All Status</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
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
          </CardContent>
        </Card>
        
        {filteredEarnings.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Restaurant
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEarnings.map((earning) => (
                    <tr key={earning.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(earning.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {earning.order.vendor.store_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        #{earning.order.id.substring(0, 8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₦{earning.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          earning.status === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {earning.status === 'paid' ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium mb-1">No Earnings Yet</h3>
              <p className="text-gray-500 mb-4">
                You haven't earned any money yet. Complete deliveries to start earning.
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

export default EarningsPage