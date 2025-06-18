"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/utils/supabase"
import { Package, Star, User } from "lucide-react"
import RiderRating from "./RiderRating"

interface OrderDetailsProps {
  order: {
    id: string
    status: string
    total_amount: number
    original_amount?: number
    discount_amount?: number
    delivery_fee?: number
    loyalty_points_redeemed?: number
    vendor: {
      store_name: string
    }
    items: Array<{
      id: string
      name: string
      price: number
      quantity: number
    }>
    rider_id?: string | null
    customer_id: string
  }
}

interface ExistingRating {
  rating: number
  comment: string
}

const OrderDetails = ({ order }: OrderDetailsProps) => {
  const [showRating, setShowRating] = useState(false)
  const [existingRating, setExistingRating] = useState<ExistingRating | null>(null)
  const [isLoadingRating, setIsLoadingRating] = useState(false)

  useEffect(() => {
    if (order.status === "delivered" && order.rider_id) {
      checkExistingRating()
    }
  }, [order.status, order.rider_id, order.id])

  const checkExistingRating = async () => {
    try {
      setIsLoadingRating(true)
      const { data, error } = await supabase
        .from("rider_ratings")
        .select("rating, comment")
        .eq("order_id", order.id)
        .single()

      if (error && error.code !== "PGRST116") {
        console.error("Error checking existing rating:", error)
        return
      }

      if (data) {
        setExistingRating(data)
      } else {
        setShowRating(true)
      }
    } catch (error) {
      console.error("Error in checkExistingRating:", error)
    } finally {
      setIsLoadingRating(false)
    }
  }

  const handleRatingSubmitted = () => {
    setShowRating(false)
    checkExistingRating()
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`h-4 w-4 ${i < rating ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
    ))
  }

  return (
    <div className="space-y-6">
      {/* Order Summary */}
      <div className="bg-gradient-to-r from-[#8f8578] to-[#7a7066] rounded-lg shadow-lg p-6">
        <h2 className="font-bold text-lg mb-4 text-[#1d2c36]">Order Summary</h2>

        <div className="space-y-3 mb-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between items-center">
              <div className="flex items-center">
                <Package className="h-4 w-4 text-[#b9c6c8] mr-2" />
                <span className="text-[#1d2c36]">
                  {item.name} x {item.quantity}
                </span>
              </div>
              <span className="font-medium text-[#1d2c36]">₦{(item.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-[#b9c6c8]/30 pt-4 space-y-2">
          <div className="flex justify-between text-[#1d2c36]">
            <span>Subtotal</span>
            <span>₦{(order.original_amount || order.total_amount).toLocaleString()}</span>
          </div>

          {order.discount_amount && order.discount_amount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span>-₦{order.discount_amount.toLocaleString()}</span>
            </div>
          )}

          {order.delivery_fee && (
            <div className="flex justify-between text-[#1d2c36]">
              <span>Delivery Fee</span>
              <span>₦{order.delivery_fee.toLocaleString()}</span>
            </div>
          )}

          {order.loyalty_points_redeemed && order.loyalty_points_redeemed > 0 && (
            <div className="flex justify-between text-blue-600">
              <span>Loyalty Points</span>
              <span>-₦{order.loyalty_points_redeemed.toLocaleString()}</span>
            </div>
          )}

          <div className="border-t border-[#b9c6c8]/30 pt-2">
            <div className="flex justify-between font-bold text-lg text-[#1d2c36]">
              <span>Total</span>
              <span>₦{order.total_amount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rider Rating Section */}
      {order.status === "delivered" && order.rider_id && (
        <div>
          {isLoadingRating ? (
            <div className="bg-gradient-to-r from-[#8f8578] to-[#7a7066] rounded-lg shadow-lg p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1d2c36] mx-auto mb-2"></div>
              <p className="text-[#1d2c36]/70">Loading rating...</p>
            </div>
          ) : existingRating ? (
            <div className="bg-gradient-to-r from-[#8f8578] to-[#7a7066] rounded-lg shadow-lg p-6">
              <h3 className="font-bold text-lg text-[#1d2c36] mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Your Rating
              </h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <span className="text-[#1d2c36] mr-2">Rating:</span>
                  <div className="flex mr-2">{renderStars(existingRating.rating)}</div>
                  <span className="text-[#1d2c36]/70">({existingRating.rating}/5)</span>
                </div>
                {existingRating.comment && (
                  <div>
                    <span className="text-[#1d2c36] font-medium">Comment:</span>
                    <p className="text-[#1d2c36]/70 mt-1 italic">"{existingRating.comment}"</p>
                  </div>
                )}
              </div>
            </div>
          ) : showRating ? (
            <RiderRating
              orderId={order.id}
              riderId={order.rider_id}
              customerId={order.customer_id}
              onRatingSubmitted={handleRatingSubmitted}
            />
          ) : null}
        </div>
      )}
    </div>
  )
}

export default OrderDetails
