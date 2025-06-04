// pages/customer/order-confirmation.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import Link from "next/link"
import { supabase } from "@/utils/supabase"
import CustomerLayout from "@/components/CustomerLayout"
import OrderDetails from "@/components/customer/OrderDetails"
import { CheckCircle, ArrowRight, Loader2, AlertCircle } from 'lucide-react'

interface Order {
  id: string
  status: string
  total_amount: number
  created_at: string
  vendor: {
    store_name: string
  }
  items: {
    id: string
    menu_item_id: string
    name: string
    price: number
    quantity: number
  }[]
  payment_method: string
}

// Define a type for the vendor data structure
interface VendorData {
  store_name: string
}

const OrderConfirmationPage = () => {
  const router = useRouter()
  const { id: orderId } = router.query
  
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    if (router.isReady && orderId) {
      fetchOrderDetails()
    } else if (router.isReady && !orderId) {
      router.push('/customer/orders')
    }
  }, [router.isReady, orderId])
  
  const fetchOrderDetails = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/login")
        return
      }
      
      // Fetch order with vendor details
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select(`
          id,
          status,
          total_amount,
          created_at,
          payment_method,
          vendor:vendors(store_name)
        `)
        .eq("id", orderId)
        .eq("customer_id", session.user.id)
        .single()
      
      if (orderError) {
        console.error("Error fetching order:", orderError)
        setError("Could not load order details. Please try again.")
        return
      }
      
      // Fetch order items
      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select("id, menu_item_id, name, price, quantity")
        .eq("order_id", orderId)
      
      if (itemsError) {
        console.error("Error fetching order items:", itemsError)
        setError("Could not load order items. Please try again.")
        return
      }
      
      // Process vendor data - it might come as an array from Supabase
      let vendorName = "Unknown Restaurant"
      
      if (orderData.vendor) {
        if (Array.isArray(orderData.vendor)) {
          // If it's an array, take the first item with explicit type assertion
          if (orderData.vendor.length > 0) {
            // Use type assertion to tell TypeScript about the structure
            const firstVendor = orderData.vendor[0] as unknown as VendorData;
            vendorName = firstVendor.store_name || vendorName;
          }
        } else if (typeof orderData.vendor === 'object') {
          // If it's an object, use type assertion
          const vendorObject = orderData.vendor as unknown as VendorData;
          vendorName = vendorObject.store_name || vendorName;
        }
      }
      
      // Combine order data with items
      const processedOrder: Order = {
        id: orderData.id,
        status: orderData.status,
        total_amount: orderData.total_amount,
        created_at: orderData.created_at,
        payment_method: orderData.payment_method,
        vendor: {
          store_name: vendorName
        },
        items: itemsData
      }
      
      setOrder(processedOrder)
    } catch (error) {
      console.error("Error in fetchOrderDetails:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }
  
  if (isLoading) {
    return (
      <CustomerLayout title="Order Confirmation">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-red-500" />
          </div>
        </div>
      </CustomerLayout>
    )
  }
  
  if (error || !order) {
    return (
      <CustomerLayout title="Order Confirmation">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-red-700 mb-2">Error Loading Order</h2>
            <p className="text-red-600 mb-4">{error || "Order not found"}</p>
            <Link
              href="/customer/orders"
              className="bg-red-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors"
            >
              View All Orders
            </Link>
          </div>
        </div>
      </CustomerLayout>
    )
  }
  
  return (
    <CustomerLayout title="Order Confirmation">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center mb-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-green-700 mb-2">Order Confirmed!</h1>
            <p className="text-green-600 mb-4">Your order has been placed successfully.</p>
            <p className="text-gray-600 mb-2">Order Number: <span className="font-bold">{order.id.substring(0, 8)}</span></p>
            <p className="text-gray-600">Placed on {new Date(order.created_at).toLocaleString()}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Order Details</h2>
            <p className="mb-2">Restaurant: <span className="font-medium">{order.vendor.store_name}</span></p>
            <p className="mb-4">Status: <span className="font-medium capitalize">{order.status}</span></p>
            
            <OrderDetails order={order} />
          </div>
          
          <div className="flex justify-between">
            <Link
              href="/customer/orders"
              className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              View All Orders
            </Link>
            
            <Link
              href={`/customer/order-tracking?id=${order.id}`}
              className="bg-red-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center"
            >
              Track Order
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </CustomerLayout>
  )
}

export default OrderConfirmationPage