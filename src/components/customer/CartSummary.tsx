// components/customer/CartSummary.tsx
import { useState, useEffect } from "react"
import Link from "next/link"
import { ShoppingCart, ChevronUp, ArrowRight } from 'lucide-react'

// Original interface - keep for backward compatibility with restaurant page
interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

// Updated interface with new props
interface CartSummaryProps {
  // Original props
  items?: CartItem[]
  
  // New props
  vendorId: string | null
  subtotal?: number
  deliveryFee?: number
  serviceFee?: number
  itemCount?: number
  isMultipleVendors?: boolean
}

const CartSummary = ({ 
  items = [], 
  vendorId,
  subtotal: propSubtotal,
  deliveryFee = 500,
  serviceFee: propServiceFee,
  itemCount: propItemCount,
  isMultipleVendors = false
}: CartSummaryProps) => {
  const [isExpanded, setIsExpanded] = useState(true) // Start expanded to show items
  const [isVisible, setIsVisible] = useState(false)

  // Calculate values from items if not provided directly
  const totalItems = propItemCount !== undefined ? propItemCount : items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = propSubtotal !== undefined ? propSubtotal : items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  
  // Calculate service fee based on number of items and subtotal
  // Base fee of 200 + 50 per item, capped at 500
  const calculatedServiceFee = Math.min(200 + (totalItems * 50), 500)
  const serviceFee = propServiceFee !== undefined ? propServiceFee : calculatedServiceFee
  
  // Calculate VAT (7.5% in Nigeria)
  const vat = Math.round(subtotal * 0.075)
  
  const total = subtotal + deliveryFee + serviceFee + vat

  useEffect(() => {
    // Show cart summary only if there are items
    setIsVisible(totalItems > 0)
    
    // Log items for debugging
    if (items.length > 0) {
      console.log("Cart items:", items)
    }
  }, [items, propItemCount, totalItems])

  if (!isVisible) return null

  // For the restaurant page (fixed at bottom)
  if (items.length > 0 && propSubtotal === undefined) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg transition-transform duration-300">
        {/* Toggle button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute -top-10 right-4 bg-red-500 text-white p-2 rounded-t-lg shadow-md flex items-center"
          aria-expanded={isExpanded} // Added ARIA attribute
        >
          <ShoppingCart className="h-5 w-5 mr-2" />
          <span className="font-medium">{totalItems} items</span>
          <ChevronUp
            className={`h-5 w-5 ml-2 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
          />
        </button>

        {/* Cart summary */}
        <div
          className={`transition-all duration-300 overflow-hidden ${
            isExpanded ? "max-h-96" : "max-h-20"
          }`}
        >
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Your Order</h3>
              <span className="text-lg font-bold">₦{subtotal.toLocaleString()}</span>
            </div>

            {isExpanded && (
              <>
                <div className="max-h-40 overflow-y-auto mb-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div className="flex items-center">
                        <span className="bg-red-100 text-red-500 rounded-full w-6 h-6 flex items-center justify-center mr-2">
                          {item.quantity}
                        </span>
                        <span>{item.name}</span>
                      </div>
                      <span>₦{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-200 mb-4">
                  <span className="font-medium">Subtotal</span>
                  <span className="font-medium">₦{subtotal.toLocaleString()}</span>
                </div>
              </>
            )}

            <Link
              href="/customer/cart"
              className="bg-red-500 text-white w-full py-3 rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center justify-center"
            >
              View Cart
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // For the cart page (static summary)
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <ShoppingCart className="h-5 w-5 mr-2 text-red-500" />
        Order Summary
      </h2>

      <div className="space-y-3 mb-6">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal ({totalItems} items)</span>
          <span className="font-medium">₦{subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Delivery Fee</span>
          <span className="font-medium">₦{deliveryFee.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Service Fee</span>
          <span className="font-medium">₦{serviceFee.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">VAT (7.5%)</span>
          <span className="font-medium">₦{vat.toLocaleString()}</span>
        </div>
        <div className="border-t border-gray-200 pt-3 mt-3">
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>₦{total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {isMultipleVendors ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4 text-sm text-yellow-800">
          <p>
            Your cart contains items from multiple restaurants. You&apos;ll need to checkout each restaurant separately.
          </p>
        </div>
      ) : (
        <Link
          href={vendorId ? `/customer/checkout?vendor=${vendorId}` : "/customer/checkout"}
          className={`w-full bg-red-500 text-white py-3 rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center justify-center ${
            totalItems === 0 ? "opacity-50 cursor-not-allowed" : ""
          }`}
          aria-disabled={totalItems === 0}
          onClick={(e) => totalItems === 0 && e.preventDefault()}
        >
          Proceed to Checkout
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      )}
    </div>
  )
}

export default CartSummary