// Enhanced geocoding service with precise Abuja area coordinates

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
 * Enhanced geocoding with precise Abuja area mapping
 */
export async function geocodeAddress(address: Address): Promise<GeocodeResult> {
  try {
    console.log("Geocoding address:", address)

    // First try to get specific coordinates for known Nigerian locations
    const specificCoords = getSpecificNigerianCoordinates(address)
    if (specificCoords) {
      console.log("Using specific Nigerian coordinates:", specificCoords)
      return {
        coordinates: specificCoords,
        formattedAddress: formatAddressForDisplay(address),
        confidence: 0.95,
      }
    }

    // Try Nominatim with multiple query formats
    const queries = generateNominatimQueries(address)

    for (const query of queries) {
      try {
        console.log("Trying Nominatim query:", query)

        const nominatimUrl =
          `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(query)}&` +
          `format=json&` +
          `addressdetails=1&` +
          `limit=3&` +
          `countrycodes=ng&` +
          `bounded=1&` +
          `viewbox=2.5,4.0,15.0,14.0` // Nigeria bounding box

        const response = await fetch(nominatimUrl, {
          headers: {
            "User-Agent": "BREEZE-Delivery-App/1.0 (contact@breeze.com)",
          },
        })

        if (!response.ok) {
          console.warn(`Nominatim API error for query "${query}": ${response.status}`)
          continue
        }

        const data = await response.json()

        if (data && data.length > 0) {
          const result = data[0]
          console.log("Nominatim result:", result)

          return {
            coordinates: {
              lat: Number.parseFloat(result.lat),
              lng: Number.parseFloat(result.lon),
            },
            formattedAddress: result.display_name,
            confidence: Number.parseFloat(result.importance || "0.7"),
          }
        }
      } catch (error) {
        console.warn(`Error with Nominatim query "${query}":`, error)
        continue
      }
    }

    // If all Nominatim queries fail, use enhanced fallback
    console.log("All Nominatim queries failed, using enhanced fallback")
    return getEnhancedFallbackCoordinates(address)
  } catch (error) {
    console.error("Geocoding error:", error)
    return getEnhancedFallbackCoordinates(address)
  }
}

/**
 * Generate multiple Nominatim query formats for better results
 */
function generateNominatimQueries(address: Address): string[] {
  const queries = []

  // Full address
  if (address.address && address.city && address.state) {
    queries.push(`${address.address}, ${address.city}, ${address.state}, Nigeria`)
  }

  // Address + city only
  if (address.address && address.city) {
    queries.push(`${address.address}, ${address.city}, Nigeria`)
  }

  // City + state
  if (address.city && address.state) {
    queries.push(`${address.city}, ${address.state}, Nigeria`)
  }

  // City only
  if (address.city) {
    queries.push(`${address.city}, Nigeria`)
  }

  return queries
}

/**
 * Get specific coordinates for known Nigerian locations with precise Abuja mapping
 */
