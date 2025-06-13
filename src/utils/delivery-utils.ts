// Updated delivery utilities using accurate geocoding and routing

import {
  geocodeAddress,
  calculateRoute,
  type Coordinates,
  type Address,
  type GeocodeResult,
  type RouteResult,
} from "./geocoding-service"

// Constants for delivery fee calculation
const BASE_FEE = 1000 // Base delivery fee in Naira (also minimum fee)
const MIN_DELIVERY_FEE = 1000 // Minimum delivery fee
const MAX_DELIVERY_FEE = 4000 // Maximum delivery fee
const WITHIN_5KM_RATE = 150 // Fee per kilometer within 5km
const BEYOND_5KM_RATE = 210 // Fee per kilometer beyond 5km
const DISTANCE_THRESHOLD = 5 // Threshold in kilometers for higher rate
const AVG_SPEED_KM_PER_MIN = 0.5 // Average speed in km per minute (30km/h)
const PREPARATION_TIME_MIN = 15 // Food preparation time in minutes

// Re-export types for convenience
export type { Coordinates, Address, GeocodeResult, RouteResult }

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
 * Calculate estimated delivery time based on distance and route duration
 * @param distanceKm Distance in kilometers
 * @param routeDurationSeconds Optional route duration in seconds from OSRM
 * @returns Estimated delivery time in minutes
 */
export function calculateEstimatedDeliveryTime(distanceKm: number, routeDurationSeconds?: number): number {
  if (distanceKm <= 0) return PREPARATION_TIME_MIN

  let travelTimeMinutes: number

  if (routeDurationSeconds && routeDurationSeconds > 0) {
    // Use actual route duration if available
    travelTimeMinutes = routeDurationSeconds / 60
  } else {
    // Fallback to distance-based calculation
    travelTimeMinutes = distanceKm / AVG_SPEED_KM_PER_MIN
  }

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
 * Calculate delivery details including distance, fee, and estimated time
 * @param vendorAddress Vendor address
 * @param customerAddress Customer address
 * @returns Promise resolving to delivery details
 */
export async function calculateDeliveryDetails(vendorAddress: Address, customerAddress: Address) {
  try {
    console.log("Calculating delivery details...")
    console.log("Vendor address:", vendorAddress)
    console.log("Customer address:", customerAddress)

    // Geocode both addresses
    const [vendorGeocode, customerGeocode] = await Promise.all([
      geocodeAddress(vendorAddress),
      geocodeAddress(customerAddress),
    ])

    console.log("Vendor coordinates:", vendorGeocode.coordinates)
    console.log("Customer coordinates:", customerGeocode.coordinates)

    // Calculate route
    const route = await calculateRoute(vendorGeocode.coordinates, customerGeocode.coordinates)

    console.log("Route calculated:", route)

    // Calculate delivery fee
    const deliveryFee = calculateDeliveryFee(route.distance)

    // Calculate estimated delivery time
    const estimatedTime = calculateEstimatedDeliveryTime(route.distance, route.duration)

    // Check if beyond threshold
    const isBeyondThreshold = isDeliveryDistanceBeyondThreshold(route.distance)

    return {
      distance: route.distance,
      deliveryFee,
      estimatedTime,
      isBeyondThreshold,
      vendorCoordinates: vendorGeocode.coordinates,
      customerCoordinates: customerGeocode.coordinates,
      routeDuration: route.duration,
      vendorFormattedAddress: vendorGeocode.formattedAddress,
      customerFormattedAddress: customerGeocode.formattedAddress,
    }
  } catch (error) {
    console.error("Error calculating delivery details:", error)
    throw new Error("Failed to calculate delivery details. Please check the addresses and try again.")
  }
}

/**
 * Validate that an address has all required fields for geocoding
 * @param address Address to validate
 * @returns Boolean indicating if address is valid
 */
export function validateAddress(address: Address): boolean {
  return Boolean(
    address &&
      address.address &&
      address.address.trim() &&
      address.city &&
      address.city.trim() &&
      address.state &&
      address.state.trim(),
  )
}

/**
 * Format address for display
 * @param address Address to format
 * @returns Formatted address string
 */
export function formatAddressForDisplay(address: Address): string {
  const parts = []

  if (address.address) parts.push(address.address)
  if (address.city) parts.push(address.city)
  if (address.state) parts.push(address.state)
  if (address.zipCode) parts.push(address.zipCode)

  return parts.join(", ")
}
