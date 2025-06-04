// pages/customer/order-tracking.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import Link from "next/link"
import { supabase } from "@/utils/supabase"
import CustomerLayout from "@/components/CustomerLayout"
import OrderStatusTimeline from "@/components/customer/OrderStatusTimeline"
import OrderDetails from "@/components/customer/OrderDetails"
import { ArrowLeft, Loader2, AlertCircle, Phone, Clock, MapPin, Copy, Check, Store } from 'lucide-react'

interface Order {
  id: string
  status: string
  total_amount: number
  created_at: string
  updated_at: string
  delivery_address: string
  customer_id: string
  vendor_id: string
  rider_id: string | null
  estimated_delivery_time: string | null
  payment_method: string
  payment_status: string
  actual_delivery_time: string | null
  contact_number: string
  special_instructions: string | null
  vendor: {
    store_name: string
    contact_phone: string
  }
  items: OrderItem[]
}

interface OrderItem {
  id: string
  menu_item_id: string
  name: string
  price: number
  quantity: number
}

const OrderTrackingPage = () => {
  const router = useRouter()
  const { id: orderId } = router.query
  
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)
  const [vendorPhone, setVendorPhone] = useState<string>("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (router.isReady && orderId) {
      fetchOrderDetails()
      
      // Set up polling for order updates every 30 seconds
      const interval = setInterval(() => {
        fetchOrderDetails(false) // Don't show loading state for refreshes
      }, 30000)
      
      setRefreshInterval(interval)
      
      return () => {
        if (refreshInterval) clearInterval(refreshInterval)
      }
    }
  }, [router.isReady, orderId])

  const fetchOrderDetails = async (showLoading = true) => {
    if (showLoading) setIsLoading(true)
    setError(null)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/login")
        return
      }

      // Fetch order with vendor details (but not contact_phone)
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select(`
          id, 
          status, 
          total_amount, 
          created_at,
          updated_at,
          delivery_address,
          customer_id,
          vendor_id,
          rider_id,
          estimated_delivery_time,
          payment_method,
          payment_status,
          actual_delivery_time,
          contact_number,
          special_instructions,
          vendor:vendors(
            store_name
          )
        `)
        .eq("id", orderId)
        .eq("customer_id", session.user.id)
        .single()

      if (orderError) {
        console.error("Error fetching order:", orderError)
        setError("Could not find the order. Please try again.")
        setIsLoading(false)
        return
      }

      // Fetch vendor contact phone from vendor_profiles
      let vendorContactPhone = ""
      if (orderData.vendor_id) {
        const { data: vendorProfileData, error: vendorProfileError } = await supabase
          .from("vendor_profiles")
          .select("contact_phone")
          .eq("vendor_id", orderData.vendor_id)
          .single()

        if (!vendorProfileError && vendorProfileData) {
          vendorContactPhone = vendorProfileData.contact_phone || ""
          setVendorPhone(vendorContactPhone)
        }
      }

      // Fetch order items
      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select(`
          id,
          menu_item_id,
          quantity,
          unit_price,
          menu_items(name)
        `)
        .eq("order_id", orderId)

      if (itemsError) {
        console.error("Error fetching order items:", itemsError)
        setError("Could not load order items. Please try again.")
        setIsLoading(false)
        return
      }

      // Transform the data
      const transformedItems = itemsData.map((item: any) => {
        let itemName = "Unknown Item"
        
        // Handle menu_items data safely
        if (item.menu_items) {
          if (Array.isArray(item.menu_items) && item.menu_items.length > 0) {
            // If it's an array, take the first item's name
            itemName = item.menu_items[0]?.name || itemName
          } else if (typeof item.menu_items === 'object' && item.menu_items !== null) {
            // If it's an object, try to get the name property
            itemName = item.menu_items.name || itemName
          }
        }
        
        return {
          id: item.id,
          menu_item_id: item.menu_item_id,
          name: itemName,
          price: item.unit_price,
          quantity: item.quantity,
        }
      })

      // Extract vendor data safely
      let vendorName = "Unknown Restaurant"
      
      if (orderData.vendor) {
        if (Array.isArray(orderData.vendor) && orderData.vendor.length > 0) {
          vendorName = orderData.vendor[0].store_name || vendorName
        } else if (typeof orderData.vendor === 'object') {
          // Check if it's a non-array object with the expected properties
          const vendor = orderData.vendor as { store_name?: string }
          vendorName = vendor.store_name || vendorName
        }
      }

      // Combine order and items
      const completeOrder: Order = {
        ...orderData,
        vendor: {
          store_name: vendorName,
          contact_phone: vendorContactPhone,
        },
        items: transformedItems,
      }

      setOrder(completeOrder)
    } catch (error) {
      console.error("Error in fetchOrderDetails:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      if (showLoading) setIsLoading(false)
    }
  }

  const getEstimatedDeliveryTime = () => {
    if (!order) return null
    
    if (order.estimated_delivery_time) {
      return new Date(order.estimated_delivery_time)
    }
    
    // If no estimated time is set, calculate based on order creation time
    // Assuming average delivery time is 45 minutes
    const createdAt = new Date(order.created_at)
    return new Date(createdAt.getTime() + 45 * 60000)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const estimatedDeliveryTime = getEstimatedDeliveryTime()

  return (
    <CustomerLayout title="Track Order">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <Link href="/customer/orders" className="mr-4">
            <ArrowLeft className="h-5 w-5 text-gray-600 hover:text-black transition-colors" />
          </Link>
          <h1 className="text-2xl font-bold">Track Order</h1>
        </div>
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-red-500" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-red-700 mb-2">Error Loading Order</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => fetchOrderDetails()}
              className="bg-red-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : !order ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-yellow-700 mb-2">Order Not Found</h2>
            <p className="text-yellow-600 mb-4">We couldn't find the order you're looking for.</p>
            <Link
              href="/customer/orders"
              className="bg-black text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              View All Orders
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Order Status */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order ID and Restaurant */}
              <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold">Order #{order.id.substring(0, 8)}</h2>
                    <p className="text-gray-600">{new Date(order.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <h3 className="font-bold text-lg">{order.vendor.store_name}</h3>
                    <p className="text-gray-600">
                      {order.status === "delivered" ? "Delivered" : "Estimated delivery by"}:
                    </p>
                    <p className="font-medium text-black">
                      {estimatedDeliveryTime ? estimatedDeliveryTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Calculating..."}
                    </p>
                  </div>
                </div>

                {/* Order Status Timeline */}
                <OrderStatusTimeline status={order.status} createdAt={order.created_at} />
              </div>

              {/* Delivery Information */}
              <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
                <h2 className="text-xl font-bold mb-4">Delivery Information</h2>
                
                <div className="flex items-start mb-4">
                  <MapPin className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium">Delivery Address</p>
                    <p className="text-gray-600">{order.delivery_address}</p>
                    {order.special_instructions && (
                      <p className="mt-1 text-sm text-gray-600">
                        <span className="font-medium">Instructions:</span> {order.special_instructions}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start">
                  <Clock className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium">Estimated Delivery Time</p>
                    <p className="text-gray-600">
                      {estimatedDeliveryTime ? estimatedDeliveryTime.toLocaleString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      }) : "Calculating..."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Delivery Status Message - Placeholder for rider info */}
              <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
                <h2 className="text-xl font-bold mb-4">Delivery Status</h2>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-700">
                    {order.status === 'confirmed' && 'Your order has been confirmed and is being prepared.'}
                    {order.status === 'preparing' && 'Your order is being prepared by the restaurant.'}
                    {order.status === 'ready' && 'Your order is ready and waiting for pickup.'}
                    {order.status === 'out_for_delivery' && 'Your order is on the way to you.'}
                    {order.status === 'delivered' && 'Your order has been delivered. Enjoy your meal!'}
                    {order.status === 'cancelled' && 'This order has been cancelled.'}
                  </p>
                  {(order.status === 'confirmed' || order.status === 'preparing' || order.status === 'ready') && (
                    <p className="mt-2 text-sm text-yellow-600">
                      A delivery partner will be assigned to your order soon.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Order Details */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <OrderDetails order={order} />
                
                {/* Contact Restaurant */}
                <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6 mt-6">
                  <h2 className="font-bold mb-4 flex items-center">
                    <Store className="h-5 w-5 mr-2 text-red-500" />
                    Restaurant Contact
                  </h2>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-1">Restaurant Name</p>
                    <p className="font-medium">{order.vendor.store_name}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Phone Number</p>
                    <div className="flex items-center justify-between bg-gray-100 p-3 rounded-lg">
                      <span className="font-medium">{order.vendor.contact_phone}</span>
                      <button 
                        onClick={() => copyToClipboard(order.vendor.contact_phone)}
                        className="text-gray-600 hover:text-black transition-colors"
                        aria-label="Copy phone number"
                      >
                        {copied ? (
                          <Check className="h-5 w-5 text-green-500" />
                        ) : (
                          <Copy className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Click the copy icon to copy the phone number, then dial it on your phone.
                    </p>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">
                      If you have any questions about your order, please contact the restaurant directly.
                    </p>
                    <a 
                      href={`tel:${order.vendor.contact_phone}`}
                      className="bg-black text-white w-full py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Call Restaurant
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </CustomerLayout>
  )
}

export default OrderTrackingPage