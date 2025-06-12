"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import Link from "next/link"
import { supabase } from "@/utils/supabase"
import CustomerLayout from "../../components/CustomerLayout"
import { Loader2, MapPin, CreditCard, AlertCircle, ArrowLeft, Clock } from 'lucide-react'
import CartSummary from "@/components/customer/CartSummary"

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

const CheckoutPage = () => {
  const router = useRouter()
  const { vendor: vendorId } = router.query

  const [isLoading, setIsLoading] = useState(true)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [subtotal, setSubtotal] = useState(0)
  const [deliveryFee, setDeliveryFee] = useState(500) // Default delivery fee
  const [serviceFee, setServiceFee] = useState(0)
  const [vat, setVat] = useState(0)
  const [total, setTotal] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState("")
  const [paymentSuccess, setPaymentSuccess] = useState(false)

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

        // Fetch user profile to pre-fill contact info
        const { data: customerData } = await supabase
          .from("customers")
          .select("name, email, phone_number, address, city, state, zip_code")
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
        }

        // Modified query to get cart items with menu items and vendor info
        let query = supabase
          .from("cart_items")
          .select(`
            id,
            menu_item_id,
            quantity,
            special_instructions,
            menu_items(
              id, 
              name, 
              price, 
              image_url, 
              vendor_id,
              vendors(id, store_name)
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
          }))

        // Filter by vendor if vendorId is provided
        if (vendorId && typeof vendorId === "string" && vendorId !== "null") {
          transformedItems = transformedItems.filter(item => item.vendor_id === vendorId)
        }

        console.log("Transformed cart items:", transformedItems)

        setCartItems(transformedItems)

        // Calculate totals
        const itemSubtotal = transformedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
        setSubtotal(itemSubtotal)

        // Calculate service fee (base fee of 200 + 50 per item, capped at 500)
        const totalItems = transformedItems.reduce((sum, item) => sum + item.quantity, 0)
        const calculatedServiceFee = Math.min(200 + totalItems * 50, 500)
        setServiceFee(calculatedServiceFee)

        // Calculate VAT (7.5% in Nigeria)
        const calculatedVat = Math.round(itemSubtotal * 0.075)
        setVat(calculatedVat)

        // Calculate total
        setTotal(itemSubtotal + deliveryFee + calculatedServiceFee + calculatedVat)
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
  }, [router.isReady, router, vendorId, deliveryFee])

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
      let resolvedVendorId = null;
    
      // First try to get vendor ID from URL parameter
      if (typeof vendorId === "string" && vendorId !== "null" && vendorId.trim() !== "") {
        resolvedVendorId = vendorId;
        console.log("Using vendor ID from URL:", resolvedVendorId);
      } 
      // If not available, try to get from cart items
      else if (cartItems.length > 0) {
        // Try to find any cart item with a valid vendor_id
        const itemWithVendor = cartItems.find(item => 
          item.vendor_id && 
          item.vendor_id !== "null" && 
          item.vendor_id.trim() !== ""
        );
        
        if (itemWithVendor) {
          resolvedVendorId = itemWithVendor.vendor_id;
          console.log("Using vendor ID from cart item:", resolvedVendorId);
        }
      }

      // Validate that we have a valid UUID for vendor_id
      const isValidUUID = (uuid: string | null | undefined): boolean => {
        return Boolean(uuid && typeof uuid === 'string' && 
               /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid));
      };

      if (!resolvedVendorId || !isValidUUID(resolvedVendorId)) {
        setPaymentError("Unable to determine vendor. Please go back and select a vendor.");
        setIsProcessing(false);
        return;
      }

      console.log("Using vendor ID:", resolvedVendorId);

      // Create order in database
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_id: session.user.id,
          status: "pending",
          total_amount: total,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          delivery_address: deliveryAddress.address,
          vendor_id: resolvedVendorId,
          rider_id: null,
          estimated_delivery_time: null,
          payment_method: paymentMethod,
          payment_status: "pending",
          actual_delivery_time: null,
          contact_number: contactInfo.phone,
          special_instructions: deliveryAddress.instructions || null,
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

      // Initialize payment with PayStack
      const response = await fetch("/api/payments/initialize-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: orderData.id,
          amount: total,
          email: contactInfo.email,
          metadata: {
            order_id: orderData.id,
            customer_id: session.user.id,
            delivery_address: deliveryAddress.address,
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
        const menuItemIds = cartItems.map(item => item.menu_item_id)
        await supabase
          .from("cart_items")
          .delete()
          .eq("customer_id", session.user.id)
          .in("menu_item_id", menuItemIds)
      }

      // Redirect to PayStack payment page
      window.location.href = paymentData.data.authorization_url
    } catch (error) {
      console.error("Error in handlePlaceOrder:", error)
      setPaymentError("An unexpected error occurred. Please try again.")
      setIsProcessing(false)
    }
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
            <h2 className="text-2xl font-bold mb-4 text-[#1d2c36]">Your cart is empty</h2>
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
            {/* Delivery Address */}
            <div className="bg-gradient-to-r from-[#8f8578] to-[#b9c6c8] rounded-lg shadow-md border border-[#b9c6c8] p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center text-[#1d2c36]">
                <MapPin className="h-5 w-5 mr-2 text-[#1d2c36]" />
                Delivery Address
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#1d2c36] mb-1">
                    Street Address*
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress.address}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, address: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#b9c6c8] focus:border-[#b9c6c8] ${
                      formErrors.address ? "border-red-500" : "border-[#b9c6c8]"
                    }`}
                    placeholder="123 Main Street"
                  />
                  {formErrors.address && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.address}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1d2c36] mb-1">City*</label>
                  <input
                    type="text"
                    value={deliveryAddress.city}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, city: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#b9c6c8] focus:border-[#b9c6c8] ${
                      formErrors.city ? "border-red-500" : "border-[#b9c6c8]"
                    }`}
                    placeholder="Lagos"
                  />
                  {formErrors.city && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1d2c36] mb-1">State*</label>
                  <input
                    type="text"
                    value={deliveryAddress.state}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, state: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#b9c6c8] focus:border-[#b9c6c8] ${
                      formErrors.state ? "border-red-500" : "border-[#b9c6c8]"
                    }`}
                    placeholder="Lagos State"
                  />
                  {formErrors.state && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.state}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1d2c36] mb-1">Zip Code</label>
                  <input
                    type="text"
                    value={deliveryAddress.zipCode}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, zipCode: e.target.value })}
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
                  {formErrors.fullName && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.fullName}</p>
                  )}
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
                  {formErrors.phone && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.phone}</p>
                  )}
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
                  {formErrors.email && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.email}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={saveInfo}
                      onChange={(e) => setSaveInfo(e.target.checked)}
                      className="h-4 w-4 text-[#b9c6c8] focus:ring-[#b9c6c8] border-[#b9c6c8] rounded"
                    />
                    <span className="ml-2 text-sm text-[#1d2c36]">
                      Save this information for future orders
                    </span>
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
                    You'll be redirected to PayStack's secure payment page to complete your payment.
                    Your payment information is encrypted and secure!
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
              <p className="text-[#1d2c36]">
                Your order will be delivered within minutes after payment confirmation.
              </p>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <CartSummary
                subtotal={subtotal}
                serviceFee={serviceFee}
                deliveryFee={deliveryFee}
                itemCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                vendorId={vendorId as string || null}
              />

              <button
                onClick={handlePlaceOrder}
                disabled={isProcessing}
                className={`w-full mt-4 bg-gradient-to-r from-[#b9c6c8] to-[#a8b5b8] text-[#1d2c36] py-3 rounded-lg font-medium hover:from-[#a8b5b8] hover:to-[#97a4a7] transition-all duration-300 flex items-center justify-center ${
                  isProcessing ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Processing...
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
    </CustomerLayout>
  )
}

export default CheckoutPage