function getSpecificNigerianCoordinates(address: Address): Coordinates | null {
  const fullAddress = `${address.address || ""} ${address.city || ""} ${address.state || ""}`.toLowerCase()

  console.log("Checking specific coordinates for:", fullAddress)

  // === PRECISE ABUJA AREA COORDINATES ===

  // Garki Areas (very specific)
  if (fullAddress.includes("garki 2") || fullAddress.includes("garki ii")) {
    return { lat: 9.052, lng: 7.489 } // Garki 2 - slightly south of main Garki
  }

  if (fullAddress.includes("garki 1") || fullAddress.includes("garki i")) {
    return { lat: 9.06, lng: 7.492 } // Garki 1 - main Garki area
  }

  if (fullAddress.includes("area 7") && fullAddress.includes("garki")) {
    return { lat: 9.059, lng: 7.49 } // Area 7, Garki - between Garki 1 and 2
  }

  if (fullAddress.includes("cbn quarters") || fullAddress.includes("cbn quarter")) {
    return { lat: 9.053, lng: 7.488 } // CBN Quarters - very close to Garki 2
  }

  if (fullAddress.includes("rubochi") && (fullAddress.includes("garki") || fullAddress.includes("area"))) {
    return { lat: 9.0585, lng: 7.4895 } // Rubochi Close area
  }

  // Other specific Garki locations
  if (fullAddress.includes("garki") && !fullAddress.includes("1") && !fullAddress.includes("2")) {
    return { lat: 9.0579, lng: 7.4951 } // General Garki
  }

  // Wuse Areas
  if (fullAddress.includes("wuse 2") || fullAddress.includes("wuse ii")) {
    return { lat: 9.065, lng: 7.485 } // Wuse 2
  }

  if (fullAddress.includes("wuse 1") || fullAddress.includes("wuse i")) {
    return { lat: 9.0643, lng: 7.4892 } // Wuse 1
  }

  if (fullAddress.includes("wuse")) {
    return { lat: 9.0643, lng: 7.4892 } // General Wuse
  }

  // Area-specific coordinates
  if (fullAddress.includes("area 1")) {
    return { lat: 9.058, lng: 7.495 } // Area 1, Garki
  }

  if (fullAddress.includes("area 2")) {
    return { lat: 9.057, lng: 7.494 } // Area 2, Garki
  }

  if (fullAddress.includes("area 3")) {
    return { lat: 9.056, lng: 7.493 } // Area 3, Garki
  }

  if (fullAddress.includes("area 7")) {
    return { lat: 9.059, lng: 7.49 } // Area 7, Garki
  }

  if (fullAddress.includes("area 8")) {
    return { lat: 9.06, lng: 7.491 } // Area 8, Garki
  }

  if (fullAddress.includes("area 10")) {
    return { lat: 9.061, lng: 7.492 } // Area 10, Garki
  }

  if (fullAddress.includes("area 11")) {
    return { lat: 9.062, lng: 7.493 } // Area 11, Garki
  }

  // Central Business District areas
  if (fullAddress.includes("central business district") || fullAddress.includes("cbd")) {
    return { lat: 9.0579, lng: 7.4951 } // CBD
  }

  // Maitama areas
  if (fullAddress.includes("maitama")) {
    return { lat: 9.0982, lng: 7.4951 } // Maitama
  }

  // Asokoro areas
  if (fullAddress.includes("asokoro")) {
    return { lat: 9.0496, lng: 7.5248 } // Asokoro
  }

  // Lifecamp areas
  if (fullAddress.includes("lifecamp")) {
    return { lat: 9.1372, lng: 7.4098 } // Lifecamp
  }

  if (fullAddress.includes("godab") && fullAddress.includes("lifecamp")) {
    return { lat: 9.1375, lng: 7.4095 } // Godab Estate, Lifecamp
  }

  // Gwarinpa areas
  if (fullAddress.includes("gwarinpa")) {
    return { lat: 9.1108, lng: 7.4165 } // Gwarinpa
  }

  // Kubwa areas
  if (fullAddress.includes("kubwa")) {
    return { lat: 9.1658, lng: 7.3364 } // Kubwa
  }

  // Karshi areas
  if (fullAddress.includes("karshi")) {
    return { lat: 8.7833, lng: 7.4833 } // Karshi
  }

  // Utako areas
  if (fullAddress.includes("utako")) {
    return { lat: 9.08, lng: 7.46 } // Utako
  }

  // Jabi areas
  if (fullAddress.includes("jabi")) {
    return { lat: 9.09, lng: 7.45 } // Jabi
  }

  // Kado areas
  if (fullAddress.includes("kado")) {
    return { lat: 9.12, lng: 7.43 } // Kado
  }

  // === LAGOS LOCATIONS ===
  if (fullAddress.includes("victoria island")) {
    return { lat: 6.4281, lng: 3.4219 }
  }

  if (fullAddress.includes("lekki")) {
    return { lat: 6.4698, lng: 3.5852 }
  }

  if (fullAddress.includes("ikeja")) {
    return { lat: 6.5954, lng: 3.3364 }
  }

  if (fullAddress.includes("lagos")) {
    return { lat: 6.5244, lng: 3.3792 }
  }

  // === OTHER MAJOR CITIES ===
  if (fullAddress.includes("kano")) {
    return { lat: 12.0022, lng: 8.592 }
  }

  if (fullAddress.includes("ibadan")) {
    return { lat: 7.3775, lng: 3.947 }
  }

  if (fullAddress.includes("port harcourt")) {
    return { lat: 4.8156, lng: 7.0498 }
  }

  if (fullAddress.includes("kaduna")) {
    return { lat: 10.5105, lng: 7.4165 }
  }

  if (fullAddress.includes("jos")) {
    return { lat: 9.8965, lng: 8.8583 }
  }

  return null
}

/**
 * Enhanced fallback coordinates with better city matching
 */
