"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { supabase } from "@/utils/supabase"
import { format } from "date-fns"
import { Loader, RefreshCcw } from "lucide-react"

interface Payment {
  id: string
  reference: string
  amount: number
  status: string
  payment_method: string
  transaction_date: string
  created_at: string
  metadata: {
    package_name: string
  }
}

const PaymentHistory: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) return

      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("vendor_id", sessionData.session.user.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      setPayments(data || [])
    } catch (error) {
      console.error("Error fetching payments:", error)
      setError("Failed to load payment history. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "success":
        return "bg-green-100 text-green-800 border border-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200"
      case "failed":
        return "bg-red-100 text-red-800 border border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200"
    }
  }

  return (
    <div className="bg-gradient-to-br from-[#1d2c36] to-[#243642] rounded-xl shadow-xl overflow-hidden border border-[#b9c6c8]/20">
      {/* Header */}
      <div className="p-6 border-b border-[#b9c6c8]/20 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#b9c6c8]">Payment History</h2>
          <p className="text-[#8f8578]">Your recent advertisement payments</p>
        </div>
        <button
          onClick={fetchPayments}
          className="px-4 py-2 flex items-center bg-gradient-to-r from-[#b9c6c8] to-[#8f8578] text-[#1d2c36] rounded-lg hover:from-[#8f8578] hover:to-[#b9c6c8] transition-all duration-200"
        >
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="p-6 flex justify-center items-center">
          <Loader className="h-8 w-8 text-[#b9c6c8] animate-spin" />
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="p-6 text-center">
          <p className="text-red-400">{error}</p>
          <button
            onClick={fetchPayments}
            className="mt-4 px-4 py-2 bg-gradient-to-r from-[#b9c6c8] to-[#8f8578] text-[#1d2c36] rounded-lg hover:from-[#8f8578] hover:to-[#b9c6c8] transition-all duration-200"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && payments.length === 0 && (
        <div className="p-6 text-center text-[#8f8578]">No payment history found.</div>
      )}

      {/* Payment Table */}
      {!isLoading && !error && payments.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-[#b9c6c8]/10 to-transparent border-b border-[#b9c6c8]/20">
              <tr>
                {["Date", "Reference", "Package", "Amount", "Status", "Method"].map((header) => (
                  <th key={header} className="px-6 py-3 text-left font-medium text-[#8f8578] uppercase tracking-wider">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#b9c6c8]/10">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-[#b9c6c8]/5 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap text-[#8f8578]">
                    {payment.transaction_date
                      ? format(new Date(payment.transaction_date), "MMM d, yyyy h:mm a")
                      : format(new Date(payment.created_at), "MMM d, yyyy h:mm a")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-[#8f8578]">{payment.reference}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-[#8f8578]">
                    {payment.metadata?.package_name || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-[#b9c6c8] font-medium">
                    ₦{payment.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                        payment.status,
                      )}`}
                    >
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-[#8f8578]">{payment.payment_method || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default PaymentHistory
