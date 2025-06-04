// pages/api/payments/initialize-order.ts
import type { NextApiRequest, NextApiResponse } from "next"
import { createClient } from "@supabase/supabase-js"
import { v4 as uuidv4 } from "uuid"

// Initialize Supabase client with service role key for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_KEY || ""
)

type PaystackResponse = {
  status: boolean
  message: string
  data?: {
    authorization_url: string
    access_code: string
    reference: string
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { orderId, amount, email, metadata } = req.body

    if (!orderId || !amount || !email) {
      return res.status(400).json({ error: "Order ID, amount, and email are required" })
    }

    console.log(`🛒 Processing payment for order ${orderId}, amount: ₦${amount}`)

    // Verify the order exists
const { data: orderData, error: orderError } = await supabase
.from("orders")
.select("id, customer_id, vendor_id, status, total_amount")
.eq("id", orderId)
.single()

    if (orderError || !orderData) {
      console.error("🚨 Order not found:", orderError?.message || "No data")
      return res.status(404).json({ error: "Order not found" })
    }

    // Generate a unique reference
    const reference = `order_${uuidv4()}`

    // Initialize payment with Paystack
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        amount: amount * 100, // Convert to kobo (Paystack uses the smallest currency unit)
        reference,
        callback_url: `${req.headers.origin}/customer/order-confirmation?order=${orderId}&ref=${reference}`,
        metadata: {
          order_id: orderId,
          customer_id: orderData.customer_id, // Changed from user_id to customer_id
          ...metadata,
          custom_fields: [
            { display_name: "Order ID", variable_name: "order_id", value: orderId },
            { display_name: "Amount", variable_name: "amount", value: `₦${amount.toLocaleString()}` },
          ],
        }
      }),
    })

    const paystackResponse: PaystackResponse = await response.json()

    if (!paystackResponse.status) {
      console.error("🚨 Paystack error:", paystackResponse.message)
      return res.status(500).json({ error: paystackResponse.message })
    }

    // Insert payment record into the database
    const { data: paymentData, error: paymentError } = await supabase
    .from("payments")
    .insert([
      {
        order_id: orderId,
        customer_id: orderData.customer_id,
        vendor_id: orderData.vendor_id, // ✅ Required to satisfy DB constraint
        reference: paystackResponse.data?.reference,
        amount: amount,
        status: "pending",
        payment_type: "order",
        metadata: {
          order_id: orderId,
          amount,
          authorization_url: paystackResponse.data?.authorization_url,
        },
      },
    ])
    .select()
    .single()

    if (paymentError) {
      console.error("🚨 Failed to create payment record:", paymentError.message)
      return res.status(500).json({ error: "Failed to create payment record" })
    }

    // Update order status
    await supabase
      .from("orders")
      .update({ status: "awaiting_payment" })
      .eq("id", orderId)

    console.log("✅ Payment initialized successfully:", paystackResponse.data?.reference)

    return res.status(200).json({
      success: true,
      data: {
        authorization_url: paystackResponse.data?.authorization_url,
        reference: paystackResponse.data?.reference,
        payment_id: paymentData.id,
      },
    })
  } catch (error) {
    console.error("🚨 Payment initialization error:", error)
    return res.status(500).json({ error: "Failed to initialize payment" })
  }
}