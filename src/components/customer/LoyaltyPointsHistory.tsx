"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/utils/supabase"
import { Loader2, TrendingUp, TrendingDown, AlertCircle } from "lucide-react"

interface PointsHistoryItem {
  id: string
  created_at: string
  order_id: string
  points: number
  type: "earned" | "redeemed"
}

export default function LoyaltyPointsHistory({ customerId }: { customerId: string }) {
  const [history, setHistory] = useState<PointsHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPointsHistory = async () => {
      setLoading(true)
      setError(null)

      try {
        console.log("Fetching points history for customer:", customerId)

        const { data: allOrders, error: allOrdersError } = await supabase
          .from("orders")
          .select("id, created_at, loyalty_points_redeemed")
          .eq("customer_id", customerId)
          .order("created_at", { ascending: false })

        if (allOrdersError) {
          console.error("Error fetching all orders:", allOrdersError)
          setError("Failed to load orders history.")
          setLoading(false)
          return
        }

        const historyItems: PointsHistoryItem[] = []

        allOrders.forEach((order) => {
          historyItems.push({
            id: `earned-${order.id}`,
            created_at: order.created_at,
            order_id: order.id,
            points: 1,
            type: "earned",
          })

          if (order.loyalty_points_redeemed && order.loyalty_points_redeemed > 0) {
            historyItems.push({
              id: `redeemed-${order.id}`,
              created_at: order.created_at,
              order_id: order.id,
              points: order.loyalty_points_redeemed,
              type: "redeemed",
            })
          }
        })

        historyItems.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )

        // Optionally keep for console debugging:
        console.log("Debug Info:", {
          totalOrders: allOrders.length,
          ordersWithRedemption: allOrders.filter((o) => o.loyalty_points_redeemed > 0).length,
          historyItemsCount: historyItems.length,
        })

        setHistory(historyItems)
      } catch (error) {
        console.error("Error in fetchPointsHistory:", error)
        setError("An unexpected error occurred. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    if (customerId) {
      fetchPointsHistory()
    }
  }, [customerId])

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-[#b9c6c8]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-[#1d2c36] p-4 rounded-lg text-center">
        <AlertCircle className="h-6 w-6 text-[#b9c6c8] mx-auto mb-2" />
        <p className="text-[#8f8578]">{error}</p>
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-[#1d2c36]">
        <p>No loyalty points activity yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-lg text-[#1d2c36]">Points Activity</h3>
      <div className="space-y-2">
        {history.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 bg-[#1d2c36] rounded-lg border border-[#b9c6c8] shadow-sm"
          >
            <div className="flex items-center">
              {item.type === "earned" ? (
                <div className="bg-[#b9c6c8] p-2 rounded-full mr-3">
                  <TrendingUp className="h-5 w-5 text-[#1d2c36]" />
                </div>
              ) : (
                <div className="bg-[#8f8578] p-2 rounded-full mr-3">
                  <TrendingDown className="h-5 w-5 text-[#1d2c36]" />
                </div>
              )}
              <div>
                <p className="font-medium text-[#8f8578]">
                  {item.type === "earned" ? "Earned Points" : "Redeemed Points"}
                </p>
                <p className="text-sm text-[#8f8578] text-opacity-80">
                  Order #{item.order_id.substring(0, 8)} •{" "}
                  {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div
              className={`font-bold ${
                item.type === "earned" ? "text-[#b9c6c8]" : "text-[#8f8578]"
              }`}
            >
              {item.type === "earned" ? "+" : "-"}
              {item.points}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
