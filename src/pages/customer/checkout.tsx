"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import Link from "next/link"
import { supabase } from "@/utils/supabase"
import CustomerLayout from "../../components/CustomerLayout"
import {
  Loader2,
  MapPin,
  CreditCard,
  AlertCircle,
  ArrowLeft,
  Clock,
  Gift,
  Info,
  ShoppingCart,
  Truck,
  LocateFixed,
  AlertTriangle,
} from "lucide-react"
import {
  calculateDistance,
  calculateDeliveryFee,
  calculateEstimatedDeliveryTime,
  formatDeliveryTime,
  geocodeAddress,
  getMockVendorCoordinates,
  isDeliveryDistanceBeyondThreshold,
  calculateServiceFee,
  type Address,
  type Coordinates,
} from "@/utils/delivery-utils"

interface CartItem {
  id: string
  menu_item_id: string
  quantity: number
  price: number
  name: string
  vendor_id: string
  vendor_name: string
}

interface DeliveryAddress {
  address: string
  city: string
  state: string
  zipCode: string
  instructions: string
}

interface ContactInfo {
  fullName: string
  phone: string
  email: string
}

interface CustomerProfile {
  id: string
  name: string
  loyalty_points: number
}

interface VendorInfo {
  id: string
  name: string
  address: string
  city: string
  state: string
  coordinates?: Coordinates
}

