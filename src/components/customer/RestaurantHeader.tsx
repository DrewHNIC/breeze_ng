// components/customer/RestaurantHeader.tsx
import Image from "next/image"
import { Star, Clock, MapPin, Phone, Calendar } from 'lucide-react'

interface OperatingHours {
  [day: string]: {
    is_open: boolean
    open_time: string
    close_time: string
  }
}

interface RestaurantHeaderProps {
  name: string
  logo_url: string | null
  banner_url: string | null
  cuisine_type: string
  rating: number
  is_open: boolean
  operating_hours: OperatingHours
  address: string
  city: string
  state: string
  contact_phone: string
  average_preparation_time: string
}

const RestaurantHeader = ({
  name,
  logo_url,
  banner_url,
  cuisine_type,
  rating,
  is_open,
  operating_hours,
  address,
  city,
  state,
  contact_phone,
  average_preparation_time,
}: RestaurantHeaderProps) => {
  // Get current day for operating hours
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
  const currentDay = days[new Date().getDay()]
  const todayHours = operating_hours?.[currentDay]

  return (
    <div className="mb-6">
      {/* Banner */}
      <div className="relative h-48 md:h-64 w-full">
        <Image
          src={banner_url || "/placeholder.svg?height=600&width=1200"}
          alt={`${name} banner`}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-60"></div>
      </div>

      {/* Restaurant Info */}
      <div className="relative px-4 pb-4 -mt-16">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex flex-col md:flex-row">
            {/* Logo */}
            <div className="relative h-24 w-24 md:h-32 md:w-32 -mt-12 md:-mt-16 mb-4 md:mb-0 mx-auto md:mx-0 rounded-lg overflow-hidden border-4 border-white shadow-sm">
              <Image
                src={logo_url || "/placeholder.svg?height=228&width=256"}
                alt={`${name} logo`}
                fill
                className="object-cover"
              />
            </div>

            {/* Details */}
            <div className="md:ml-6 flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <h1 className="text-2xl md:text-3xl font-bold mb-1">{name}</h1>
                <div className="flex items-center mb-2 md:mb-0">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      is_open ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {is_open ? "Open" : "Closed"}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center mr-4">
                  <Star className="h-4 w-4 text-yellow-500 mr-1" />
                  <span>{rating?.toFixed(1) || "New"}</span>
                </div>
                <div className="flex items-center mr-4">
                  <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                  <span>{`${address}, ${city}, ${state}`}</span>
                </div>
                <div className="flex items-center mr-4">
                  <Phone className="h-4 w-4 text-gray-400 mr-1" />
                  <span>{contact_phone}</span>
                </div>
                <div className="flex items-center mr-4">
                  <Clock className="h-4 w-4 text-gray-400 mr-1" />
                  <span>Prep time: ~{average_preparation_time} mins</span>
                </div>
                {todayHours && (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                    <span>
                      Today: {todayHours.is_open ? `${todayHours.open_time} - ${todayHours.close_time}` : "Closed"}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center">
                <span className="px-3 py-1 bg-primary bg-opacity-10 text-primary rounded-full text-sm font-medium">
                  {cuisine_type}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RestaurantHeader