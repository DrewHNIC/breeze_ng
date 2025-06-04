// components/customer/CartItem.tsx
import { useState } from "react"
import Image from "next/image"
import { Trash2, Plus, Minus } from 'lucide-react'
import { supabase } from "@/utils/supabase"

interface CartItemProps {
  id: string
  cartItemId: string
  name: string
  description?: string
  price: number
  quantity: number
  image_url: string | null
  special_instructions?: string | null
  onUpdateQuantity: (cartItemId: string, newQuantity: number) => Promise<void>
  onRemoveItem: (cartItemId: string) => Promise<void>
  onUpdateInstructions: (cartItemId: string, instructions: string) => Promise<void>
}

const CartItem = ({
  id,
  cartItemId,
  name,
  description,
  price,
  quantity,
  image_url,
  special_instructions,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateInstructions,
}: CartItemProps) => {
  const [isUpdating, setIsUpdating] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [instructions, setInstructions] = useState(special_instructions || "")
  const [isSubmittingInstructions, setIsSubmittingInstructions] = useState(false)

  const handleIncrement = async () => {
    setIsUpdating(true)
    await onUpdateQuantity(cartItemId, quantity + 1)
    setIsUpdating(false)
  }

  const handleDecrement = async () => {
    if (quantity > 1) {
      setIsUpdating(true)
      await onUpdateQuantity(cartItemId, quantity - 1)
      setIsUpdating(false)
    } else {
      await onRemoveItem(cartItemId)
    }
  }

  const handleRemove = async () => {
    await onRemoveItem(cartItemId)
  }

  const handleInstructionsSubmit = async () => {
    setIsSubmittingInstructions(true)
    await onUpdateInstructions(cartItemId, instructions)
    setIsSubmittingInstructions(false)
    setShowInstructions(false)
  }

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 flex flex-col md:flex-row mb-4">
      {/* Image */}
      <div className="relative h-32 md:h-auto md:w-1/4 md:min-h-[160px]">
        <Image
          src={image_url || "/placeholder.svg?height=160&width=160"}
          alt={name}
          fill
          className="object-cover"
        />
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between">
          <h3 className="font-bold text-lg">{name}</h3>
          <button
            onClick={handleRemove}
            className="text-red-500 hover:text-red-700 transition-colors"
            aria-label="Remove item"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>

        {description && <p className="text-gray-600 text-sm mt-1 mb-2">{description}</p>}

        <div className="mt-auto flex flex-col sm:flex-row sm:items-center justify-between">
          <div className="flex items-center mb-3 sm:mb-0">
            <button
              onClick={handleDecrement}
              disabled={isUpdating}
              className="bg-gray-100 text-gray-700 rounded-full w-8 h-8 flex items-center justify-center disabled:opacity-50"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-10 text-center font-medium">{quantity}</span>
            <button
              onClick={handleIncrement}
              disabled={isUpdating}
              className="bg-gray-100 text-gray-700 rounded-full w-8 h-8 flex items-center justify-center disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-lg font-bold">₦{(price * quantity).toLocaleString()}</span>
            <span className="text-sm text-gray-500">₦{price.toLocaleString()} each</span>
          </div>
        </div>

        {/* Special Instructions */}
        <div className="mt-3 border-t border-gray-100 pt-3">
          {showInstructions ? (
            <div className="space-y-2">
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Add special instructions (e.g., allergies, spice level)"
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                rows={2}
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleInstructionsSubmit}
                  disabled={isSubmittingInstructions}
                  className="bg-accent text-primary px-3 py-1 rounded-md text-sm font-medium disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowInstructions(false)
                    setInstructions(special_instructions || "")
                  }}
                  className="bg-gray-200 text-gray-700 px-3 py-1 rounded-md text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowInstructions(true)}
              className="text-accent text-sm hover:underline"
            >
              {special_instructions ? "Edit special instructions" : "Add special instructions"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default CartItem