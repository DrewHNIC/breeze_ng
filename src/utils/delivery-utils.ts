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
 * In a production environment, this would use the Google Maps Geocoding API
 * @param address Address to geocode
 * @returns Promise resolving to coordinates
 */
export async function geocodeAddress(address: Address): Promise<Coordinates> {
  // In a production environment, this would be implemented as:
  /*
  const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
  const formattedAddress = encodeURIComponent(
    `${address.address}, ${address.city}, ${address.state}${address.zipCode ? `, ${address.zipCode}` : ''}`
  );
  
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${formattedAddress}&key=${API_KEY}`
  );
  
  const data = await response.json();
  
  if (data.status === 'OK' && data.results && data.results.length > 0) {
    const location = data.results[0].geometry.location;
    return {
      lat: location.lat,
      lng: location.lng
    };
  }
  */

  // For now, we'll use a more deterministic mock implementation
  // This creates more realistic coordinates based on the address string
  const fullAddress = `${address.address}, ${address.city}, ${address.state}`

  // Use specific coordinates for common Nigerian cities
  if (fullAddress.toLowerCase().includes("lagos")) {
    // Lagos coordinates with slight variation
    const variation = Math.random() * 0.05 - 0.025
    return {
      lat: 6.5244 + variation,
      lng: 3.3792 + variation,
    }
  } else if (fullAddress.toLowerCase().includes("abuja")) {
    // Abuja coordinates with slight variation
    const variation = Math.random() * 0.05 - 0.025
    return {
      lat: 9.0765 + variation,
      lng: 7.3986 + variation,
    }
  } else if (fullAddress.toLowerCase().includes("kano")) {
    // Kano coordinates with slight variation
    const variation = Math.random() * 0.05 - 0.025
    return {
      lat: 12.0022 + variation,
      lng: 8.592 + variation,
    }
  } else if (fullAddress.toLowerCase().includes("ibadan")) {
    // Ibadan coordinates with slight variation
    const variation = Math.random() * 0.05 - 0.025
    return {
      lat: 7.3775 + variation,
      lng: 3.947 + variation,
    }
  }

  // For other addresses, generate coordinates based on a hash of the address
  let hash = 0
  for (let i = 0; i < fullAddress.length; i++) {
    hash = (hash << 5) - hash + fullAddress.charCodeAt(i)
    hash |= 0 // Convert to 32bit integer
  }

  // Generate coordinates within Nigeria (roughly)
  // Nigeria's bounds: ~4-14°N, 3-15°E
  const lat = 6.5 + (Math.abs(hash % 100) / 100) * 7.5 // 6.5-14°N (central to northern Nigeria)
  const lng = 3.3 + (Math.abs((hash >> 10) % 100) / 100) * 11.7 // 3.3-15°E (western to eastern Nigeria)

  return { lat, lng }
}

/**
 * Get vendor coordinates based on vendor address
 * In a production environment, this would use the Google Maps Geocoding API
 * @param address Vendor address
 * @returns Promise resolving to coordinates
 */
export async function getVendorCoordinates(address: Address): Promise<Coordinates> {
  // In a production environment, this would call the Google Maps Geocoding API
  // For now, we'll use the same geocoding function as for customer addresses
  return await geocodeAddress(address)
}
