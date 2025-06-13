// Utility functions for delivery calculations

// Constants for delivery fee calculation
const BASE_FEE = 1000 // Base delivery fee in Naira (also minimum fee)
const MIN_DELIVERY_FEE = 1000 // Minimum delivery fee
const MAX_DELIVERY_FEE = 4000 // Maximum delivery fee
const WITHIN_5KM_RATE = 150 // Fee per kilometer within 5km
const BEYOND_5KM_RATE = 210 // Fee per kilometer beyond 5km
const DISTANCE_THRESHOLD = 5 // Threshold in kilometers for higher rate
const AVG_SPEED_KM_PER_MIN = 0.5 // Average speed in km per minute (30km/h)
const PREPARATION_TIME_MIN = 15 // Food preparation time in minutes

// Interface for coordinates
export interface Coordinates {
  lat: number
  lng: number
}

// Interface for address
export interface Address {
  address: string
  city: string
  state: string
  zipCode?: string
  coordinates?: Coordinates
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param coord1 First coordinate
 * @param coord2 Second coordinate
 * @returns Distance in kilometers
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(coord2.lat - coord1.lat)
  const dLon = toRad(coord2.lng - coord1.lng)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return Number.parseFloat(distance.toFixed(2))
}

/**
 * Convert degrees to radians
 */
function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/**
 * Calculate delivery fee based on distance with tiered pricing
 * @param distanceKm Distance in kilometers
 * @returns Delivery fee in Naira
 */
export function calculateDeliveryFee(distanceKm: number): number {
  if (distanceKm <= 0) return MIN_DELIVERY_FEE

  let fee = BASE_FEE

  if (distanceKm <= DISTANCE_THRESHOLD) {
    // Within threshold: base fee + rate per km
    fee += distanceKm * WITHIN_5KM_RATE
  } else {
    // Beyond threshold: base fee + threshold distance at normal rate + remaining distance at higher rate
    fee += DISTANCE_THRESHOLD * WITHIN_5KM_RATE + (distanceKm - DISTANCE_THRESHOLD) * BEYOND_5KM_RATE
  }

  // Ensure fee is within bounds
  return Math.min(Math.max(fee, MIN_DELIVERY_FEE), MAX_DELIVERY_FEE)
}

/**
 * Check if delivery distance is beyond the threshold
 * @param distanceKm Distance in kilometers
 * @returns Boolean indicating if distance is beyond threshold
 */
export function isDeliveryDistanceBeyondThreshold(distanceKm: number): boolean {
  return distanceKm > DISTANCE_THRESHOLD
}

/**
 * Calculate service fee based on number of items
 * @param itemCount Number of items in order
 * @returns Service fee in Naira
 */
export function calculateServiceFee(itemCount: number): number {
  if (itemCount <= 0) return 0

  // Base fee of 300 + 135 for each additional item beyond the first
  const additionalItems = Math.max(0, itemCount - 1)
  return 300 + additionalItems * 135
}

/**
 * Calculate estimated delivery time based on distance
 * @param distanceKm Distance in kilometers
 * @returns Estimated delivery time in minutes
 */
export function calculateEstimatedDeliveryTime(distanceKm: number): number {
  if (distanceKm <= 0) return PREPARATION_TIME_MIN

  const travelTimeMinutes = distanceKm / AVG_SPEED_KM_PER_MIN
  const totalTimeMinutes = PREPARATION_TIME_MIN + travelTimeMinutes

  return Math.ceil(totalTimeMinutes)
}

/**
 * Format delivery time for display
 * @param minutes Delivery time in minutes
 * @returns Formatted time string
 */
export function formatDeliveryTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minutes`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (remainingMinutes === 0) {
    return `${hours} hour${hours > 1 ? "s" : ""}`
  }

  return `${hours} hour${hours > 1 ? "s" : ""} ${remainingMinutes} minute${remainingMinutes > 1 ? "s" : ""}`
}

/**
 * Geocode an address to get coordinates
 * This is a placeholder function that would normally call a geocoding API
 * @param address Address to geocode
 * @returns Promise resolving to coordinates
 */
export async function geocodeAddress(address: Address): Promise<Coordinates> {
  // In a real implementation, this would call a geocoding API like Google Maps
  // For now, we'll return mock coordinates based on the address string

  // This is just a simple hash function to generate consistent mock coordinates
  const addressStr = address.address || ""
  const cityStr = address.city || ""
  const stateStr = address.state || ""
  const hashString = `${addressStr} ${cityStr} ${stateStr}`
  let hash = 0
  for (let i = 0; i < hashString.length; i++) {
    hash = (hash << 5) - hash + hashString.charCodeAt(i)
    hash |= 0 // Convert to 32bit integer
  }

  // Generate coordinates within Nigeria (roughly)
  // Nigeria's bounds: ~4-14°N, 3-15°E
  const lat = 4 + (Math.abs(hash % 1000) / 1000) * 10 // 4-14°N
  const lng = 3 + (Math.abs((hash >> 10) % 1000) / 1000) * 12 // 3-15°E

  return { lat, lng }
}

/**
 * Get mock vendor coordinates based on vendor ID
 * In a real implementation, this would fetch the vendor's address from the database
 * @param vendorId Vendor ID
 * @returns Mock coordinates
 */
export function getMockVendorCoordinates(vendorId: string): Coordinates {
  // Generate consistent coordinates based on vendor ID
  let hash = 0
  for (let i = 0; i < vendorId.length; i++) {
    hash = (hash << 5) - hash + vendorId.charCodeAt(i)
    hash |= 0
  }

  // Generate coordinates within Nigeria (roughly)
  const lat = 6.5 + (Math.abs(hash % 100) / 100) * 0.5 // Around Lagos
  const lng = 3.3 + (Math.abs((hash >> 10) % 100) / 100) * 0.5 // Around Lagos

  return { lat, lng }
}
