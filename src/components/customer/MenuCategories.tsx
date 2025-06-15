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
    if (activeBtnRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const activeBtn = activeBtnRef.current

      const containerLeft = container.scrollLeft
      const containerRight = containerLeft + container.clientWidth

      const btnLeft = activeBtn.offsetLeft
      const btnRight = btnLeft + activeBtn.clientWidth

      if (btnLeft < containerLeft) {
        container.scrollTo({ left: btnLeft - 16, behavior: "smooth" })
      } else if (btnRight > containerRight) {
        container.scrollTo({ left: btnRight - container.clientWidth + 16, behavior: "smooth" })
      }
    }
  }, [activeCategory])

  if (categories.length === 0) return null

  return (
    <div
      ref={scrollContainerRef}
      className="flex overflow-x-auto no-scrollbar py-3 px-4 sticky top-16 bg-white z-30 border-b border-[#e5e7eb]"
      aria-label="Menu categories"
    >
      <div className="flex space-x-2 min-w-max">
        {categories.map((category) => {
          const isActive = category.id === activeCategory
          return (
            <button
              key={category.id}
              ref={isActive ? activeBtnRef : null}
              onClick={() => onCategoryChange(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
                isActive
                  ? "bg-[#1d2c36] text-white border-[#1d2c36]"
                  : "bg-[#f3f4f6] text-[#1d2c36] hover:bg-[#e5e7eb] border-[#d1d5db]"
              }`}
              aria-current={isActive ? "true" : "false"}
            >
              {category.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default MenuCategories
