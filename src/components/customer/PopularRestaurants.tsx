import { Swiper, SwiperSlide } from "swiper/react"
import { Autoplay } from "swiper/modules"
import "swiper/css"
import "swiper/css/autoplay"
import RestaurantCard from "./RestaurantCard"

interface Vendor {
  id: string
  store_name: string
  logo_url: string | null
  banner_url: string | null
  cuisine_type: string | null
  rating: number | null
  avg_delivery_time: string | null
  description: string | null
}

interface PopularRestaurantsProps {
  vendors: Vendor[]
}

const PopularRestaurants = ({ vendors }: PopularRestaurantsProps) => {
  if (vendors.length === 0) {
    return (
      <section className="mb-12 px-4">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center text-[#1d2c36]">
          Popular Restaurants
        </h2>
        <p className="text-gray-500 text-center">No popular restaurants available at the moment.</p>
      </section>
    )
  }

  return (
    <section className="mb-16 px-4">
      <div className="mb-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-[#1d2c36] relative inline-block">
          Popular Restaurants
          <span className="block h-1 w-12 bg-[#b9c6c8] rounded-full mt-2 mx-auto"></span>
        </h2>
        <p className="text-sm text-gray-500 mt-1">Tried, tested, and loved by customers like you.</p>
      </div>

      <Swiper
        modules={[Autoplay]}
        spaceBetween={20}
        slidesPerView={1.2}
        autoplay={{ delay: 4000, disableOnInteraction: false }}
        loop
        breakpoints={{
          640: { slidesPerView: 1.4 },
          768: { slidesPerView: 2.5 },
          1024: { slidesPerView: 3.5 },
          1280: { slidesPerView: 4.2 },
        }}
        className="pb-4"
      >
        {vendors.map((vendor) => (
          <SwiperSlide key={vendor.id} className="!h-auto">
            <div className="transition-transform hover:scale-[1.02]">
              <RestaurantCard vendor={vendor} />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  )
}

export default PopularRestaurants
