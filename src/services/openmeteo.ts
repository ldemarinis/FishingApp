import axios from 'axios';
import type { WeatherData } from '../types';

const BASE_URL = 'https://api.open-meteo.com/v1/forecast';

/**
 * WMO weather code to human-readable description.
 * https://open-meteo.com/en/docs#weathervariables
 */
const WMO_CODES: Record<number, string> = {
  0: 'Clear Sky',
  1: 'Mostly Clear',
  2: 'Partly Cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Icy Fog',
  51: 'Light Drizzle',
  53: 'Drizzle',
  55: 'Heavy Drizzle',
  61: 'Light Rain',
  63: 'Rain',
  65: 'Heavy Rain',
  71: 'Light Snow',
  73: 'Snow',
  75: 'Heavy Snow',
  80: 'Light Showers',
  81: 'Showers',
  82: 'Heavy Showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm w/ Hail',
  99: 'Thunderstorm w/ Heavy Hail',
};

function degreesToCardinal(deg: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(((deg % 360) + 360) % 360 / 22.5) % 16;
  return directions[index];
}

/**
 * Fetch weather data for a given lat/lon and date.
 * Returns the day's forecast: wind, temperature, wave height if coastal.
 * Uses Open-Meteo free API — no key required.
 */
export async function getWeatherForecast(
  lat: number,
  lon: number,
  date: string // "YYYY-MM-DD"
): Promise<WeatherData> {
  const response = await axios.get(BASE_URL, {
    params: {
      latitude: lat,
      longitude: lon,
      daily: [
        'weather_code',
        'temperature_2m_max',
        'windspeed_10m_max',
        'winddirection_10m_dominant',
        'wave_height_max',
      ].join(','),
      hourly: [
        'temperature_2m',
        'windspeed_10m',
        'winddirection_10m',
        'weather_code',
      ].join(','),
      wind_speed_unit: 'mph',
      temperature_unit: 'fahrenheit',
      precipitation_unit: 'inch',
      start_date: date,
      end_date: date,
      timezone: 'auto',
    },
  });

  const daily = response.data.daily;
  const hourly = response.data.hourly;

  if (!daily || !daily.time || daily.time.length === 0) {
    throw new Error('Open-Meteo returned no data');
  }

  // Use daily summary
  const windSpeed: number = daily.windspeed_10m_max?.[0] ?? 0;
  const windDirection: number = daily.winddirection_10m_dominant?.[0] ?? 0;
  const temperature: number = daily.temperature_2m_max?.[0] ?? 70;
  const weatherCode: number = daily.weather_code?.[0] ?? 0;
  const waveHeight: number | undefined = daily.wave_height_max?.[0] ?? undefined;

  return {
    windSpeed,
    windDirection,
    windDirectionCardinal: degreesToCardinal(windDirection),
    waveHeight: waveHeight != null ? Math.round(waveHeight * 3.28084 * 10) / 10 : undefined, // m -> ft
    temperature: Math.round(temperature),
    weatherCode,
    weatherDescription: WMO_CODES[weatherCode] ?? 'Unknown',
  };
}

/**
 * Fetch hourly forecast for charting or more granular planning.
 */
export async function getHourlyForecast(
  lat: number,
  lon: number,
  date: string
): Promise<Array<{ time: string; windSpeed: number; windDir: number; temp: number; code: number }>> {
  const response = await axios.get(BASE_URL, {
    params: {
      latitude: lat,
      longitude: lon,
      hourly: [
        'temperature_2m',
        'windspeed_10m',
        'winddirection_10m',
        'weather_code',
      ].join(','),
      wind_speed_unit: 'mph',
      temperature_unit: 'fahrenheit',
      start_date: date,
      end_date: date,
      timezone: 'auto',
    },
  });

  const hourly = response.data.hourly;
  return (hourly.time as string[]).map((t: string, i: number) => ({
    time: t,
    windSpeed: hourly.windspeed_10m[i] ?? 0,
    windDir: hourly.winddirection_10m[i] ?? 0,
    temp: hourly.temperature_2m[i] ?? 70,
    code: hourly.weather_code[i] ?? 0,
  }));
}
