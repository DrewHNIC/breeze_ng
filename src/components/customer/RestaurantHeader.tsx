// components/customer/RestaurantHeader.tsx
import Image from "next/image"
import { Star, Clock, MapPin, Phone, Calendar } from "lucide-react"

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
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
  const currentDay = days[new Date().getDay()]
  const todayHours = operating_hours?.[currentDay]

  return (
    <div className="mb-8">
      {/* Banner */}
      <div className="relative h-48 md:h-64 w-full rounded-xl overflow-hidden shadow-lg">
        <Image
          src={banner_url || "/placeholder.svg?height=600&width=1200"}
          alt={`${name} banner`}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
      </div>

      {/* Info Card */}
      <div className="relative px-4 pb-4 -mt-16">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-5 border border-white/30">
          <div className="flex flex-col md:flex-row">
            {/* Logo */}
            <div className="relative h-24 w-24 md:h-32 md:w-32 -mt-12 md:-mt-16 mb-4 md:mb-0 mx-auto md:mx-0 rounded-xl overflow-hidden border-4 border-white shadow-md">
              <Image
                src={logo_url || "/placeholder.svg?height=228&width=256"}
                alt={`${name} logo`}
                fill
                className="object-cover"
              />
            </div>

            {/* Details */}
            <div className="md:ml-6 flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-[#1d2c36]">{name}</h1>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium shadow-inner ${
                    is_open
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {is_open ? "Open Now" : "Closed"}
                </span>
              </div>

              <div className="flex flex-wrap gap-3 text-sm text-[#1d2c36] mb-4">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>{rating?.toFixed(1) || "New"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-[#b9c6c8]" />
                  <span>{`${address}, ${city}, ${state}`}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4 text-[#b9c6c8]" />
                  <span>{contact_phone}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-[#b9c6c8]" />
                  <span>Prep time: ~{average_preparation_time} mins</span>
                </div>
                {todayHours && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-[#b9c6c8]" />
                    <span>
                      Today:{" "}
                      {todayHours.is_open
                        ? `${todayHours.open_time} - ${todayHours.close_time}`
                        : "Closed"}
                    </span>
                  </div>
                )}
              </div>

              <div className="inline-block px-3 py-1 bg-[#1d2c36]/10 text-[#1d2c36] border border-[#b9c6c8] rounded-full text-sm font-medium shadow-sm">
                {cuisine_type}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RestaurantHeader
