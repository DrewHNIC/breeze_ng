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
        navigation={{
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        }}
        pagination={{ clickable: true }}
        loop
        className="w-full h-[300px] md:h-[400px] lg:h-[500px] rounded-xl overflow-hidden"
      >
        {vendors.map((vendor) => (
          <SwiperSlide key={vendor.id} className="relative">
            <Image
              src={vendor.banner_url || "/placeholder.svg"}
              alt={vendor.store_name}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
            <div className="absolute bottom-10 left-6 md:left-12 text-white z-10 max-w-md">
              <h2 className="text-2xl md:text-4xl font-bold leading-snug drop-shadow-lg">
                {vendor.store_name}
              </h2>
              <p className="text-sm md:text-base text-gray-200 mt-1 line-clamp-2">
                {vendor.description}
              </p>
              <Link
                href={`/customer/restaurant/${vendor.id}`}
                className="mt-4 inline-block bg-[#1d2c36] text-white px-5 py-2 rounded-full text-sm md:text-base font-medium hover:bg-[#334752] transition-colors"
              >
                View Menu
              </Link>
            </div>
          </SwiperSlide>
        ))}

        {/* Custom Navigation Arrows */}
        <div className="swiper-button-prev !text-white !w-10 !h-10 !left-2 md:!left-6 hover:scale-110 transition-transform" />
        <div className="swiper-button-next !text-white !w-10 !h-10 !right-2 md:!right-6 hover:scale-110 transition-transform" />
      </Swiper>
    </div>
  )
}

export default HeroCarousel
