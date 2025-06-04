// pages/customer/search.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { supabase } from "@/utils/supabase"
import { Search, X, Filter, Star, Clock } from 'lucide-react'
import CustomerLayout from "@/components/CustomerLayout"
import Image from "next/image"
import Link from "next/link"

// Define Interfaces
interface Vendor {
  id: string
  store_name: string
  logo_url: string | null
  banner_url: string | null
  cuisine_type: string | null
  rating: number | null
  avg_delivery_time: string | null
  is_advertised?: boolean
}

interface MenuItem {
  id: string
  item_name: string
  description: string
  image_url: string
  price: number
  vendor_id: string
  vendor_name: string
}

interface Category {
  name: string
  count: number
  image_url?: string
}

const SearchPage = () => {
  const router = useRouter()
  const { q, category } = router.query
  
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [advertisedVendors, setAdvertisedVendors] = useState<Vendor[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Set initial search term and category from URL
  useEffect(() => {
    if (q && typeof q === "string") {
      setSearchTerm(q)
    }
    
    if (category && typeof category === "string") {
      setSelectedCategory(category.replace(/-/g, " "))
    }
  }, [q, category])

  // Fetch Advertised Vendors (with active advertisements)
  useEffect(() => {
    const fetchAdvertisedVendors = async () => {
      try {
        // Get current date for comparison
        const now = new Date().toISOString()
        
        // Fetch vendors with active advertisements
        const { data, error } = await supabase
          .from("advertisements")
          .select(`
            vendor_id,
            vendors!inner (
              id, 
              store_name
            ),
            vendor_profiles!inner (
              logo_url,
              banner_url,
              cuisine_type
            )
          `)
          .eq("status", "active")
          .lt("start_date", now)
          .gt("end_date", now)
        
        if (error) {
          console.error("Error fetching advertised vendors:", error)
          return
        }
        
        // Transform the data to get complete vendor information
        const advertisedVendorsData = data.map(item => {
          // Access the first element of the arrays for nested selects
          const vendorData = Array.isArray(item.vendors) 
            ? item.vendors[0] 
            : item.vendors
          const profileData = Array.isArray(item.vendor_profiles) 
            ? item.vendor_profiles[0] 
            : item.vendor_profiles
          
          return {
            id: item.vendor_id,
            store_name: vendorData?.store_name || "Unknown Restaurant",
            logo_url: profileData?.logo_url || null,
            banner_url: profileData?.banner_url || null,
            cuisine_type: profileData?.cuisine_type || null,
            rating: null,
            avg_delivery_time: null,
            is_advertised: true
          }
        }).filter(vendor => vendor.banner_url || vendor.logo_url) // Only include vendors with images
        
        setAdvertisedVendors(advertisedVendorsData)
      } catch (error) {
        console.error("Error in fetchAdvertisedVendors:", error)
      }
    }
    
    fetchAdvertisedVendors()
  }, [])

  // Fetch Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Fetch cuisine categories from the new table
        const { data, error } = await supabase
          .from("cuisine_categories")
          .select("name, image_url, description")
          .order("name", { ascending: true })
        
        if (error) {
          console.error("Error fetching categories:", error)
          return
        }
        
        // Transform to the format expected by the component
        // We'll keep the count field but not display it
        const categoryData = data.map(category => ({
          name: category.name,
          count: 1,
          image_url: category.image_url
        }))
        
        setCategories(categoryData)
      } catch (error) {
        console.error("Error in fetchCategories:", error)
      }
    }
    
    fetchCategories()
  }, [])

  // Fetch Vendors and Menu Items based on search or category
  useEffect(() => {
    const fetchSearchResults = async () => {
      setLoading(true)
      
      try {
        // Base query for vendors
        let vendorQuery = supabase
          .from("vendors")
          .select(`
            id,
            store_name,
            rating,
            avg_delivery_time,
            vendor_profiles!inner (
              logo_url,
              banner_url,
              cuisine_type
            )
          `)
        
        // Apply search filter if search term exists
        if (searchTerm) {
          vendorQuery = vendorQuery.ilike("store_name", `%${searchTerm}%`)
        }
        
        // Apply category filter if selected
        if (selectedCategory) {
          vendorQuery = vendorQuery.eq("vendor_profiles.cuisine_type", selectedCategory)
        }
        
        // Execute vendor query
        const { data: vendorData, error: vendorError } = await vendorQuery
        
        if (vendorError) {
          console.error("Error fetching vendors:", vendorError)
        } else {
          // Transform vendor data
          const transformedVendors = vendorData.map(vendor => {
            // Access the first element of the array for nested selects
            const profileData = Array.isArray(vendor.vendor_profiles) 
              ? vendor.vendor_profiles[0] 
              : vendor.vendor_profiles
            
            return {
              id: vendor.id,
              store_name: vendor.store_name,
              logo_url: profileData?.logo_url || null,
              banner_url: profileData?.banner_url || null,
              cuisine_type: profileData?.cuisine_type || null,
              rating: vendor.rating,
              avg_delivery_time: vendor.avg_delivery_time
            }
          })
          
          setVendors(transformedVendors)
        }
        
        // Fetch menu items if search term exists
        if (searchTerm) {
          const { data: menuData, error: menuError } = await supabase
            .from("menu_items")
            .select(`
              id, 
              item_name, 
              description, 
              image_url, 
              price,
              vendor_id,
              vendors!inner (store_name)
            `)
            .ilike("item_name", `%${searchTerm}%`)
          
          if (menuError) {
            console.error("Error fetching menu items:", menuError)
          } else {
            // Transform menu item data
            const transformedMenuItems = menuData.map(item => {
              // Access the first element of the array for nested selects
              const vendorData = Array.isArray(item.vendors) ? item.vendors[0] : item.vendors
              
              return {
                id: item.id,
                item_name: item.item_name,
                description: item.description || "",
                image_url: item.image_url || "/placeholder.svg?height=80&width=80",
                price: item.price,
                vendor_id: item.vendor_id,
                vendor_name: vendorData?.store_name || "Unknown Restaurant"
              }
            })
            
            setMenuItems(transformedMenuItems)
          }
        } else {
          setMenuItems([])
        }
      } catch (error) {
        console.error("Error in fetchSearchResults:", error)
      } finally {
        setLoading(false)
      }
    }
    
    // Only fetch if we have a search term or category
    if (searchTerm || selectedCategory) {
      fetchSearchResults()
    } else if (!loading) {
      // Reset results if no search term or category
      setVendors([])
      setMenuItems([])
      setLoading(false)
    }
  }, [searchTerm, selectedCategory])

  // Handle Search Form Submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Update URL with search parameters
    const params = new URLSearchParams()
    if (searchTerm) params.set("q", searchTerm)
    if (selectedCategory) {
      const formattedCategory = selectedCategory.toLowerCase().replace(/\s+/g, "-")
      params.set("category", formattedCategory)
    }
    
    router.push(`/customer/search?${params.toString()}`)
  }

  // Handle Category Selection
  const handleCategorySelect = (category: string) => {
    const newCategory = category === selectedCategory ? null : category
    setSelectedCategory(newCategory)
    
    // Update URL
    const params = new URLSearchParams(router.query as Record<string, string>)
    if (newCategory) {
      const formattedCategory = newCategory.toLowerCase().replace(/\s+/g, "-")
      params.set("category", formattedCategory)
    } else {
      params.delete("category")
    }
    
    if (searchTerm) params.set("q", searchTerm)
    
    router.push(`/customer/search?${params.toString()}`, undefined, { shallow: true })
  }

  // Clear all filters
  const handleClearFilters = () => {
    setSelectedCategory(null)
    
    // Update URL - keep search term if exists
    const params = new URLSearchParams()
    if (searchTerm) params.set("q", searchTerm)
    
    router.push(`/customer/search?${params.toString()}`, undefined, { shallow: true })
  }

  return (
    <CustomerLayout title="Search">
      <div className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex items-center space-x-2 bg-white p-4 rounded-lg shadow-md">
          <Search className="text-gray-500" />
          <input
            type="text"
            placeholder="Search for restaurants or menu items..."
            className="w-full bg-transparent outline-none text-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button type="button" onClick={() => setSearchTerm("")} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          )}
          <button
            type="submit"
            className="bg-accent text-primary px-4 py-2 rounded-md font-medium hover:bg-opacity-90 transition-colors"
          >
            Search
          </button>
        </form>

        {/* Category Filters */}
        {categories.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <Filter className="h-5 w-5 mr-2 text-black" />
                <h3 className="font-medium">Filter by Cuisine:</h3>
              </div>
              
              {/* Clear Filter Button - Only show when a category is selected */}
              {selectedCategory && (
                <button
                  onClick={handleClearFilters}
                  className="text-accent hover:text-accent-dark text-sm font-medium"
                >
                  Clear Filter
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.name}
                  onClick={() => handleCategorySelect(category.name)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    selectedCategory === category.name
                      ? "bg-black text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Advertised Vendors */}
        {!searchTerm && !selectedCategory && advertisedVendors.length > 0 && (
          <section className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Featured Restaurants</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {advertisedVendors.map((vendor) => (
                <Link key={vendor.id} href={`/customer/restaurant/${vendor.id}`} className="group">
                  <div className="relative h-60 rounded-lg overflow-hidden shadow-md">
                    <Image 
                      src={vendor.banner_url || vendor.logo_url || "/placeholder.svg?height=240&width=400"} 
                      alt={vendor.store_name}
                      fill
                      className="object-cover transition-transform group-hover:scale-105 duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-70"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <h3 className="text-xl font-bold">{vendor.store_name}</h3>
                      {vendor.cuisine_type && (
                        <p className="text-sm opacity-90">{vendor.cuisine_type}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Search Results */}
        {(searchTerm || selectedCategory) && (
          <div className="mt-8">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
              </div>
            ) : (
              <>
                {/* Vendor Results */}
                {vendors.length > 0 ? (
                  <section className="mb-10">
                    <h2 className="text-2xl font-bold mb-4">
                      {selectedCategory ? `${selectedCategory} Restaurants` : "Restaurants"}
                      {searchTerm ? ` matching "${searchTerm}"` : ""}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {vendors.map((vendor) => (
                        <Link key={vendor.id} href={`/customer/restaurant/${vendor.id}`} className="block group">
                          <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100 h-full">
                            <div className="relative h-48 w-full">
                              <Image
                                src={vendor.banner_url || vendor.logo_url || "/placeholder.svg?height=192&width=384"}
                                alt={vendor.store_name}
                                fill
                                className="object-cover transition-transform group-hover:scale-105 duration-300"
                              />
                            </div>
                            <div className="p-4">
                              <h3 className="font-bold text-lg mb-1 line-clamp-1">{vendor.store_name}</h3>
                              <p className="text-gray-600 text-sm mb-2">{vendor.cuisine_type || "Various Cuisine"}</p>
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <Star className="h-4 w-4 text-yellow-500 mr-1" />
                                  <span className="text-sm font-medium">
                                    {vendor.rating ? vendor.rating.toFixed(1) : "New"}
                                  </span>
                                </div>
                                
                                {vendor.avg_delivery_time && (
                                  <div className="flex items-center text-sm text-gray-500">
                                    <Clock className="h-4 w-4 mr-1" />
                                    <span>{vendor.avg_delivery_time}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                ) : (
                  searchTerm && (
                    <p className="text-center py-8 text-gray-500">
                      No restaurants found matching &quot;{searchTerm}&quot;
                      {selectedCategory ? ` in ${selectedCategory}` : ""}
                    </p>
                  )
                )}

                {/* Menu Item Results */}
                {menuItems.length > 0 && (
                  <section className="mt-8">
                    <h2 className="text-2xl font-bold mb-4">Menu Items matching &quot;{searchTerm}&quot;</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {menuItems.map((item) => (
                        <Link 
                          key={item.id} 
                          href={`/customer/restaurant/${item.vendor_id}?highlight=${item.id}`}
                          className="bg-white shadow-md rounded-lg p-4 flex items-center space-x-4 hover:shadow-lg transition-shadow"
                        >
                          <div className="relative h-20 w-20 flex-shrink-0">
                            <Image
                              src={item.image_url || "/placeholder.svg"}
                              alt={item.item_name}
                              fill
                              className="object-cover rounded-lg"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold line-clamp-1">{item.item_name}</h3>
                            <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
                            <div className="flex justify-between items-center mt-2">
                              <p className="text-lg font-bold text-accent">₦{item.price.toLocaleString()}</p>
                              <p className="text-xs text-gray-500">{item.vendor_name}</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {vendors.length === 0 && menuItems.length === 0 && searchTerm && (
                  <div className="text-center py-12">
                    <p className="text-xl text-gray-600 mb-4">No results found</p>
                    <p className="text-gray-500">Try adjusting your search or filters</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </CustomerLayout>
  )
}

export default SearchPage