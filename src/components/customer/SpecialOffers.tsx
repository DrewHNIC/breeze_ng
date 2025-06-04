import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from 'lucide-react'

interface SpecialOffer {
  id: string
  title: string
  description: string
  imageUrl: string
  link: string
}

const SpecialOffers = () => {
  const [offers, setOffers] = useState<SpecialOffer[]>([
    {
      id: "1",
      title: "Free Delivery on Your First Order",
      description: "Use code WELCOME at checkout",
      imageUrl: "/placeholder.svg?height=300&width=600",
      link: "/customer/search",
    },
    {
      id: "2",
      title: "20% Off Selected Restaurants",
      description: "Limited time offer",
      imageUrl: "/placeholder.svg?height=300&width=600",
      link: "/customer/search?discount=true",
    },
    {
      id: "3",
      title: "Refer a Friend, Get $10",
      description: "Share the love, earn rewards",
      imageUrl: "/placeholder.svg?height=300&width=600",
      link: "/customer/referrals",
    },
  ])

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {offers.map((offer) => (
        <Link key={offer.id} href={offer.link} className="group">
          <div className="relative rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition h-full">
            <div className="relative h-40 w-full">
              <Image
                src={offer.imageUrl || "/placeholder.svg"}
                alt={offer.title}
                fill
                className="object-cover group-hover:scale-105 transition duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg mb-1 group-hover:text-black transition">{offer.title}</h3>
              <p className="text-gray-600 text-sm mb-3">{offer.description}</p>
              <div className="flex items-center text-black font-medium group-hover:translate-x-1 transition-transform">
                <span>Learn more</span>
                <ArrowRight className="ml-1 h-4 w-4" />
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

export default SpecialOffers