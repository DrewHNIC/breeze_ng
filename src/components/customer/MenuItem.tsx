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

  const incrementQuantity = () => setQuantity((prev) => prev + 1)
  const decrementQuantity = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1))

  const handleAddToCart = () => {
    onAddToCart(id, quantity)
    setIsAdding(false)
    setQuantity(1)
  }

  return (
    <div className="bg-white rounded-2xl shadow-md border border-[#e5e7eb] overflow-hidden flex flex-col md:flex-row transition hover:shadow-lg">
      {/* Image */}
      <div className="relative h-48 md:h-auto md:w-1/3 md:min-h-[180px]">
        <Image
          src={image_url || "/placeholder.svg?height=300&width=160"}
          alt={name}
          fill
          className="object-cover"
        />
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col justify-between flex-1">
        <div>
          <h3 className="text-lg font-semibold text-[#1d2c36] mb-1">{name}</h3>
          <p className="text-sm text-gray-600 mb-3">{description}</p>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-[#1d2c36]">₦{price.toLocaleString()}</span>

          {isAdding ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={decrementQuantity}
                className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center hover:bg-gray-300"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-6 text-center text-sm">{quantity}</span>
              <button
                onClick={incrementQuantity}
                className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center hover:bg-gray-300"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                onClick={handleAddToCart}
                className="bg-[#b9c6c8] text-[#1d2c36] px-4 py-1.5 rounded-full text-sm font-medium hover:bg-[#a8b6b8] transition-colors"
              >
                Add
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="bg-[#b9c6c8] text-[#1d2c36] px-4 py-2 rounded-full font-medium hover:bg-[#a8b6b8] transition-colors flex items-center text-sm"
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
