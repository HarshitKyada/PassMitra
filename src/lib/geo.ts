/**
 * Geolocation and Distance Utilities for Ahmedabad
 */

export const AHMEDABAD_CENTER: [number, number] = [72.5714, 23.0225];

export function calculateHaversineDistance(
  coords1: [number, number], // [lng, lat]
  coords2: [number, number]
): number {
  const [lon1, lat1] = coords1;
  const [lon2, lat2] = coords2;
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

export function formatDistance(distanceKm?: number): string {
  if (distanceKm === undefined || isNaN(distanceKm)) return '~1.4 km away';
  if (distanceKm < 0.5) return 'under 500 m';
  if (distanceKm < 1.0) return `${Math.round(distanceKm * 1000)} m away`;
  return `${distanceKm.toFixed(1)} km away`;
}

export function getDirectionsUrl(lat: number, lng: number, landmark?: string): string {
  const query = landmark ? encodeURIComponent(`${landmark} Ahmedabad`) : `${lat},${lng}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${query}`;
}
