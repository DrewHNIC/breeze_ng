// components/vendor/PaymentHistory.tsx
import React, { useState, useEffect } from "react"
import { supabase } from "@/utils/supabase"
import { format } from "date-fns"
import { Loader, RefreshCcw } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

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
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Payment History</h2>
          <p className="text-gray-600 dark:text-gray-300">Your recent advertisement payments</p>
        </div>
        <button
          onClick={fetchPayments}
          className="px-4 py-2 flex items-center bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="p-6 flex justify-center items-center">
          <Loader className="h-8 w-8 text-accent animate-spin" />
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="p-6 text-center">
          <p className="text-red-500">{error}</p>
          <button
            onClick={fetchPayments}
            className="mt-4 px-4 py-2 bg-accent text-primary rounded-lg hover:bg-accent/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && payments.length === 0 && (
        <div className="p-6 text-center text-gray-500 dark:text-gray-400">
          No payment history found.
        </div>
      )}

      {/* Payment Table */}
      {!isLoading && !error && payments.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {["Date", "Reference", "Package", "Amount", "Status", "Method"].map((header) => (
                  <th
                    key={header}
                    className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                    {payment.transaction_date
                      ? format(new Date(payment.transaction_date), "MMM d, yyyy h:mm a")
                      : format(new Date(payment.created_at), "MMM d, yyyy h:mm a")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                    {payment.reference}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                    {payment.metadata?.package_name || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                    ₦{payment.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                        payment.status
                      )}`}
                    >
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                    {payment.payment_method || "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  )
}

export default PaymentHistory
