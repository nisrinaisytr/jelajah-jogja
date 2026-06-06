// lib/route-optimizer.ts
// Haversine distance + Nearest Neighbor heuristic untuk optimasi rute dalam 1 hari.
// Jarak TIDAK disimpan di DB — selalu dihitung runtime dari koordinat.

export const EARTH_RADIUS_KM = 6371;

interface LatLng {
  latitude: number;
  longitude: number;
}

/** Jarak Haversine antar 2 koordinat (km). */
export function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

export interface NearestNeighborStep<T extends LatLng> {
  dest: T;
  distance: number; // km dari titik sebelumnya
}

/**
 * Nearest Neighbor TSP heuristic.
 * Mulai dari `start` (mis. hotel), pilih destinasi terdekat berikutnya secara berurutan.
 * Mengembalikan urutan optimal + jarak dari titik sebelumnya.
 */
export function nearestNeighbor<T extends LatLng>(start: LatLng, destinations: T[]): NearestNeighborStep<T>[] {
  const remaining = [...destinations];
  const route: NearestNeighborStep<T>[] = [];
  let current: LatLng = start;

  while (remaining.length > 0) {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = haversine(current.latitude, current.longitude, remaining[i].latitude, remaining[i].longitude);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    const [picked] = remaining.splice(bestIdx, 1);
    route.push({ dest: picked, distance: Math.round(bestDist * 100) / 100 });
    current = picked;
  }
  return route;
}
