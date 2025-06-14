"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import Image from "next/image"
import { supabase } from "@/utils/supabase"
import CustomerLayout from "@/components/CustomerLayout"
import LoyaltyPointsHistory from "@/components/customer/LoyaltyPointsHistory"
import { User, MapPin, Edit2, Save, X, Upload, Loader2, AlertCircle, CheckCircle, Utensils, Heart } from "lucide-react"

interface CustomerProfile {
  id: string
  name: string
  email: string
  phone_number: string | null
  avatar_url: string | null
  date_of_birth: string | null
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  landmark: string | null
  dietary_preferences: string[] | null
  favorite_cuisines: string[] | null
  loyalty_points: number
  created_at: string
}

const ProfilePage = () => {
  const router = useRouter()
  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    phone_number: "",
    date_of_birth: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    landmark: "",
    dietary_preferences: [] as string[],
    favorite_cuisines: [] as string[],
  })

  // Available dietary preferences and cuisines
  const availableDietaryPreferences = [
    "Vegetarian",
    "Vegan",
    "Gluten-Free",
    "Dairy-Free",
    "Nut-Free",
    "Halal",
    "Kosher",
    "Low-Carb",
    "Keto",
  ]

  const availableCuisines = [
    "African",
    "Nigerian",
    "Chinese",
    "Italian",
    "Indian",
    "Japanese",
    "Mexican",
    "Thai",
    "American",
    "Lebanese",
    "Turkish",
    "French",
    "Spanish",
    "Greek",
    "Korean",
  ]

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.push("/login")
        return
      }

      const { data, error } = await supabase.from("customers").select("*").eq("id", session.user.id).single()

      if (error) {
        console.error("Error fetching profile:", error)
        setError("Failed to load profile. Please try again.")
        return
      }

      setProfile(data)

      // Initialize form data
      setFormData({
        name: data.name || "",
        phone_number: data.phone_number || "",
        date_of_birth: data.date_of_birth || "",
        address: data.address || "",
        city: data.city || "",
        state: data.state || "",
        zip_code: data.zip_code || "",
        landmark: data.landmark || "",
        dietary_preferences: data.dietary_preferences || [],
        favorite_cuisines: data.favorite_cuisines || [],
      })
    } catch (error) {
      console.error("Error in fetchProfile:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleDietaryPreferenceToggle = (preference: string) => {
    setFormData((prev) => {
      const current = [...prev.dietary_preferences]
      if (current.includes(preference)) {
        return { ...prev, dietary_preferences: current.filter((p) => p !== preference) }
      } else {
        return { ...prev, dietary_preferences: [...current, preference] }
      }
    })
  }

  const handleCuisineToggle = (cuisine: string) => {
    setFormData((prev) => {
      const current = [...prev.favorite_cuisines]
      if (current.includes(cuisine)) {
        return { ...prev, favorite_cuisines: current.filter((c) => c !== cuisine) }
      } else {
        return { ...prev, favorite_cuisines: [...current, cuisine] }
      }
    })
  }

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true)
      setError(null)
      setSuccess(null)

      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.push("/login")
        return
      }

      const { error } = await supabase
        .from("customers")
        .update({
          name: formData.name,
          phone_number: formData.phone_number,
          date_of_birth: formData.date_of_birth,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zip_code,
          landmark: formData.landmark,
          dietary_preferences: formData.dietary_preferences,
          favorite_cuisines: formData.favorite_cuisines,
          updated_at: new Date().toISOString(),
        })
        .eq("id", session.user.id)

      if (error) {
        console.error("Error updating profile:", error)
        setError("Failed to update profile. Please try again.")
        return
      }

      // Refresh profile data
      await fetchProfile()
      setSuccess("Profile updated successfully!")
      setIsEditing(false)
    } catch (error) {
      console.error("Error in handleSaveProfile:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0]
      if (!file) return

      setUploadingAvatar(true)
      setError(null)

      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.push("/login")
        return
      }

      // Create a unique file name
      const fileExt = file.name.split(".").pop()
      const fileName = `${session.user.id}_avatar_${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload the file
      const { error: uploadError } = await supabase.storage.from("customer-images").upload(filePath, file)

      if (uploadError) {
        console.error("Error uploading avatar:", uploadError)
        setError("Failed to upload avatar. Please try again.")
        return
      }

      // Get the public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("customer-images").getPublicUrl(filePath)

      // Update the profile with the new avatar URL
      const { error: updateError } = await supabase
        .from("customers")
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", session.user.id)

      if (updateError) {
        console.error("Error updating avatar URL:", updateError)
        setError("Failed to update profile with new avatar. Please try again.")
        return
      }

      // Refresh profile data
      await fetchProfile()
      setSuccess("Avatar updated successfully!")
    } catch (error) {
      console.error("Error in handleAvatarUpload:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setUploadingAvatar(false)
    }
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Not set"

    try {
      const date = new Date(dateString)
      return date.toLocaleDateString()
    } catch (error) {
      return dateString
    }
  }

  if (isLoading) {
    return (
      <CustomerLayout title="Profile">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-[#b9c6c8]" />
          </div>
        </div>
      </CustomerLayout>
    )
  }

  return (
    <CustomerLayout title="Profile">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center text-[#1d2c36]">
          <User className="h-6 w-6 mr-2 text-[#b9c6c8]" />
          My Profile
        </h1>

        {error && (
          <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-start">
            <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <p>{success}</p>
          </div>
        )}

        <div className="bg-[#8f8578] rounded-lg shadow-md border border-[#1d2c36] overflow-hidden">
          {/* Profile Header */}
          <div className="relative bg-gradient-to-r from-[#1d2c36] to-[#2a3f4d] h-32 md:h-48">
            <div className="absolute bottom-0 left-0 w-full p-4 md:p-6 flex flex-col md:flex-row items-center md:items-end">
              <div className="relative mb-4 md:mb-0">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-[#8f8578] overflow-hidden bg-[#b9c6c8]">
                  {profile?.avatar_url ? (
                    <Image
                      src={profile.avatar_url || "/placeholder.svg"}
                      alt={profile.name || "Profile"}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#b9c6c8] text-[#1d2c36]">
                      <span className="text-2xl font-bold">
                        {profile?.name ? profile.name.charAt(0).toUpperCase() : "U"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Avatar Upload Button */}
                <label className="absolute bottom-0 right-0 bg-[#8f8578] rounded-full p-2 shadow-md cursor-pointer border border-[#1d2c36]">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar}
                  />
                  {uploadingAvatar ? (
                    <Loader2 className="h-5 w-5 animate-spin text-[#b9c6c8]" />
                  ) : (
                    <Upload className="h-5 w-5 text-[#1d2c36]" />
                  )}
                </label>
              </div>

              <div className="text-center md:text-left md:ml-6 text-[#8f8578] md:flex-1">
                <h2 className="text-xl md:text-2xl font-bold">{profile?.name || "User"}</h2>
                <p className="text-[#b9c6c8]">{profile?.email}</p>
                <p className="text-sm text-[#b9c6c8] opacity-75">
                  Member since {formatDate(profile?.created_at || null)}
                </p>
              </div>

              <div className="mt-4 md:mt-0">
                {isEditing ? (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="bg-[#b9c6c8] text-[#1d2c36] px-4 py-2 rounded-lg font-medium hover:bg-[#a8b5b8] transition-colors flex items-center"
                    >
                      {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false)
                        // Reset form data to current profile
                        if (profile) {
                          setFormData({
                            name: profile.name || "",
                            phone_number: profile.phone_number || "",
                            date_of_birth: profile.date_of_birth || "",
                            address: profile.address || "",
                            city: profile.city || "",
                            state: profile.state || "",
                            zip_code: profile.zip_code || "",
                            landmark: profile.landmark || "",
                            dietary_preferences: profile.dietary_preferences || [],
                            favorite_cuisines: profile.favorite_cuisines || [],
                          })
                        }
                      }}
                      className="bg-[#8f8578] text-[#1d2c36] px-4 py-2 rounded-lg font-medium hover:bg-[#7a7469] transition-colors border border-[#1d2c36]"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-[#8f8578] text-[#1d2c36] px-4 py-2 rounded-lg font-medium hover:bg-[#7a7469] transition-colors flex items-center border border-[#1d2c36]"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center text-[#1d2c36]">
                  <User className="h-5 w-5 mr-2 text-[#b9c6c8]" />
                  Personal Information
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1d2c36] mb-1">Full Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-[#1d2c36] rounded-lg focus:ring-2 focus:ring-[#b9c6c8] focus:border-[#b9c6c8] bg-[#1d2c36] text-[#8f8578]"
                        placeholder="Your full name"
                      />
                    ) : (
                      <p className="text-[#1d2c36]">{profile?.name || "Not set"}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1d2c36] mb-1">Email Address</label>
                    <p className="text-[#1d2c36]">{profile?.email}</p>
                    <p className="text-xs text-[#1d2c36] opacity-60 mt-1">Email cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1d2c36] mb-1">Phone Number</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-[#1d2c36] rounded-lg focus:ring-2 focus:ring-[#b9c6c8] focus:border-[#b9c6c8] bg-[#1d2c36] text-[#8f8578]"
                        placeholder="Your phone number"
                      />
                    ) : (
                      <p className="text-[#1d2c36]">{profile?.phone_number || "Not set"}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1d2c36] mb-1">Date of Birth</label>
                    {isEditing ? (
                      <input
                        type="date"
                        name="date_of_birth"
                        value={formData.date_of_birth}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-[#1d2c36] rounded-lg focus:ring-2 focus:ring-[#b9c6c8] focus:border-[#b9c6c8] bg-[#1d2c36] text-[#8f8578]"
                      />
                    ) : (
                      <p className="text-[#1d2c36]">{formatDate(profile?.date_of_birth)}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center text-[#1d2c36]">
                  <MapPin className="h-5 w-5 mr-2 text-[#b9c6c8]" />
                  Address Information
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1d2c36] mb-1">Street Address</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-[#1d2c36] rounded-lg focus:ring-2 focus:ring-[#b9c6c8] focus:border-[#b9c6c8] bg-[#1d2c36] text-[#8f8578]"
                        placeholder="Your street address"
                      />
                    ) : (
                      <p className="text-[#1d2c36]">{profile?.address || "Not set"}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#1d2c36] mb-1">City</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-[#1d2c36] rounded-lg focus:ring-2 focus:ring-[#b9c6c8] focus:border-[#b9c6c8] bg-[#1d2c36] text-[#8f8578]"
                          placeholder="Your city"
                        />
                      ) : (
                        <p className="text-[#1d2c36]">{profile?.city || "Not set"}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#1d2c36] mb-1">State</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-[#1d2c36] rounded-lg focus:ring-2 focus:ring-[#b9c6c8] focus:border-[#b9c6c8] bg-[#1d2c36] text-[#8f8578]"
                          placeholder="Your state"
                        />
                      ) : (
                        <p className="text-[#1d2c36]">{profile?.state || "Not set"}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1d2c36] mb-1">Zip Code</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="zip_code"
                        value={formData.zip_code}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-[#1d2c36] rounded-lg focus:ring-2 focus:ring-[#b9c6c8] focus:border-[#b9c6c8] bg-[#1d2c36] text-[#8f8578]"
                        placeholder="Your zip code"
                      />
                    ) : (
                      <p className="text-[#1d2c36]">{profile?.zip_code || "Not set"}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1d2c36] mb-1">Landmark (Optional)</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="landmark"
                        value={formData.landmark}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-[#1d2c36] rounded-lg focus:ring-2 focus:ring-[#b9c6c8] focus:border-[#b9c6c8] bg-[#1d2c36] text-[#8f8578]"
                        placeholder="Nearby landmark for easier delivery"
                      />
                    ) : (
                      <p className="text-[#1d2c36]">{profile?.landmark || "Not set"}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="mt-8">
              <h3 className="text-lg font-bold mb-4 flex items-center text-[#1d2c36]">
                <Utensils className="h-5 w-5 mr-2 text-[#b9c6c8]" />
                Food Preferences
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Dietary Preferences */}
                <div>
                  <h4 className="font-medium mb-2 text-[#1d2c36]">Dietary Preferences</h4>
                  {isEditing ? (
                    <div className="flex flex-wrap gap-2">
                      {availableDietaryPreferences.map((preference) => (
                        <button
                          key={preference}
                          type="button"
                          onClick={() => handleDietaryPreferenceToggle(preference)}
                          className={`px-3 py-1 rounded-full text-sm transition-colors ${
                            formData.dietary_preferences.includes(preference)
                              ? "bg-[#b9c6c8] text-[#1d2c36]"
                              : "bg-[#1d2c36] text-[#8f8578] hover:bg-[#2a3f4d]"
                          }`}
                        >
                          {preference}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div>
                      {profile?.dietary_preferences && profile.dietary_preferences.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {profile.dietary_preferences.map((preference) => (
                            <span
                              key={preference}
                              className="bg-[#1d2c36] text-[#b9c6c8] px-3 py-1 rounded-full text-sm"
                            >
                              {preference}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[#1d2c36] opacity-60 italic">No dietary preferences set</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Favorite Cuisines */}
                <div>
                  <h4 className="font-medium mb-2 text-[#1d2c36]">Favorite Cuisines</h4>
                  {isEditing ? (
                    <div className="flex flex-wrap gap-2">
                      {availableCuisines.map((cuisine) => (
                        <button
                          key={cuisine}
                          type="button"
                          onClick={() => handleCuisineToggle(cuisine)}
                          className={`px-3 py-1 rounded-full text-sm transition-colors ${
                            formData.favorite_cuisines.includes(cuisine)
                              ? "bg-[#b9c6c8] text-[#1d2c36]"
                              : "bg-[#1d2c36] text-[#8f8578] hover:bg-[#2a3f4d]"
                          }`}
                        >
                          {cuisine}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div>
                      {profile?.favorite_cuisines && profile.favorite_cuisines.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {profile.favorite_cuisines.map((cuisine) => (
                            <span key={cuisine} className="bg-[#1d2c36] text-[#b9c6c8] px-3 py-1 rounded-full text-sm">
                              {cuisine}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[#1d2c36] opacity-60 italic">No favorite cuisines set</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Loyalty Points */}
            <div className="mt-8 bg-gradient-to-r from-[#1d2c36] to-[#2a3f4d] rounded-lg p-6 border border-[#b9c6c8]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold mb-1 flex items-center text-[#8f8578]">
                    <Heart className="h-5 w-5 mr-2 text-[#b9c6c8]" />
                    Loyalty Points
                  </h3>
                  <p className="text-[#b9c6c8]">Earn points with every order and redeem them for discounts!</p>
                </div>
                <div className="bg-[#8f8578] rounded-lg px-6 py-4 shadow-sm border border-[#b9c6c8]">
                  <p className="text-sm text-[#1d2c36]">Your Points</p>
                  <p className="text-3xl font-bold text-[#1d2c36]">{profile?.loyalty_points || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loyalty Points History */}
        {profile && (
          <div className="mt-6 bg-[#8f8578] rounded-lg shadow-md border border-[#1d2c36] p-6">
            <LoyaltyPointsHistory customerId={profile.id} />
          </div>
        )}
      </div>
    </CustomerLayout>
  )
}

export default ProfilePage
