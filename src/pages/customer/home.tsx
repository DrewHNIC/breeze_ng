// pages/customer/home.tsx
import { useState, useEffect } from "react"
import { useRouter } from "next/router" // Added this import to fix the router issue
import CustomerLayout from "../../components/CustomerLayout"
import { supabase } from "@/utils/supabase"
import HeroCarousel from "../../components/customer/HeroCarousel"
import CategoriesSection from "../../components/customer/CategoriesSection"
import PopularRestaurants from "../../components/customer/PopularRestaurants"
import RestaurantCard from "../../components/customer/RestaurantCard"
import { Heart } from 'lucide-react';
import LoyaltyExplainer from "@/components/customer/LoyaltyExplainer";

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
  const router = useRouter() // Initialize router
  const [featuredVendors, setFeaturedVendors] = useState<Vendor[]>([])
  const [popularVendors, setPopularVendors] = useState<Vendor[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Fetch customer profile for loyalty points
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: profileData } = await supabase
            .from("customers")
            .select("loyalty_points")
            .eq("id", session.user.id)
            .single();
            
          if (profileData) {
            setProfile(profileData);
          }
        }
    
        // **Fetch Featured Vendors (Random Selection)**
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
          .limit(6);

    
        if (randomError) console.error("Error fetching random vendors:", randomError);
    
        setFeaturedVendors(
          (randomVendors || []).map((vendor: any) => {
            // Access the first element of the array for nested selects
            const profileData = Array.isArray(vendor.vendor_profiles) 
              ? vendor.vendor_profiles[0] 
              : vendor.vendor_profiles;
              
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
            };
          })
        );
    
        // **Fetch Advertised Vendors (Only Active Ads)**
        const now = new Date().toISOString();
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
          .limit(6);
    
        if (adError) console.error("Error fetching advertised vendors:", adError);
        
        setPopularVendors(
          (advertisedVendors || []).map((ad: any) => {
            const vendor = ad.vendors;
            // Access the first element of the array for nested selects
            const profileData = Array.isArray(vendor.vendor_profiles) 
              ? vendor.vendor_profiles[0] 
              : vendor.vendor_profiles;
              
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
            };
          })
        );
    
        // **Fetch Categories from `cuisine_categories` Table**
        const { data: categoriesData, error: categoriesError } = await supabase
          .from("cuisine_categories")
          .select("name, image_url, description")
          .order("name", { ascending: true });
    
        if (categoriesError) console.error("Error fetching categories:", categoriesError);
    
        setCategories(categoriesData || []);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);
  

  return (
    <CustomerLayout title="Home">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-red-900 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-black font-medium italic">Loading delicious options near you...</p>
        </div>
      ) : (
        <div className="pb-10">
          {/* Hero Carousel */}
          {featuredVendors.length > 0 && <HeroCarousel vendors={featuredVendors} />}
          
          {/* Loyalty Points Banner */}
          {profile?.loyalty_points >= 5 && (
            <div className="container mx-auto px-4 mt-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-yellow-100 p-2 rounded-full mr-3">
                    <Heart className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium text-yellow-800">
                      You have {profile.loyalty_points} loyalty points!
                    </p>
                    <p className="text-sm text-yellow-700">
                      You can redeem 5 points for a 50% discount on your next order.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => router.push("/customer/search")}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                >
                  Order Now
                </button>
              </div>
            </div>
          )}
          
          <div className="container mx-auto px-4 mt-8">
            {/* Loyalty Program Explainer */}
            <div className="mb-8">
              <LoyaltyExplainer />
            </div>
            
            {/* Categories Section */}
            <CategoriesSection categories={categories} />

            {/* Explore Restaurants (Random Vendors) */}
            <section className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">Explore Our Options</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredVendors.map((vendor) => (
                  <RestaurantCard key={vendor.id} vendor={vendor} />
                ))}
              </div>
            </section>

            {/* Popular Restaurants (Advertised Vendors) */}
            <PopularRestaurants vendors={popularVendors} />
          </div>
        </div>
      )}
    </CustomerLayout>
  )
}

export default CustomerHome