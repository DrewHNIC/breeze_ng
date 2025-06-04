// pages/api/payments/verify-order.ts
import type { NextApiRequest, NextApiResponse } from "next"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client with service role key for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_KEY || ""
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const { order, reference } = req.query

  if (!order) return res.status(400).json({ error: "Order ID is required" })
  if (!reference) return res.status(400).json({ error: "Reference is required" })

  try {
    console.log(`🔍 Verifying payment for order: ${order}, reference: ${reference}`)

    // Verify payment with Paystack
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    })

    const paystackResponse = await response.json()
    if (!paystackResponse.status) {
      console.error("❌ Paystack verification failed:", paystackResponse.message)
      return res.status(500).json({ error: paystackResponse.message })
    }

    const paymentStatus = paystackResponse.data.status
    console.log(`✅ Paystack verification success. Payment status: ${paymentStatus}`)

    // Get the payment record
    const { data: paymentData, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("reference", reference)
      .eq("order_id", order)
      .single()

    if (paymentError) {
      console.error("❌ Payment record not found:", paymentError)
      return res.status(404).json({ error: "Payment not found" })
    }

    // If payment is already processed, return the order details
    if (paymentData.status === "success") {
      console.log("⚡ Payment already processed. Returning existing data.")
      
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", order)
        .single()

      if (orderError) {
        console.error("❌ Order not found:", orderError)
        return res.status(404).json({ error: "Order not found" })
      }

      return res.status(200).json({
        success: true,
        data: {
          status: "success",
          payment: paymentData,
          order: orderData,
        },
      })
    }

    // Payment is successful, update order status
    if (paymentStatus === "success") {
      console.log("🎯 Payment successful. Updating order status...")

      // Update payment record
      // Update payment record
const { error: updatePaymentError } = await supabase
.from("payments")
.update({
  status: "success",
  payment_method: paystackResponse.data.channel,
  transaction_date: paystackResponse.data.paid_at,
  payment_type: "order",
  metadata: {
    ...paymentData.metadata,
    paystack_response: paystackResponse.data,
  },
})
.eq("id", paymentData.id)

      if (updatePaymentError) {
        console.error("❌ Failed to update payment record:", updatePaymentError)
        return res.status(500).json({ error: "Failed to update payment record" })
      }

      // Update order status
const { data: orderData, error: orderError } = await supabase
.from("orders")
.update({
  status: "confirmed", // Changed from paid to confirmed to match OrderStatus type
  payment_status: "paid", // Added to match orders table
  payment_method: paystackResponse.data.channel,
  updated_at: new Date().toISOString(), // Added to update the updated_at field
})
.eq("id", order)
.select()
.single()

      if (orderError) {
        console.error("❌ Failed to update order:", orderError)
        return res.status(500).json({ error: "Failed to update order" })
      }

      console.log("✅ Order and payment updated successfully")

      return res.status(200).json({
        success: true,
        data: {
          status: "success",
          payment: {
            ...paymentData,
            status: "success",
          },
          order: orderData,
        },
      })
    }

    // Payment not successful
    console.warn(`⚠️ Payment verification returned unsuccessful status: ${paymentStatus}`)
    return res.status(200).json({
      success: true,
      data: {
        status: paymentStatus,
        message: paystackResponse.data.gateway_response,
      },
    })
  } catch (error) {
    console.error("🚨 Payment verification error:", error)
    return res.status(500).json({ error: "Failed to verify payment" })
  }
}