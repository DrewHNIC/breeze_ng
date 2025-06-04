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
      <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">Explore Categories</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 px-4">
        {categories.map((category, index) => (
          <button
            key={index}
            onClick={() => handleCategoryClick(category.name)}
            className="relative group overflow-hidden rounded-lg shadow-lg transition-transform transform hover:scale-105"
            aria-label={`View restaurants in ${category.name}`} // Added ARIA label
          >
            {/* Category Image */}
            <div className="aspect-square relative">
              <Image
                src={category.image_url || "/placeholder.svg?height=400&width=400"}
                alt={category.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw" // Responsive image sizing
                loading="lazy" // Lazy load images
              />
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-70 transition-all duration-300"></div>

            {/* Category Name */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <span className="text-lg font-semibold group-hover:scale-110 transition-all">
                {category.name}
              </span>
              {category.description && (
                <span className="text-xs mt-1 px-2 text-center opacity-0 group-hover:opacity-100 transition-opacity">
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