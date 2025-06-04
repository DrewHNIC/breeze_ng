// pages/rider/profile.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { supabase } from "@/utils/supabase"
import { User, Mail, Phone, Truck, Star, Package, DollarSign, Camera, Loader2, AlertCircle, Save, Calendar } from 'lucide-react'
import RiderLayout from "@/components/RiderLayout"

// Create a simple toast implementation since we don't have the hook
const toast = (props: { title: string; description: string; variant?: string }) => {
  alert(`${props.title}: ${props.description}`)
}

interface RiderProfile {
  id: string
  name: string
  email: string
  phone_number: string
  avatar_url: string | null
  vehicle_type: string | null
  vehicle_details: {
    plate_number?: string
    model?: string
    color?: string
  } | null
  is_active: boolean
  is_available: boolean
  rating: number | null
  total_deliveries: number
  total_earnings: number
  created_at: string
}

const vehicleTypes = [
  { value: "motorcycle", label: "Motorcycle" },
  { value: "bicycle", label: "Bicycle" },
  { value: "car", label: "Car" },
  { value: "scooter", label: "Scooter" },
  { value: "walking", label: "Walking" }
]

const RiderProfilePage = () => {
  const router = useRouter()
  const [profile, setProfile] = useState<RiderProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [name, setName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [vehicleType, setVehicleType] = useState("")
  const [plateNumber, setPlateNumber] = useState("")
  const [vehicleModel, setVehicleModel] = useState("")
  const [vehicleColor, setVehicleColor] = useState("")
  const [isAvailable, setIsAvailable] = useState(false)
  
  // Avatar preview
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      
      if (!session) {
        router.push("/login")
        return
      }

      // Check if user is a rider
      const { data, error } = await supabase
        .from("riders")
        .select("*")
        .eq("id", session.user.id)
        .single()
      
      if (error || !data) {
        router.push("/login")
        return
      }

      setProfile(data)
      
      // Initialize form state
      setName(data.name || "")
      setPhoneNumber(data.phone_number || "")
      setVehicleType(data.vehicle_type || "")
      setPlateNumber(data.vehicle_details?.plate_number || "")
      setVehicleModel(data.vehicle_details?.model || "")
      setVehicleColor(data.vehicle_details?.color || "")
      setIsAvailable(data.is_available || false)
      setAvatarUrl(data.avatar_url)
      
      setIsLoading(false)
    } catch (error) {
      console.error("Error in checkAuth:", error)
      setError("Authentication failed. Please try logging in again.")
      setIsLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!profile) return
    
    try {
      setIsSaving(true)
      
      const { error } = await supabase
        .from("riders")
        .update({
          name,
          phone_number: phoneNumber,
          vehicle_type: vehicleType,
          vehicle_details: {
            plate_number: plateNumber,
            model: vehicleModel,
            color: vehicleColor
          },
          is_available: isAvailable,
          updated_at: new Date().toISOString()
        })
        .eq("id", profile.id)
      
      if (error) {
        console.error("Error updating profile:", error)
        toast({
          title: "Failed to update profile",
          description: error.message,
          variant: "destructive",
        })
        return
      }
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      })
      
      // Refresh profile data
      checkAuth()
    } catch (error) {
      console.error("Error in handleSaveProfile:", error)
      toast({
        title: "An error occurred",
        description: "Failed to update your profile.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!profile || !event.target.files || event.target.files.length === 0) return
    
    try {
      setIsUploading(true)
      
      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const filePath = `avatars/${profile.id}-${Math.random().toString(36).substring(2)}.${fileExt}`
      
      // Upload the file
      const { error: uploadError } = await supabase.storage
        .from('riders')
        .upload(filePath, file)
      
      if (uploadError) {
        throw uploadError
      }
      
      // Get the public URL
      const { data } = supabase.storage
        .from('riders')
        .getPublicUrl(filePath)
      
      // Update the profile with the new avatar URL
      const { error: updateError } = await supabase
        .from("riders")
        .update({
          avatar_url: data.publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq("id", profile.id)
      
      if (updateError) {
        throw updateError
      }
      
      // Update local state
      setAvatarUrl(data.publicUrl)
      
      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated.",
      })
    } catch (error) {
      console.error("Error uploading avatar:", error)
      toast({
        title: "Upload failed",
        description: "Failed to upload your profile picture.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
      })
    } catch (e) {
      return dateString
    }
  }

  if (isLoading) {
    return (
      <RiderLayout title="Profile">
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-red-500" />
        </div>
      </RiderLayout>
    )
  }

  if (error) {
    return (
      <RiderLayout title="Profile">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-red-700 mb-2">Error Loading Profile</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={checkAuth} 
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Try Again
            </button>
          </div>
        </div>
      </RiderLayout>
    )
  }

  if (!profile) return null

  return (
    <RiderLayout title="Profile">
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Rider Profile</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Profile Summary */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6 flex flex-col items-center">
                <div className="relative mb-4">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                    {avatarUrl ? (
                      <img 
                        src={avatarUrl || "/placeholder.svg"} 
                        alt={profile.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-12 w-12 text-gray-400" />
                    )}
                  </div>
                  <label 
                    htmlFor="avatar-upload" 
                    className="absolute bottom-0 right-0 bg-red-600 text-white p-1 rounded-full cursor-pointer hover:bg-red-700"
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </label>
                  <input 
                    id="avatar-upload" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleAvatarUpload}
                    disabled={isUploading}
                  />
                </div>
                
                <h2 className="text-xl font-bold">{profile.name}</h2>
                <p className="text-gray-500 mb-4">{profile.email}</p>
                
                <div className="w-full space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Star className="h-5 w-5 text-yellow-500 mr-2" />
                      <span>Rating</span>
                    </div>
                    <span className="font-medium">{profile.rating ? profile.rating.toFixed(1) : 'N/A'}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Package className="h-5 w-5 text-blue-500 mr-2" />
                      <span>Total Deliveries</span>
                    </div>
                    <span className="font-medium">{profile.total_deliveries}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-green-500 mr-2" />
                      <span>Total Earnings</span>
                    </div>
                    <span className="font-medium">₦{profile.total_earnings.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-purple-500 mr-2" />
                      <span>Joined</span>
                    </div>
                    <span className="font-medium">{formatDate(profile.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Edit Profile */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-medium mb-4">Edit Profile</h3>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Your full name"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input
                        id="email"
                        type="email"
                        value={profile.email}
                        disabled
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                        placeholder="Your email address"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input
                        id="phone"
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Your phone number"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="vehicle-type" className="block text-sm font-medium text-gray-700 mb-1">
                      Vehicle Type
                    </label>
                    <div className="relative">
                      <Truck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <select
                        id="vehicle-type"
                        value={vehicleType}
                        onChange={(e) => setVehicleType(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      >
                        <option value="">Select vehicle type</option>
                        {vehicleTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {vehicleType && vehicleType !== "walking" && vehicleType !== "bicycle" && (
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="plate-number" className="block text-sm font-medium text-gray-700 mb-1">
                          Plate Number
                        </label>
                        <input
                          id="plate-number"
                          type="text"
                          value={plateNumber}
                          onChange={(e) => setPlateNumber(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          placeholder="ABC123XY"
                        />
                      </div>
                      <div>
                        <label htmlFor="vehicle-model" className="block text-sm font-medium text-gray-700 mb-1">
                          Vehicle Model
                        </label>
                        <input
                          id="vehicle-model"
                          type="text"
                          value={vehicleModel}
                          onChange={(e) => setVehicleModel(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          placeholder="Honda CBR"
                        />
                      </div>
                      <div>
                        <label htmlFor="vehicle-color" className="block text-sm font-medium text-gray-700 mb-1">
                          Vehicle Color
                        </label>
                        <input
                          id="vehicle-color"
                          type="text"
                          value={vehicleColor}
                          onChange={(e) => setVehicleColor(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          placeholder="Red"
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <input
                      id="availability"
                      type="checkbox"
                      checked={isAvailable}
                      onChange={(e) => setIsAvailable(e.target.checked)}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                    <label htmlFor="availability" className="ml-2 block text-sm text-gray-700">
                      I am available for deliveries
                    </label>
                  </div>
                  
                  <div className="pt-4">
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="w-full py-2 bg-red-600 text-white rounded-md flex items-center justify-center hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-5 w-5 mr-2" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RiderLayout>
  )
}

export default RiderProfilePage