// pages/api/payments/initialize.ts
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
    const { packageName, price, userId } = req.body

    if (!packageName || !price || !userId) {
      return res.status(400).json({ error: "Package name, price, and userId are required" })
    }

    console.log(`🛒 Processing payment for user ${userId}, package: ${packageName}, price: ₦${price}`)

    // Verify the user exists
    const { data: userData, error: userError } = await supabase
      .from("vendors")
      .select("id, email, store_name, name")
      .eq("id", userId)
      .single()

    if (userError || !userData) {
      console.error("🚨 Vendor not found:", userError?.message || "No data")
      return res.status(404).json({ error: "Vendor not found" })
    }

    if (!userData.email) {
      console.error("🚨 Vendor email is missing")
      return res.status(400).json({ error: "Vendor email is missing" })
    }

    // Use store_name if available, or fallback to name
    const storeName = userData.store_name || userData.name || "Unnamed Store"

    // Generate a unique reference
    const reference = `ad_${uuidv4()}`

    // Initialize payment with Paystack
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: userData.email,
        amount: price * 100, // Convert to kobo (Paystack uses the smallest currency unit)
        reference,
        callback_url: `${req.headers.origin}/vendor/ads/payment-callback`,
        metadata: {
          vendor_id: userId,
          package_name: packageName,
          store_name: storeName,
          custom_fields: [
            { display_name: "Package", variable_name: "package", value: packageName },
            { display_name: "Store", variable_name: "store", value: storeName },
          ],
        },
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
          vendor_id: userId,
          reference: paystackResponse.data?.reference,
          amount: price,
          status: "pending",
          metadata: {
            package_name: packageName,
            price,
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
