import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import Image from 'next/image';

interface MenuItemListProps {
  menuItems: any[];
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
}

const MenuItemList: React.FC<MenuItemListProps> = ({ menuItems, onEdit, onDelete }) => {
  return (
    <div className="bg-black-900 rounded-md p-4">
      <h2 className="text-lg font-semibold text-secondary mb-4">Menu Items</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {menuItems.map((item) => (
          <div key={item.id} className="bg-black-800 rounded-md p-4 flex flex-col">
            <div className="relative w-full h-40 mb-4">
              <Image
                src={item.image_url || '/placeholder.svg'}
                alt={item.name}
                fill
                className="rounded-md object-cover"
              />
            </div>
            <h3 className="text-white font-semibold mb-2">{item.name}</h3>
            <p className="text-white text-sm mb-2">{item.description}</p>
            <p className="text-white font-bold mb-4">${item.price.toFixed(2)}</p>
            <div className="flex justify-end mt-auto">
              <button 
                className="text-secondary hover:text-accent mr-2"
                onClick={() => onEdit(item)}
              >
                <Edit size={18} />
              </button>
              <button 
                className="text-secondary hover:text-accent"
                onClick={() => onDelete(item.id)}
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuItemList;