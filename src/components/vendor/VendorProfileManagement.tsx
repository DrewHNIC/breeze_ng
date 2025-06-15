"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import { supabase } from "@/utils/supabase"
import {
  Camera,
  X,
  Save,
  Clock,
  LogOut,
  Lock,
  Trash2,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
} from "lucide-react"

interface DayHours {
  is_open: boolean
  open_time: string
  close_time: string
}

interface OperatingHours {
  monday: DayHours
  tuesday: DayHours
  wednesday: DayHours
  thursday: DayHours
  friday: DayHours
  saturday: DayHours
  sunday: DayHours
}

interface VendorProfile {
  id: string
  store_name: string
  business_description: string
  contact_email: string
  contact_phone: string
  address: string
  city: string
  state: string
  zip_code: string
  cuisine_type: string
  logo_url: string | null
  banner_url: string | null
  average_preparation_time: number
  is_open: boolean
  landmark_description: string
  operating_hours: OperatingHours
  bank_name: string
  account_name: string
  account_number: string
  security_question: string
  security_answer: string
}

interface BankInfo {
  bank_name: string
  account_name: string
  account_number: string
  security_question: string
  security_answer: string
}

interface Notification {
  id: string
  type: "success" | "warning" | "info" | "error"
  title: string
  message: string
  timestamp: Date
}

const defaultOperatingHours: OperatingHours = {
  monday: { is_open: true, open_time: "09:00", close_time: "17:00" },
  tuesday: { is_open: true, open_time: "09:00", close_time: "17:00" },
  wednesday: { is_open: true, open_time: "09:00", close_time: "17:00" },
  thursday: { is_open: true, open_time: "09:00", close_time: "17:00" },
  friday: { is_open: true, open_time: "09:00", close_time: "17:00" },
  saturday: { is_open: true, open_time: "10:00", close_time: "15:00" },
  sunday: { is_open: false, open_time: "10:00", close_time: "15:00" },
}

const cuisineTypes = [
  "African",
  "Asian",
  "Bakery",
  "Breakfast",
  "Chinese",
  "Desserts",
  "Drinks",
  "Fast Food",
  "Greek",
  "Healthy",
  "Indian",
  "Italian",
  "Japanese",
  "Korean",
  "Local Dishes",
  "Mediterranean",
  "Mexican",
  "Middle Eastern",
  "Pizza",
  "Seafood",
  "Thai",
  "Vegetarian",
  "Vietnamese",
]

const bankOptions = [
  "Access Bank",
  "Citibank",
  "Ecobank",
  "Fidelity Bank",
  "First Bank",
  "First City Monument Bank (FCMB)",
  "Guaranty Trust Bank (GTB)",
  "Heritage Bank",
  "Keystone Bank",
  "Polaris Bank",
  "Stanbic IBTC Bank",
  "Standard Chartered Bank",
  "Sterling Bank",
  "Union Bank",
  "United Bank for Africa (UBA)",
  "Unity Bank",
  "Wema Bank",
  "Zenith Bank",
]

