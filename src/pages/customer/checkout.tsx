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
  calculateDeliveryDetails,
  calculateServiceFee,
  formatDeliveryTime,
  validateAddress,
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
  const [deliveryFee, setDeliveryFee] = useState(0)
  const [serviceFee, setServiceFee] = useState(0)
  const [vat, setVat] = useState(0)
  const [total, setTotal] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState("")

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

          // Pre-fill delivery address from customer data
          setDeliveryAddress({
            address: customerData.address || "",
            city: customerData.city || "",
            state: customerData.state || "",
            zipCode: customerData.zip_code || "",
            instructions: "",
          })

          // Set customer profile with loyalty points
          setCustomerProfile({
            id: customerData.id,
            name: customerData.name || "",
            loyalty_points: customerData.loyalty_points || 0,
          })

          console.log("Customer data loaded:", {
            name: customerData.name,
            address: customerData.address,
            city: customerData.city,
            state: customerData.state,
            loyalty_points: customerData.loyalty_points,
          })
        }

        // Fetch vendor information directly if vendorId is provided
        let vendorAddress = ""
        let vendorCity = ""
        let vendorState = ""
        let vendorName = ""

        if (vendorId && typeof vendorId === "string" && vendorId !== "null") {
          // Direct query to get vendor profile information
          const { data: vendorProfileData, error: vendorProfileError } = await supabase
            .from("vendor_profiles")
            .select("address, city, state, vendor_id")
            .eq("vendor_id", vendorId)
            .single()

          if (vendorProfileData) {
            vendorAddress = vendorProfileData.address || ""
            vendorCity = vendorProfileData.city || ""
            vendorState = vendorProfileData.state || ""

            console.log("Vendor profile data:", vendorProfileData)

            // Get vendor name
            const { data: vendorData } = await supabase.from("vendors").select("store_name").eq("id", vendorId).single()

            if (vendorData) {
              vendorName = vendorData.store_name || ""
            }
          } else if (vendorProfileError) {
            console.error("Error fetching vendor profile:", vendorProfileError)
          }
        }

        // Fetch cart items
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
                store_name
              )
            )
          `)
          .eq("customer_id", session.user.id)

        const { data, error } = await query

        if (error) {
          console.error("Error fetching cart items:", error)
          setPaymentError(`Failed to load cart items: ${error.message}`)
          return
        }

        // Transform the data and filter by vendor if needed
        let transformedItems = data
          .filter((item) => item.menu_items)
          .map((item: any) => ({
            id: item.id,
            menu_item_id: item.menu_item_id,
            quantity: item.quantity,
            price: item.menu_items.price,
            name: item.menu_items.name,
            vendor_id: item.menu_items.vendor_id || "",
            vendor_name: item.menu_items.vendors?.store_name || "Unknown Vendor",
          }))

        // Filter by vendor if vendorId is provided
        if (vendorId && typeof vendorId === "string" && vendorId !== "null") {
          transformedItems = transformedItems.filter((item) => item.vendor_id === vendorId)
        }

        setCartItems(transformedItems)

        // Set vendor info
        if (transformedItems.length > 0) {
          const firstItem = transformedItems[0]
          const firstVendorId = firstItem.vendor_id

          // If we don't already have vendor info from the direct query above
          if (!vendorName && firstVendorId) {
            const { data: vendorProfileData } = await supabase
              .from("vendor_profiles")
              .select("address, city, state")
              .eq("vendor_id", firstVendorId)
              .single()

            if (vendorProfileData) {
              vendorAddress = vendorProfileData.address || ""
              vendorCity = vendorProfileData.city || ""
              vendorState = vendorProfileData.state || ""
              vendorName = firstItem.vendor_name
            }
          }

          setVendorInfo({
            id: firstVendorId,
            name: vendorName || firstItem.vendor_name,
            address: vendorAddress,
            city: vendorCity,
            state: vendorState,
          })

          console.log("Final vendor info:", {
            id: firstVendorId,
            name: vendorName || firstItem.vendor_name,
            address: vendorAddress,
            city: vendorCity,
            state: vendorState,
          })
        }

        // Calculate totals
        const itemSubtotal = transformedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
        setSubtotal(itemSubtotal)

        const totalItems = transformedItems.reduce((sum, item) => sum + item.quantity, 0)
        const calculatedServiceFee = calculateServiceFee(totalItems)
        setServiceFee(calculatedServiceFee)

        const calculatedVat = Math.round(itemSubtotal * 0.075)
        setVat(calculatedVat)

        const initialTotal = itemSubtotal + calculatedServiceFee + calculatedVat
        setTotal(initialTotal)
        setFinalTotal(initialTotal)
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
    const performDeliveryCalculation = async () => {
      // Check if we have all required data
      if (!vendorInfo || !deliveryAddress.address || !deliveryAddress.city || !deliveryAddress.state) {
        console.log("Missing required data for delivery calculation:", {
          hasVendorInfo: !!vendorInfo,
          hasAddress: !!deliveryAddress.address,
          hasCity: !!deliveryAddress.city,
          hasState: !!deliveryAddress.state,
        })
        return
      }

      // Check if vendor has address
      if (!vendorInfo.address || !vendorInfo.city || !vendorInfo.state) {
        console.log("Vendor missing address information:", vendorInfo)
        setPaymentError("Vendor address information is incomplete. Please contact support.")
        return
      }

      try {
        setIsCalculatingDelivery(true)
        setPaymentError("") // Clear any previous errors

        // Prepare addresses for geocoding
        const vendorAddress: Address = {
          address: vendorInfo.address,
          city: vendorInfo.city,
          state: vendorInfo.state,
        }

        const customerAddress: Address = {
          address: deliveryAddress.address,
          city: deliveryAddress.city,
          state: deliveryAddress.state,
          zipCode: deliveryAddress.zipCode,
        }

        console.log("Starting delivery calculation with addresses:")
        console.log("Vendor:", vendorAddress)
        console.log("Customer:", customerAddress)

        // Validate addresses
        if (!validateAddress(vendorAddress)) {
          throw new Error("Vendor address is incomplete")
        }

        if (!validateAddress(customerAddress)) {
          throw new Error("Customer address is incomplete")
        }

        // Calculate delivery details using the enhanced geocoding service
        const deliveryDetails = await calculateDeliveryDetails(vendorAddress, customerAddress)

        console.log("Delivery calculation completed:", deliveryDetails)

        // Update state with calculated values
        setDistance(deliveryDetails.distance)
        setDeliveryFee(deliveryDetails.deliveryFee)
        setEstimatedTime(deliveryDetails.estimatedTime)
        setIsBeyondThreshold(deliveryDetails.isBeyondThreshold)
        setCustomerCoordinates(deliveryDetails.customerCoordinates)
        setVendorCoordinates(deliveryDetails.vendorCoordinates)

        // Update total with delivery fee
        const newTotal = subtotal + serviceFee + vat + deliveryDetails.deliveryFee
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
        setPaymentError(
          `Failed to calculate delivery details: ${error instanceof Error ? error.message : "Unknown error"}`,
        )
      } finally {
        setIsCalculatingDelivery(false)
      }
    }

    performDeliveryCalculation()
  }, [
    vendorInfo,
    deliveryAddress.address,
    deliveryAddress.city,
    deliveryAddress.state,
    deliveryAddress.zipCode,
    subtotal,
    serviceFee,
    vat,
  ])

  // Calculate discount when loyalty points are toggled
  useEffect(() => {
    if (usePoints && customerProfile && customerProfile.loyalty_points >= 10) {
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

    if (!deliveryAddress.address.trim()) errors.address = "Delivery address is required"
    if (!deliveryAddress.city.trim()) errors.city = "City is required"
    if (!deliveryAddress.state.trim()) errors.state = "State is required"

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

      console.log("Starting order creation process...")

      // Save user info if requested
      if (saveInfo) {
        console.log("Saving user info...")
        const { error: updateError } = await supabase
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

        if (updateError) {
          console.error("Error updating customer info:", updateError)
          // Continue with order creation even if customer update fails
        }
      }

      // Determine vendor ID
      let resolvedVendorId = null

      if (typeof vendorId === "string" && vendorId !== "null" && vendorId.trim() !== "") {
        resolvedVendorId = vendorId
        console.log("Using vendor ID from URL:", resolvedVendorId)
      } else if (cartItems.length > 0) {
        const itemWithVendor = cartItems.find(
          (item) => item.vendor_id && item.vendor_id !== "null" && item.vendor_id.trim() !== "",
        )
        if (itemWithVendor) {
          resolvedVendorId = itemWithVendor.vendor_id
          console.log("Using vendor ID from cart item:", resolvedVendorId)
        }
      }

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

      console.log("Resolved vendor ID:", resolvedVendorId)

      const loyaltyPointsRedeemed = usePoints && customerProfile && customerProfile.loyalty_points >= 10 ? 10 : 0
      const discountAmount = pointsDiscount

      console.log("Order details:", {
        loyaltyPointsRedeemed,
        discountAmount,
        finalTotal,
        total,
        deliveryFee,
        distance,
      })

      const estimatedDeliveryTimeMinutes = estimatedTime || 30
      const now = new Date()
      const estimatedDeliveryTime = new Date(now.getTime() + estimatedDeliveryTimeMinutes * 60000)

      // Prepare order data
      const orderData = {
        customer_id: session.user.id,
        status: "pending",
        total_amount: Math.round(finalTotal), // Ensure it's an integer
        original_amount: Math.round(total), // Ensure it's an integer
        discount_amount: Math.round(discountAmount), // Ensure it's an integer
        delivery_fee: Math.round(deliveryFee), // Ensure it's an integer
        distance_km: distance || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        delivery_address: deliveryAddress.address,
        delivery_city: deliveryAddress.city,
        delivery_state: deliveryAddress.state,
        delivery_zip: deliveryAddress.zipCode || null,
        vendor_id: resolvedVendorId,
        rider_id: null,
        estimated_delivery_time: estimatedDeliveryTime.toISOString(),
        payment_method: paymentMethod,
        payment_status: "pending",
        actual_delivery_time: null,
        contact_number: contactInfo.phone,
        special_instructions: deliveryAddress.instructions || null,
        loyalty_points_redeemed: loyaltyPointsRedeemed,
      }

      console.log("Order data to insert:", orderData)

      // Create order in database
      const { data: createdOrder, error: orderError } = await supabase
        .from("orders")
        .insert(orderData)
        .select()
        .single()

      if (orderError) {
        console.error("Detailed order creation error:", orderError)
        console.error("Error code:", orderError.code)
        console.error("Error message:", orderError.message)
        console.error("Error details:", orderError.details)
        console.error("Error hint:", orderError.hint)

        // Provide more specific error messages
        let errorMessage = "Failed to create order. "
        if (orderError.message.includes("violates foreign key constraint")) {
          errorMessage += "Invalid vendor or customer reference."
        } else if (orderError.message.includes("violates not-null constraint")) {
          errorMessage += "Missing required information."
        } else if (orderError.message.includes("violates check constraint")) {
          errorMessage += "Invalid data values."
        } else {
          errorMessage += `Database error: ${orderError.message}`
        }

        setPaymentError(errorMessage)
        setIsProcessing(false)
        return
      }

      if (!createdOrder) {
        console.error("Order was created but no data returned")
        setPaymentError("Order creation failed - no order data returned.")
        setIsProcessing(false)
        return
      }

      console.log("Order created successfully:", createdOrder)

      // Create order items
      const orderItems = cartItems.map((item) => ({
        order_id: createdOrder.id,
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        unit_price: Math.round(item.price), // Ensure it's an integer
        total_price: Math.round(item.price * item.quantity), // Ensure it's an integer
        special_instructions: "",
        created_at: new Date().toISOString(),
      }))

      console.log("Order items to insert:", orderItems)

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

      if (itemsError) {
        console.error("Error creating order items:", itemsError)
        console.error("Items error details:", itemsError.details)

        // If order items creation fails, delete the order to avoid orphaned orders
        await supabase.from("orders").delete().eq("id", createdOrder.id)

        setPaymentError(`Failed to create order items: ${itemsError.message}`)
        setIsProcessing(false)
        return
      }

      console.log("Order items created successfully")

      // Update loyalty points if redeemed
      if (loyaltyPointsRedeemed > 0 && customerProfile) {
        const newPointsBalance = customerProfile.loyalty_points - loyaltyPointsRedeemed
        console.log("Updating loyalty points:", customerProfile.loyalty_points, "->", newPointsBalance)

        const { error: pointsError } = await supabase
          .from("customers")
          .update({ loyalty_points: newPointsBalance })
          .eq("id", session.user.id)

        if (pointsError) {
          console.error("Error updating loyalty points:", pointsError)
          // Continue with the order process even if points update fails
        }
      }

      // Initialize payment with PayStack
      console.log("Initializing payment...")
      const response = await fetch("/api/payments/initialize-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: createdOrder.id,
          amount: Math.round(finalTotal), // Ensure it's an integer
          email: contactInfo.email,
          metadata: {
            order_id: createdOrder.id,
            customer_id: session.user.id,
            delivery_address: deliveryAddress.address,
            loyalty_points_redeemed: loyaltyPointsRedeemed,
            discount_amount: Math.round(discountAmount),
            delivery_fee: Math.round(deliveryFee),
            distance_km: distance || 0,
          },
        }),
      })

      if (!response.ok) {
        console.error("Payment initialization failed with status:", response.status)
        const errorText = await response.text()
        console.error("Payment error response:", errorText)

        // Clean up the order if payment initialization fails
        await supabase.from("order_items").delete().eq("order_id", createdOrder.id)
        await supabase.from("orders").delete().eq("id", createdOrder.id)

        setPaymentError("Failed to initialize payment. Please try again.")
        setIsProcessing(false)
        return
      }

      const paymentData = await response.json()
      console.log("Payment initialization response:", paymentData)

      if (!paymentData.success) {
        console.error("Payment initialization unsuccessful:", paymentData)

        // Clean up the order if payment initialization fails
        await supabase.from("order_items").delete().eq("order_id", createdOrder.id)
        await supabase.from("orders").delete().eq("id", createdOrder.id)

        setPaymentError(paymentData.error || "Failed to initialize payment")
        setIsProcessing(false)
        return
      }

      // Clear cart items
      if (resolvedVendorId) {
        console.log("Clearing cart items...")
        const menuItemIds = cartItems.map((item) => item.menu_item_id)
        const { error: clearCartError } = await supabase
          .from("cart_items")
          .delete()
          .eq("customer_id", session.user.id)
          .in("menu_item_id", menuItemIds)

        if (clearCartError) {
          console.error("Error clearing cart:", clearCartError)
          // Don't fail the order for this
        }
      }

      console.log("Redirecting to payment page...")
      // Redirect to PayStack payment page
      window.location.href = paymentData.data.authorization_url
    } catch (error) {
      console.error("Error in handlePlaceOrder:", error)
      setPaymentError("An unexpected error occurred. Please try again.")
      setIsProcessing(false)
    }
  }

  const handleAddressChange = (field: keyof DeliveryAddress, value: string) => {
    setDeliveryAddress({ ...deliveryAddress, [field]: value })
    setCustomerCoordinates(null) // Reset to force recalculation
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
