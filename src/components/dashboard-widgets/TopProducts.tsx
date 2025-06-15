import type React from "react"
import Image from "next/image"

interface Product {
  id: string
  name: string
  image: string
  orders: number
  revenue: number
}

interface TopProductsProps {
  products: Product[]
}

const TopProducts: React.FC<TopProductsProps> = ({ products }) => {
  return (
    <div className="bg-gradient-to-br from-[#1d2c36] to-[#243642] rounded-lg p-6 border border-[#b9c6c8]/20 backdrop-blur-sm">
      <h3 className="text-[#b9c6c8] text-lg font-semibold mb-6">Top Products</h3>
      <div className="space-y-4">
        {products.length > 0 ? (
          products.map((product, index) => (
            <div
              key={product.id}
              className="flex items-center gap-4 p-3 rounded-lg bg-gradient-to-r from-[#b9c6c8]/5 to-transparent hover:from-[#b9c6c8]/10 transition-all duration-200"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-[#b9c6c8] to-[#8f8578] text-[#1d2c36] font-bold text-sm">
                {index + 1}
              </div>
              <div className="relative w-12 h-12">
                <Image
                  src={product.image || "/placeholder.svg"}
                  alt={product.name}
                  fill
                  className="rounded-lg object-cover border border-[#b9c6c8]/20"
                />
              </div>
              <div className="flex-1">
                <h4 className="text-[#b9c6c8] font-medium">{product.name}</h4>
                <p className="text-[#8f8578] text-sm">{product.orders} orders</p>
              </div>
              <p className="text-[#b9c6c8] font-medium">₦{product.revenue.toLocaleString()}</p>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-[#b9c6c8]/20 to-[#8f8578]/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-[#8f8578]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <p className="text-[#8f8578] text-sm">No product data available</p>
            <p className="text-[#8f8578]/60 text-xs mt-1">Complete some orders to see your top products</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default TopProducts
