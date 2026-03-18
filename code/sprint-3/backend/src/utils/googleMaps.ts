import axios from 'axios';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export interface LatLng {
  lat: number;
  lng: number;
}

export interface PlaceLocation {
  placeId?: string;
  lat?: number;
  lng?: number;
  via?: boolean;
}

export type LocationInput = LatLng | PlaceLocation | [number, number] | string | null | undefined;

export interface DirectionsParams {
  origin: LocationInput;
  destination: LocationInput;
  waypoints?: (PlaceLocation | LocationInput)[];
  alternatives?: boolean;
  departureTime?: string | Date;
  optimizeWaypoints?: boolean;
}

// origin/destination รับได้ทั้ง {lat,lng} หรือ place_id
const normalizeLocation = (loc: LocationInput): string | null => {
  if (!loc) return null;
  if (typeof loc === 'object' && !Array.isArray(loc)) {
    if ('placeId' in loc && loc.placeId) return `place_id:${loc.placeId}`;
    if ('lat' in loc && 'lng' in loc && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
      return `${loc.lat},${loc.lng}`;
    }
  }
  if (Array.isArray(loc) && loc.length === 2) {
    return `${loc[0]},${loc[1]}`;
  }
  // fallback: string address
  if (typeof loc === 'string') return loc;
  return null;
};

export const getDirections = async ({
  origin,
  destination,
  waypoints = [],
  alternatives = true,
  departureTime,
  optimizeWaypoints,
}: DirectionsParams): Promise<any> => {
  const originStr = normalizeLocation(origin);
  const destStr = normalizeLocation(destination);
  if (!originStr || !destStr) {
    throw new Error('Invalid origin/destination');
  }

  const params: Record<string, string | number | undefined> = {
    origin: originStr,
    destination: destStr,
    key: GOOGLE_MAPS_API_KEY,
    language: 'th',
    region: 'th',
    alternatives: alternatives ? 'true' : 'false',
  };

  if (waypoints.length) {
    const wp = waypoints
      .map((w) => {
        // ถ้าอยากให้เป็น "ผ่านจุด" (ไม่ถือว่าจอด) ใช้รูปแบบ `via:lat,lng`
        // default: ถือเป็น stopover ปกติ
        const s = normalizeLocation(w);
        return (w && typeof w === 'object' && !Array.isArray(w) && 'via' in w && w.via) ? `via:${s}` : s;
      })
      .filter(Boolean);

    // optimizeWaypoints: ให้ Google จัดลำดับ stopover (ไม่รวม via) ให้อัตโนมัติ
    params.waypoints = (optimizeWaypoints ? 'optimize:true|' : '') + wp.join('|');
  }

  if (departureTime) {
    params.departure_time = Math.floor(new Date(departureTime).getTime() / 1000);
  }

  const url = 'https://maps.googleapis.com/maps/api/directions/json';
  const { data } = await axios.get(url, { params });
  if (data.status !== 'OK') {
    const msg = data.error_message || data.status;
    const err = new Error(`Google Directions error: ${msg}`) as Error & { code?: string };
    err.code = data.status;
    throw err;
  }
  return data;
};

export const geocode = async (address: string): Promise<any> => {
  const url = 'https://maps.googleapis.com/maps/api/geocode/json';
  const { data } = await axios.get(url, {
    params: { address, key: GOOGLE_MAPS_API_KEY, language: 'th', region: 'th' },
  });
  if (data.status !== 'OK') throw new Error(`Geocode error: ${data.status}`);
  return data;
};

export const reverseGeocode = async (lat: number, lng: number): Promise<any> => {
  const url = 'https://maps.googleapis.com/maps/api/geocode/json';
  const { data } = await axios.get(url, {
    params: { latlng: `${lat},${lng}`, key: GOOGLE_MAPS_API_KEY, language: 'th', region: 'th' },
  });
  if (data.status !== 'OK') throw new Error(`Reverse geocode error: ${data.status}`);
  return data;
};
