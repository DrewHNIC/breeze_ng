// pages/api/payments/verify.ts
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

  const { reference, vendor_id } = req.query

  if (!reference) return res.status(400).json({ error: "Reference is required" })
  if (!vendor_id) return res.status(400).json({ error: "Vendor ID is required" })

  try {
    console.log(`🔍 Verifying payment for reference: ${reference}, vendor: ${vendor_id}`)

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
      .eq("vendor_id", vendor_id)
      .single()

    if (paymentError) {
      console.error("❌ Payment record not found:", paymentError)
      return res.status(404).json({ error: "Payment not found" })
    }

    // If payment is already processed, return the advertisement details
    if (paymentData.advertisement_id) {
      console.log("⚡ Payment already linked to an advertisement. Returning existing data.")
      const { data: adData, error: adError } = await supabase
        .from("advertisements")
        .select("*")
        .eq("id", paymentData.advertisement_id)
        .single()

      if (adError) {
        console.error("❌ Advertisement not found:", adError)
        return res.status(404).json({ error: "Advertisement not found" })
      }

      return res.status(200).json({
        success: true,
        data: {
          payment: paymentData,
          advertisement: adData,
        },
      })
    }

    // Payment is successful, but ad is not yet created
    if (paymentStatus === "success") {
      console.log("🎯 Payment successful. Creating advertisement...")

      const packageName = paymentData.metadata.package_name
      const price = paymentData.amount

      const startDate = new Date()
      const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000) // 1-day duration

      // Create new advertisement entry
      const { data: adData, error: adError } = await supabase
        .from("advertisements")
        .insert({
          vendor_id,
          package_name: packageName,
          package_price: price,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          status: "active",
        })
        .select()
        .single()

      if (adError) {
        console.error("❌ Failed to create advertisement:", adError)
        return res.status(500).json({ error: "Failed to create advertisement" })
      }

      console.log("🚀 Advertisement created successfully:", adData)

      // Update payment record with advertisement ID
      const { error: updateError } = await supabase
        .from("payments")
        .update({
          status: "success",
          advertisement_id: adData.id,
          payment_method: paystackResponse.data.channel,
          transaction_date: paystackResponse.data.paid_at,
          metadata: {
            ...paymentData.metadata,
            paystack_response: paystackResponse.data,
          },
        })
        .eq("id", paymentData.id)

      if (updateError) {
        console.error("❌ Failed to update payment record:", updateError)
        return res.status(500).json({ error: "Failed to update payment record" })
      }

      console.log("✅ Payment record updated successfully")

      return res.status(200).json({
        success: true,
        data: {
          payment: {
            ...paymentData,
            status: "success",
            advertisement_id: adData.id,
          },
          advertisement: adData,
        },
      })
    }

    // Payment not successful
    console.warn(`⚠️ Payment verification returned unsuccessful status: ${paymentStatus}`)
    return res.status(200).json({
      success: false,
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
