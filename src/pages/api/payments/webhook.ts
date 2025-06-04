// pages/api/payments/order-webhook.ts
import type { NextApiRequest, NextApiResponse } from "next"
import { createClient } from "@supabase/supabase-js"
import crypto from "crypto"

// Initialize Supabase client with service role key for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_KEY || ""
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    // 🔐 Verify Paystack webhook signature
    const secretKey = process.env.PAYSTACK_SECRET_KEY || ""
    const signature = req.headers["x-paystack-signature"] as string

    const hash = crypto
      .createHmac("sha512", secretKey)
      .update(JSON.stringify(req.body))
      .digest("hex")

    if (hash !== signature) {
      console.error("❌ Invalid Paystack webhook signature!")
      return res.status(401).json({ error: "Invalid signature" })
    }

    const event = req.body
    console.log(`🚀 Webhook event received: ${event.event}`)

    // 🔥 Handle successful charge event
    if (event.event === "charge.success") {
      const { reference, status, paid_at, metadata } = event.data
      const orderId = metadata.order_id

      if (!orderId) {
        console.error("❌ No order ID in metadata")
        return res.status(400).json({ error: "No order ID in metadata" })
      }

      console.log(`✅ Payment success for order: ${orderId}, reference: ${reference}`)

      // Fetch the payment record
      const { data: paymentData, error: paymentError } = await supabase
        .from("payments")
        .select("*")
        .eq("reference", reference)
        .eq("order_id", orderId)
        .single()

      if (paymentError) {
        console.error("❌ Payment record not found:", paymentError)
        return res.status(404).json({ error: "Payment not found" })
      }

      // 🔄 Update the payment record
      const { error: updateError } = await supabase
        .from("payments")
        .update({
          status: "success",
          payment_method: event.data.channel,
          transaction_date: paid_at,
          metadata: {
            ...paymentData.metadata,
            paystack_response: event.data,
          },
        })
        .eq("reference", reference)

      if (updateError) {
        console.error("❌ Failed to update payment record:", updateError)
        return res.status(500).json({ error: "Failed to update payment" })
      }

      // Update order status
      const { error: orderError } = await supabase
        .from("orders")
        .update({
          status: "confirmed",
          payment_status: "paid",
          payment_method: event.data.channel,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId)

      if (orderError) {
        console.error("❌ Failed to update order:", orderError)
        return res.status(500).json({ error: "Failed to update order" })
      }

      console.log("✅ Order and payment updated successfully")
    }

    // ✅ Return success response
    return res.status(200).json({ received: true })
  } catch (error) {
    console.error("🚨 Webhook processing error:", error)
    return res.status(500).json({ error: "Webhook processing failed" })
  }
}