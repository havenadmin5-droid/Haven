/**
 * Location utilities for Haven
 * Handles fuzzy pin locations for privacy
 */

// City coordinates for India (approximate centers)
export const CITY_COORDINATES: Record<string, [number, number]> = {
  Mumbai: [19.076, 72.8777],
  Delhi: [28.6139, 77.209],
  Bangalore: [12.9716, 77.5946],
  Hyderabad: [17.385, 78.4867],
  Chennai: [13.0827, 80.2707],
  Kolkata: [22.5726, 88.3639],
  Pune: [18.5204, 73.8567],
  Ahmedabad: [23.0225, 72.5714],
  Jaipur: [26.9124, 75.7873],
  Lucknow: [26.8467, 80.9462],
  Chandigarh: [30.7333, 76.7794],
  Kochi: [9.9312, 76.2673],
  Goa: [15.2993, 74.124],
  Indore: [22.7196, 75.8577],
  Coimbatore: [11.0168, 76.9558],
  Nagpur: [21.1458, 79.0882],
  Vadodara: [22.3072, 73.1812],
  Surat: [21.1702, 72.8311],
  Thiruvananthapuram: [8.5241, 76.9366],
  Bhopal: [23.2599, 77.4126],
  Visakhapatnam: [17.6868, 83.2185],
  Mysore: [12.2958, 76.6394],
  Other: [20.5937, 78.9629], // Center of India
};

/**
 * Simple seeded random number generator
 * Uses a hash of the user ID to generate consistent random numbers
 */
function seededRandom(seed: string): () => number {
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  // Use hash as seed for pseudo-random generator
  let state = Math.abs(hash);

  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

/**
 * Calculate fuzzy coordinates for a user
 * Offsets the actual city center by 1-3km in a random direction
 * The offset is consistent for each user (seeded by user ID)
 *
 * @param city - The city name
 * @param userId - The user's ID (used as seed for consistent offset)
 * @returns Fuzzy [latitude, longitude] coordinates
 */
export function getFuzzyCoordinates(
  city: string,
  userId: string
): [number, number] {
  const baseCoords = CITY_COORDINATES[city] ?? CITY_COORDINATES["Other"] ?? [20.5937, 78.9629];

  // Create seeded random generator from user ID
  const random = seededRandom(userId);

  // Generate random offset between 1-3km
  const offsetKm = 1 + random() * 2; // 1-3km

  // Random angle (0-360 degrees)
  const angle = random() * 2 * Math.PI;

  // Convert km to approximate degrees
  // 1 degree latitude ≈ 111km
  // 1 degree longitude ≈ 111km * cos(latitude)
  const latOffset = (offsetKm / 111) * Math.cos(angle);
  const lngOffset = (offsetKm / (111 * Math.cos(baseCoords[0] * Math.PI / 180))) * Math.sin(angle);

  return [
    baseCoords[0] + latOffset,
    baseCoords[1] + lngOffset,
  ];
}

/**
 * Get default map center for India
 */
export function getDefaultMapCenter(): [number, number] {
  return [20.5937, 78.9629]; // Center of India
}

/**
 * Get default zoom level
 */
export function getDefaultZoom(): number {
  return 5;
}

/**
 * Get zoom level for a specific city
 */
export function getCityZoom(): number {
  return 11;
}
