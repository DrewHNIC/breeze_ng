"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { supabase } from "@/utils/supabase"
import CustomerLayout from "@/components/CustomerLayout"
import LoyaltyPointsHistory from "@/components/customer/LoyaltyPointsHistory"
import { Heart, Award, Gift, Loader2, AlertCircle, Info, ShoppingBag, Percent } from "lucide-react"

interface CustomerProfile {
  id: string
  name: string
  loyalty_points: number
  created_at: string
}

const LoyaltyProgramPage = () => {
  const router = useRouter()
  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.push("/login")
        return
      }

      console.log("Fetching profile for user ID:", session.user.id)

      const { data, error } = await supabase
        .from("customers")
        .select("id, name, loyalty_points, created_at")
        .eq("id", session.user.id)
        .single()

      if (error) {
        console.error("Error fetching profile:", error)
        setError("Failed to load profile. Please try again.")
        return
      }

      console.log("Profile data:", data)
      setProfile(data)

      // Calculate loyalty points manually as a fallback
      if (data && (data.loyalty_points === null || data.loyalty_points === undefined)) {
        console.log("Loyalty points not found in profile, calculating manually...")
        await calculateLoyaltyPoints(session.user.id)
      }
    } catch (error) {
      console.error("Error in fetchProfile:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate loyalty points manually by counting orders and redemptions
  const calculateLoyaltyPoints = async (userId: string) => {
    try {
      // Get total orders (each order earns 1 point)
      const { data: orders, error: ordersError } = await supabase.from("orders").select("id").eq("customer_id", userId)

      if (ordersError) {
        console.error("Error fetching orders:", ordersError)
        return
      }

      // Get total points redeemed
      const { data: redeemedOrders, error: redeemedError } = await supabase
        .from("orders")
        .select("loyalty_points_redeemed")
        .eq("customer_id", userId)
        .gt("loyalty_points_redeemed", 0)

      if (redeemedError) {
        console.error("Error fetching redeemed points:", redeemedError)
        return
      }

      const totalOrders = orders?.length || 0
      const totalRedeemed = redeemedOrders?.reduce((sum, order) => sum + (order.loyalty_points_redeemed || 0), 0) || 0

      const calculatedPoints = totalOrders - totalRedeemed

      setDebugInfo({
        totalOrders,
        totalRedeemed,
        calculatedPoints,
      })

      // Update profile with calculated points
      if (profile) {
        setProfile({
          ...profile,
          loyalty_points: calculatedPoints,
        })

        // Optionally update the database with the calculated points
        const { error: updateError } = await supabase
          .from("customers")
          .update({ loyalty_points: calculatedPoints })
          .eq("id", userId)

        if (updateError) {
          console.error("Error updating loyalty points:", updateError)
        }
      }
    } catch (error) {
      console.error("Error calculating loyalty points:", error)
    }
  }

  if (isLoading) {
    return (
      <CustomerLayout title="Loyalty Program">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-[#b9c6c8]" />
          </div>
        </div>
      </CustomerLayout>
    )
  }

  if (error || !profile) {
    return (
      <CustomerLayout title="Loyalty Program">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-[#1d2c36] border border-[#b9c6c8] rounded-lg p-6 text-center">
            <AlertCircle className="h-12 w-12 text-[#b9c6c8] mx-auto mb-4" />
            <h2 className="text-lg font-bold text-[#8f8578] mb-2">Error</h2>
            <p className="text-[#8f8578] mb-4">{error || "Could not load your profile"}</p>
            <button
              onClick={fetchProfile}
              className="bg-[#b9c6c8] text-[#1d2c36] px-6 py-2 rounded-lg font-medium hover:bg-opacity-90 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </CustomerLayout>
    )
  }

  return (
    <CustomerLayout title="Loyalty Program">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center text-[#1d2c36]">
          <Heart className="h-6 w-6 mr-2 text-[#b9c6c8]" />
          BREEZE Loyalty Program
        </h1>

        {/* Points Summary Card */}
        <div className="bg-gradient-to-r from-[#b9c6c8] to-[#1d2c36] rounded-lg shadow-lg p-6 mb-8 text-[#8f8578]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2">Your Loyalty Points</h2>
              <p className="text-[#8f8578] text-opacity-90">Keep ordering to earn more points!</p>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="bg-[#1d2c36] bg-opacity-70 backdrop-blur-sm rounded-lg px-8 py-4 text-center">
                <p className="text-sm uppercase tracking-wide">Available Points</p>
                <p className="text-4xl font-bold">{profile.loyalty_points !== null ? profile.loyalty_points : "..."}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Debug Information - Only visible during development */}
        {debugInfo && (
          <div className="bg-[#1d2c36] text-[#8f8578] p-4 rounded-lg mb-8 border border-[#b9c6c8]">
            <h3 className="font-bold mb-2">Debug Information</h3>
            <pre className="text-xs overflow-auto">{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )}

        {/* How It Works */}
        <div className="bg-[#8f8578] rounded-lg shadow-md border border-[#1d2c36] p-6 mb-8">
          <h2 className="text-xl font-bold mb-6 flex items-center text-[#1d2c36]">
            <Info className="h-5 w-5 mr-2 text-[#b9c6c8]" />
            How It Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#1d2c36] rounded-lg p-6 border border-[#b9c6c8]">
              <div className="bg-[#8f8578] h-16 w-16 rounded-full flex items-center justify-center mb-4 shadow-sm">
                <ShoppingBag className="h-8 w-8 text-[#b9c6c8]" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-[#8f8578]">Earn Points</h3>
              <p className="text-[#8f8578] text-opacity-80">
                Earn 1 loyalty point for every order you place through BREEZE, regardless of the order amount.
              </p>
            </div>

            <div className="bg-[#1d2c36] rounded-lg p-6 border border-[#b9c6c8]">
              <div className="bg-[#8f8578] h-16 w-16 rounded-full flex items-center justify-center mb-4 shadow-sm">
                <Percent className="h-8 w-8 text-[#b9c6c8]" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-[#8f8578]">Redeem Rewards</h3>
              <p className="text-[#8f8578] text-opacity-80">
                Use 10 points to get a 50% discount (up to ₦2,000) on your next order at checkout.
              </p>
            </div>

            <div className="bg-[#1d2c36] rounded-lg p-6 border border-[#b9c6c8]">
              <div className="bg-[#8f8578] h-16 w-16 rounded-full flex items-center justify-center mb-4 shadow-sm">
                <Award className="h-8 w-8 text-[#b9c6c8]" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-[#8f8578]">No Expiration</h3>
              <p className="text-[#8f8578] text-opacity-80">
                Your loyalty points never expire, so you can save them for when you need them most.
              </p>
            </div>
          </div>
        </div>

        {/* Upcoming Rewards */}
        <div className="bg-[#8f8578] rounded-lg shadow-md border border-[#1d2c36] p-6 mb-8">
          <h2 className="text-xl font-bold mb-6 flex items-center text-[#1d2c36]">
            <Gift className="h-5 w-5 mr-2 text-[#b9c6c8]" />
            Upcoming Rewards
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-[#1d2c36] rounded-lg bg-[#1d2c36]">
              <div className="flex items-center">
                <div className="bg-[#b9c6c8] p-3 rounded-full mr-4">
                  <Percent className="h-6 w-6 text-[#1d2c36]" />
                </div>
                <div>
                  <h3 className="font-bold text-[#8f8578]">50% Off Your Next Order</h3>
                  <p className="text-sm text-[#8f8578] text-opacity-80">Up to ₦2,000 discount</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg text-[#8f8578]">
                  {profile.loyalty_points !== null ? profile.loyalty_points : "..."}/10 points
                </p>
                <p className="text-sm text-[#8f8578] text-opacity-80">
                  {profile.loyalty_points >= 10
                    ? "Ready to redeem!"
                    : `Need ${10 - (profile.loyalty_points || 0)} more points`}
                </p>
              </div>
            </div>

            <div className="bg-[#1d2c36] p-4 rounded-lg">
              <p className="text-[#8f8578] text-opacity-80 text-sm">
                More rewards coming soon! We're constantly working on new ways to reward our loyal customers.
              </p>
            </div>
          </div>
        </div>

        {/* Points History */}
        <div className="bg-[#8f8578] rounded-lg shadow-md border border-[#1d2c36] p-6">
          <h2 className="text-xl font-bold mb-6 text-[#1d2c36]">Points History</h2>
          <LoyaltyPointsHistory customerId={profile.id} />
        </div>
      </div>
    </CustomerLayout>
  )
}

export default LoyaltyProgramPage
