import React from 'react';
import { Edit, Trash2 } from 'lucide-react';

interface CategoryListProps {
  categories: any[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  onEditCategory: (category: any) => void;
  onDeleteCategory: (id: string) => void;
}

const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  onEditCategory,
  onDeleteCategory
}) => {
  return (
    <div className="bg-black-900 rounded-md p-4 h-full flex flex-col">
      <h2 className="text-lg font-semibold text-secondary mb-4">Categories</h2>
      <ul className="space-y-2 flex-grow overflow-y-auto">
        <li>
          <button
            onClick={() => onSelectCategory(null)}
            className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
              selectedCategory === null ? 'bg-accent text-primary' : 'text-secondary hover:bg-red-900'
            }`}
            aria-current={selectedCategory === null ? 'true' : undefined}
          >
            All Items
          </button>
        </li>
        {categories.map((category) => (
          <li key={category.id} className="flex items-center">
            <button
              onClick={() => onSelectCategory(category.id)}
              className={`flex-grow text-left px-3 py-2 rounded-md transition-colors ${
                selectedCategory === category.id ? 'bg-accent text-primary' : 'text-secondary hover:bg-red-900'
              }`}
              aria-current={selectedCategory === category.id ? 'true' : undefined}
            >
              {category.name}
            </button>
            <button
              onClick={() => onEditCategory(category)}
              className="text-secondary hover:text-accent ml-2 p-1 rounded focus:outline-none focus:ring-2 focus:ring-accent"
              aria-label={`Edit category ${category.name}`}
            >
              <Edit size={18} />
            </button>
            <button
              onClick={() => onDeleteCategory(category.id)}
              className="text-secondary hover:text-accent ml-2 p-1 rounded focus:outline-none focus:ring-2 focus:ring-accent"
              aria-label={`Delete category ${category.name}`}
            >
              <Trash2 size={18} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CategoryList;
