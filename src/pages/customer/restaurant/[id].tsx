// pages/customer/restaurant/[id].tsx
"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/router"
import { supabase } from "@/utils/supabase"
import CustomerLayout from "@/components/CustomerLayout"
import RestaurantHeader from "@/components/customer/RestaurantHeader"
import MenuCategories from "@/components/customer/MenuCategories"
import MenuItem from "@/components/customer/MenuItem"
import CartSummary from "@/components/customer/CartSummary"
import { Loader2, AlertCircle } from 'lucide-react'

interface Restaurant {
  id: string
  store_name: string
  logo_url: string | null
  banner_url: string | null
  cuisine_type: string
  rating: number
  is_open: boolean
  operating_hours: {
    [day: string]: {
      is_open: boolean
      open_time: string
      close_time: string
    }
  }
  address: string
  city: string
  state: string
  contact_phone: string
  average_preparation_time: string
}

interface MenuCategory {
  id: string
  name: string
}

interface MenuItemType {
  id: string
  name: string
  description: string
  price: number
  image_url: string | null
  category_id: string
}

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

const RestaurantPage = () => {
  const router = useRouter()
  const { id: restaurantId, highlight: highlightItemId } = router.query
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([])
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([])
  const [activeCategory, setActiveCategory] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  
  // Ref for highlighted menu item
  const highlightedItemRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (router.isReady && restaurantId) {
      fetchRestaurantData()
    }
  }, [router.isReady, restaurantId])
  
  // Scroll to highlighted item if specified
  useEffect(() => {
    if (highlightItemId && highlightedItemRef.current) {
      setTimeout(() => {
        highlightedItemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 500)
    }
  }, [highlightItemId, menuItems])
  
  const fetchRestaurantData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // First, fetch the vendor data
      const { data: vendorData, error: vendorError } = await supabase
        .from("vendors")
        .select("id, store_name, rating")
        .eq("id", restaurantId)
        .single()
      
      if (vendorError) {
        console.error("Error fetching vendor:", vendorError)
        setError("Could not load restaurant details. Please try again.")
        return
      }
      
      // Then, fetch the vendor profile data separately
      const { data: profileData, error: profileError } = await supabase
        .from("vendor_profiles")
        .select("*")
        .eq("vendor_id", restaurantId)
        .single()
      
      if (profileError) {
        console.error("Error fetching vendor profile:", profileError)
        setError("Could not load restaurant profile. Please try again.")
        return
      }
      
      // Now combine the data
      const transformedRestaurant: Restaurant = {
        id: vendorData.id,
        store_name: vendorData.store_name,
        logo_url: profileData.logo_url,
        banner_url: profileData.banner_url,
        cuisine_type: profileData.cuisine_type || "Various Cuisine",
        rating: vendorData.rating || 0,
        is_open: profileData.is_open || false,
        operating_hours: profileData.operating_hours || {},
        address: profileData.address || "",
        city: profileData.city || "",
        state: profileData.state || "",
        contact_phone: profileData.contact_phone || "",
        average_preparation_time: profileData.average_preparation_time || "30-45"
      }
      
      setRestaurant(transformedRestaurant)
      
      // Fetch menu categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("menu_categories")
        .select("id, name")
        .eq("vendor_id", restaurantId)
        .order("name", { ascending: true })
      
      if (categoriesError) {
        console.error("Error fetching menu categories:", categoriesError)
      } else if (categoriesData && categoriesData.length > 0) {
        setMenuCategories(categoriesData)
        setActiveCategory(categoriesData[0].id) // Set first category as active
      }
      
      // Fetch menu items
      const { data: itemsData, error: itemsError } = await supabase
        .from("menu_items")
        .select("*")
        .eq("vendor_id", restaurantId)
        .order("name", { ascending: true })
      
      if (itemsError) {
        console.error("Error fetching menu items:", itemsError)
      } else {
        setMenuItems(itemsData || [])
      }
      
      // Fetch cart items for this restaurant
      await fetchCartItems()
    } catch (error) {
      console.error("Error in fetchRestaurantData:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }
  
  const fetchCartItems = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      
      const { data: cartData, error: cartError } = await supabase
        .from("cart_items")
        .select(`
          id,
          menu_item_id,
          quantity,
          menu_items(name, price)
        `)
        .eq("customer_id", session.user.id)
        .eq("menu_items.vendor_id", restaurantId)
      
      if (cartError) {
        console.error("Error fetching cart items:", cartError)
        return
      }
      
      // Transform cart data
      const transformedCart: CartItem[] = cartData
        .filter(item => item.menu_items) // Filter out items with missing menu_items
        .map(item => {
          // Handle menu_items whether it's an array or an object
          const menuItem = Array.isArray(item.menu_items) 
            ? item.menu_items[0]  // If it's an array, take the first item
            : item.menu_items     // Otherwise use it directly as an object
          
          return {
            id: item.menu_item_id,
            name: menuItem?.name || '',
            price: menuItem?.price || 0,
            quantity: item.quantity
          }
        })
      
      setCartItems(transformedCart)
    } catch (error) {
      console.error("Error in fetchCartItems:", error)
    }
  }
  
  const handleAddToCart = async (menuItemId: string, quantity: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/login")
        return
      }
      
      // Check if item already exists in cart
      const { data: existingItem, error: checkError } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("customer_id", session.user.id)
        .eq("menu_item_id", menuItemId)
        .single()
      
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
        console.error("Error checking cart:", checkError)
        return
      }
      
      if (existingItem) {
        // Update existing item quantity
        const newQuantity = existingItem.quantity + quantity
        const { error: updateError } = await supabase
          .from("cart_items")
          .update({ quantity: newQuantity })
          .eq("id", existingItem.id)
        
        if (updateError) {
          console.error("Error updating cart item:", updateError)
          return
        }
      } else {
        // Add new item to cart
        const { error: insertError } = await supabase
          .from("cart_items")
          .insert({
            customer_id: session.user.id,
            menu_item_id: menuItemId,
            quantity: quantity
          })
        
        if (insertError) {
          console.error("Error adding to cart:", insertError)
          return
        }
      }
      
      // Get the menu item details
      const menuItem = menuItems.find(item => item.id === menuItemId)
      if (!menuItem) return
      
      // Update local cart state
      const existingCartItem = cartItems.find(item => item.id === menuItemId)
      if (existingCartItem) {
        // Update existing cart item
        const updatedCart = cartItems.map(item => {
          if (item.id === menuItemId) {
            return { ...item, quantity: item.quantity + quantity }
          }
          return item
        })
        setCartItems(updatedCart)
      } else {
        // Add new cart item
        setCartItems([
          ...cartItems,
          {
            id: menuItemId,
            name: menuItem.name,
            price: menuItem.price,
            quantity: quantity
          }
        ])
      }
    } catch (error) {
      console.error("Error in handleAddToCart:", error)
    }
  }
  
  // Filter menu items by active category
  const filteredMenuItems = activeCategory
    ? menuItems.filter(item => item.category_id === activeCategory)
    : menuItems
  
  if (isLoading) {
    return (
      <CustomerLayout title="Restaurant">
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-red-500" />
        </div>
      </CustomerLayout>
    )
  }
  
  if (error || !restaurant) {
    return (
      <CustomerLayout title="Restaurant Not Found">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-red-700 mb-2">Restaurant Not Found</h2>
            <p className="text-red-600 mb-4">{error || "The restaurant you're looking for doesn't exist or has been removed."}</p>
            <button
              onClick={() => router.back()}
              className="bg-red-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </CustomerLayout>
    )
  }
  
  return (
    <CustomerLayout title={restaurant.store_name}>
      {/* Restaurant Header */}
      <RestaurantHeader
        name={restaurant.store_name}
        logo_url={restaurant.logo_url}
        banner_url={restaurant.banner_url}
        cuisine_type={restaurant.cuisine_type}
        rating={restaurant.rating}
        is_open={restaurant.is_open}
        operating_hours={restaurant.operating_hours}
        address={restaurant.address}
        city={restaurant.city}
        state={restaurant.state}
        contact_phone={restaurant.contact_phone}
        average_preparation_time={restaurant.average_preparation_time}
      />
      
      <div className="container mx-auto px-4 pb-24">
        {/* Menu Categories */}
        <MenuCategories
          categories={menuCategories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
        
        {/* Menu Items */}
        <div className="mt-6 space-y-6">
          {filteredMenuItems.length > 0 ? (
            filteredMenuItems.map(item => (
              <div 
                key={item.id} 
                ref={item.id === highlightItemId ? highlightedItemRef : null}
                className={`${item.id === highlightItemId ? 'ring-2 ring-accent ring-offset-2' : ''}`}
              >
                <MenuItem
                  id={item.id}
                  name={item.name}
                  description={item.description}
                  price={item.price}
                  image_url={item.image_url}
                  onAddToCart={handleAddToCart}
                />
              </div>
            ))
          ) : (
            <p className="text-center py-8 text-gray-500">
              No menu items available in this category.
            </p>
          )}
        </div>
      </div>
      
      {/* Cart Summary */}
      {cartItems.length > 0 && (
        <CartSummary 
          items={cartItems} 
          vendorId={restaurantId as string}
        />
      )}
    </CustomerLayout>
  )
}

export default RestaurantPage