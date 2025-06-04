// components/vendor/VendorProfileManagement.tsx
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '@/utils/supabase';
import { Camera, Upload, X, Save, Clock, LogOut, Lock, Trash2, MapPin, CreditCard, AlertTriangle } from 'lucide-react';

interface DayHours {
  is_open: boolean;
  open_time: string;
  close_time: string;
}

interface OperatingHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

interface VendorProfile {
  id: string;
  store_name: string;
  business_description: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  cuisine_type: string;
  logo_url: string | null;
  banner_url: string | null;
  average_preparation_time: number;
  is_open: boolean;
  landmark_description: string;
  operating_hours: OperatingHours;
  bank_name: string;
  account_name: string;
  account_number: string;
  security_question: string;
  security_answer: string;
}

interface BankInfo {
  bank_name: string;
  account_name: string;
  account_number: string;
  security_question: string;
  security_answer: string;
}

const defaultOperatingHours: OperatingHours = {
  monday: { is_open: true, open_time: '09:00', close_time: '17:00' },
  tuesday: { is_open: true, open_time: '09:00', close_time: '17:00' },
  wednesday: { is_open: true, open_time: '09:00', close_time: '17:00' },
  thursday: { is_open: true, open_time: '09:00', close_time: '17:00' },
  friday: { is_open: true, open_time: '09:00', close_time: '17:00' },
  saturday: { is_open: true, open_time: '10:00', close_time: '15:00' },
  sunday: { is_open: false, open_time: '10:00', close_time: '15:00' },
};

// Updated cuisine types array for VendorProfileManagement.tsx
const cuisineTypes = [
  'African', 'Asian', 'Bakery', 'Breakfast', 
  'Chinese', 'Desserts', 'Drinks', 'Fast Food', 'Greek', 'Healthy', 
  'Indian', 'Italian', 'Japanese', 'Korean', 'Local Dishes', 'Mediterranean', 
  'Mexican', 'Middle Eastern', 'Pizza', 'Seafood', 'Thai', 'Vegetarian', 
  'Vietnamese'
];

const bankOptions = [
  'Access Bank', 'Citibank', 'Ecobank', 'Fidelity Bank', 'First Bank', 
  'First City Monument Bank (FCMB)', 'Guaranty Trust Bank (GTB)', 'Heritage Bank', 
  'Keystone Bank', 'Polaris Bank', 'Stanbic IBTC Bank', 'Standard Chartered Bank', 
  'Sterling Bank', 'Union Bank', 'United Bank for Africa (UBA)', 'Unity Bank', 
  'Wema Bank', 'Zenith Bank'
];

