import React, { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { supabase } from '../../utils/supabase';
import CategoryList from './CategoryList';
import MenuItemList from './MenuItemList';
import AddEditCategoryModal from './AddEditCategoryModal';
import AddEditMenuItemModal from './AddEditMenuItemModal';

const MenuManagement: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [isAddMenuItemModalOpen, setIsAddMenuItemModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingMenuItem, setEditingMenuItem] = useState<any>(null);

  useEffect(() => {
    fetchCategories();
    fetchMenuItems();
  }, []);

  const fetchCategories = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
  
    const { data: vendorProfile, error } = await supabase
      .from("vendors")
      .select("id")
      .eq("email", user.email)
      .single();
  
    if (error || !vendorProfile) {
      console.error("Vendor profile not found", error);
      return;
    }
  
    const vendor_id = vendorProfile.id;
  
    const { data, error: fetchError } = await supabase
      .from("categories")
      .select("*")
      .eq("vendor_id", vendor_id);  // Fetch only the vendor's categories
  
    if (fetchError) {
      console.error("Error fetching categories:", fetchError);
    } else {
      setCategories(data);
    }
  };
  
  

  const fetchMenuItems = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
  
    const { data: vendorProfile, error } = await supabase
      .from("vendors")
      .select("id")
      .eq("email", user.email)
      .single();
  
    if (error || !vendorProfile) {
      console.error("Vendor profile not found", error);
      return;
    }
  
    const vendor_id = vendorProfile.id;
  
    const { data, error: fetchError } = await supabase
      .from("menu_items")
      .select("*")
      .eq("vendor_id", vendor_id);  // Fetch only the vendor's menu items
  
    if (fetchError) {
      console.error("Error fetching menu items:", fetchError);
    } else {
      setMenuItems(data);
    }
  };
  
  

  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    setIsAddCategoryModalOpen(true);
  };

  const handleDeleteCategory = async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) console.error('Error deleting category:', error);
    else {
      fetchCategories();
      fetchMenuItems();
    }
  };

  const handleEditMenuItem = (item: any) => {
    setEditingMenuItem(item);
    setIsAddMenuItemModalOpen(true);
  };

  const handleDeleteMenuItem = async (id: string) => {
    const { error } = await supabase.from('menu_items').delete().eq('id', id);
    if (error) console.error('Error deleting menu item:', error);
    else fetchMenuItems();
  };

  const filteredMenuItems = menuItems.filter(
    item =>
      (selectedCategory ? item.category_id === selectedCategory : true) &&
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-secondary">Menu Management</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => {
              setEditingCategory(null);
              setIsAddCategoryModalOpen(true);
            }}
            className="bg-accent text-primary px-4 py-2 rounded-md hover:bg-red-900 transition-colors"
          >
            <Plus className="inline-block mr-2" size={18} />
            Add Category
          </button>
          <button
            onClick={() => {
              setEditingMenuItem(null);
              setIsAddMenuItemModalOpen(true);
            }}
            className="bg-accent text-primary px-4 py-2 rounded-md hover:bg-red-900 transition-colors"
          >
            <Plus className="inline-block mr-2" size={18} />
            Add Menu Item
          </button>
        </div>
      </div>
      <div className="flex flex-1 space-x-6">
        <CategoryList
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onEditCategory={handleEditCategory}
          onDeleteCategory={handleDeleteCategory}
        />
        <div className="flex-1">
          <div className="mb-4 relative">
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white text-black rounded-md py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black" size={18} />
          </div>
          <MenuItemList 
            menuItems={filteredMenuItems} 
            onEdit={handleEditMenuItem}
            onDelete={handleDeleteMenuItem}
          />
        </div>
      </div>
      <AddEditCategoryModal
        isOpen={isAddCategoryModalOpen}
        onClose={() => {
          setIsAddCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        onSave={fetchCategories}
        category={editingCategory}
      />
      <AddEditMenuItemModal
        isOpen={isAddMenuItemModalOpen}
        onClose={() => {
          setIsAddMenuItemModalOpen(false);
          setEditingMenuItem(null);
        }}
        onSave={fetchMenuItems}
        categories={categories}
        menuItem={editingMenuItem}
      />
    </div>
  );
};

export default MenuManagement;