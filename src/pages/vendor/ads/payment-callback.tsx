// pages/vendor/ads/payment-callback.tsx
import React, { useEffect, useState } from "react"
import { useRouter } from "next/router"
import DashboardLayout from "@/components/DashboardLayout"
import { CheckCircle, XCircle, Loader } from 'lucide-react'
import Link from "next/link"
import { supabase } from "@/utils/supabase"

type PaymentStatus = "loading" | "success" | "error";

const PaymentCallback: React.FC = () => {
  const router = useRouter()
  const { reference } = router.query
  const [status, setStatus] = useState<PaymentStatus>("loading")
  const [message, setMessage] = useState<string>("")
  const [vendorId, setVendorId] = useState<string | null>(null)

  useEffect(() => {
    const fetchVendorId = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setVendorId(session.user.id)
        } else {
          router.push("/login")
        }
      } catch (error) {
        console.error("Error fetching vendor ID:", error)
        router.push("/login")
      }
    }

    fetchVendorId()
  }, [router])

  useEffect(() => {
    if (!reference || !vendorId) return

    const verifyPayment = async () => {
      try {
        console.log(`🔍 Verifying payment for reference: ${reference}`)
        
        const response = await fetch(`/api/payments/verify?reference=${reference}&vendor_id=${vendorId}`)
        if (!response.ok) throw new Error(`Server error: ${response.status}`)

        const data = await response.json()
        console.log("✅ Payment verification response:", data)

        if (data.success) {
          setStatus("success")
          setMessage("Your payment was successful! Your advertisement campaign is now active.")
        } else {
          setStatus("error")
          setMessage(data.data?.message || "Payment verification failed. Please contact support.")
        }
      } catch (error) {
        console.error("❌ Error verifying payment:", error)
        setStatus("error")
        setMessage("An error occurred while verifying your payment. Please contact support.")
      }
    }

    verifyPayment()
  }, [reference, vendorId, router.isReady])

  return (
    <DashboardLayout title="Payment Status">
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
        <div className="p-8 flex flex-col items-center text-center">
          
          {status === "loading" && (
            <>
              <Loader className="h-16 w-16 text-accent animate-spin mb-6" />
              <h2 className="text-2xl font-bold mb-2">Verifying Payment</h2>
              <p className="text-gray-600 dark:text-gray-300">
                Please wait while we verify your payment...
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="h-16 w-16 text-green-500 mb-6" />
              <h2 className="text-2xl font-bold mb-2 text-green-600 dark:text-green-400">
                Payment Successful!
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-6">{message}</p>
              <Link href="/vendor/ads">
                <button className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all">
                  View Your Campaign
                </button>
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="h-16 w-16 text-red-500 mb-6" />
              <h2 className="text-2xl font-bold mb-2 text-red-600 dark:text-red-400">
                Payment Failed
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-6">{message}</p>
              <Link href="/vendor/ads">
                <button className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all">
                  Try Again
                </button>
              </Link>
            </>
          )}
          
        </div>
      </div>
    </DashboardLayout>
  )
}

export default PaymentCallback