const CheckoutPage = () => {
  const router = useRouter()
  const { vendor: vendorId } = router.query

  const [isLoading, setIsLoading] = useState(true)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [subtotal, setSubtotal] = useState(0)
  const [deliveryFee, setDeliveryFee] = useState(0) // Start with 0, will be calculated
  const [serviceFee, setServiceFee] = useState(0)
  const [vat, setVat] = useState(0)
  const [total, setTotal] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState("")
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  // Delivery calculation states
  const [distance, setDistance] = useState<number | null>(null)
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null)
  const [isCalculatingDelivery, setIsCalculatingDelivery] = useState(false)
  const [vendorInfo, setVendorInfo] = useState<VendorInfo | null>(null)
  const [customerCoordinates, setCustomerCoordinates] = useState<Coordinates | null>(null)
  const [vendorCoordinates, setVendorCoordinates] = useState<Coordinates | null>(null)
  const [isBeyondThreshold, setIsBeyondThreshold] = useState(false)

  // Loyalty points states
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null)
  const [usePoints, setUsePoints] = useState(false)
  const [pointsDiscount, setPointsDiscount] = useState(0)
  const [finalTotal, setFinalTotal] = useState(0)

  // Form states
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>({
    address: "",
    city: "",
    state: "",
    zipCode: "",
    instructions: "",
  })

  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    fullName: "",
    phone: "",
    email: "",
  })

  const [paymentMethod, setPaymentMethod] = useState("card")
  const [saveInfo, setSaveInfo] = useState(true)

  // Form validation
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        setIsLoading(true)
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          router.push("/login")
          return
        }

        // Fetch user profile to pre-fill contact info and get loyalty points
        const { data: customerData } = await supabase
          .from("customers")
          .select("id, name, email, phone_number, address, city, state, zip_code, loyalty_points")
          .eq("id", session.user.id)
          .single()

        if (customerData) {
          setContactInfo({
            fullName: customerData.name || "",
            phone: customerData.phone_number || "",
            email: customerData.email || session.user.email || "",
          })

          if (customerData.address) {
            setDeliveryAddress({
              address: customerData.address || "",
              city: customerData.city || "",
              state: customerData.state || "",
              zipCode: customerData.zip_code || "",
              instructions: "",
            })
          }

          // Set customer profile with loyalty points
          setCustomerProfile({
            id: customerData.id,
            name: customerData.name || "",
            loyalty_points: customerData.loyalty_points || 0,
          })

          console.log("Customer loyalty points:", customerData.loyalty_points)
        }

        // Modified query to get cart items with menu items and vendor info
        // Join with vendor_profiles to get the address
        const query = supabase
          .from("cart_items")
          .select(`
            id,
            menu_item_id,
            quantity,
            menu_items(
              id, 
              name, 
              price, 
              image_url, 
              vendor_id,
              vendors(
                id, 
                store_name,
                vendor_profiles(
                  address,
                  city,
                  state
                )
              )
            )
          `)
          .eq("customer_id", session.user.id)

        // If vendorId is provided and is a valid string (not "null"), we need to filter by vendor
        // Since vendor_id in cart_items is null, we need to filter through menu_items
        if (vendorId && typeof vendorId === "string" && vendorId !== "null") {
          // We'll filter after getting the data since we can't directly filter on nested relationships
        }

        const { data, error } = await query

        if (error) {
          console.error("Error fetching cart items:", error)
          setPaymentError(`Failed to load cart items: ${error.message}`)
          return
        }

        console.log("Raw cart data:", data)

        // Transform the data and filter by vendor if needed
        let transformedItems = data
          .filter((item) => item.menu_items) // Filter out items with missing menu_items
          .map((item: any) => ({
            id: item.id,
            menu_item_id: item.menu_item_id,
            quantity: item.quantity,
            price: item.menu_items.price,
            name: item.menu_items.name,
            vendor_id: item.menu_items.vendor_id || "",
            vendor_name: item.menu_items.vendors?.store_name || "Unknown Vendor",
            vendor_address: item.menu_items.vendors?.vendor_profiles?.[0]?.address || "",
            vendor_city: item.menu_items.vendors?.vendor_profiles?.[0]?.city || "",
            vendor_state: item.menu_items.vendors?.vendor_profiles?.[0]?.state || "",
          }))

        // Filter by vendor if vendorId is provided
        if (vendorId && typeof vendorId === "string" && vendorId !== "null") {
          transformedItems = transformedItems.filter((item) => item.vendor_id === vendorId)
        }

        console.log("Transformed cart items:", transformedItems)

        setCartItems(transformedItems)

        // Set vendor info if we have items
        if (transformedItems.length > 0) {
          const firstItem = transformedItems[0]
          setVendorInfo({
            id: firstItem.vendor_id,
            name: firstItem.vendor_name,
            address: firstItem.vendor_address || "No address provided",
            city: firstItem.vendor_city || "",
            state: firstItem.vendor_state || "",
          })
        }

        // Calculate totals
        const itemSubtotal = transformedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
        setSubtotal(itemSubtotal)

        // Calculate service fee (base fee of 300 + 135 per additional item)
        const totalItems = transformedItems.reduce((sum, item) => sum + item.quantity, 0)
        const calculatedServiceFee = calculateServiceFee(totalItems)
        setServiceFee(calculatedServiceFee)

        // Calculate VAT (7.5% in Nigeria)
        const calculatedVat = Math.round(itemSubtotal * 0.075)
        setVat(calculatedVat)

        // Initial total calculation (will be updated when delivery fee is calculated)
        const initialTotal = itemSubtotal + calculatedServiceFee + calculatedVat
        setTotal(initialTotal)
        setFinalTotal(initialTotal) // Initialize final total with the full amount
      } catch (error) {
        console.error("Error in fetchCartItems:", error)
        setPaymentError("An unexpected error occurred while loading your cart.")
      } finally {
        setIsLoading(false)
      }
    }

    if (router.isReady) {
      fetchCartItems()
    }
  }, [router.isReady, router, vendorId])

  // Calculate delivery fee when address changes or vendor info is available
  useEffect(() => {
    const calculateDeliveryDetails = async () => {
      if (!vendorInfo || !deliveryAddress.address || !deliveryAddress.city || !deliveryAddress.state) {
        return
      }

      try {
        setIsCalculatingDelivery(true)

        // Get customer coordinates
        const customerAddress: Address = {
          address: deliveryAddress.address,
          city: deliveryAddress.city,
          state: deliveryAddress.state,
          zipCode: deliveryAddress.zipCode,
        }

        // In a real implementation, we would use a geocoding API
        // For now, we'll use our mock function
        let customerCoords: Coordinates
        let vendorCoords: Coordinates

        if (!customerCoordinates) {
          customerCoords = await geocodeAddress(customerAddress)
          setCustomerCoordinates(customerCoords)
        } else {
          customerCoords = customerCoordinates
        }

        if (!vendorCoordinates) {
          // In a real implementation, we would fetch the vendor's coordinates from the database
          // For now, we'll use our mock function
          vendorCoords = getMockVendorCoordinates(vendorInfo.id)
          setVendorCoordinates(vendorCoords)
        } else {
          vendorCoords = vendorCoordinates
        }

        // Calculate distance
        const calculatedDistance = calculateDistance(customerCoords, vendorCoords)
        setDistance(calculatedDistance)

        // Check if beyond threshold
        const beyond = isDeliveryDistanceBeyondThreshold(calculatedDistance)
        setIsBeyondThreshold(beyond)

        // Calculate delivery fee
        const fee = calculateDeliveryFee(calculatedDistance)
        setDeliveryFee(fee)

        // Calculate estimated delivery time
        const time = calculateEstimatedDeliveryTime(calculatedDistance)
        setEstimatedTime(time)

        // Update total with delivery fee
        const newTotal = subtotal + serviceFee + vat + fee
        setTotal(newTotal)

        // Update final total with discount if applicable
        if (usePoints && customerProfile && customerProfile.loyalty_points >= 10) {
          const discount = Math.min(newTotal * 0.5, 2000)
          setPointsDiscount(discount)
          setFinalTotal(newTotal - discount)
        } else {
          setFinalTotal(newTotal)
        }
      } catch (error) {
        console.error("Error calculating delivery details:", error)
      } finally {
        setIsCalculatingDelivery(false)
      }
    }

    calculateDeliveryDetails()
  }, [
    vendorInfo,
    deliveryAddress.address,
    deliveryAddress.city,
    deliveryAddress.state,
    subtotal,
    serviceFee,
    vat,
    customerCoordinates,
    vendorCoordinates,
  ])

  // Calculate discount when loyalty points are toggled
  useEffect(() => {
    if (usePoints && customerProfile && customerProfile.loyalty_points >= 10) {
      // Calculate 50% discount, capped at ₦2,000
      const discount = Math.min(total * 0.5, 2000)
      setPointsDiscount(discount)
      setFinalTotal(total - discount)
    } else {
      setPointsDiscount(0)
      setFinalTotal(total)
    }
  }, [usePoints, total, customerProfile])

  const validateForm = () => {
    const errors: Record<string, string> = {}

    // Validate delivery address
    if (!deliveryAddress.address.trim()) errors.address = "Delivery address is required"
    if (!deliveryAddress.city.trim()) errors.city = "City is required"
    if (!deliveryAddress.state.trim()) errors.state = "State is required"

    // Validate contact info
    if (!contactInfo.fullName.trim()) errors.fullName = "Full name is required"
    if (!contactInfo.phone.trim()) errors.phone = "Phone number is required"
    if (!contactInfo.email.trim()) errors.email = "Email is required"
    else if (!/\S+@\S+\.\S+/.test(contactInfo.email)) errors.email = "Email is invalid"

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handlePlaceOrder = async () => {
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    try {
      setIsProcessing(true)
      setPaymentError("")

      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.push("/login")
        return
      }

      // Save user info if requested
      if (saveInfo) {
        await supabase
          .from("customers")
          .update({
            name: contactInfo.fullName,
            phone_number: contactInfo.phone,
            address: deliveryAddress.address,
            city: deliveryAddress.city,
            state: deliveryAddress.state,
            zip_code: deliveryAddress.zipCode,
            updated_at: new Date().toISOString(),
          })
          .eq("id", session.user.id)
      }

      // Determine vendor ID - use the one from URL or from the first cart item
      let resolvedVendorId = null

      // First try to get vendor ID from URL parameter
      if (typeof vendorId === "string" && vendorId !== "null" && vendorId.trim() !== "") {
        resolvedVendorId = vendorId
        console.log("Using vendor ID from URL:", resolvedVendorId)
      }
      // If not available, try to get from cart items
      else if (cartItems.length > 0) {
        // Try to find any cart item with a valid vendor_id
        const itemWithVendor = cartItems.find(
          (item) => item.vendor_id && item.vendor_id !== "null" && item.vendor_id.trim() !== "",
        )

        if (itemWithVendor) {
          resolvedVendorId = itemWithVendor.vendor_id
          console.log("Using vendor ID from cart item:", resolvedVendorId)
        }
      }

      // Validate that we have a valid UUID for vendor_id
      const isValidUUID = (uuid: string | null | undefined): boolean => {
        return Boolean(
          uuid &&
            typeof uuid === "string" &&
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid),
        )
      }

      if (!resolvedVendorId || !isValidUUID(resolvedVendorId)) {
        setPaymentError("Unable to determine vendor. Please go back and select a vendor.")
        setIsProcessing(false)
        return
      }

      console.log("Using vendor ID:", resolvedVendorId)

      // Determine if loyalty points are being redeemed
      const loyaltyPointsRedeemed = usePoints && customerProfile && customerProfile.loyalty_points >= 10 ? 10 : 0
      const discountAmount = pointsDiscount

      console.log("Loyalty points redeemed:", loyaltyPointsRedeemed)
      console.log("Discount amount:", discountAmount)

      // Calculate estimated delivery time
      const estimatedDeliveryTimeMinutes = estimatedTime || 30 // Default to 30 minutes if not calculated
      const now = new Date()
      const estimatedDeliveryTime = new Date(now.getTime() + estimatedDeliveryTimeMinutes * 60000)

      // Create order in database
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_id: session.user.id,
          status: "pending",
          total_amount: finalTotal, // Use the final total with discount applied
          original_amount: total, // Store the original amount before discount
          discount_amount: discountAmount, // Store the discount amount
          delivery_fee: deliveryFee, // Store the calculated delivery fee
          distance_km: distance || 0, // Store the calculated distance
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          delivery_address: deliveryAddress.address,
          delivery_city: deliveryAddress.city,
          delivery_state: deliveryAddress.state,
          delivery_zip: deliveryAddress.zipCode,
          vendor_id: resolvedVendorId,
          rider_id: null,
          estimated_delivery_time: estimatedDeliveryTime.toISOString(),
          payment_method: paymentMethod,
          payment_status: "pending",
          actual_delivery_time: null,
          contact_number: contactInfo.phone,
          special_instructions: deliveryAddress.instructions || null,
          loyalty_points_redeemed: loyaltyPointsRedeemed, // Store the number of points redeemed
        })
        .select()
        .single()

      if (orderError || !orderData) {
        console.error("Error creating order:", orderError)
        setPaymentError("Failed to create order. Please try again.")
        setIsProcessing(false)
        return
      }

      // Create order items
      const orderItems = cartItems.map((item) => ({
        order_id: orderData.id,
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        special_instructions: "",
        created_at: new Date().toISOString(),
      }))

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

      if (itemsError) {
        console.error("Error creating order items:", itemsError)

        // If order items creation fails, delete the order to avoid orphaned orders
        await supabase.from("orders").delete().eq("id", orderData.id)

        setPaymentError("Failed to create order items. Please try again.")
        setIsProcessing(false)
        return
      }

      // If loyalty points were redeemed, update the customer's points balance
      if (loyaltyPointsRedeemed > 0 && customerProfile) {
        const newPointsBalance = customerProfile.loyalty_points - loyaltyPointsRedeemed

        const { error: pointsError } = await supabase
          .from("customers")
          .update({ loyalty_points: newPointsBalance })
          .eq("id", session.user.id)

        if (pointsError) {
          console.error("Error updating loyalty points:", pointsError)
          // Continue with the order process even if points update fails
          // We'll handle this edge case later
        }
      }

      // Initialize payment with PayStack
      const response = await fetch("/api/payments/initialize-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: orderData.id,
          amount: finalTotal, // Use the final total with discount applied
          email: contactInfo.email,
          metadata: {
            order_id: orderData.id,
            customer_id: session.user.id,
            delivery_address: deliveryAddress.address,
            loyalty_points_redeemed: loyaltyPointsRedeemed,
            discount_amount: discountAmount,
            delivery_fee: deliveryFee,
            distance_km: distance || 0,
          },
        }),
      })

      const paymentData = await response.json()

      if (!paymentData.success) {
        // If payment initialization fails, delete the order and order items
        await supabase.from("order_items").delete().eq("order_id", orderData.id)
        await supabase.from("orders").delete().eq("id", orderData.id)

        setPaymentError(paymentData.error || "Failed to initialize payment")
        setIsProcessing(false)
        return
      }

      // Clear cart items for this vendor after successful order creation
      if (resolvedVendorId) {
        // Since vendor_id in cart_items is null, we need to delete based on menu_item_id
        const menuItemIds = cartItems.map((item) => item.menu_item_id)
        await supabase.from("cart_items").delete().eq("customer_id", session.user.id).in("menu_item_id", menuItemIds)
      }

      // Redirect to PayStack payment page
      window.location.href = paymentData.data.authorization_url
    } catch (error) {
      console.error("Error in handlePlaceOrder:", error)
      setPaymentError("An unexpected error occurred. Please try again.")
      setIsProcessing(false)
    }
  }

  // Function to recalculate delivery details when address changes
  const handleAddressChange = (field: keyof DeliveryAddress, value: string) => {
    setDeliveryAddress({ ...deliveryAddress, [field]: value })

    // Reset coordinates to force recalculation
    setCustomerCoordinates(null)
  }

  if (isLoading) {
    return (
      <CustomerLayout title="Checkout">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[#b9c6c8]" />
            <span className="ml-2 text-lg text-[#1d2c36]">Loading checkout...</span>
          </div>
        </div>
      </CustomerLayout>
    )
  }

  if (cartItems.length === 0 && !isLoading) {
    return (
      <CustomerLayout title="Checkout">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16 max-w-md mx-auto">
            <div className="bg-gradient-to-r from-[#b9c6c8] to-[#a8b5b8] text-[#1d2c36] rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-[#1d2c36]">Checkout</h2>
            <p className="text-[#1d2c36] mb-6">
              You need to add some items to your cart before proceeding to checkout.
            </p>
            <Link
              href="/customer/search"
              className="bg-gradient-to-r from-[#b9c6c8] to-[#a8b5b8] text-[#1d2c36] px-6 py-3 rounded-lg font-medium hover:from-[#a8b5b8] hover:to-[#97a4a7] transition-all duration-300 inline-flex items-center"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Browse Restaurants
            </Link>
          </div>
        </div>
      </CustomerLayout>
    )
  }

  return (
    <CustomerLayout title="Checkout">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link href="/customer/cart" className="text-[#1d2c36] hover:text-[#b9c6c8] mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-[#1d2c36]">Checkout</h1>
        </div>

        {paymentError && (
          <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <p>{paymentError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2 space-y-8">
            {/* Loyalty Points Redemption */}
            {customerProfile && customerProfile.loyalty_points >= 10 && (
              <div className="bg-gradient-to-r from-[#8f8578] to-[#b9c6c8] rounded-lg shadow-md border border-[#b9c6c8] p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center text-[#1d2c36]">
                  <Gift className="h-5 w-5 mr-2 text-[#1d2c36]" />
                  Loyalty Points
                </h2>

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[#1d2c36] mb-1">
                      You have <span className="font-bold">{customerProfile.loyalty_points}</span> loyalty points
                    </p>
                    <p className="text-sm text-[#1d2c36] opacity-80">
                      Redeem 10 points for 50% off your order (up to ₦2,000)
                    </p>
                  </div>
                  <div className="bg-[#1d2c36] px-4 py-2 rounded-lg">
                    <p className="text-[#8f8578] text-sm">Available</p>
                    <p className="text-[#b9c6c8] font-bold text-xl">{customerProfile.loyalty_points} pts</p>
                  </div>
                </div>

                <label className="flex items-center p-4 border border-[#1d2c36] rounded-lg bg-[#1d2c36] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={usePoints}
                    onChange={(e) => setUsePoints(e.target.checked)}
                    className="h-5 w-5 text-[#b9c6c8] focus:ring-[#b9c6c8] border-[#b9c6c8] rounded"
                    disabled={customerProfile.loyalty_points < 10}
                  />
                  <div className="ml-3">
                    <span className="font-medium text-[#8f8578]">Use 10 points to get 50% off this order</span>
                    {usePoints && (
                      <p className="text-sm text-[#b9c6c8] mt-1">You'll save ₦{pointsDiscount.toLocaleString()}</p>
                    )}
                  </div>
                </label>

                {usePoints && (
                  <div className="mt-4 bg-[#1d2c36] bg-opacity-20 p-4 rounded-lg flex items-start">
                    <Info className="h-5 w-5 text-[#1d2c36] mr-2 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-[#1d2c36]">
                      10 points will be deducted from your loyalty balance when you complete this order.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Delivery Address */}
            <div className="bg-gradient-to-r from-[#8f8578] to-[#b9c6c8] rounded-lg shadow-md border border-[#b9c6c8] p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center text-[#1d2c36]">
                <MapPin className="h-5 w-5 mr-2 text-[#1d2c36]" />
                Delivery Address
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#1d2c36] mb-1">Street Address*</label>
                  <input
                    type="text"
                    value={deliveryAddress.address}
                    onChange={(e) => handleAddressChange("address", e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#b9c6c8] focus:border-[#b9c6c8] ${
                      formErrors.address ? "border-red-500" : "border-[#b9c6c8]"
                    }`}
                    placeholder="123 Main Street"
                  />
                  {formErrors.address && <p className="mt-1 text-sm text-red-500">{formErrors.address}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1d2c36] mb-1">City*</label>
                  <input
                    type="text"
                    value={deliveryAddress.city}
                    onChange={(e) => handleAddressChange("city", e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#b9c6c8] focus:border-[#b9c6c8] ${
                      formErrors.city ? "border-red-500" : "border-[#b9c6c8]"
                    }`}
                    placeholder="Lagos"
                  />
                  {formErrors.city && <p className="mt-1 text-sm text-red-500">{formErrors.city}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1d2c36] mb-1">State*</label>
                  <input
                    type="text"
                    value={deliveryAddress.state}
                    onChange={(e) => handleAddressChange("state", e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#b9c6c8] focus:border-[#b9c6c8] ${
                      formErrors.state ? "border-red-500" : "border-[#b9c6c8]"
                    }`}
                    placeholder="Lagos State"
                  />
                  {formErrors.state && <p className="mt-1 text-sm text-red-500">{formErrors.state}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1d2c36] mb-1">Zip Code</label>
                  <input
                    type="text"
                    value={deliveryAddress.zipCode}
                    onChange={(e) => handleAddressChange("zipCode", e.target.value)}
                    className="w-full px-4 py-2 border border-[#b9c6c8] rounded-lg focus:ring-2 focus:ring-[#b9c6c8] focus:border-[#b9c6c8]"
                    placeholder="100001"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#1d2c36] mb-1">
                    Delivery Instructions (Optional)
                  </label>
                  <textarea
                    value={deliveryAddress.instructions}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, instructions: e.target.value })}
                    className="w-full px-4 py-2 border border-[#b9c6c8] rounded-lg focus:ring-2 focus:ring-[#b9c6c8] focus:border-[#b9c6c8]"
                    placeholder="E.g., Ring the doorbell, call when nearby, etc."
                    rows={2}
                  />
                </div>
              </div>

              {/* Delivery details section */}
              {vendorInfo && (
                <div className="mt-6 border-t border-[#1d2c36] pt-4">
                  <h3 className="font-medium text-[#1d2c36] mb-2 flex items-center">
                    <Truck className="h-4 w-4 mr-2" />
                    Delivery Details
                  </h3>

                  {isCalculatingDelivery ? (
                    <div className="flex items-center text-[#1d2c36] text-sm">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Calculating delivery details...
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <div className="bg-[#1d2c36] p-1.5 rounded-full mr-2 mt-0.5">
                          <MapPin className="h-3 w-3 text-[#b9c6c8]" />
                        </div>
                        <div className="text-sm text-[#1d2c36]">
                          <p className="font-medium">Pickup from:</p>
                          <p>{vendorInfo.name}</p>
                          <p className="text-xs opacity-75">
                            {vendorInfo.address}
                            {vendorInfo.city && `, ${vendorInfo.city}`}
                            {vendorInfo.state && `, ${vendorInfo.state}`}
                          </p>
                        </div>
                      </div>

                      {distance !== null && (
                        <div className="flex items-center">
                          <div className="bg-[#1d2c36] p-1.5 rounded-full mr-2">
                            <LocateFixed className="h-3 w-3 text-[#b9c6c8]" />
                          </div>
                          <div className="text-sm text-[#1d2c36]">
                            <p>
                              Distance: <span className="font-medium">{distance.toFixed(1)} km</span>
                            </p>
                          </div>
                        </div>
                      )}

                      {isBeyondThreshold && (
                        <div className="flex items-start mt-2 bg-amber-50 p-3 rounded-lg border border-amber-200">
                          <AlertTriangle className="h-4 w-4 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-amber-700">
                            Your delivery address is more than 5km away from the restaurant. Additional delivery fees
                            apply.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Contact Information */}
            <div className="bg-gradient-to-r from-[#8f8578] to-[#b9c6c8] rounded-lg shadow-md border border-[#b9c6c8] p-6">
              <h2 className="text-xl font-bold mb-4 text-[#1d2c36]">Contact Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#1d2c36] mb-1">Full Name*</label>
                  <input
                    type="text"
                    value={contactInfo.fullName}
                    onChange={(e) => setContactInfo({ ...contactInfo, fullName: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#b9c6c8] focus:border-[#b9c6c8] ${
                      formErrors.fullName ? "border-red-500" : "border-[#b9c6c8]"
                    }`}
                    placeholder="John Doe"
                  />
                  {formErrors.fullName && <p className="mt-1 text-sm text-red-500">{formErrors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1d2c36] mb-1">Phone Number*</label>
                  <input
                    type="tel"
                    value={contactInfo.phone}
                    onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#b9c6c8] focus:border-[#b9c6c8] ${
                      formErrors.phone ? "border-red-500" : "border-[#b9c6c8]"
                    }`}
                    placeholder="+234 800 000 0000"
                  />
                  {formErrors.phone && <p className="mt-1 text-sm text-red-500">{formErrors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1d2c36] mb-1">Email*</label>
                  <input
                    type="email"
                    value={contactInfo.email}
                    onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#b9c6c8] focus:border-[#b9c6c8] ${
                      formErrors.email ? "border-red-500" : "border-[#b9c6c8]"
                    }`}
                    placeholder="john@example.com"
                  />
                  {formErrors.email && <p className="mt-1 text-sm text-red-500">{formErrors.email}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={saveInfo}
                      onChange={(e) => setSaveInfo(e.target.checked)}
                      className="h-4 w-4 text-[#b9c6c8] focus:ring-[#b9c6c8] border-[#b9c6c8]"
                    />
                    <span className="ml-2 text-sm text-[#1d2c36]">Save this information for future orders</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-gradient-to-r from-[#8f8578] to-[#b9c6c8] rounded-lg shadow-md border border-[#b9c6c8] p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center text-[#1d2c36]">
                <CreditCard className="h-5 w-5 mr-2 text-[#1d2c36]" />
                Payment Method
              </h2>

              <div className="space-y-3">
                <label className="flex items-center p-3 border border-[#b9c6c8] rounded-lg cursor-pointer bg-gradient-to-r from-[#b9c6c8]/20 to-[#8f8578]/20">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === "card"}
                    onChange={() => setPaymentMethod("card")}
                    className="h-4 w-4 text-[#b9c6c8] focus:ring-[#b9c6c8] border-[#b9c6c8]"
                  />
                  <span className="ml-2 flex items-center">
                    <CreditCard className="h-5 w-5 mr-2 text-[#1d2c36]" />
                    <span className="font-medium text-[#1d2c36]">Credit/Debit Card</span>
                  </span>
                  <span className="ml-auto text-sm text-[#1d2c36]">Powered by PayStack</span>
                </label>

                <div className="p-4 bg-gradient-to-r from-[#b9c6c8]/20 to-[#8f8578]/20 rounded-lg border border-[#b9c6c8] text-sm text-[#1d2c36]">
                  <p>
                    You'll be redirected to PayStack's secure payment page to complete your payment. Your payment
                    information is encrypted and secure!
                  </p>
                </div>
              </div>
            </div>

            {/* Estimated Delivery */}
            <div className="bg-gradient-to-r from-[#8f8578] to-[#b9c6c8] rounded-lg shadow-md border border-[#b9c6c8] p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center text-[#1d2c36]">
                <Clock className="h-5 w-5 mr-2 text-[#1d2c36]" />
                Estimated Delivery
              </h2>

              {isCalculatingDelivery ? (
                <div className="flex items-center">
                  <Loader2 className="h-5 w-5 animate-spin mr-2 text-[#1d2c36]" />
                  <p className="text-[#1d2c36]">Calculating delivery time...</p>
                </div>
              ) : estimatedTime ? (
                <div>
                  <p className="text-[#1d2c36] text-lg font-medium">
                    Your order will be delivered in approximately {formatDeliveryTime(estimatedTime)}
                  </p>
                  <p className="text-[#1d2c36] text-sm mt-2 opacity-75">
                    This includes food preparation time and delivery based on a {distance?.toFixed(1) || "0"} km
                    distance.
                  </p>
                </div>
              ) : (
                <p className="text-[#1d2c36]">Enter your delivery address to see the estimated delivery time.</p>
              )}
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-[#8f8578] rounded-lg shadow-md border border-[#1d2c36] p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center text-[#1d2c36]">
                  <ShoppingCart className="h-5 w-5 mr-2 text-[#1d2c36]" />
                  Order Summary
                </h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-[#1d2c36]">
                      Subtotal ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items)
                    </span>
                    <span className="font-medium text-[#1d2c36]">₦{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#1d2c36]">Delivery Fee</span>
                    {isCalculatingDelivery ? (
                      <span className="font-medium text-[#1d2c36] flex items-center">
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        Calculating...
                      </span>
                    ) : (
                      <span className="font-medium text-[#1d2c36]">₦{deliveryFee.toLocaleString()}</span>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#1d2c36]">Service Fee</span>
                    <span className="font-medium text-[#1d2c36]">₦{serviceFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#1d2c36]">VAT (7.5%)</span>
                    <span className="font-medium text-[#1d2c36]">₦{vat.toLocaleString()}</span>
                  </div>

                  {usePoints && pointsDiscount > 0 && (
                    <div className="flex justify-between text-[#b9c6c8] bg-[#1d2c36] p-2 rounded">
                      <span className="flex items-center">
                        <Gift className="h-4 w-4 mr-1" />
                        Loyalty Discount (10 pts)
                      </span>
                      <span className="font-medium">-₦{pointsDiscount.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="border-t border-[#1d2c36] pt-3 mt-3">
                    <div className="flex justify-between font-bold text-[#1d2c36]">
                      <span>Total</span>
                      <span>₦{finalTotal.toLocaleString()}</span>
                    </div>

                    {usePoints && pointsDiscount > 0 && (
                      <div className="text-right text-sm mt-1 text-[#1d2c36]">
                        You saved ₦{pointsDiscount.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={isProcessing || isCalculatingDelivery}
                  className={`w-full bg-gradient-to-r from-[#b9c6c8] to-[#a8b5b8] text-[#1d2c36] py-3 rounded-lg font-medium hover:from-[#a8b5b8] hover:to-[#97a4a7] transition-all duration-300 flex items-center justify-center ${
                    isProcessing || isCalculatingDelivery ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5 mr-2" />
                      Processing...
                    </>
                  ) : isCalculatingDelivery ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5 mr-2" />
                      Calculating...
                    </>
                  ) : (
                    "Place Order & Pay"
                  )}
                </button>

                <p className="mt-4 text-sm text-[#1d2c36] text-center">
                  By placing your order, you agree to our{" "}
                  <Link href="/terms" className="text-[#b9c6c8] hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-[#b9c6c8] hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  )
}

export default CheckoutPage
