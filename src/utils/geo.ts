import * as turf from '@turf/turf';
import mapboxgl from 'mapbox-gl';

/**
 * Converts longitude/latitude to metres relative to an origin point.
 * Uses a simple equirectangular projection approximation for small areas.
 */
export function lngLatToMetres(lngLat: [number, number], origin: [number, number]): { x: number; z: number } {
  const [lng, lat] = lngLat;
  const [originLng, originLat] = origin;

  // Distance in metres
  const xDist = turf.distance(turf.point([originLng, lat]), turf.point([lng, lat]), { units: 'meters' });
  const zDist = turf.distance(turf.point([lng, originLat]), turf.point([lng, lat]), { units: 'meters' });

  return {
    x: lng > originLng ? xDist : -xDist,
    z: lat < originLat ? zDist : -zDist, // Mapbox Y is south-increasing in some contexts, but here we want Three.js Z (south = positive)
  };
}

export function metresToLngLat(x: number, z: number, origin: [number, number]): [number, number] {
  const [originLng, originLat] = origin;
  
  // Approximate conversion
  const destinationX = turf.destination(turf.point(origin), x, 90, { units: 'meters' });
  const finalPoint = turf.destination(destinationX, z, 180, { units: 'meters' });
  
  return finalPoint.geometry.coordinates as [number, number];
}

/**
 * Checks if a point (in metres) is inside the site boundary.
 */
export function isPointInBoundary(x: number, z: number, origin: [number, number], boundary: [number, number][]): boolean {
  if (boundary.length < 3) return false;
  
  // Ensure the polygon is closed for Turf
  const closedBoundary = [...boundary];
  if (
    closedBoundary[0][0] !== closedBoundary[closedBoundary.length - 1][0] ||
    closedBoundary[0][1] !== closedBoundary[closedBoundary.length - 1][1]
  ) {
    closedBoundary.push(closedBoundary[0]);
  }

  const pointLngLat = metresToLngLat(x, z, origin);
  const poly = turf.polygon([closedBoundary]);
  return turf.booleanPointInPolygon(turf.point(pointLngLat), poly);
}

/**
 * Gets the bounding box of a boundary in metres.
 */
export function getBoundaryExtentMetres(boundary: [number, number][], origin: [number, number]) {
  if (boundary.length === 0) return { minX: 0, maxX: 0, minZ: 0, maxZ: 0 };
  
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  
  boundary.forEach(coord => {
    const { x, z } = lngLatToMetres(coord, origin);
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minZ = Math.min(minZ, z);
    maxZ = Math.max(maxZ, z);
  });
  
  return { minX, maxX, minZ, maxZ };
}
