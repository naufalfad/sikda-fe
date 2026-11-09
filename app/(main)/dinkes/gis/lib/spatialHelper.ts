/**
 * Spatial Analytics & Helper for SIKDA GIS Dinkes
 */

// Simple & robust Ray-Casting Point-in-Polygon (PIP) implementation
export function isPointInPolygonRing(pt: [number, number], ring: number[][]): boolean {
  const [lng, lat] = pt;
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];

    const intersect = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}

export function isPointInFeature(pt: [number, number], feature: any): boolean {
  if (!feature?.geometry?.coordinates) return false;
  const geomType = feature.geometry.type;
  const coords = feature.geometry.coordinates;

  if (geomType === 'Polygon') {
    return isPointInPolygonRing(pt, coords[0]);
  } else if (geomType === 'MultiPolygon') {
    return coords.some((polyCoords: number[][][]) => isPointInPolygonRing(pt, polyCoords[0]));
  }
  return false;
}

/**
 * Agregasi Jumlah Faskes per Kecamatan (Choropleth Analytics)
 */
export function calculateFaskesPerKecamatan(
  faskesList: any[],
  geojsonKecamatan: any
): Record<string, number> {
  const counts: Record<string, number> = {};
  if (!geojsonKecamatan?.features) return counts;

  geojsonKecamatan.features.forEach((feature: any) => {
    const kecName = feature.properties?.WADMKC;
    if (!kecName) return;
    counts[kecName] = 0;

    faskesList.forEach((f) => {
      // First check kecamatan string match
      if (
        f.wilayahKecamatan?.toLowerCase().includes(kecName.toLowerCase()) ||
        f.kecamatan?.toLowerCase().includes(kecName.toLowerCase())
      ) {
        counts[kecName] += 1;
        return;
      }

      // Or spatial PIP check
      const lat = f.latitude ?? (f.titikGps ? parseFloat(f.titikGps.split(',')[0]) : NaN);
      const lng = f.longitude ?? (f.titikGps ? parseFloat(f.titikGps.split(',')[1]) : NaN);

      if (!isNaN(lat) && !isNaN(lng)) {
        if (isPointInFeature([lng, lat], feature)) {
          counts[kecName] += 1;
        }
      }
    });
  });

  return counts;
}

/**
 * Inverted Boundary Masking (Area Luar Wilayah Kabupaten Bogor)
 * Creates a world-bounding polygon with the county boundaries cut out as holes.
 */
export function createInvertedMask(geojson: any): [number, number][][] | null {
  if (!geojson?.features) return null;

  // World outer boundary ring in [lat, lng] format
  const worldOuterRing: [number, number][] = [
    [-85, -180],
    [-85, 180],
    [85, 180],
    [85, -180],
    [-85, -180],
  ];

  const holes: [number, number][][] = [];

  geojson.features.forEach((feature: any) => {
    const geom = feature.geometry;
    if (!geom) return;

    if (geom.type === 'Polygon') {
      const ring = geom.coordinates[0].map(([lng, lat]: [number, number]) => [lat, lng] as [number, number]);
      holes.push(ring);
    } else if (geom.type === 'MultiPolygon') {
      geom.coordinates.forEach((poly: any) => {
        const ring = poly[0].map(([lng, lat]: [number, number]) => [lat, lng] as [number, number]);
        holes.push(ring);
      });
    }
  });

  // Returns array where first is outer boundary, followed by holes
  return [worldOuterRing, ...holes];
}
