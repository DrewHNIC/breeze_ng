// components/customer/HeroCarousel.tsx
import { Swiper, SwiperSlide } from "swiper/react"
import { Autoplay, Navigation, Pagination } from "swiper/modules"
import "swiper/css"
import "swiper/css/navigation"
import "swiper/css/pagination"
import Image from "next/image"
import Link from "next/link"

interface Vendor {
  id: string
  store_name: string
  banner_url: string | null
  description: string | null
  cuisine_type: string | null
  rating: number | null
  avg_delivery_time: string | null
  is_advertised: boolean
}

interface HeroCarouselProps {
  vendors: Vendor[]
}

const HeroCarousel = ({ vendors }: HeroCarouselProps) => {
  if (vendors.length === 0) return null

  return (
    <div className="relative">
      <Swiper
        modules={[Autoplay, Navigation, Pagination]}
        spaceBetween={30}
        slidesPerView={1}
        autoplay={{ delay: 7000, disableOnInteraction: false }}
        navigation
        pagination={{ clickable: true }}
        loop
        className="w-full h-[300px] md:h-[400px] lg:h-[500px]" // Adjusted height for responsiveness
      >
        {vendors.map((vendor) => (
          <SwiperSlide key={vendor.id} className="relative">
            <Image
              src={vendor.banner_url || "/placeholder.svg"}
              alt={vendor.store_name}
              fill
              className="object-cover rounded-lg shadow-lg"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // Responsive image sizing
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
            <div className="absolute bottom-12 left-8 text-white">
              <h2 className="text-2xl md:text-4xl font-bold">{vendor.store_name}</h2>
              <p className="text-sm md:text-base text-gray-300">{vendor.description}</p>
              <Link
                href={`/customer/restaurant/${vendor.id}`}
                className="mt-4 inline-block bg-red-900 text-white px-6 py-2 rounded-md hover:bg-red-500 transition-all"
              >
                View Menu
              </Link>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}

export default HeroCarousel