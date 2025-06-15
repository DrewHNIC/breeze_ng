// components/customer/CategoriesSection.tsx
import { useRouter } from "next/router";
import Image from "next/image";

interface Category {
  name: string;
  image_url: string;
  description?: string;
}

interface CategoriesSectionProps {
  categories: Category[];
}

const CategoriesSection = ({ categories }: CategoriesSectionProps) => {
  const router = useRouter();

  const handleCategoryClick = (categoryName: string) => {
    const formattedCategory = categoryName.toLowerCase().replace(/\s+/g, "-");
    router.push(`/customer/search?category=${encodeURIComponent(formattedCategory)}`);
  };

  if (categories.length === 0) return null;

  return (
    <section className="mb-16">
      <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center text-[#1d2c36]">
        Explore Categories
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 px-4">
        {categories.map((category, index) => (
          <button
            key={index}
            onClick={() => handleCategoryClick(category.name)}
            className="relative group rounded-2xl overflow-hidden bg-[#1d2c36]/80 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-[#b9c6c8]"
            aria-label={`View restaurants in ${category.name}`}
          >
            {/* Background image */}
            <div className="aspect-square relative">
              <Image
                src={category.image_url || "/placeholder.svg?height=400&width=400"}
                alt={category.name}
                fill
                className="object-cover brightness-90 group-hover:brightness-75 transition duration-300"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                loading="lazy"
              />
            </div>

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent group-hover:from-black/90 transition duration-300 z-10"></div>

            {/* Text content */}
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-2">
              <span className="text-white text-lg font-semibold drop-shadow-md group-hover:scale-110 transition-transform duration-300">
                {category.name}
              </span>
              {category.description && (
                <span className="text-xs mt-1 text-white text-opacity-80 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {category.description}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

export default CategoriesSection;
