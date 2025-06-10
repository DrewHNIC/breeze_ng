import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import CustomerLayout from "../../components/CustomerLayout"
import { supabase } from "@/utils/supabase"
import HeroCarousel from "../../components/customer/HeroCarousel"
import CategoriesSection from "../../components/customer/CategoriesSection"
import PopularRestaurants from "../../components/customer/PopularRestaurants"
import LoyaltyExplainer from "@/components/customer/LoyaltyExplainer"

interface Vendor {
  id: string
  store_name: string
  logo_url: string | null
  banner_url: string | null
  cuisine_type: string | null
  rating: number | null
  avg_delivery_time: string | null
  description: string | null
  is_advertised: boolean
}

interface Category {
  name: string
  image_url: string
  description?: string
}

const CustomerHome = () => {
  const router = useRouter()
  const [featuredVendors, setFeaturedVendors] = useState<Vendor[]>([])
  const [popularVendors, setPopularVendors] = useState<Vendor[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)

        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          const { data: profileData } = await supabase
            .from("customers")
            .select("loyalty_points")
            .eq("id", session.user.id)
            .single()

          if (profileData) {
            setProfile(profileData)
          }
        }

        const { data: randomVendors, error: randomError } = await supabase
          .from("vendors")
          .select(`
            id,
            store_name,
            cuisine_type,
            rating,
            avg_delivery_time,
            description,
            vendor_profiles:vendor_profiles!fk_vendor (
              logo_url,
              banner_url
            )
          `)
          .order("created_at", { ascending: false })
          .limit(6)

        if (randomError) console.error("Error fetching random vendors:", randomError)

        setFeaturedVendors(
          (randomVendors || []).map((vendor: any) => {
            const profileData = Array.isArray(vendor.vendor_profiles)
              ? vendor.vendor_profiles[0]
              : vendor.vendor_profiles

            return {
              id: vendor.id,
              store_name: vendor.store_name,
              logo_url: profileData?.logo_url ?? "/placeholder.svg",
              banner_url: profileData?.banner_url ?? "/placeholder.svg",
              cuisine_type: vendor.cuisine_type,
              rating: vendor.rating,
              avg_delivery_time: vendor.avg_delivery_time,
              description: vendor.description,
              is_advertised: false,
            }
          })
        )

        const now = new Date().toISOString()
        const { data: advertisedVendors, error: adError } = await supabase
          .from("advertisements")
          .select(`
            vendor_id,
            vendors!inner (
              id,
              store_name,
              cuisine_type,
              rating,
              avg_delivery_time,
              description,
              vendor_profiles:vendor_profiles!fk_vendor (
                logo_url,
                banner_url
              )
            )
          `)
          .eq("status", "active")
          .lt("start_date", now)
          .gt("end_date", now)
          .order("created_at", { ascending: false })
          .limit(6)

        if (adError) console.error("Error fetching advertised vendors:", adError)

        setPopularVendors(
          (advertisedVendors || []).map((ad: any) => {
            const vendor = ad.vendors
            const profileData = Array.isArray(vendor.vendor_profiles)
              ? vendor.vendor_profiles[0]
              : vendor.vendor_profiles

            return {
              id: vendor.id,
              store_name: vendor.store_name,
              logo_url: profileData?.logo_url ?? "/placeholder.svg",
              banner_url: profileData?.banner_url ?? "/placeholder.svg",
              cuisine_type: vendor.cuisine_type,
              rating: vendor.rating,
              avg_delivery_time: vendor.avg_delivery_time,
              description: vendor.description,
              is_advertised: true,
            }
          })
        )

        const { data: categoriesData, error: categoriesError } = await supabase
          .from("cuisine_categories")
          .select("name, image_url, description")
          .order("name", { ascending: true })

        if (categoriesError) console.error("Error fetching categories:", categoriesError)

        setCategories(categoriesData || [])
        setLoading(false)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <CustomerLayout title="Home">
      {loading ? (
        <div className="flex flex-col justify-center items-center h-64">
          <div
            className="w-12 h-12 border-4 border-[#C4710B] border-t-transparent rounded-full animate-spin"
            style={{
              background: "linear-gradient(to right, #872816, #C4710B)",
            }}
          />
          <p className="mt-4 text-[#1A2026] font-medium italic">
            Loading delicious options near you...
          </p>
        </div>
      ) : (
        <div className="pb-10">
          {featuredVendors.length > 0 && <HeroCarousel vendors={featuredVendors} />}

          {profile?.loyalty_points >= 5 && (
            <div className="container mx-auto mt-4">
              <LoyaltyExplainer points={profile.loyalty_points} />
            </div>
          )}

          {categories.length > 0 && (
            <div className="container mx-auto mt-6">
              <CategoriesSection categories={categories} />
            </div>
          )}

          {popularVendors.length > 0 && (
            <div className="container mx-auto mt-6">
              <PopularRestaurants vendors={popularVendors} />
            </div>
          )}
        </div>
      )}
    </CustomerLayout>
  )
}

export default CustomerHome