function getEnhancedFallbackCoordinates(address: Address): GeocodeResult {
  const cityName = address.city?.toLowerCase() || ""
  const stateName = address.state?.toLowerCase() || ""
  const addressText = address.address?.toLowerCase() || ""

  console.log("Using enhanced fallback for:", { cityName, stateName, addressText })

  // Enhanced city coordinates with more specific locations
  const cityCoordinates: Record<string, Coordinates> = {
    // Abuja areas - more precise
    "abuja(fct)": { lat: 9.0579, lng: 7.4951 }, // Default to Garki (central)
    abuja: { lat: 9.0579, lng: 7.4951 },
    garki: { lat: 9.0579, lng: 7.4951 },
    "garki 1": { lat: 9.06, lng: 7.492 },
    "garki 2": { lat: 9.052, lng: 7.489 },
    wuse: { lat: 9.0643, lng: 7.4892 },
    "wuse 1": { lat: 9.0643, lng: 7.4892 },
    "wuse 2": { lat: 9.065, lng: 7.485 },
    maitama: { lat: 9.0982, lng: 7.4951 },
    asokoro: { lat: 9.0496, lng: 7.5248 },
    lifecamp: { lat: 9.1372, lng: 7.4098 },
    gwarinpa: { lat: 9.1108, lng: 7.4165 },
    kubwa: { lat: 9.1658, lng: 7.3364 },
    karshi: { lat: 8.7833, lng: 7.4833 },
    utako: { lat: 9.08, lng: 7.46 },
    jabi: { lat: 9.09, lng: 7.45 },
    kado: { lat: 9.12, lng: 7.43 },

    // Lagos areas
    lagos: { lat: 6.5244, lng: 3.3792 },
    ikeja: { lat: 6.5954, lng: 3.3364 },
    "victoria island": { lat: 6.4281, lng: 3.4219 },
    lekki: { lat: 6.4698, lng: 3.5852 },

    // Other major cities
    kano: { lat: 12.0022, lng: 8.592 },
    ibadan: { lat: 7.3775, lng: 3.947 },
    "port harcourt": { lat: 4.8156, lng: 7.0498 },
    kaduna: { lat: 10.5105, lng: 7.4165 },
    jos: { lat: 9.8965, lng: 8.8583 },
  }

  // Try exact city match first
  let coordinates = cityCoordinates[cityName]

  // If no exact match, try partial matches
  if (!coordinates) {
    for (const [city, coords] of Object.entries(cityCoordinates)) {
      if (cityName.includes(city) || city.includes(cityName)) {
        coordinates = coords
        break
      }
    }
  }

  // Try state-based fallback
  if (!coordinates) {
    if (stateName.includes("abuja") || stateName.includes("fct")) {
      coordinates = cityCoordinates["garki"] // Use Garki as Abuja center
    } else if (stateName.includes("lagos")) {
      coordinates = cityCoordinates["lagos"]
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

  // Default to Garki (Abuja center) if nothing matches
  if (!coordinates) {
    coordinates = cityCoordinates["garki"]
  }

  return {
    coordinates,
    formattedAddress: formatAddressForDisplay(address),
    confidence: 0.6, // Medium confidence for fallback
  }
}

/**
 * Calculate route distance and duration using OSRM
 */
export async function calculateRoute(origin: Coordinates, destination: Coordinates): Promise<RouteResult> {
  try {
    console.log("Calculating route from", origin, "to", destination)

    // Check if coordinates are very close (within 0.005 degrees ~ 500m)
    const latDiff = Math.abs(origin.lat - destination.lat)
    const lngDiff = Math.abs(origin.lng - destination.lng)

    if (latDiff < 0.005 && lngDiff < 0.005) {
      console.log("Origin and destination are very close, returning minimal distance")
      return {
        distance: 0.5, // 500 meters minimum for very close locations
        duration: 180, // 3 minutes minimum
      }
    }

    // Use OSRM demo server
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
    const distanceKm = route.distance / 1000

    // For very short distances in the same area, cap the maximum distance
    if (latDiff < 0.02 && lngDiff < 0.02 && distanceKm > 8) {
      console.log("Capping distance for nearby locations:", distanceKm, "->", 5)
      return {
        distance: 5, // Cap at 5km for nearby locations
        duration: route.duration,
        geometry: route.geometry,
      }
    }

    return {
      distance: distanceKm,
      duration: route.duration, // Already in seconds
      geometry: route.geometry,
    }
  } catch (error) {
    console.error("Route calculation error:", error)

    // Fallback to straight-line distance calculation
    const straightLineDistance = calculateStraightLineDistance(origin, destination)

    return {
      distance: Math.max(straightLineDistance, 0.5), // Minimum 500m
      duration: Math.max(straightLineDistance * 120, 180), // Rough estimate, minimum 3 minutes
    }
  }
}

/**
 * Calculate straight-line distance between two coordinates using Haversine formula
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
 * Format address for display
 */
function formatAddressForDisplay(address: Address): string {
  const parts = []

  if (address.address) parts.push(address.address)
  if (address.city) parts.push(address.city)
  if (address.state) parts.push(address.state)
  if (address.zipCode) parts.push(address.zipCode)

  return parts.join(", ")
}

/**
 * Validate coordinates
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
 */
export async function getDistanceBetweenAddresses(address1: Address, address2: Address): Promise<number> {
  try {
    // Geocode both addresses
    const [geocode1, geocode2] = await Promise.all([geocodeAddress(address1), geocodeAddress(address2)])

    console.log("Address 1 geocoded:", geocode1)
    console.log("Address 2 geocoded:", geocode2)

    // Calculate route distance
    const route = await calculateRoute(geocode1.coordinates, geocode2.coordinates)

    return route.distance
  } catch (error) {
    console.error("Error calculating distance between addresses:", error)
    throw error
  }
}
