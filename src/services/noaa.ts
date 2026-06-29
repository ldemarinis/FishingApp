import axios from 'axios';
import type { TidePrediction, TideMinute, NOAAStation } from '../types';

const BASE_URL = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter';
const STATIONS_URL = 'https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations.json';

/**
 * Fetch hi/lo tide predictions for a station on a given date.
 * Returns MLLW datum, English units (feet), local standard/daylight time.
 */
export async function getTidePredictions(
  stationId: string,
  date: string // "YYYY-MM-DD"
): Promise<TidePrediction[]> {
  const params = {
    begin_date: date.replace(/-/g, ''),
    end_date: date.replace(/-/g, ''),
    station: stationId,
    product: 'predictions',
    datum: 'MLLW',
    time_zone: 'lst_ldt',
    interval: 'hilo',
    units: 'english',
    application: 'TideMaster',
    format: 'json',
  };

  const response = await axios.get(BASE_URL, { params });

  if (response.data.error) {
    throw new Error(`NOAA API error: ${response.data.error.message}`);
  }

  const predictions: TidePrediction[] = (response.data.predictions ?? []).map(
    (p: { t: string; v: string; type: string }) => ({
      time: p.t,
      height: parseFloat(p.v),
      type: p.type as 'H' | 'L',
    })
  );

  return predictions;
}

/**
 * Fetch minute-interval tide predictions for a smooth chart curve.
 * Uses 6-minute interval (finest available without hilo interval).
 */
export async function getTideMinutePredictions(
  stationId: string,
  date: string // "YYYY-MM-DD"
): Promise<TideMinute[]> {
  const params = {
    begin_date: date.replace(/-/g, ''),
    end_date: date.replace(/-/g, ''),
    station: stationId,
    product: 'predictions',
    datum: 'MLLW',
    time_zone: 'lst_ldt',
    interval: '6',
    units: 'english',
    application: 'TideMaster',
    format: 'json',
  };

  const response = await axios.get(BASE_URL, { params });

  if (response.data.error) {
    throw new Error(`NOAA API error: ${response.data.error.message}`);
  }

  return (response.data.predictions ?? []).map(
    (p: { t: string; v: string }) => ({
      time: p.t,
      height: parseFloat(p.v),
    })
  );
}

/**
 * Find the nearest NOAA tide prediction station to lat/lon.
 * Uses the NOAA metadata API and filters for type=R (reference) stations.
 */
export async function getNearestStation(
  lat: number,
  lon: number
): Promise<NOAAStation> {
  const response = await axios.get(STATIONS_URL, {
    params: { type: 'tidepredictions', units: 'english' },
  });

  const stations: NOAAStation[] = (response.data.stations ?? []).map(
    (s: { id: string; name: string; lat: number; lng: number }) => ({
      id: s.id,
      name: s.name,
      lat: s.lat,
      lon: s.lng,
      distance: haversineKm(lat, lon, s.lat, s.lng),
    })
  );

  if (stations.length === 0) {
    throw new Error('No NOAA tide stations found');
  }

  stations.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
  return stations[0];
}

/** NOAA nautical chart (RNC) tile URL template for Mapbox raster source */
export function getNOAATileUrl(): string {
  return 'https://tileservice.charts.noaa.gov/tiles/50000_1/{z}/{x}/{y}.png';
}

/** Haversine distance in km */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Given a list of hi/lo predictions, return the current tide status for display.
 */
export function getCurrentTideStatus(
  predictions: TidePrediction[],
  now: Date = new Date()
): {
  currentHeight: number | null;
  nextEvent: TidePrediction | null;
  trend: 'rising' | 'falling' | 'unknown';
} {
  if (predictions.length === 0) {
    return { currentHeight: null, nextEvent: null, trend: 'unknown' };
  }

  const nowMs = now.getTime();

  // Find the previous and next hi/lo around now
  let prev: TidePrediction | null = null;
  let next: TidePrediction | null = null;

  for (const p of predictions) {
    const t = parseNoaaTime(p.time).getTime();
    if (t <= nowMs) {
      prev = p;
    } else if (!next) {
      next = p;
      break;
    }
  }

  if (!prev || !next) {
    return { currentHeight: null, nextEvent: next, trend: 'unknown' };
  }

  const prevMs = parseNoaaTime(prev.time).getTime();
  const nextMs = parseNoaaTime(next.time).getTime();
  const fraction = (nowMs - prevMs) / (nextMs - prevMs);
  // Simple linear interpolation (good enough for status display)
  const currentHeight = prev.height + fraction * (next.height - prev.height);
  const trend: 'rising' | 'falling' = next.type === 'H' ? 'rising' : 'falling';

  return { currentHeight, nextEvent: next, trend };
}

/** Parse NOAA "YYYY-MM-DD HH:mm" time strings to Date */
export function parseNoaaTime(timeStr: string): Date {
  // "2024-01-15 06:23" -> Date
  return new Date(timeStr.replace(' ', 'T'));
}
