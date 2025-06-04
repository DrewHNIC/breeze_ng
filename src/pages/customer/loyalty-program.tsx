// pages/customer/loyalty-program.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { supabase } from "@/utils/supabase"
import CustomerLayout from "@/components/CustomerLayout"
import LoyaltyPointsHistory from "@/components/customer/LoyaltyPointsHistory"
import { Heart, Award, Gift, Loader2, AlertCircle, Info, ShoppingBag, Percent } from 'lucide-react'

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
  
  useEffect(() => {
    fetchProfile()
  }, [])
  
  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/login")
        return
      }
      
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
      
      setProfile(data)
    } catch (error) {
      console.error("Error in fetchProfile:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }
  
  if (isLoading) {
    return (
      <CustomerLayout title="Loyalty Program">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-red-500" />
          </div>
        </div>
      </CustomerLayout>
    )
  }
  
  if (error || !profile) {
    return (
      <CustomerLayout title="Loyalty Program">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-red-700 mb-2">Error</h2>
            <p className="text-red-600 mb-4">{error || "Could not load your profile"}</p>
            <button
              onClick={fetchProfile}
              className="bg-red-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors"
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
        <h1 className="text-2xl font-bold mb-6 flex items-center">
          <Heart className="h-6 w-6 mr-2 text-red-500" />
          BREEZE Loyalty Program
        </h1>
        
        {/* Points Summary Card */}
        <div className="bg-gradient-to-r from-red-500 to-red-700 rounded-lg shadow-lg p-6 mb-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2">Your Loyalty Points</h2>
              <p className="text-white text-opacity-90">Keep ordering to earn more points!</p>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg px-8 py-4 text-center">
                <p className="text-sm uppercase tracking-wide">Available Points</p>
                <p className="text-4xl font-bold">{profile.loyalty_points}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* How It Works */}
        <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6 mb-8">
          <h2 className="text-xl font-bold mb-6 flex items-center">
            <Info className="h-5 w-5 mr-2 text-red-500" />
            How It Works
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-red-50 rounded-lg p-6 border border-red-100">
              <div className="bg-white h-16 w-16 rounded-full flex items-center justify-center mb-4 shadow-sm">
                <ShoppingBag className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-lg font-bold mb-2">Earn Points</h3>
              <p className="text-gray-600">
                Earn 1 loyalty point for every order you place through BREEZE, regardless of the order amount.
              </p>
            </div>
            
            <div className="bg-red-50 rounded-lg p-6 border border-red-100">
              <div className="bg-white h-16 w-16 rounded-full flex items-center justify-center mb-4 shadow-sm">
                <Percent className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-lg font-bold mb-2">Redeem Rewards</h3>
              <p className="text-gray-600">
                Use 10 points to get a 50% discount (up to ₦2,000) on your next order at checkout.
              </p>
            </div>
            
            <div className="bg-red-50 rounded-lg p-6 border border-red-100">
              <div className="bg-white h-16 w-16 rounded-full flex items-center justify-center mb-4 shadow-sm">
                <Award className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-lg font-bold mb-2">No Expiration</h3>
              <p className="text-gray-600">
                Your loyalty points never expire, so you can save them for when you need them most.
              </p>
            </div>
          </div>
        </div>
        
        {/* Upcoming Rewards */}
        <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6 mb-8">
          <h2 className="text-xl font-bold mb-6 flex items-center">
            <Gift className="h-5 w-5 mr-2 text-red-500" />
            Upcoming Rewards
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center">
                <div className="bg-red-100 p-3 rounded-full mr-4">
                  <Percent className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <h3 className="font-bold">50% Off Your Next Order</h3>
                  <p className="text-sm text-gray-600">Up to ₦2,000 discount</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">{profile.loyalty_points}/10 points</p>
                <p className="text-sm text-gray-500">
                  {profile.loyalty_points >= 10 ? 'Ready to redeem!' : `Need ${10 - profile.loyalty_points} more points`}
                </p>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-600 text-sm">
                More rewards coming soon! We're constantly working on new ways to reward our loyal customers.
              </p>
            </div>
          </div>
        </div>
        
        {/* Points History */}
        <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
          <h2 className="text-xl font-bold mb-6">Points History</h2>
          <LoyaltyPointsHistory customerId={profile.id} />
        </div>
      </div>
    </CustomerLayout>
  )
}

export default LoyaltyProgramPage