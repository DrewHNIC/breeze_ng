// components/customer/PopularRestaurants.tsx
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
      <section className="mb-12">
        <h2 className="text-2xl md:text-3xl font-bold mb-6">Popular Restaurants</h2>
        <p className="text-gray-500">No popular restaurants available at the moment.</p>
      </section>
    );
  }

  return (
    <section className="mb-12">
      <h2 className="text-2xl md:text-3xl font-bold mb-6">Popular Restaurants</h2>
      <Swiper
        modules={[Autoplay]}
        spaceBetween={10}
        slidesPerView={Math.min(vendors.length, 3)} // Dynamically set slides per view
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        loop
        breakpoints={{
          640: { slidesPerView: Math.min(vendors.length, 2) },
          768: { slidesPerView: Math.min(vendors.length, 3) },
          1024: { slidesPerView: Math.min(vendors.length, 4) },
        }}
      >
        {vendors.map((vendor) => (
          <SwiperSlide key={vendor.id}>
            <RestaurantCard vendor={vendor} />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

export default PopularRestaurants