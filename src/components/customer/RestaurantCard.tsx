// components/customer/RestaurantCard.tsx
import Link from "next/link"
import Image from "next/image"
import { Star, Clock, Award } from 'lucide-react'

interface Vendor {
  id: string
  store_name: string
  logo_url: string | null
  banner_url: string | null
  cuisine_type: string | null
  rating: number | null
  avg_delivery_time: string | null
  description: string | null
  is_advertised?: boolean
}

interface RestaurantCardProps {
  vendor: Vendor
  featured?: boolean
}

const RestaurantCard = ({ vendor, featured = false }: RestaurantCardProps) => {
  return (
    <Link href={`/customer/restaurant/${vendor.id}`} className="block group">
      <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 h-full flex flex-col">
        {/* Banner Image */}
        <div className="relative h-40 sm:h-48 w-full overflow-hidden">
          <Image
            src={vendor.banner_url || "/placeholder.svg?height=300&width=500"}
            alt={`${vendor.store_name} banner`}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          
          {/* Featured Badge */}
          {vendor.is_advertised && (
            <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md flex items-center">
              <Award className="h-3 w-3 mr-1" />
              <span>Featured</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="text-lg font-semibold text-gray-800">{vendor.store_name}</h3>
          <p className="text-sm text-gray-600">{vendor.description}</p>
          <p className="text-xs text-gray-500">{vendor.cuisine_type} • {vendor.avg_delivery_time} mins</p>

          {/* Ratings and Delivery Time */}
          <div className="mt-auto flex items-center justify-between text-sm text-gray-600">
            {vendor.rating && (
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-400 mr-1" />
                <span>{vendor.rating.toFixed(1)}</span>
              </div>
            )}
            
            {vendor.avg_delivery_time && (
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                <span>{vendor.avg_delivery_time} min</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

export default RestaurantCard