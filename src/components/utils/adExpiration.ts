import { supabase } from "@/utils/supabase"

export async function checkAndUpdateExpiredAds(vendorId: string) {
  try {
    const now = new Date().toISOString()

    // Fetch expired ads in a single query
    const { data: expiredAds, error } = await supabase
      .from("advertisements")
      .select("id")
      .eq("vendor_id", vendorId)
      .eq("status", "active")
      .lt("expiry_time", now)

    if (error) {
      console.error("❌ Error fetching expired ads:", error)
      return { success: false, error }
    }

    if (!expiredAds || expiredAds.length === 0) {
      console.log("✅ No expired advertisements found.")
      return { success: true, message: "No expired advertisements found" }
    }

    const expiredAdIds = expiredAds.map((ad) => ad.id)

    // Batch update expired ads
    const { error: updateError } = await supabase
      .from("advertisements")
      .update({ status: "expired" })
      .in("id", expiredAdIds)

    if (updateError) {
      console.error("❌ Error updating expired ads:", updateError)
      return { success: false, error: updateError }
    }

    console.log(`✅ Successfully updated ${expiredAds.length} expired ads.`)

    return {
      success: true,
      message: `Updated ${expiredAds.length} expired advertisements`,
      updatedIds: expiredAdIds,
    }
  } catch (error) {
    console.error("⚠️ Exception in checkAndUpdateExpiredAds:", error)
    return { success: false, error }
  }
}
