import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../utils/supabase';

interface AddEditCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  category?: any;
}

const AddEditCategoryModal: React.FC<AddEditCategoryModalProps> = ({ isOpen, onClose, onSave, category }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (category) {
      setName(category.name);
    } else {
      setName('');
    }
  }, [category]);

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
      .eq("email", user.email)  // Ensure we fetch by email
      .single();
  
    if (error || !vendorProfile) {
      console.error("Vendor profile not found", error);
      return;
    }
  
    const vendor_id = vendorProfile.id; // This is the unique vendor ID
  
    let response;
    if (category) {
      response = await supabase
        .from("categories")
        .update({ name })
        .eq("id", category.id)
        .eq("vendor_id", vendor_id);  // Ensure vendor-specific update
    } else {
      response = await supabase
        .from("categories")
        .insert({ name, vendor_id });  // Ensure vendor-specific insert
    }
  
    if (response.error) {
      console.error("Database error:", response.error);
    } else {
      console.log("Category operation successful:", response.data);
      onSave();
      onClose();
    }
  };
  
  
  
  

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-black-900 rounded-md p-6 w-96">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-secondary">
            {category ? 'Edit Category' : 'Add Category'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-secondary">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-secondary mb-2">
              Category Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-800 text-secondary rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-accent"
              required
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-accent text-primary px-4 py-2 rounded-md hover:bg-accent-dark transition-colors"
            >
              {category ? 'Update' : 'Add'} Category
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditCategoryModal;