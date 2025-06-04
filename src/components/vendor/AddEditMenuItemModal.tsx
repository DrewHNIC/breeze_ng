import React, { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { supabase } from "../../utils/supabase";

interface AddEditMenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  categories: any[];
  menuItem?: any;
}

const AddEditMenuItemModal: React.FC<AddEditMenuItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  menuItem,
}) => {
  const [name, setName] = useState(menuItem?.name || "");
  const [description, setDescription] = useState(menuItem?.description || "");
  const [price, setPrice] = useState(menuItem?.price || "");
  const [categoryId, setCategoryId] = useState(menuItem?.category_id || "");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (menuItem?.image_url) {
      setImagePreview(menuItem.image_url);
    } else {
      setImagePreview(null);
    }
  }, [menuItem]);

  // Handle closing the modal with the Escape key
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    },
    [isOpen, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    } else {
      document.removeEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("User not authenticated");
      return;
    }
  
    // Fetch vendor ID from "vendors" table
    const { data: vendorProfile, error } = await supabase
      .from("vendors")
      .select("id")
      .eq("email", user.email)  // Ensure we fetch by `email`
      .single();
  
    if (error || !vendorProfile) {
      console.error("Vendor profile not found", error);
      return;
    }
  
    const vendor_id = vendorProfile.id; // Unique vendor ID
  
    let imageUrl = menuItem?.image_url;
    if (image) {
      imageUrl = await uploadImage(image);
    }
  
    const menuItemData = {
      name,
      description,
      price: parseFloat(price),
      category_id: categoryId,
      image_url: imageUrl,
      vendor_id,  // Ensure menu item is linked to vendor
    };
  
    let response;
    if (menuItem) {
      response = await supabase
        .from("menu_items")
        .update(menuItemData)
        .eq("id", menuItem.id)
        .eq("vendor_id", vendor_id);  // Ensure vendor-specific update
    } else {
      response = await supabase
        .from("menu_items")
        .insert(menuItemData);  // Ensure vendor-specific insert
    }
  
    if (response.error) {
      console.error("Database error:", response.error);
    } else {
      console.log("Menu item operation successful:", response.data);
      onSave();
      onClose();
    }
  };
  
  

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from("menu-item-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Error uploading image:", uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage.from("menu-item-images").getPublicUrl(filePath);

    return publicUrl;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#111] text-white rounded-lg p-6 w-[90%] max-w-lg shadow-lg transform transition-all duration-300 scale-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{menuItem ? "Edit Menu Item" : "Add Menu Item"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto pr-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-2">Item Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-800 text-white rounded-md py-2 px-3 focus:ring-2 focus:ring-gray-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-gray-800 text-white rounded-md py-2 px-3 focus:ring-2 focus:ring-gray-500"
                rows={3}
                required
              ></textarea>
            </div>
            <div>
              <label className="block text-sm mb-2">Price</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-gray-800 text-white rounded-md py-2 px-3 focus:ring-2 focus:ring-gray-500"
                step="0.01"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-gray-800 text-white rounded-md py-2 px-3 focus:ring-2 focus:ring-gray-500"
                required
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-2">Image</label>
              <input
                type="file"
                onChange={handleImageChange}
                className="w-full bg-gray-800 text-white rounded-md py-2 px-3 focus:ring-2 focus:ring-gray-500"
                accept="image/*"
              />
              {imagePreview && (
                <img src={imagePreview} alt="Preview" className="mt-2 w-full h-40 object-cover rounded-md" />
              )}
            </div>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-500 text-gray-300 rounded-md hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition"
              >
                {menuItem ? "Update" : "Add"} Menu Item
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddEditMenuItemModal;
