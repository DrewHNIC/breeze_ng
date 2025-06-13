// Geocoding and routing service using OpenStreetMap, Nominatim, and OSRM

export interface Coordinates {
  lat: number
  lng: number
}

export interface Address {
  address: string
  city: string
  state: string
  zipCode?: string
  country?: string
}

export interface GeocodeResult {
  coordinates: Coordinates
  formattedAddress: string
  confidence: number
}

export interface RouteResult {
  distance: number // in kilometers
  duration: number // in seconds
  geometry?: any
}

/**
 * Geocode an address using Nominatim (OpenStreetMap)
 * @param address Address to geocode
 * @returns Promise resolving to geocode result
 */
export async function geocodeAddress(address: Address): Promise<GeocodeResult> {
  try {
    // Format the address for better geocoding results
    const formattedQuery = formatAddressForGeocoding(address)

    console.log("Geocoding address:", formattedQuery)

    // Use Nominatim API (free OpenStreetMap geocoding service)
    const nominatimUrl =
      `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(formattedQuery)}&` +
      `format=json&` +
      `addressdetails=1&` +
      `limit=1&` +
      `countrycodes=ng` // Restrict to Nigeria

    const response = await fetch(nominatimUrl, {
      headers: {
        "User-Agent": "BREEZE-Delivery-App/1.0 (contact@breeze.com)", // Required by Nominatim
      },
    })

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`)
    }

    const data = await response.json()

    if (!data || data.length === 0) {
      throw new Error("No geocoding results found")
    }

    const result = data[0]

    return {
      coordinates: {
        lat: Number.parseFloat(result.lat),
        lng: Number.parseFloat(result.lon),
      },
      formattedAddress: result.display_name,
      confidence: Number.parseFloat(result.importance || "0.5"),
    }
  } catch (error) {
    console.error("Geocoding error:", error)

    // Fallback to approximate coordinates for major Nigerian cities
    return getFallbackCoordinates(address)
  }
}

/**
 * Calculate route distance and duration using OSRM
 * @param origin Origin coordinates
 * @param destination Destination coordinates
 * @returns Promise resolving to route result
 */
export async function calculateRoute(origin: Coordinates, destination: Coordinates): Promise<RouteResult> {
  try {
    console.log("Calculating route from", origin, "to", destination)

    // Use OSRM demo server (for production, you'd want to host your own OSRM instance)
    const osrmUrl =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${origin.lng},${origin.lat};${destination.lng},${destination.lat}?` +
      `overview=false&` +
      `alternatives=false&` +
      `steps=false&` +
      `geometries=geojson`

    const response = await fetch(osrmUrl)

    if (!response.ok) {
      throw new Error(`OSRM API error: ${response.status}`)
    }

    const data = await response.json()

    if (!data.routes || data.routes.length === 0) {
      throw new Error("No route found")
    }

    const route = data.routes[0]

    return {
      distance: route.distance / 1000, // Convert meters to kilometers
      duration: route.duration, // Already in seconds
      geometry: route.geometry,
    }
  } catch (error) {
    console.error("Route calculation error:", error)

    // Fallback to straight-line distance calculation
    return {
      distance: calculateStraightLineDistance(origin, destination),
      duration: 0,
    }
  }
}

/**
 * Format address for better geocoding results
 * @param address Address object
 * @returns Formatted address string
 */
function formatAddressForGeocoding(address: Address): string {
  const parts = []

  if (address.address) parts.push(address.address)
  if (address.city) parts.push(address.city)
  if (address.state) parts.push(address.state)
  if (address.country) parts.push(address.country)
  else parts.push("Nigeria") // Default to Nigeria

  return parts.join(", ")
}

/**
 * Calculate straight-line distance between two coordinates using Haversine formula
 * @param coord1 First coordinate
 * @param coord2 Second coordinate
 * @returns Distance in kilometers
 */