export default function VendorProfileManagement() {
  const [profile, setProfile] = useState<VendorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"basic" | "hours" | "delivery" | "payment" | "account">("basic")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [securityAnswer, setSecurityAnswer] = useState("")
  const [showSecurityCheck, setShowSecurityCheck] = useState(false)
  const [bankInfo, setBankInfo] = useState<BankInfo>({
    bank_name: "",
    account_name: "",
    account_number: "",
    security_question: "",
    security_answer: "",
  })

  // Add notification function
  const addNotification = (type: Notification["type"], title: string, message: string) => {
    const notification: Notification = {
      id: Date.now().toString(),
      type,
      title,
      message,
      timestamp: new Date(),
    }
    setNotifications((prev) => [notification, ...prev])

    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      removeNotification(notification.id)
    }, 5000)
  }

  // Remove notification function
  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }

  // Get notification icon
  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case "info":
        return <Clock className="h-5 w-5 text-blue-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  // Get notification colors
  const getNotificationColors = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return "border-green-200 bg-green-50"
      case "error":
        return "border-red-200 bg-red-50"
      case "warning":
        return "border-yellow-200 bg-yellow-50"
      case "info":
        return "border-blue-200 bg-blue-50"
      default:
        return "border-gray-200 bg-gray-50"
    }
  }

  // Fetch vendor profile
  useEffect(() => {
    async function fetchProfile() {
      setLoading(true)
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session) return

        // Get vendor profile
        const { data: vendorProfile, error: profileError } = await supabase
          .from("vendor_profiles")
          .select("*")
          .eq("vendor_id", session.user.id)
          .single()

        if (profileError && profileError.code !== "PGRST116") {
          console.error("Error fetching vendor profile:", profileError)
          return
        }

        // Get vendor basic info
        const { data: vendor, error: vendorError } = await supabase
          .from("vendors")
          .select("*")
          .eq("id", session.user.id)
          .single()

        if (vendorError) {
          console.error("Error fetching vendor:", vendorError)
          return
        }

        // Combine vendor and profile data
        const combinedProfile: VendorProfile = {
          id: session.user.id,
          store_name: vendor.store_name || "",
          business_description: vendorProfile?.business_description || "",
          contact_email: vendor.email || session.user.email || "",
          contact_phone: vendorProfile?.contact_phone || "",
          address: vendorProfile?.address || "",
          city: vendorProfile?.city || "",
          state: vendorProfile?.state || "",
          zip_code: vendorProfile?.zip_code || "",
          cuisine_type: vendorProfile?.cuisine_type || "",
          logo_url: vendorProfile?.logo_url || null,
          banner_url: vendorProfile?.banner_url || null,
          average_preparation_time: vendorProfile?.average_preparation_time || 30,
          is_open: vendorProfile?.is_open || false,
          landmark_description: vendorProfile?.landmark_description || "",
          operating_hours: vendorProfile?.operating_hours || defaultOperatingHours,
          bank_name: vendorProfile?.bank_name || "",
          account_name: vendorProfile?.account_name || "",
          account_number: vendorProfile?.account_number || "",
          security_question: vendorProfile?.security_question || "",
          security_answer: vendorProfile?.security_answer || "",
        }

        setProfile(combinedProfile)
        setBankInfo({
          bank_name: combinedProfile.bank_name,
          account_name: combinedProfile.account_name,
          account_number: combinedProfile.account_number,
          security_question: combinedProfile.security_question,
          security_answer: combinedProfile.security_answer,
        })
        setLogoPreview(combinedProfile.logo_url)
        setBannerPreview(combinedProfile.banner_url)
      } catch (error) {
        console.error("Error in fetchProfile:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  // Handle logo file change
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setLogoFile(file)
      setLogoPreview(URL.createObjectURL(file))
    }
  }

  // Handle banner file change
  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setBannerFile(file)
      setBannerPreview(URL.createObjectURL(file))
    }
  }

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    if (!profile) return

    setProfile((prev) => {
      if (!prev) return prev

      return {
        ...prev,
        [name]: value,
      }
    })
  }

  // Handle bank info changes
  const handleBankInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setBankInfo((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target

    if (!profile) return

    if (name.includes(".")) {
      const [day, property] = name.split(".")

      setProfile((prev) => {
        if (!prev || !prev.operating_hours) return prev

        const updatedHours = { ...prev.operating_hours }

        if (updatedHours[day as keyof OperatingHours]) {
          updatedHours[day as keyof OperatingHours] = {
            ...updatedHours[day as keyof OperatingHours],
            [property]: checked,
          }
        }

        return {
          ...prev,
          operating_hours: updatedHours,
        }
      })
    } else {
      setProfile((prev) => {
        if (!prev) return prev
        return { ...prev, [name]: checked }
      })
    }
  }

  // Handle number input changes
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const numValue = Number.parseFloat(value)

    if (!isNaN(numValue) && profile) {
      setProfile((prev) => {
        if (!prev) return prev
        return { ...prev, [name]: numValue }
      })
    }
  }

  // Handle time input changes for operating hours
  const handleTimeChange = (day: keyof OperatingHours, field: "open_time" | "close_time", value: string) => {
    if (!profile) return

    setProfile((prev) => {
      if (!prev || !prev.operating_hours) return prev

      const updatedHours = { ...prev.operating_hours }

      if (updatedHours[day]) {
        updatedHours[day] = {
          ...updatedHours[day],
          [field]: value,
        }
      }

      return {
        ...prev,
        operating_hours: updatedHours,
      }
    })
  }

  // Handle password change
  const handleChangePassword = async () => {
    setPasswordError("")

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match")
      return
    }

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters")
      return
    }

    try {
      setSaving(true)

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) {
        throw updateError
      }

      addNotification("success", "Password Updated", "Your password has been updated successfully!")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      console.error("Error changing password:", error)
      setPasswordError(error.message)
      addNotification("error", "Password Update Failed", error.message)
    } finally {
      setSaving(false)
    }
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      window.location.href = "/login"
    } catch (error) {
      console.error("Error signing out:", error)
      addNotification("error", "Logout Failed", "Failed to sign out. Please try again.")
    }
  }

  // Handle account deletion
  const handleDeleteAccount = async () => {
    try {
      setSaving(true)

      // Delete vendor profile
      await supabase.from("vendor_profiles").delete().eq("vendor_id", profile?.id)

      // Delete vendor
      await supabase.from("vendors").delete().eq("id", profile?.id)

      // Sign out
      await supabase.auth.signOut()

      // Redirect to home
      window.location.href = "/"
    } catch (error) {
      console.error("Error deleting account:", error)
      addNotification("error", "Account Deletion Failed", "Error deleting account. Please try again.")
    } finally {
      setSaving(false)
      setShowDeleteConfirm(false)
    }
  }

  // Verify security question before saving bank info
  const handleVerifySecurity = () => {
    if (profile?.security_answer && securityAnswer.toLowerCase() === profile.security_answer.toLowerCase()) {
      saveBankInfo()
    } else {
      addNotification("error", "Security Verification Failed", "Security answer is incorrect")
    }
  }

  // Save bank info
  const saveBankInfo = async () => {
    if (!profile) return

    setSaving(true)

    try {
      const { error } = await supabase
        .from("vendor_profiles")
        .update({
          bank_name: bankInfo.bank_name,
          account_name: bankInfo.account_name,
          account_number: bankInfo.account_number,
          security_question: bankInfo.security_question,
          security_answer: bankInfo.security_answer,
        })
        .eq("vendor_id", profile.id)

      if (error) {
        throw new Error(`Error updating bank info: ${error.message}`)
      }

      setProfile((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          bank_name: bankInfo.bank_name,
          account_name: bankInfo.account_name,
          account_number: bankInfo.account_number,
          security_question: bankInfo.security_question,
          security_answer: bankInfo.security_answer,
        }
      })

      addNotification(
        "success",
        "Payment Information Updated",
        "Your payment information has been updated successfully!",
      )
      setShowSecurityCheck(false)
      setSecurityAnswer("")
    } catch (error: any) {
      console.error("Error saving bank info:", error)
      addNotification("error", "Update Failed", error.message)
    } finally {
      setSaving(false)
    }
  }

  // Save profile changes
  const handleSave = async () => {
    if (!profile) return

    setSaving(true)

    try {
      // Upload logo if changed
      let logoUrl = profile.logo_url
      if (logoFile) {
        const logoFileName = `${profile.id}_logo_${Date.now()}`
        const { data: logoData, error: logoError } = await supabase.storage
          .from("vendor-images")
          .upload(logoFileName, logoFile, {
            cacheControl: "3600",
            upsert: true,
          })

        if (logoError) {
          throw new Error(`Error uploading logo: ${logoError.message}`)
        }

        // Get public URL
        const { data: logoPublicUrl } = supabase.storage.from("vendor-images").getPublicUrl(logoFileName)

        logoUrl = logoPublicUrl.publicUrl
      }

      // Upload banner if changed
      let bannerUrl = profile.banner_url
      if (bannerFile) {
        const bannerFileName = `${profile.id}_banner_${Date.now()}`
        const { data: bannerData, error: bannerError } = await supabase.storage
          .from("vendor-images")
          .upload(bannerFileName, bannerFile, {
            cacheControl: "3600",
            upsert: true,
          })

        if (bannerError) {
          throw new Error(`Error uploading banner: ${bannerError.message}`)
        }

        // Get public URL
        const { data: bannerPublicUrl } = supabase.storage.from("vendor-images").getPublicUrl(bannerFileName)

        bannerUrl = bannerPublicUrl.publicUrl
      }

      // Update vendor basic info
      const { error: vendorError } = await supabase
        .from("vendors")
        .update({
          store_name: profile.store_name,
        })
        .eq("id", profile.id)

      if (vendorError) {
        throw new Error(`Error updating vendor: ${vendorError.message}`)
      }

      // Check if vendor profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from("vendor_profiles")
        .select("vendor_id")
        .eq("vendor_id", profile.id)
        .single()

      let profileError

      if (!existingProfile) {
        // Insert new profile
        const { error } = await supabase.from("vendor_profiles").insert({
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
          operating_hours: profile.operating_hours,
        })

        profileError = error
      } else {
        // Update existing profile
        const { error } = await supabase
          .from("vendor_profiles")
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
            operating_hours: profile.operating_hours,
          })
          .eq("vendor_id", profile.id)

        profileError = error
      }

      if (profileError) {
        throw new Error(`Error updating profile: ${profileError.message}`)
      }

      addNotification("success", "Profile Updated", "Your profile has been updated successfully!")

      // Reset file states
      setLogoFile(null)
      setBannerFile(null)
    } catch (error: any) {
      console.error("Error saving profile:", error)
      addNotification("error", "Update Failed", error.message)
    } finally {
      setSaving(false)
    }
  }

  // Handle bank info save button
  const handleSaveBankInfo = () => {
    // Validate inputs
    if (!bankInfo.bank_name || !bankInfo.account_name || !bankInfo.account_number) {
      addNotification("error", "Validation Error", "Please fill in all bank information fields")
      return
    }

    if (!bankInfo.security_question || !bankInfo.security_answer) {
      addNotification("error", "Validation Error", "Please set a security question and answer")
      return
    }

    // If updating existing bank info, verify security answer first
    if (profile?.security_answer && profile.bank_name) {
      setShowSecurityCheck(true)
    } else {
      // First time setting up bank info
      saveBankInfo()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#b9c6c8]"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="bg-gradient-to-br from-[#1d2c36] to-[#243642] rounded-lg shadow-md p-6 border border-[#b9c6c8]/20">
        <p className="text-red-400">Error loading profile. Please try again later.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 relative">
      {/* Notification Container */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`border rounded-lg p-4 shadow-lg backdrop-blur-sm transition-all duration-300 ${getNotificationColors(
                notification.type,
              )}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900">{notification.title}</h4>
                    <p className="text-sm text-gray-700 mt-1">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-2">{notification.timestamp.toLocaleTimeString()}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-gradient-to-br from-[#1d2c36] to-[#243642] rounded-lg shadow-md overflow-hidden border border-[#b9c6c8]/20">
        {/* Banner Image */}
        <div className="relative h-48 bg-gradient-to-r from-[#1d2c36] to-[#243642]">
          {bannerPreview ? (
            <Image
              src={bannerPreview || "/placeholder.svg"}
              alt="Restaurant Banner"
              fill
              style={{ objectFit: "cover" }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-[#8f8578]">No banner image</p>
            </div>
          )}
          <label className="absolute bottom-4 right-4 bg-gradient-to-r from-[#b9c6c8] to-[#8f8578] text-[#1d2c36] p-2 rounded-full cursor-pointer hover:from-[#8f8578] hover:to-[#b9c6c8] transition-all duration-200">
            <Camera className="h-5 w-5" />
            <input type="file" className="hidden" accept="image/*" onChange={handleBannerChange} />
          </label>
        </div>

        {/* Profile Header */}
        <div className="p-6 flex flex-col md:flex-row gap-6 items-start">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-[#1d2c36] to-[#243642] overflow-hidden border-4 border-[#b9c6c8]/20 -mt-12 shadow-md">
              {logoPreview ? (
                <Image
                  src={logoPreview || "/placeholder.svg"}
                  alt="Restaurant Logo"
                  width={96}
                  height={96}
                  style={{ objectFit: "cover" }}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-[#8f8578] text-xs">No logo</p>
                </div>
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-gradient-to-r from-[#b9c6c8] to-[#8f8578] text-[#1d2c36] p-1 rounded-full cursor-pointer hover:from-[#8f8578] hover:to-[#b9c6c8] transition-all duration-200">
              <Camera className="h-4 w-4" />
              <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
            </label>
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-bold text-[#b9c6c8]">{profile.store_name || "Your Restaurant"}</h1>
            <p className="text-[#8f8578]">{profile.cuisine_type || "Cuisine Type"}</p>
            <div className="flex items-center mt-3">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                  profile.is_open
                    ? "bg-green-100 text-green-800 border border-green-200"
                    : "bg-red-100 text-red-800 border border-red-200"
                }`}
              >
                <div className={`w-2 h-2 rounded-full mr-2 ${profile.is_open ? "bg-green-500" : "bg-red-500"}`}></div>
                {profile.is_open ? "Currently Open" : "Currently Closed"}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-[#b9c6c8]/20">
          <nav className="flex flex-wrap -mb-px overflow-x-auto">
            <button
              onClick={() => setActiveTab("basic")}
              className={`py-4 px-4 md:px-6 text-center border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                activeTab === "basic"
                  ? "border-[#b9c6c8] text-[#b9c6c8]"
                  : "border-transparent text-[#8f8578] hover:text-[#b9c6c8] hover:border-[#b9c6c8]/50"
              }`}
            >
              Basic Information
            </button>
            <button
              onClick={() => setActiveTab("hours")}
              className={`py-4 px-4 md:px-6 text-center border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                activeTab === "hours"
                  ? "border-[#b9c6c8] text-[#b9c6c8]"
                  : "border-transparent text-[#8f8578] hover:text-[#b9c6c8] hover:border-[#b9c6c8]/50"
              }`}
            >
              Operating Hours
            </button>
            <button
              onClick={() => setActiveTab("delivery")}
              className={`py-4 px-4 md:px-6 text-center border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                activeTab === "delivery"
                  ? "border-[#b9c6c8] text-[#b9c6c8]"
                  : "border-transparent text-[#8f8578] hover:text-[#b9c6c8] hover:border-[#b9c6c8]/50"
              }`}
            >
              Store Location
            </button>
            <button
              onClick={() => setActiveTab("payment")}
              className={`py-4 px-4 md:px-6 text-center border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                activeTab === "payment"
                  ? "border-[#b9c6c8] text-[#b9c6c8]"
                  : "border-transparent text-[#8f8578] hover:text-[#b9c6c8] hover:border-[#b9c6c8]/50"
              }`}
            >
              Payment Information
            </button>
            <button
              onClick={() => setActiveTab("account")}
              className={`py-4 px-4 md:px-6 text-center border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                activeTab === "account"
                  ? "border-[#b9c6c8] text-[#b9c6c8]"
                  : "border-transparent text-[#8f8578] hover:text-[#b9c6c8] hover:border-[#b9c6c8]/50"
              }`}
            >
              Account Settings
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Basic Information Tab */}
          {activeTab === "basic" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#b9c6c8] mb-2">Business Name</label>
                  <input
                    type="text"
                    name="store_name"
                    value={profile.store_name || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-[#b9c6c8]/20 rounded-md bg-gradient-to-r from-[#1d2c36] to-[#243642] text-[#b9c6c8] focus:outline-none focus:ring-2 focus:ring-[#b9c6c8]/50 focus:border-[#b9c6c8] transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#b9c6c8] mb-2">Cuisine Type</label>
                  <select
                    name="cuisine_type"
                    value={profile.cuisine_type || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-[#b9c6c8]/20 rounded-md bg-gradient-to-r from-[#1d2c36] to-[#243642] text-[#b9c6c8] focus:outline-none focus:ring-2 focus:ring-[#b9c6c8]/50 focus:border-[#b9c6c8] transition-all duration-200"
                  >
                    <option value="">Select Cuisine Type</option>
                    {cuisineTypes.map((cuisine) => (
                      <option key={cuisine} value={cuisine}>
                        {cuisine}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#b9c6c8] mb-2">Business Description</label>
                  <textarea
                    name="business_description"
                    value={profile.business_description || ""}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-[#b9c6c8]/20 rounded-md bg-gradient-to-r from-[#1d2c36] to-[#243642] text-[#b9c6c8] focus:outline-none focus:ring-2 focus:ring-[#b9c6c8]/50 focus:border-[#b9c6c8] transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#b9c6c8] mb-2">Contact Email</label>
                  <input
                    type="email"
                    name="contact_email"
                    value={profile.contact_email || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-[#b9c6c8]/20 rounded-md bg-gradient-to-r from-[#1d2c36] to-[#243642] text-[#b9c6c8] focus:outline-none focus:ring-2 focus:ring-[#b9c6c8]/50 focus:border-[#b9c6c8] transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#b9c6c8] mb-2">Contact Phone</label>
                  <input
                    type="tel"
                    name="contact_phone"
                    value={profile.contact_phone || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-[#b9c6c8]/20 rounded-md bg-gradient-to-r from-[#1d2c36] to-[#243642] text-[#b9c6c8] focus:outline-none focus:ring-2 focus:ring-[#b9c6c8]/50 focus:border-[#b9c6c8] transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#b9c6c8] mb-2">
                    Average Preparation Time (minutes)
                  </label>
                  <input
                    type="number"
                    name="average_preparation_time"
                    value={profile.average_preparation_time || ""}
                    onChange={handleNumberChange}
                    min="0"
                    className="w-full px-3 py-2 border border-[#b9c6c8]/20 rounded-md bg-gradient-to-r from-[#1d2c36] to-[#243642] text-[#b9c6c8] focus:outline-none focus:ring-2 focus:ring-[#b9c6c8]/50 focus:border-[#b9c6c8] transition-all duration-200"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_open"
                    name="is_open"
                    checked={profile.is_open || false}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 text-[#b9c6c8] focus:ring-[#b9c6c8] border-[#b9c6c8]/20 rounded"
                  />
                  <label htmlFor="is_open" className="ml-2 block text-sm text-[#b9c6c8]">
                    Restaurant is currently open
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Operating Hours Tab */}
          {activeTab === "hours" && (
            <div className="space-y-6">
              <p className="text-sm text-[#8f8578]">Set your restaurant's operating hours for each day of the week.</p>

              <div className="space-y-4">
                {Object.entries(profile.operating_hours).map(([day, hours]) => (
                  <div
                    key={day}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border border-[#b9c6c8]/20 rounded-md bg-gradient-to-r from-[#b9c6c8]/5 to-transparent"
                  >
                    <div className="w-32">
                      <span className="font-medium capitalize text-[#b9c6c8]">{day}</span>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`${day}.is_open`}
                        name={`${day}.is_open`}
                        checked={hours.is_open}
                        onChange={handleCheckboxChange}
                        className="h-4 w-4 text-[#b9c6c8] focus:ring-[#b9c6c8] border-[#b9c6c8]/20 rounded"
                      />
                      <label htmlFor={`${day}.is_open`} className="ml-2 block text-sm text-[#b9c6c8]">
                        Open
                      </label>
                    </div>

                    <div className="flex flex-1 items-center gap-2">
                      <Clock className="h-4 w-4 text-[#8f8578]" />
                      <input
                        type="time"
                        value={hours.open_time}
                        onChange={(e) => handleTimeChange(day as keyof OperatingHours, "open_time", e.target.value)}
                        disabled={!hours.is_open}
                        className="px-2 py-1 border border-[#b9c6c8]/20 rounded-md bg-gradient-to-r from-[#1d2c36] to-[#243642] text-[#b9c6c8] focus:outline-none focus:ring-2 focus:ring-[#b9c6c8]/50 focus:border-[#b9c6c8] disabled:bg-[#1d2c36]/50 disabled:text-[#8f8578]/50 transition-all duration-200"
                      />
                      <span className="text-[#8f8578]">to</span>
                      <input
                        type="time"
                        value={hours.close_time}
                        onChange={(e) => handleTimeChange(day as keyof OperatingHours, "close_time", e.target.value)}
                        disabled={!hours.is_open}
                        className="px-2 py-1 border border-[#b9c6c8]/20 rounded-md bg-gradient-to-r from-[#1d2c36] to-[#243642] text-[#b9c6c8] focus:outline-none focus:ring-2 focus:ring-[#b9c6c8]/50 focus:border-[#b9c6c8] disabled:bg-[#1d2c36]/50 disabled:text-[#8f8578]/50 transition-all duration-200"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Store Location Tab */}
          {activeTab === "delivery" && (
            <div className="space-y-6">
              <p className="text-sm text-[#8f8578]">
                Provide your store location details to help riders locate your store for pickups.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#b9c6c8] mb-2">Store Address</label>
                  <input
                    type="text"
                    name="address"
                    value={profile.address || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-[#b9c6c8]/20 rounded-md bg-gradient-to-r from-[#1d2c36] to-[#243642] text-[#b9c6c8] focus:outline-none focus:ring-2 focus:ring-[#b9c6c8]/50 focus:border-[#b9c6c8] transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#b9c6c8] mb-2">City</label>
                  <input
                    type="text"
                    name="city"
                    value={profile.city || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-[#b9c6c8]/20 rounded-md bg-gradient-to-r from-[#1d2c36] to-[#243642] text-[#b9c6c8] focus:outline-none focus:ring-2 focus:ring-[#b9c6c8]/50 focus:border-[#b9c6c8] transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#b9c6c8] mb-2">State</label>
                  <input
                    type="text"
                    name="state"
                    value={profile.state || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-[#b9c6c8]/20 rounded-md bg-gradient-to-r from-[#1d2c36] to-[#243642] text-[#b9c6c8] focus:outline-none focus:ring-2 focus:ring-[#b9c6c8]/50 focus:border-[#b9c6c8] transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#b9c6c8] mb-2">ZIP Code</label>
                  <input
                    type="text"
                    name="zip_code"
                    value={profile.zip_code || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-[#b9c6c8]/20 rounded-md bg-gradient-to-r from-[#1d2c36] to-[#243642] text-[#b9c6c8] focus:outline-none focus:ring-2 focus:ring-[#b9c6c8]/50 focus:border-[#b9c6c8] transition-all duration-200"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#b9c6c8] mb-2">Landmark Description</label>
                  <textarea
                    name="landmark_description"
                    value={profile.landmark_description || ""}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Describe any landmarks or directions that can help riders locate your store (e.g., 'Next to City Bank, blue building with red sign')"
                    className="w-full px-3 py-2 border border-[#b9c6c8]/20 rounded-md bg-gradient-to-r from-[#1d2c36] to-[#243642] text-[#b9c6c8] placeholder-[#8f8578] focus:outline-none focus:ring-2 focus:ring-[#b9c6c8]/50 focus:border-[#b9c6c8] transition-all duration-200"
                  />
                  <p className="mt-1 text-xs text-[#8f8578]">
                    This information helps riders easily locate your store for pickups.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Payment Information Tab */}
          {activeTab === "payment" && (
            <div className="space-y-6">
              <p className="text-sm text-[#8f8578]">
                Set up your bank account information to receive payments from orders.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#b9c6c8] mb-2">Bank Name</label>
                  <select
                    name="bank_name"
                    value={bankInfo.bank_name}
                    onChange={handleBankInfoChange}
                    className="w-full px-3 py-2 border border-[#b9c6c8]/20 rounded-md bg-gradient-to-r from-[#1d2c36] to-[#243642] text-[#b9c6c8] focus:outline-none focus:ring-2 focus:ring-[#b9c6c8]/50 focus:border-[#b9c6c8] transition-all duration-200"
                  >
                    <option value="">Select Bank</option>
                    {bankOptions.map((bank) => (
                      <option key={bank} value={bank}>
                        {bank}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#b9c6c8] mb-2">Account Name</label>
                  <input
                    type="text"
                    name="account_name"
                    value={bankInfo.account_name}
                    onChange={handleBankInfoChange}
                    className="w-full px-3 py-2 border border-[#b9c6c8]/20 rounded-md bg-gradient-to-r from-[#1d2c36] to-[#243642] text-[#b9c6c8] focus:outline-none focus:ring-2 focus:ring-[#b9c6c8]/50 focus:border-[#b9c6c8] transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#b9c6c8] mb-2">Account Number</label>
                  <input
                    type="text"
                    name="account_number"
                    value={bankInfo.account_number}
                    onChange={handleBankInfoChange}
                    className="w-full px-3 py-2 border border-[#b9c6c8]/20 rounded-md bg-gradient-to-r from-[#1d2c36] to-[#243642] text-[#b9c6c8] focus:outline-none focus:ring-2 focus:ring-[#b9c6c8]/50 focus:border-[#b9c6c8] transition-all duration-200"
                  />
                </div>
                <div className="md:col-span-2">
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md mb-4">
                    <p className="text-sm text-yellow-700">
                      <strong>Security Note:</strong> To protect your payment information, you'll need to set up a
                      security question and answer. This will be required whenever you want to update your payment
                      details in the future.
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#b9c6c8] mb-2">Security Question</label>
                  <input
                    type="text"
                    name="security_question"
                    value={bankInfo.security_question}
                    onChange={handleBankInfoChange}
                    placeholder="e.g., What was your first pet's name?"
                    className="w-full px-3 py-2 border border-[#b9c6c8]/20 rounded-md bg-gradient-to-r from-[#1d2c36] to-[#243642] text-[#b9c6c8] placeholder-[#8f8578] focus:outline-none focus:ring-2 focus:ring-[#b9c6c8]/50 focus:border-[#b9c6c8] transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#b9c6c8] mb-2">Security Answer</label>
                  <input
                    type="text"
                    name="security_answer"
                    value={bankInfo.security_answer}
                    onChange={handleBankInfoChange}
                    className="w-full px-3 py-2 border border-[#b9c6c8]/20 rounded-md bg-gradient-to-r from-[#1d2c36] to-[#243642] text-[#b9c6c8] focus:outline-none focus:ring-2 focus:ring-[#b9c6c8]/50 focus:border-[#b9c6c8] transition-all duration-200"
                  />
                  <p className="mt-1 text-xs text-[#8f8578]">
                    Remember this answer as you'll need it to make changes to your payment information.
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveBankInfo}
                  disabled={saving}
                  className="flex items-center gap-2 bg-gradient-to-r from-[#b9c6c8] to-[#8f8578] text-[#1d2c36] px-4 py-2 rounded-md hover:from-[#8f8578] hover:to-[#b9c6c8] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[#1d2c36]"></div>
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
          {activeTab === "account" && (
            <div className="space-y-8">
              {/* Change Password Section */}
              <div className="bg-gradient-to-r from-[#b9c6c8]/10 to-transparent p-6 rounded-lg border border-[#b9c6c8]/20">
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-[#b9c6c8]">
                  <Lock className="h-5 w-5" />
                  Change Password
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#b9c6c8] mb-2">Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-[#b9c6c8]/20 rounded-md bg-gradient-to-r from-[#1d2c36] to-[#243642] text-[#b9c6c8] focus:outline-none focus:ring-2 focus:ring-[#b9c6c8]/50 focus:border-[#b9c6c8] transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#b9c6c8] mb-2">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-[#b9c6c8]/20 rounded-md bg-gradient-to-r from-[#1d2c36] to-[#243642] text-[#b9c6c8] focus:outline-none focus:ring-2 focus:ring-[#b9c6c8]/50 focus:border-[#b9c6c8] transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#b9c6c8] mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-[#b9c6c8]/20 rounded-md bg-gradient-to-r from-[#1d2c36] to-[#243642] text-[#b9c6c8] focus:outline-none focus:ring-2 focus:ring-[#b9c6c8]/50 focus:border-[#b9c6c8] transition-all duration-200"
                    />
                  </div>

                  {passwordError && <p className="text-red-400 text-sm">{passwordError}</p>}

                  <div className="flex justify-end">
                    <button
                      onClick={handleChangePassword}
                      disabled={saving || !currentPassword || !newPassword || !confirmPassword}
                      className="flex items-center gap-2 bg-gradient-to-r from-[#b9c6c8] to-[#8f8578] text-[#1d2c36] px-4 py-2 rounded-md hover:from-[#8f8578] hover:to-[#b9c6c8] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[#1d2c36]"></div>
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
              <div className="bg-gradient-to-r from-[#b9c6c8]/10 to-transparent p-6 rounded-lg border border-[#b9c6c8]/20">
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-[#b9c6c8]">
                  <LogOut className="h-5 w-5" />
                  Logout
                </h3>

                <p className="text-[#8f8578] mb-4">Sign out of your account on this device.</p>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 bg-gradient-to-r from-[#8f8578] to-[#b9c6c8] text-[#1d2c36] px-4 py-2 rounded-md hover:from-[#b9c6c8] hover:to-[#8f8578] transition-all duration-200"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>

              {/* Delete Account Section */}
              <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
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

          {/* Save Button (only show for tabs that need it) */}
          {(activeTab === "basic" || activeTab === "hours" || activeTab === "delivery") && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-gradient-to-r from-[#b9c6c8] to-[#8f8578] text-[#1d2c36] px-4 py-2 rounded-md hover:from-[#8f8578] hover:to-[#b9c6c8] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[#1d2c36]"></div>
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
          <div className="bg-gradient-to-br from-[#1d2c36] to-[#243642] border border-[#b9c6c8]/20 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium mb-4 text-[#b9c6c8]">Security Verification</h3>
            <p className="text-[#8f8578] mb-4">
              To update your payment information, please answer your security question:
            </p>
            <p className="font-medium mb-2 text-[#b9c6c8]">{profile.security_question}</p>

            <input
              type="text"
              value={securityAnswer}
              onChange={(e) => setSecurityAnswer(e.target.value)}
              className="w-full px-3 py-2 border border-[#b9c6c8]/20 rounded-md bg-gradient-to-r from-[#1d2c36] to-[#243642] text-[#b9c6c8] placeholder-[#8f8578] focus:outline-none focus:ring-2 focus:ring-[#b9c6c8]/50 focus:border-[#b9c6c8] mb-4 transition-all duration-200"
              placeholder="Your answer"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSecurityCheck(false)}
                className="px-4 py-2 border border-[#b9c6c8]/20 rounded-md text-[#8f8578] hover:bg-[#b9c6c8]/10 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifySecurity}
                disabled={!securityAnswer}
                className="bg-gradient-to-r from-[#b9c6c8] to-[#8f8578] text-[#1d2c36] px-4 py-2 rounded-md hover:from-[#8f8578] hover:to-[#b9c6c8] disabled:opacity-50 transition-all duration-200"
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
          <div className="bg-gradient-to-br from-[#1d2c36] to-[#243642] border border-[#b9c6c8]/20 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-lg font-medium">Delete Account</h3>
            </div>

            <p className="text-[#8f8578] mb-4">
              Are you sure you want to delete your account? This action cannot be undone and all your data will be
              permanently removed.
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-[#b9c6c8]/20 rounded-md text-[#8f8578] hover:bg-[#b9c6c8]/10 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
              >
                Yes, Delete My Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
