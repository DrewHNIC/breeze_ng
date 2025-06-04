// components/customer/VendorCartGroup.tsx
import Link from "next/link"
import Image from "next/image"
import { Store, ChevronRight } from 'lucide-react'
import CartItem from "./CartItem"

interface CartItemType {
  cartItemId: string
  menu_item_id: string
  name: string
  description?: string
  price: number
  quantity: number
  image_url: string | null
  special_instructions?: string | null
}

interface VendorInfo {
  id: string
  name: string
  logo_url: string | null
}

interface VendorCartGroupProps {
  vendor: VendorInfo
  items: CartItemType[]
  onUpdateQuantity: (cartItemId: string, newQuantity: number) => Promise<void>
  onRemoveItem: (cartItemId: string) => Promise<void>
  onUpdateInstructions: (cartItemId: string, instructions: string) => Promise<void>
}

const VendorCartGroup = ({
  vendor,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateInstructions,
}: VendorCartGroupProps) => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <Link href={`/customer/restaurant/${vendor.id}`} className="flex items-center group">
          <div className="relative h-10 w-10 rounded-full overflow-hidden mr-3 border border-gray-200">
            {vendor.logo_url ? (
              <Image src={vendor.logo_url || "/placeholder.svg"} alt={vendor.name} fill className="object-cover" />
            ) : (
              <div className="bg-primary h-full w-full flex items-center justify-center text-white">
                <Store className="h-5 w-5" />
              </div>
            )}
          </div>
          <div>
            <h2 className="font-bold text-lg group-hover:text-accent transition-colors">{vendor.name}</h2>
            <p className="text-sm text-gray-500">
              Subtotal: <span className="font-medium">₦{subtotal.toLocaleString()}</span>
            </p>
          </div>
          <ChevronRight className="h-5 w-5 ml-2 text-gray-400 group-hover:text-accent transition-colors" />
        </Link>

        <Link
          href={`/customer/checkout?vendor=${vendor.id}`}
          className="bg-accent text-primary px-4 py-2 rounded-full text-sm font-medium hover:bg-opacity-90 transition-colors"
        >
          Checkout
        </Link>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <CartItem
            key={item.cartItemId}
            id={item.menu_item_id}
            cartItemId={item.cartItemId}
            name={item.name}
            description={item.description}
            price={item.price}
            quantity={item.quantity}
            image_url={item.image_url}
            special_instructions={item.special_instructions}
            onUpdateQuantity={onUpdateQuantity}
            onRemoveItem={onRemoveItem}
            onUpdateInstructions={onUpdateInstructions}
          />
        ))}
      </div>
    </div>
  )
}

export default VendorCartGroup