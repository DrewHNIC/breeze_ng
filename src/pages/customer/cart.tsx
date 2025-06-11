"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import dynamic from "next/dynamic"
import { supabase } from "@/utils/supabase"
import CustomerLayout from "../../components/CustomerLayout"
import { ShoppingCart, AlertCircle, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"

// Dynamically import components with ssr: false to prevent server-side rendering
const VendorCartGroup = dynamic(() => import("../../components/customer/VendorCartGroup"), { ssr: false })
const CartSummary = dynamic(() => import("../../components/customer/CartSummary"), { ssr: false })

interface CartItem {
  cartItemId: string
  menu_item_id: string
  quantity: number
  special_instructions: string | null
  vendor_id: string
  menu_items: {
    id: string
    name: string
    description: string
    price: number
    image_url: string | null
  }
  vendors: {
    id: string
    store_name: string
    vendor_profiles: {
      logo_url: string | null
    }[]
  }
}

interface GroupedCartItems {
  [vendorId: string]: {
    vendor: {
      id: string
      name: string
      logo_url: string | null
    }
    items: {
      cartItemId: string
      menu_item_id: string
      name: string
      description: string
      price: number
      quantity: number
      image_url: string | null
      special_instructions: string | null
    }[]
  }
}

// Use dynamic import with ssr: false to prevent server-side rendering of the entire page
const CartPage = () => {
  const router = useRouter()
  const [groupedItems, setGroupedItems] = useState<GroupedCartItems>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalItems, setTotalItems] = useState<number>(0)
  const [subtotal, setSubtotal] = useState<number>(0)
  const [isClient, setIsClient] = useState(false)

  // Set isClient to true when component mounts (client-side only)
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    // Only run on client side
    if (!isClient) return

    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session) {
          router.push("/login")
        } else {
          fetchCartItems()
        }
      } catch (error) {
        console.error("Auth check error:", error)
      }
    }

    checkAuth()
  }, [router, isClient])

  const fetchCartItems = async () => {
    if (!isClient) return

    try {
      setIsLoading(true)
      setError(null)

      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) return

      const { data, error } = await supabase
        .from("cart_items")
        .select(`
          id,
          menu_item_id,
          quantity,
          special_instructions,
          vendor_id,
          menu_items!cart_items_menu_item_id_fkey(id, name, description, price, image_url),
          vendors!cart_items_vendor_id_fkey(id, store_name, vendor_profiles(logo_url))
        `)
        .eq("customer_id", session.user.id)

      if (error) {
        console.error("Error fetching cart items:", error)
        setError("Failed to load your cart. Please try again.")
        return
      }

      // Group items by vendor with proper number handling
      const grouped: GroupedCartItems = {}
      let itemCount = 0
      let cartSubtotal = 0

      if (Array.isArray(data)) {
        data.forEach((item: any) => {
          if (!item) return

          const vendorId = item.vendor_id || ""
          const menuItem = item.menu_items || {
            id: "",
            name: "Unknown Item",
            description: "",
            price: 0,
            image_url: null,
          }
          const vendor = item.vendors || {
            id: vendorId,
            store_name: "Unknown Vendor",
            vendor_profiles: [{ logo_url: null }],
          }

          if (!vendorId) return // Skip if essential data is missing

          if (!grouped[vendorId]) {
            grouped[vendorId] = {
              vendor: {
                id: vendorId,
                name: vendor?.store_name || "Unknown Vendor",
                logo_url: vendor?.vendor_profiles?.[0]?.logo_url || null,
              },
              items: [],
            }
          }

          const quantity = Number(item.quantity) || 0
          const price = Number(menuItem.price) || 0

          grouped[vendorId].items.push({
            cartItemId: item.id || "",
            menu_item_id: item.menu_item_id || "",
            name: menuItem.name || "Unknown Item",
            description: menuItem.description || "",
            price: price,
            quantity: quantity,
            image_url: menuItem.image_url,
            special_instructions: item.special_instructions,
          })

          itemCount += quantity
          cartSubtotal += price * quantity
        })
      }

      setGroupedItems(grouped)
      setTotalItems(itemCount)
      setSubtotal(cartSubtotal)
    } catch (error) {
      console.error("Error in fetchCartItems:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateQuantity = async (cartItemId: string, newQuantity: number) => {
    if (!isClient) return

    try {
      const { error } = await supabase.from("cart_items").update({ quantity: newQuantity }).eq("id", cartItemId)

      if (error) {
        console.error("Error updating quantity:", error)
        return
      }

      await fetchCartItems()
    } catch (error) {
      console.error("Error in handleUpdateQuantity:", error)
    }
  }

  const handleRemoveItem = async (cartItemId: string) => {
    if (!isClient) return

    try {
      const { error } = await supabase.from("cart_items").delete().eq("id", cartItemId)

      if (error) {
        console.error("Error removing item:", error)
        return
      }

      await fetchCartItems()
    } catch (error) {
      console.error("Error in handleRemoveItem:", error)
    }
  }

  const handleUpdateInstructions = async (cartItemId: string, instructions: string) => {
    if (!isClient) return

    try {
      const { error } = await supabase
        .from("cart_items")
        .update({ special_instructions: instructions })
        .eq("id", cartItemId)

      if (error) {
        console.error("Error updating instructions:", error)
        return
      }

      await fetchCartItems()
    } catch (error) {
      console.error("Error in handleUpdateInstructions:", error)
    }
  }

  // Don't render anything on server
  if (!isClient) {
    return (
      <CustomerLayout title="Your Cart">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-[#b9c6c8]" />
          </div>
        </div>
      </CustomerLayout>
    )
  }

  const vendorCount = Object.keys(groupedItems).length

  return (
    <CustomerLayout title="Your Cart">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <button onClick={() => router.back()} className="mr-4 text-[#1d2c36] hover:text-[#b9c6c8]">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold flex items-center text-[#1d2c36]">
            <ShoppingCart className="h-6 w-6 mr-2" />
            Your Cart {totalItems > 0 ? `(${totalItems} items)` : ""}
          </h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-[#b9c6c8]" />
          </div>
        ) : error ? (
          <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-red-700 mb-2">Error Loading Cart</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchCartItems}
              className="bg-gradient-to-r from-[#b9c6c8] to-[#a8b5b8] text-[#1d2c36] px-6 py-2 rounded-lg font-medium hover:from-[#a8b5b8] hover:to-[#97a4a7] transition-all duration-300"
            >
              Try Again
            </button>
          </div>
        ) : totalItems === 0 ? (
          <div className="bg-gradient-to-r from-[#8f8578] to-[#b9c6c8] rounded-lg shadow-md p-8 text-center">
            <div className="bg-gradient-to-r from-[#b9c6c8] to-[#a8b5b8] rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="h-10 w-10 text-[#1d2c36]" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-[#1d2c36]">Your cart is empty</h2>
            <p className="text-[#1d2c36] mb-6">Looks like you haven&apos;t added any items to your cart yet.</p>
            <Link
              href="/customer/search"
              className="bg-gradient-to-r from-[#b9c6c8] to-[#a8b5b8] text-[#1d2c36] px-6 py-3 rounded-lg font-medium hover:from-[#a8b5b8] hover:to-[#97a4a7] transition-all duration-300 inline-block"
            >
              Browse Restaurants
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {Object.values(groupedItems).map((group) => (
                <VendorCartGroup
                  key={group.vendor.id}
                  vendor={group.vendor}
                  items={group.items}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemoveItem={handleRemoveItem}
                  onUpdateInstructions={handleUpdateInstructions}
                />
              ))}
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <CartSummary
                  vendorId={vendorCount === 1 ? Object.keys(groupedItems)[0] : null}
                  subtotal={subtotal}
                  deliveryFee={500}
                  serviceFee={200}
                  itemCount={totalItems}
                  isMultipleVendors={vendorCount > 1}
                />
                {vendorCount > 1 && (
                  <div className="mt-4 bg-gradient-to-r from-[#8f8578] to-[#b9c6c8] rounded-lg shadow-md border border-[#b9c6c8] p-6">
                    <h3 className="font-bold mb-3 text-[#1d2c36]">Checkout by Restaurant</h3>
                    <div className="space-y-3">
                      {Object.values(groupedItems).map((group) => {
                        const vendorSubtotal = group.items.reduce(
                          (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
                          0,
                        )
                        return (
                          <div key={group.vendor.id} className="flex justify-between items-center">
                            <span className="truncate max-w-[200px] text-[#1d2c36]">{group.vendor.name}</span>
                            <div className="flex items-center">
                              <span className="text-sm font-medium mr-3 text-[#1d2c36]">
                                ₦{(vendorSubtotal || 0).toLocaleString()}
                              </span>
                              <Link
                                href={`/customer/checkout?vendor=${group.vendor.id}`}
                                className="bg-gradient-to-r from-[#1d2c36] to-[#2a3f4d] text-[#8f8578] px-3 py-1 rounded text-sm hover:from-[#2a3f4d] hover:to-[#3a4f5d] transition-all duration-300"
                              >
                                Checkout
                              </Link>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </CustomerLayout>
  )
}

// Export the component with noSSR to prevent server-side rendering
export default dynamic(() => Promise.resolve(CartPage), { ssr: false })
