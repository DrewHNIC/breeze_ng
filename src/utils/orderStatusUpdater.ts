import { supabase } from "@/utils/supabase"

export async function checkAndUpdateExpiredOrders() {
  try {
    // Get all orders that are in "preparing" status with expired estimated_delivery_time
    const { data: expiredOrders, error } = await supabase
      .from("orders")
      .select("id, estimated_delivery_time, status")
      .eq("status", "preparing")
      .not("estimated_delivery_time", "is", null)
      .lt("estimated_delivery_time", new Date().toISOString())

    if (error) {
      console.error("Error fetching expired orders:", error)
      return
    }

    if (!expiredOrders || expiredOrders.length === 0) {
      return
    }

    // Update all expired orders to "ready" status
    const orderIds = expiredOrders.map((order) => order.id)

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "ready",
        updated_at: new Date().toISOString(),
      })
      .in("id", orderIds)

    if (updateError) {
      console.error("Error updating expired orders:", updateError)
      return
    }

    console.log(`Updated ${expiredOrders.length} orders to "ready" status`)
  } catch (error) {
    console.error("Error in checkAndUpdateExpiredOrders:", error)
  }
}

// Function to start the background checker
export function startOrderStatusChecker() {
  // Check immediately
  checkAndUpdateExpiredOrders()

  // Then check every minute
  const interval = setInterval(checkAndUpdateExpiredOrders, 60000) // 60 seconds

  return interval
}