function calculateStraightLineDistance(coord1: Coordinates, coord2: Coordinates): number {
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
 * Get fallback coordinates for major Nigerian cities when geocoding fails
 * @param address Address object
 * @returns Geocode result with approximate coordinates
 */
function getFallbackCoordinates(address: Address): GeocodeResult {
  const cityName = address.city.toLowerCase()
  const stateName = address.state.toLowerCase()

  // Major Nigerian cities with accurate coordinates
  const cityCoordinates: Record<string, Coordinates> = {
    // Lagos State
    lagos: { lat: 6.5244, lng: 3.3792 },
    ikeja: { lat: 6.5954, lng: 3.3364 },
    "victoria island": { lat: 6.4281, lng: 3.4219 },
    lekki: { lat: 6.4698, lng: 3.5852 },

    // Abuja (FCT)
    abuja: { lat: 9.0765, lng: 7.3986 },
    garki: { lat: 9.0579, lng: 7.4951 },
    wuse: { lat: 9.0643, lng: 7.4892 },
    maitama: { lat: 9.0982, lng: 7.4951 },
    asokoro: { lat: 9.0496, lng: 7.5248 },
    lifecamp: { lat: 9.1372, lng: 7.4098 },
    gwarinpa: { lat: 9.1108, lng: 7.4165 },
    kubwa: { lat: 9.1658, lng: 7.3364 },

    // Kano State
    kano: { lat: 12.0022, lng: 8.592 },

    // Oyo State
    ibadan: { lat: 7.3775, lng: 3.947 },

    // Rivers State
    "port harcourt": { lat: 4.8156, lng: 7.0498 },

    // Kaduna State
    kaduna: { lat: 10.5105, lng: 7.4165 },

    // Plateau State
    jos: { lat: 9.8965, lng: 8.8583 },
  }

  // Try to match city name
  let coordinates = cityCoordinates[cityName]

  // If no direct match, try to match by state
  if (!coordinates) {
    if (stateName.includes("lagos")) {
      coordinates = cityCoordinates["lagos"]
    } else if (stateName.includes("abuja") || stateName.includes("fct")) {
      coordinates = cityCoordinates["abuja"]
    } else if (stateName.includes("kano")) {
      coordinates = cityCoordinates["kano"]
    } else if (stateName.includes("oyo")) {
      coordinates = cityCoordinates["ibadan"]
    } else if (stateName.includes("rivers")) {
      coordinates = cityCoordinates["port harcourt"]
    } else if (stateName.includes("kaduna")) {
      coordinates = cityCoordinates["kaduna"]
    } else if (stateName.includes("plateau")) {
      coordinates = cityCoordinates["jos"]
    }
  }

  // Default to Lagos if no match found
  if (!coordinates) {
    coordinates = cityCoordinates["lagos"]
  }

  return {
    coordinates,
    formattedAddress: `${address.address}, ${address.city}, ${address.state}, Nigeria`,
    confidence: 0.3, // Low confidence for fallback
  }
}

/**
 * Validate coordinates
 * @param coordinates Coordinates to validate
 * @returns Boolean indicating if coordinates are valid
 */
export function validateCoordinates(coordinates: Coordinates): boolean {
  return (
    coordinates &&
    typeof coordinates.lat === "number" &&
    typeof coordinates.lng === "number" &&
    coordinates.lat >= -90 &&
    coordinates.lat <= 90 &&
    coordinates.lng >= -180 &&
    coordinates.lng <= 180 &&
    !isNaN(coordinates.lat) &&
    !isNaN(coordinates.lng)
  )
}

/**
 * Get distance between two addresses
 * @param address1 First address
 * @param address2 Second address
 * @returns Promise resolving to distance in kilometers
 */
export async function getDistanceBetweenAddresses(address1: Address, address2: Address): Promise<number> {
  try {
    // Geocode both addresses
    const [geocode1, geocode2] = await Promise.all([geocodeAddress(address1), geocodeAddress(address2)])

    // Calculate route distance
    const route = await calculateRoute(geocode1.coordinates, geocode2.coordinates)

    return route.distance
  } catch (error) {
    console.error("Error calculating distance between addresses:", error)
    throw error
  }
}