export default function VendorProfileManagement() {
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'hours' | 'delivery' | 'payment' | 'account'>('basic');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [showSecurityCheck, setShowSecurityCheck] = useState(false);
  const [bankInfo, setBankInfo] = useState<BankInfo>({
    bank_name: '',
    account_name: '',
    account_number: '',
    security_question: '',
    security_answer: ''
  });

  // Fetch vendor profile
  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Get vendor profile
        const { data: vendorProfile, error: profileError } = await supabase
          .from('vendor_profiles')
          .select('*')
          .eq('vendor_id', session.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching vendor profile:', profileError);
          return;
        }

        // Get vendor basic info
        const { data: vendor, error: vendorError } = await supabase
          .from('vendors')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (vendorError) {
          console.error('Error fetching vendor:', vendorError);
          return;
        }

        // Combine vendor and profile data
        const combinedProfile: VendorProfile = {
          id: session.user.id,
          store_name: vendor.store_name || '',
          business_description: vendorProfile?.business_description || '',
          contact_email: vendor.email || session.user.email || '',
          contact_phone: vendorProfile?.contact_phone || '',
          address: vendorProfile?.address || '',
          city: vendorProfile?.city || '',
          state: vendorProfile?.state || '',
          zip_code: vendorProfile?.zip_code || '',
          cuisine_type: vendorProfile?.cuisine_type || '',
          logo_url: vendorProfile?.logo_url || null,
          banner_url: vendorProfile?.banner_url || null,
          average_preparation_time: vendorProfile?.average_preparation_time || 30,
          is_open: vendorProfile?.is_open || false,
          landmark_description: vendorProfile?.landmark_description || '',
          operating_hours: vendorProfile?.operating_hours || defaultOperatingHours,
          bank_name: vendorProfile?.bank_name || '',
          account_name: vendorProfile?.account_name || '',
          account_number: vendorProfile?.account_number || '',
          security_question: vendorProfile?.security_question || '',
          security_answer: vendorProfile?.security_answer || ''
        };

        setProfile(combinedProfile);
        setBankInfo({
          bank_name: combinedProfile.bank_name,
          account_name: combinedProfile.account_name,
          account_number: combinedProfile.account_number,
          security_question: combinedProfile.security_question,
          security_answer: combinedProfile.security_answer
        });
        setLogoPreview(combinedProfile.logo_url);
        setBannerPreview(combinedProfile.banner_url);
      } catch (error) {
        console.error('Error in fetchProfile:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  // Handle logo file change
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  // Handle banner file change
  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (!profile) return;
    
    // Create a new profile object with the updated value
    setProfile(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        [name]: value
      };
    });
  };

  // Handle bank info changes
  const handleBankInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBankInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    
    if (!profile) return;
    
    if (name.includes('.')) {
      const [day, property] = name.split('.');
      
      setProfile(prev => {
        if (!prev || !prev.operating_hours) return prev;
        
        const updatedHours = { ...prev.operating_hours };
        
        if (updatedHours[day as keyof OperatingHours]) {
          updatedHours[day as keyof OperatingHours] = {
            ...updatedHours[day as keyof OperatingHours],
            [property]: checked
          };
        }
        
        return {
          ...prev,
          operating_hours: updatedHours
        };
      });
    } else {
      setProfile(prev => {
        if (!prev) return prev;
        return { ...prev, [name]: checked };
      });
    }
  };

  // Handle number input changes
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value);
    
    if (!isNaN(numValue) && profile) {
      setProfile(prev => {
        if (!prev) return prev;
        return { ...prev, [name]: numValue };
      });
    }
  };

  // Handle time input changes for operating hours
  const handleTimeChange = (day: keyof OperatingHours, field: 'open_time' | 'close_time', value: string) => {
    if (!profile) return;
    
    setProfile(prev => {
      if (!prev || !prev.operating_hours) return prev;
      
      const updatedHours = { ...prev.operating_hours };
      
      if (updatedHours[day]) {
        updatedHours[day] = {
          ...updatedHours[day],
          [field]: value
        };
      }
      
      return {
        ...prev,
        operating_hours: updatedHours
      };
    });
  };

  // Handle password change
  const handleChangePassword = async () => {
    setPasswordError('');
    
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    
    try {
      setSaving(true);
      
      // First verify the current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile?.contact_email || '',
        password: currentPassword,
      });
      
      if (signInError) {
        setPasswordError('Current password is incorrect');
        return;
      }
      
      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (updateError) {
        throw updateError;
      }
      
      setMessage({ text: 'Password updated successfully!', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error changing password:', error);
      setPasswordError(error.message);
    } finally {
      setSaving(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    try {
      setSaving(true);
      
      // Delete vendor profile
      await supabase
        .from('vendor_profiles')
        .delete()
        .eq('vendor_id', profile?.id);
      
      // Delete vendor
      await supabase
        .from('vendors')
        .delete()
        .eq('id', profile?.id);
      
      // Delete user account
      await supabase.auth.admin.deleteUser(profile?.id || '');
      
      // Sign out
      await supabase.auth.signOut();
      
      // Redirect to home
      window.location.href = '/';
    } catch (error) {
      console.error('Error deleting account:', error);
      setMessage({ text: 'Error deleting account. Please try again.', type: 'error' });
    } finally {
      setSaving(false);
      setShowDeleteConfirm(false);
    }
  };

  // Verify security question before saving bank info
  const handleVerifySecurity = () => {
    if (profile?.security_answer && securityAnswer.toLowerCase() === profile.security_answer.toLowerCase()) {
      saveBankInfo();
    } else {
      setMessage({ text: 'Security answer is incorrect', type: 'error' });
    }
  };

  // Save bank info
  const saveBankInfo = async () => {
    if (!profile) return;
    
    setSaving(true);
    setMessage({ text: '', type: '' });
    
    try {
      const { error } = await supabase
        .from('vendor_profiles')
        .update({
          bank_name: bankInfo.bank_name,
          account_name: bankInfo.account_name,
          account_number: bankInfo.account_number,
          security_question: bankInfo.security_question,
          security_answer: bankInfo.security_answer
        })
        .eq('vendor_id', profile.id);
        
      if (error) {
        throw new Error(`Error updating bank info: ${error.message}`);
      }
      
      setProfile(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          bank_name: bankInfo.bank_name,
          account_name: bankInfo.account_name,
          account_number: bankInfo.account_number,
          security_question: bankInfo.security_question,
          security_answer: bankInfo.security_answer
        };
      });
      
      setMessage({ text: 'Payment information updated successfully!', type: 'success' });
      setShowSecurityCheck(false);
      setSecurityAnswer('');
    } catch (error: any) {
      console.error('Error saving bank info:', error);
      setMessage({ text: error.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Save profile changes
  const handleSave = async () => {
    if (!profile) return;
    
    setSaving(true);
    setMessage({ text: '', type: '' });
    
    try {
      // Upload logo if changed
      let logoUrl = profile.logo_url;
      if (logoFile) {
        const logoFileName = `${profile.id}_logo_${Date.now()}`;
        const { data: logoData, error: logoError } = await supabase.storage
          .from('vendor-images')
          .upload(logoFileName, logoFile, {
            cacheControl: '3600',
            upsert: true
          });
          
        if (logoError) {
          throw new Error(`Error uploading logo: ${logoError.message}`);
        }
        
        // Get public URL
        const { data: logoPublicUrl } = supabase.storage
          .from('vendor-images')
          .getPublicUrl(logoFileName);
          
        logoUrl = logoPublicUrl.publicUrl;
      }
      
      // Upload banner if changed
      let bannerUrl = profile.banner_url;
      if (bannerFile) {
        const bannerFileName = `${profile.id}_banner_${Date.now()}`;
        const { data: bannerData, error: bannerError } = await supabase.storage
          .from('vendor-images')
          .upload(bannerFileName, bannerFile, {
            cacheControl: '3600',
            upsert: true
          });
          
        if (bannerError) {
          throw new Error(`Error uploading banner: ${bannerError.message}`);
        }
        
        // Get public URL
        const { data: bannerPublicUrl } = supabase.storage
          .from('vendor-images')
          .getPublicUrl(bannerFileName);
          
        bannerUrl = bannerPublicUrl.publicUrl;
      }
      
      // Update vendor basic info
      const { error: vendorError } = await supabase
        .from('vendors')
        .update({
          store_name: profile.store_name
        })
        .eq('id', profile.id);
        
      if (vendorError) {
        throw new Error(`Error updating vendor: ${vendorError.message}`);
      }
      
      // Check if vendor profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('vendor_profiles')
        .select('vendor_id')
        .eq('vendor_id', profile.id)
        .single();
      
      let profileError;
      
      if (!existingProfile) {
        // Insert new profile
        const { error } = await supabase
          .from('vendor_profiles')
          .insert({
            vendor_id: profile.id,
            business_description: profile.business_description,
            contact_phone: profile.contact_phone,
            address: profile.address,
            city: profile.city,
            state: profile.state,
            zip_code: profile.zip_code,
            cuisine_type: profile.cuisine_type,
            logo_url: logoUrl,
            banner_url: bannerUrl,
            average_preparation_time: profile.average_preparation_time,
            is_open: profile.is_open,
            landmark_description: profile.landmark_description,
            operating_hours: profile.operating_hours
          });
          
        profileError = error;
      } else {
        // Update existing profile
        const { error } = await supabase
          .from('vendor_profiles')
          .update({
            business_description: profile.business_description,
            contact_phone: profile.contact_phone,
            address: profile.address,
            city: profile.city,
            state: profile.state,
            zip_code: profile.zip_code,
            cuisine_type: profile.cuisine_type,
            logo_url: logoUrl,
            banner_url: bannerUrl,
            average_preparation_time: profile.average_preparation_time,
            is_open: profile.is_open,
            landmark_description: profile.landmark_description,
            operating_hours: profile.operating_hours
          })
          .eq('vendor_id', profile.id);
          
        profileError = error;
      }
        
      if (profileError) {
        throw new Error(`Error updating profile: ${profileError.message}`);
      }
      
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
      
      // Reset file states
      setLogoFile(null);
      setBannerFile(null);
    } catch (error: any) {
      console.error('Error saving profile:', error);
      setMessage({ text: error.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Handle bank info save button
  const handleSaveBankInfo = () => {
    // Validate inputs
    if (!bankInfo.bank_name || !bankInfo.account_name || !bankInfo.account_number) {
      setMessage({ text: 'Please fill in all bank information fields', type: 'error' });
      return;
    }
    
    if (!bankInfo.security_question || !bankInfo.security_answer) {
      setMessage({ text: 'Please set a security question and answer', type: 'error' });
      return;
    }
    
    // If updating existing bank info, verify security answer first
    if (profile?.security_answer && profile.bank_name) {
      setShowSecurityCheck(true);
    } else {
      // First time setting up bank info
      saveBankInfo();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black-900"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-black rounded-lg shadow-md p-6">
        <p className="text-red-900">Error loading profile. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-black rounded-lg shadow-md overflow-hidden">
        {/* Banner Image */}
        <div className="relative h-48 bg-black">
          {bannerPreview ? (
            <Image 
              src={bannerPreview || "/placeholder.svg"} 
              alt="Restaurant Banner" 
              fill
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-white">No banner image</p>
            </div>
          )}
          <label className="absolute bottom-4 right-4 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-white transition-colors">
            <Camera className="h-5 w-5" />
            <input 
              type="file" 
              className="hidden" 
              accept="image/*" 
              onChange={handleBannerChange} 
            />
          </label>
        </div>
        
        {/* Profile Header */}
        <div className="p-6 flex flex-col md:flex-row gap-6 items-start">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-black overflow-hidden border-4 border-white -mt-12 shadow-md">
              {logoPreview ? (
                <Image 
                  src={logoPreview || "/placeholder.svg"} 
                  alt="Restaurant Logo" 
                  width={96} 
                  height={96} 
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-white text-xs">No logo</p>
                </div>
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-primary text-white p-1 rounded-full cursor-pointer hover:bg-white transition-colors">
              <Camera className="h-4 w-4" />
              <input 
                type="file" 
                className="hidden" 
                accept="image/*" 
                onChange={handleLogoChange} 
              />
            </label>
          </div>
          
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{profile.store_name || 'Your Restaurant'}</h1>
            <p className="text-white">{profile.cuisine_type || 'Cuisine Type'}</p>
            <div className="flex items-center mt-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                profile.is_open ? 'bg-green-600 text-green-800' : 'bg-red-600 text-red-800'
              }`}>
                {profile.is_open ? 'Open' : 'Closed'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-black">
          <nav className="flex flex-wrap -mb-px">
            <button
              onClick={() => setActiveTab('basic')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'basic'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Basic Information
            </button>
            <button
              onClick={() => setActiveTab('hours')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'hours'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-black'
              }`}
            >
              Operating Hours
            </button>
            <button
              onClick={() => setActiveTab('delivery')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'delivery'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Store Location
            </button>
            <button
              onClick={() => setActiveTab('payment')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'payment'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Payment Information
            </button>
            <button
              onClick={() => setActiveTab('account')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'account'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Account Settings
            </button>
          </nav>
        </div>
        
        {/* Tab Content */}
        <div className="p-6">
          {/* Basic Information Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Business Name
                  </label>
                  <input
                    type="text"
                    name="store_name"
                    value={profile.store_name || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-700 rounded-md bg-black text-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Cuisine Type
                  </label>
                  <select
                    name="cuisine_type"
                    value={profile.cuisine_type || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-700 rounded-md bg-black text-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  >
                    <option value="">Select Cuisine Type</option>
                    {cuisineTypes.map(cuisine => (
                      <option key={cuisine} value={cuisine}>{cuisine}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-white mb-1">
                    Business Description
                  </label>
                  <textarea
                    name="business_description"
                    value={profile.business_description || ''}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-700 rounded-md bg-black text-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    name="contact_email"
                    value={profile.contact_email || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-700 rounded-md bg-black text-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    name="contact_phone"
                    value={profile.contact_phone || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-700 rounded-md bg-black text-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Average Preparation Time (minutes)
                  </label>
                  <input
                    type="number"
                    name="average_preparation_time"
                    value={profile.average_preparation_time || ''}
                    onChange={handleNumberChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-700 rounded-md bg-black text-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_open"
                    name="is_open"
                    checked={profile.is_open || false}
                    onChange={handleCheckboxChange}
                    className="w-full px-3 py-2 border border-gray-700 rounded-md bg-black text-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  />
                  <label htmlFor="is_open" className="ml-2 block text-sm text-white">
                    Restaurant is currently open
                  </label>
                </div>
              </div>
            </div>
          )}
          
          {/* Operating Hours Tab */}
          {activeTab === 'hours' && (
            <div className="space-y-6">
              <p className="text-sm text-white">Set your restaurant's operating hours for each day of the week.</p>
              
              <div className="space-y-4">
                {Object.entries(profile.operating_hours).map(([day, hours]) => (
                  <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border rounded-md">
                    <div className="w-32">
                      <span className="font-medium capitalize">{day}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`${day}.is_open`}
                        name={`${day}.is_open`}
                        checked={hours.is_open}
                        onChange={handleCheckboxChange}
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                      <label htmlFor={`${day}.is_open`} className="ml-2 block text-sm text-white">
                        Open
                      </label>
                    </div>
                    
                    <div className="flex flex-1 items-center gap-2">
                      <Clock className="h-4 w-4 text-black" />
                      <input
                        type="time"
                        value={hours.open_time}
                        onChange={(e) => handleTimeChange(day as keyof OperatingHours, 'open_time', e.target.value)}
                        disabled={!hours.is_open}
                        className="px-2 py-1 border border-gray-700 rounded-md bg-black text-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 disabled:bg-gray-800 disabled:text-gray-500"
                      />
                      <span className="text-white">to</span>
                      <input
                        type="time"
                        value={hours.close_time}
                        onChange={(e) => handleTimeChange(day as keyof OperatingHours, 'close_time', e.target.value)}
                        disabled={!hours.is_open}
                        className="px-2 py-1 border border-gray-700 rounded-md bg-black text-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 disabled:bg-gray-800 disabled:text-gray-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Store Location Tab (formerly Delivery Settings) */}
          {activeTab === 'delivery' && (
            <div className="space-y-6">
              <p className="text-sm text-gray-500">
                Provide your store location details to help riders locate your store for pickups.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Store Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={profile.address || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md bg-black text-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={profile.city || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md bg-black text-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={profile.state || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md bg-black text-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    name="zip_code"
                    value={profile.zip_code || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md bg-black text-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Landmark Description
                  </label>
                  <textarea
                    name="landmark_description"
                    value={profile.landmark_description || ''}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Describe any landmarks or directions that can help riders locate your store (e.g., 'Next to City Bank, blue building with red sign')"
                    className="w-full px-3 py-2 border rounded-md bg-black text-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    This information helps riders easily locate your store for pickups.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Payment Information Tab */}
          {activeTab === 'payment' && (
            <div className="space-y-6">
              <p className="text-sm text-gray-500">
                Set up your bank account information to receive payments from orders.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Bank Name
                  </label>
                  <select
                    name="bank_name"
                    value={bankInfo.bank_name}
                    onChange={handleBankInfoChange}
                    className="w-full px-3 py-2 border rounded-md bg-black text-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  >
                    <option value="">Select Bank</option>
                    {bankOptions.map(bank => (
                      <option key={bank} value={bank}>{bank}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Account Name
                  </label>
                  <input
                    type="text"
                    name="account_name"
                    value={bankInfo.account_name}
                    onChange={handleBankInfoChange}
                    className="w-full px-3 py-2 border rounded-md bg-black text-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    name="account_number"
                    value={bankInfo.account_number}
                    onChange={handleBankInfoChange}
                    className="w-full px-3 py-2 border rounded-md bg-black text-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <div className="bg-yellow-50 p-4 rounded-md mb-4">
                    <p className="text-sm text-yellow-700">
                      <strong>Security Note:</strong> To protect your payment information, you'll need to set up a security question and answer. 
                      This will be required whenever you want to update your payment details in the future.
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Security Question
                  </label>
                  <input
                    type="text"
                    name="security_question"
                    value={bankInfo.security_question}
                    onChange={handleBankInfoChange}
                    placeholder="e.g., What was your first pet's name?"
                    className="w-full px-3 py-2 border rounded-md bg-black text-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Security Answer
                  </label>
                  <input
                    type="text"
                    name="security_answer"
                    value={bankInfo.security_answer}
                    onChange={handleBankInfoChange}
                    className="w-full px-3 py-2 border rounded-md bg-black text-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Remember this answer as you'll need it to make changes to your payment information.
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={handleSaveBankInfo}
                  disabled={saving}
                  className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      <span>Save Payment Information</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
          
          {/* Account Settings Tab */}
          {activeTab === 'account' && (
            <div className="space-y-8">
              {/* Change Password Section */}
              <div className="bg-black p-6 rounded-lg">
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <Lock className="h-5 w-5 text-white" />
                  Change Password
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-whitemb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md bg-black text-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md bg-black text-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md bg-black text-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    />
                  </div>
                  
                  {passwordError && (
                    <p className="text-red-500 text-sm">{passwordError}</p>
                  )}
                  
                  <div className="flex justify-end">
                    <button
                      onClick={handleChangePassword}
                      disabled={saving || !currentPassword || !newPassword || !confirmPassword}
                      className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                          <span>Updating...</span>
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          <span>Update Password</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Logout Section */}
              <div className="bg-black p-6 rounded-lg">
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <LogOut className="h-5 w-5 text-white" />
                  Logout
                </h3>
                
                <p className="text-white mb-4">
                  Sign out of your account on this device.
                </p>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
              
              {/* Delete Account Section */}
              <div className="bg-red-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-red-700">
                  <Trash2 className="h-5 w-5" />
                  Delete Account
                </h3>
                
                <p className="text-red-600 mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Account</span>
                </button>
              </div>
            </div>
          )}
          
          {/* Message Display */}
          {message.text && (
            <div className={`mt-4 p-3 rounded-md ${
              message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {message.text}
            </div>
          )}
          
          {/* Save Button (only show for tabs that need it) */}
          {(activeTab === 'basic' || activeTab === 'hours' || activeTab === 'delivery') && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Security Check Modal */}
      {showSecurityCheck && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Security Verification</h3>
            <p className="text-gray-600 mb-4">
              To update your payment information, please answer your security question:
            </p>
            <p className="font-medium mb-2">{profile.security_question}</p>
            
            <input
              type="text"
              value={securityAnswer}
              onChange={(e) => setSecurityAnswer(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-primary mb-4"
              placeholder="Your answer"
            />
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSecurityCheck(false)}
                className="px-4 py-2 border rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifySecurity}
                disabled={!securityAnswer}
                className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark disabled:opacity-50"
              >
                Verify
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-lg font-medium">Delete Account</h3>
            </div>
            
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
            </p>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border rounded-md bg-black text-white hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
              >
                Yes, Delete My Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}