import * as turf from '@turf/turf';
import type { PointCoord, Area, Branch } from '@/types';

export function calculateArea(points: PointCoord[]): number {
  if (points.length < 3) return 0;
  try {
    const coords = points.map((p) => [p.longitude, p.latitude]);
    coords.push(coords[0]);
    const polygon = turf.polygon([coords]);
    return turf.area(polygon);
  } catch {
    return 0;
  }
}

export function formatArea(sqMeters: number): string {
  if (sqMeters < 1000) {
    return `${sqMeters.toFixed(0)} م²`;
  } else if (sqMeters < 1000000) {
    return `${(sqMeters / 1000).toFixed(1)} هزار م²`;
  } else {
    return `${(sqMeters / 1000000).toFixed(2)} کیلومتر²`;
  }
}

export function getPolygonCenter(points: PointCoord[]): PointCoord {
  if (points.length === 0) return { latitude: 35.6892, longitude: 51.3890 };
  if (points.length < 3) {
    const lat = points.reduce((s, p) => s + p.latitude, 0) / points.length;
    const lng = points.reduce((s, p) => s + p.longitude, 0) / points.length;
    return { latitude: lat, longitude: lng };
  }
  try {
    const coords = points.map((p) => [p.longitude, p.latitude]);
    coords.push(coords[0]);
    const polygon = turf.polygon([coords]);
    const center = turf.centroid(polygon);
    return {
      latitude: center.geometry.coordinates[1],
      longitude: center.geometry.coordinates[0],
    };
  } catch {
    const lat = points.reduce((s, p) => s + p.latitude, 0) / points.length;
    const lng = points.reduce((s, p) => s + p.longitude, 0) / points.length;
    return { latitude: lat, longitude: lng };
  }
}

export function formatCoordinate(
  lat: number, 
  lng: number, 
  format: 'lat-lng' | 'lng-lat' = 'lat-lng', 
  style: 'decimal' | 'dms' = 'decimal'
): string {
  if (style === 'dms') {
    const latDMS = decimalToDMS(lat, lat >= 0 ? 'N' : 'S');
    const lngDMS = decimalToDMS(lng, lng >= 0 ? 'E' : 'W');
    return format === 'lat-lng' ? `${latDMS}, ${lngDMS}` : `${lngDMS}, ${latDMS}`;
  }
  const latStr = lat.toFixed(6);
  const lngStr = lng.toFixed(6);
  return format === 'lat-lng' ? `${latStr}, ${lngStr}` : `${lngStr}, ${latStr}`;
}

function decimalToDMS(decimal: number, direction: string): string {
  const abs = Math.abs(decimal);
  const degrees = Math.floor(abs);
  const minutes = Math.floor((abs - degrees) * 60);
  const seconds = ((abs - degrees - minutes / 60) * 3600).toFixed(1);
  return `${degrees}°${minutes}'${seconds}"${direction}`;
}

export function generateGeoJSON(branches: Branch[], areas?: Area[]): object {
  const features: object[] = [];
  
  branches.forEach((b) => {
    // Branch point
    features.push({
      type: 'Feature',
      properties: {
        type: 'branch',
        name: b.name,
        description: b.description || '',
        status: b.status,
        sticker: b.sticker,
        color: b.color,
        phone: b.phone || '',
        address: b.address || '',
      },
      geometry: {
        type: 'Point',
        coordinates: [b.longitude, b.latitude],
      },
    });
    
    // Areas
    const targetAreas = areas ? areas.filter(a => a.branchId === b.id) : b.areas;
    targetAreas.forEach((a) => {
      if (a.points.length >= 3) {
        const coords = a.points.map((p) => [p.longitude, p.latitude]);
        coords.push(coords[0]); // Close polygon
        features.push({
          type: 'Feature',
          properties: {
            type: 'area',
            branchName: b.name,
            areaName: a.name,
            description: a.description || '',
            color: a.fillColor,
            fillOpacity: a.fillOpacity,
            borderColor: a.borderColor,
            borderWidth: a.borderWidth,
            pointsCount: a.points.length,
          },
          geometry: {
            type: 'Polygon',
            coordinates: [coords],
          },
        });
      }
    });
  });
  
  return {
    type: 'FeatureCollection',
    generated: new Date().toISOString(),
    generator: 'MapBranch Glass',
    features,
  };
}

export function generateTXT(branch: Branch, area: Area): string {
  let txt = '';
  txt += `═══════════════════════════════════════\n`;
  txt += `شعبه: ${branch.name}\n`;
  txt += `محدوده: ${area.name}\n`;
  txt += `═══════════════════════════════════════\n\n`;
  txt += `تعداد نقاط: ${area.points.length}\n`;
  txt += `فرمت: Latitude, Longitude\n\n`;
  txt += `─── مختصات نقاط ───\n\n`;
  
  area.points.forEach((p, i) => {
    txt += `${String(i + 1).padStart(2, ' ')}. ${p.latitude.toFixed(6)}, ${p.longitude.toFixed(6)}\n`;
  });
  
  // Close polygon
  if (area.points.length > 0) {
    const first = area.points[0];
    txt += `${String(area.points.length + 1).padStart(2, ' ')}. ${first.latitude.toFixed(6)}, ${first.longitude.toFixed(6)} (بسته شدن)\n`;
  }
  
  const sqm = calculateArea(area.points);
  txt += `\n─── اطلاعات تکمیلی ───\n\n`;
  txt += `مساحت تقریبی: ${formatArea(sqm)}\n`;
  txt += `تاریخ خروجی: ${new Date().toLocaleString('fa-IR')}\n`;
  
  return txt;
}

export function generateCSV(branches: Branch[]): string {
  let csv = 'Branch Name,Area Name,Point Index,Latitude,Longitude\n';
  branches.forEach((b) => {
    if (b.areas.length === 0) {
      csv += `"${b.name}","(no area)",0,${b.latitude.toFixed(6)},${b.longitude.toFixed(6)}\n`;
    } else {
      b.areas.forEach((a) => {
        a.points.forEach((p, i) => {
          csv += `"${b.name}","${a.name}",${i + 1},${p.latitude.toFixed(6)},${p.longitude.toFixed(6)}\n`;
        });
      });
    }
  });
  return csv;
}
