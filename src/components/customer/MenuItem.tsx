// components/customer/MenuItem.tsx
import { useState } from "react"
import Image from "next/image"
import { Plus, Minus, ShoppingCart } from 'lucide-react'

interface MenuItemProps {
  id: string
  name: string
  description: string
  price: number
  image_url: string | null
  onAddToCart: (id: string, quantity: number) => void
}

const MenuItem = ({ id, name, description, price, image_url, onAddToCart }: MenuItemProps) => {
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)

  const incrementQuantity = () => {
    setQuantity((prev) => prev + 1)
  }

  const decrementQuantity = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1))
  }

  const handleAddToCart = () => {
    onAddToCart(id, quantity)
    setIsAdding(false)
    setQuantity(1)
  }

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col md:flex-row">
      {/* Image */}
      <div className="relative h-48 md:h-auto md:w-1/3 md:min-h-[160px]">
        <Image
          src={image_url || "/placeholder.svg?height=300&width=160"}
          alt={name}
          fill
          className="object-cover"
        />
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-bold text-lg mb-1">{name}</h3>
        <p className="text-gray-600 text-sm mb-2 flex-grow">{description}</p>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold">₦{price.toLocaleString()}</span>

          {isAdding ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={decrementQuantity}
                className="bg-gray-200 text-gray-700 rounded-full w-8 h-8 flex items-center justify-center"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center">{quantity}</span>
              <button
                onClick={incrementQuantity}
                className="bg-gray-200 text-gray-700 rounded-full w-8 h-8 flex items-center justify-center"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                onClick={handleAddToCart}
                className="bg-accent text-primary px-4 py-2 rounded-full font-medium hover:bg-opacity-90 transition-colors"
              >
                Add
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="bg-accent text-primary px-4 py-2 rounded-full font-medium hover:bg-opacity-90 transition-colors flex items-center"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default MenuItem