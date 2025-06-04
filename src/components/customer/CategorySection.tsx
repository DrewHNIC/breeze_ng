import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { supabase } from "@/utils/supabase";

interface Category {
  id: string
  name: string
  image_url: string
}

const CategorySection = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchCategories() {
      try {
        setIsLoading(true)
        
        // Fetch categories from the database
        const { data, error } = await supabase
          .from("food_categories")
          .select("id, name, image_url")
          .order("name")
        
        if (error) {
          console.error("Error fetching categories:", error)
          setIsLoading(false)
          return
        }
        
        if (data && data.length > 0) {
          setCategories(data)
        } else {
          // If no categories found, use placeholder data
          setCategories([
            { id: "1", name: "Fast Food", image_url: "/placeholder.svg?height=200&width=200" },
            { id: "2", name: "Healthy", image_url: "/placeholder.svg?height=200&width=200" },
            { id: "3", name: "Pizza", image_url: "/placeholder.svg?height=200&width=200" },
            { id: "4", name: "Asian", image_url: "/placeholder.svg?height=200&width=200" },
            { id: "5", name: "African", image_url: "/placeholder.svg?height=200&width=200" },
            { id: "6", name: "Desserts", image_url: "/placeholder.svg?height=200&width=200" },
            { id: "7", name: "Breakfast", image_url: "/placeholder.svg?height=200&width=200" },
            { id: "8", name: "Drinks", image_url: "/placeholder.svg?height=200&width=200" },
          ])
        }
        
        setIsLoading(false)
      } catch (error) {
        console.error("Error in fetchCategories:", error)
        setIsLoading(false)
      }
    }

    fetchCategories()
  }, [])

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-200 rounded-full h-24 w-24 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mx-auto w-16"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/customer/search?category=${category.id}`}
          className="flex flex-col items-center group"
        >
          <div className="relative h-24 w-24 rounded-full overflow-hidden mb-2 group-hover:ring-2 ring-black transition">
            <Image
              src={category.image_url || "/placeholder.svg"}
              alt={category.name}
              fill
              className="object-cover"
            />
          </div>
          <span className="text-sm font-medium text-center group-hover:text-black transition">
            {category.name}
          </span>
        </Link>
      ))}
    </div>
  )
}

export default CategorySection