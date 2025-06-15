"use client"

import { useRef, useState, useEffect } from "react"
import { supabase } from "@/utils/supabase"
import type { Order } from "./OrderManagement"

interface OrderReceiptProps {
  order: Order
}

export default function OrderReceipt({ order }: OrderReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null)
  const [vendorName, setVendorName] = useState("Restaurant")

  // Fetch vendor name
  useEffect(() => {
    async function fetchVendorName() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session) return

        const { data: vendor, error } = await supabase
          .from("vendors")
          .select("store_name")
          .eq("id", session.user.id)
          .single()

        if (error) {
          console.error("Error fetching vendor name:", error)
          return
        }

        setVendorName(vendor.store_name || "Restaurant")
      } catch (error) {
        console.error("Error in fetchVendorName:", error)
      }
    }

    fetchVendorName()
  }, [])

  const handlePrint = () => {
    const content = receiptRef.current
    if (!content) return

    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      alert("Please allow pop-ups to print receipts")
      return
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Order Receipt #${order.order_code}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              max-width: 300px;
              margin: 0 auto;
            }
            .receipt {
              border: 1px solid #ddd;
              padding: 15px;
            }
            .header {
              text-align: center;
              margin-bottom: 15px;
              border-bottom: 1px dashed #ddd;
              padding-bottom: 10px;
            }
            .font-logo {
              font-family: 'Brush Script MT', cursive;
              font-size: 24px;
              font-weight: bold;
              color: #333;
            }
            .info {
              margin-bottom: 15px;
              font-size: 12px;
            }
            .items {
              margin-bottom: 15px;
              border-bottom: 1px dashed #ddd;
              padding-bottom: 10px;
            }
            .item {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
              font-size: 12px;
            }
            .item-detail {
              display: flex;
              justify-content: space-between;
              margin-bottom: 3px;
              font-size: 11px;
              padding-left: 10px;
            }
            .pricing {
              border-top: 1px dashed #ddd;
              padding-top: 10px;
              margin-top: 10px;
            }
            .total {
              font-weight: bold;
              display: flex;
              justify-content: space-between;
              margin-top: 10px;
              font-size: 14px;
              border-top: 1px solid #333;
              padding-top: 5px;
            }
            .footer {
              text-align: center;
              margin-top: 15px;
              font-size: 12px;
            }
            @media print {
              body {
                width: 100%;
                max-width: 300px;
              }
            }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()

    // Print after a short delay to ensure content is loaded
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  // Format date for receipt
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  // Calculate subtotal
  const calculateSubtotal = () => {
    if (!order.items || order.items.length === 0) return 0
    return order.items.reduce((sum, item) => {
      const price = item.price_per_item || 0
      const quantity = item.quantity || 0
      return sum + price * quantity
    }, 0)
  }

  // Calculate delivery fee - use the actual delivery fee from order if available
  const calculateDeliveryFee = () => {
    // If we have delivery fee in the order data, use it
    if (order.delivery_fee && order.delivery_fee > 0) {
      return order.delivery_fee
    }
    // Otherwise calculate based on subtotal
    const subtotal = calculateSubtotal()
    const fee = subtotal * 0.1
    return Math.min(Math.max(fee, 200), 1000)
  }

  // Calculate VAT (7.5%)
  const calculateVAT = () => {
    const subtotal = calculateSubtotal()
    return subtotal * 0.075
  }

  // Calculate service fee (2.5%)
  const calculateServiceFee = () => {
    const subtotal = calculateSubtotal()
    return subtotal * 0.065
  }

  return (
    <div>
      <button
        onClick={handlePrint}
        className="bg-gradient-to-r from-[#b9c6c8] to-[#8f8578] hover:from-[#8f8578] hover:to-[#b9c6c8] text-[#1d2c36] font-semibold py-2 px-4 rounded flex items-center gap-2 transition-all duration-200"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
          />
        </svg>
        Print Receipt
      </button>

      {/* Hidden receipt content for printing */}
      <div className="hidden">
        <div ref={receiptRef} className="receipt">
          <div className="header">
            <h2 className="font-logo">Breeze</h2>
            <p>
              <strong>Restaurant:</strong> {vendorName}
            </p>
            <p>Order #{order.order_code}</p>
            <p>{formatDate(order.created_at)}</p>
          </div>

          <div className="info">
            <p>
              <strong>Customer:</strong> {order.customer_name}
            </p>
            <p>
              <strong>Phone:</strong> {order.customer_phone}
            </p>
            <p>
              <strong>Address:</strong> {order.delivery_address}
            </p>
            {order.special_instructions && (
              <p>
                <strong>Instructions:</strong> {order.special_instructions}
              </p>
            )}
          </div>

          <div className="items">
            <p>
              <strong>Items:</strong>
            </p>
            {order.items?.map((item) => (
              <div key={item.id}>
                <div className="item">
                  <span>{item.menu_item_name}</span>
                  <span></span>
                </div>
                <div className="item-detail">
                  <span>
                    {item.quantity} x ₦{(item.price_per_item || 0).toLocaleString()}
                  </span>
                  <span>₦{((item.quantity || 0) * (item.price_per_item || 0)).toLocaleString()}</span>
                </div>
                {item.special_requests && (
                  <div className="item-detail">
                    <span style={{ fontStyle: "italic", color: "#666" }}>Note: {item.special_requests}</span>
                    <span></span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="pricing">
            <div className="item">
              <span>Subtotal:</span>
              <span>₦{Math.round(calculateSubtotal()).toLocaleString()}</span>
            </div>
            <div className="item">
              <span>Delivery Fee:</span>
              <span>₦{Math.round(calculateDeliveryFee()).toLocaleString()}</span>
            </div>
            <div className="item">
              <span>VAT (7.5%):</span>
              <span>₦{Math.round(calculateVAT()).toLocaleString()}</span>
            </div>
            <div className="item">
              <span>Service Fee (2.5%):</span>
              <span>₦{Math.round(calculateServiceFee()).toLocaleString()}</span>
            </div>
            <div className="total">
              <span>Total:</span>
              <span>₦{(order.total_amount || 0).toLocaleString()}</span>
            </div>
            <div className="item">
              <span>Payment Method:</span>
              <span>{order.payment_method.charAt(0).toUpperCase() + order.payment_method.slice(1)}</span>
            </div>
            <div className="item">
              <span>Payment Status:</span>
              <span>Successful</span>
            </div>
          </div>

          <div className="footer">
            <p>Thank you for your order, come again!</p>
          </div>
        </div>
      </div>
    </div>
  )
}
