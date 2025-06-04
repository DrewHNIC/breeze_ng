// components/customer/MenuCategories.tsx
import { useRef, useEffect } from "react"

interface MenuCategoriesProps {
  categories: {
    id: string
    name: string
  }[]
  activeCategory: string
  onCategoryChange: (categoryId: string) => void
}

const MenuCategories = ({ categories, activeCategory, onCategoryChange }: MenuCategoriesProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const activeBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    // Scroll active button into view when activeCategory changes
    if (activeBtnRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const activeBtn = activeBtnRef.current
      
      const containerLeft = container.scrollLeft
      const containerRight = containerLeft + container.clientWidth
      
      const btnLeft = activeBtn.offsetLeft
      const btnRight = btnLeft + activeBtn.clientWidth
      
      if (btnLeft < containerLeft) {
        container.scrollTo({ left: btnLeft - 16, behavior: 'smooth' })
      } else if (btnRight > containerRight) {
        container.scrollTo({ left: btnRight - container.clientWidth + 16, behavior: 'smooth' })
      }
    }
  }, [activeCategory])

  if (categories.length === 0) {
    return null
  }

  return (
    <div 
      ref={scrollContainerRef}
      className="flex overflow-x-auto py-2 px-1 sticky top-16 bg-white z-20 border-b border-gray-200 no-scrollbar"
      aria-label="Menu categories" // Added ARIA label
    >
      <div className="flex space-x-2 min-w-max px-2">
        {categories.map((category) => (
          <button
            key={category.id}
            ref={category.id === activeCategory ? activeBtnRef : null}
            onClick={() => onCategoryChange(category.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              category.id === activeCategory
                ? "bg-accent text-primary"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            aria-current={category.id === activeCategory ? "true" : "false"} // Added ARIA attribute
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  )
}

export default MenuCategories