/**
 * Haversine formula to calculate distance between two GPS coordinates
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Calculate distance from steps
 * @param {number} steps - Number of steps
 * @returns {number} Distance in kilometers
 */
export const calculateDistanceFromSteps = (steps) => {
  // Average step length: 0.762 meters (30 inches)
  return (steps * 0.762) / 1000; // Convert to km
};

/**
 * Calculate calories using MET (Metabolic Equivalent of Task) formula
 * @param {number} timeHours - Time in hours
 * @param {number} weightKg - Weight in kilograms (default: 75kg)
 * @param {number} met - MET value for walking (default: 3.5)
 * @returns {number} Calories burned
 */
export const calculateCaloriesMET = (timeHours, weightKg = 75, met = 3.5) => {
  // MET formula: Calories = MET × Weight (kg) × Time (hours)
  return Math.round(met * weightKg * timeHours);
};

/**
 * Calculate total distance from route coordinates using Haversine
 * @param {Array} route - Array of {latitude, longitude} objects
 * @returns {number} Total distance in kilometers
 */
export const calculateRouteDistance = (route) => {
  if (!route || route.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 1; i < route.length; i++) {
    const prev = route[i - 1];
    const curr = route[i];
    totalDistance += calculateHaversineDistance(
      prev.latitude,
      prev.longitude,
      curr.latitude,
      curr.longitude
    );
  }
  return totalDistance;
};

/**
 * Get date key for storage (YYYY-MM-DD format)
 * @param {Date} date - Date object
 * @returns {string} Date key
 */
export const getDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Check if date is today
 * @param {Date} date - Date to check
 * @returns {boolean} True if date is today
 */
export const isToday = (date) => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

