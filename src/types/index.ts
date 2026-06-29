export interface Location {
  lat: number;
  lon: number;
  name?: string;
}

export interface TidePrediction {
  time: string; // ISO or "YYYY-MM-DD HH:mm"
  height: number; // feet (English units)
  type: 'H' | 'L';
}

export interface TideMinute {
  time: string;
  height: number;
}

export interface SolunarData {
  sunrise: string;    // "HH:mm"
  sunset: string;
  moonrise: string;
  moonset: string;
  moonPhase: number;  // 0–1, 0=new, 0.5=full
  moonPhaseName: string;
  majorPeriods: [string, string][]; // [start, end] pairs "HH:mm"
  minorPeriods: [string, string][];
}

export interface WeatherData {
  windSpeed: number;         // mph
  windDirection: number;     // degrees
  windDirectionCardinal: string; // "NE", "SSW", etc.
  waveHeight?: number;       // feet
  temperature: number;       // °F
  weatherCode: number;
  weatherDescription: string;
}

export interface TimeSlot {
  startTime: string;   // "HH:mm"
  endTime: string;
  locationDesc: string;
  species: string[];
  rigs: string[];
  baits: string[];
  lures: string[];
  strategy: string;
  confidence: number;  // 0–10
}

export interface FishingPlan {
  date: string;
  location: Location;
  summary: string;
  timeSlots: TimeSlot[];
  generalAdvice: string;
}

export interface FishingPlanParams {
  location: Location;
  date: string;
  tides: TidePrediction[];
  solunar: SolunarData;
  weather: WeatherData;
  targetSpecies?: string[];
}

export interface NOAAStation {
  id: string;
  name: string;
  lat: number;
  lon: number;
  distance?: number; // km
}

export type Species =
  | 'Redfish'
  | 'Speckled Trout'
  | 'Flounder'
  | 'Snook'
  | 'Tarpon'
  | 'Sheepshead'
  | 'Black Drum'
  | 'Cobia';

export const ALL_SPECIES: Species[] = [
  'Redfish',
  'Speckled Trout',
  'Flounder',
  'Snook',
  'Tarpon',
  'Sheepshead',
  'Black Drum',
  'Cobia',
];

export interface AppState {
  location: Location | null;
  homePort: Location | null;
  selectedDate: string; // "YYYY-MM-DD"
  targetSpecies: Species[];
  claudeApiKey: string;
  mapboxToken: string;
  noaaStationId: string;
  setLocation: (loc: Location) => void;
  setHomePort: (loc: Location) => void;
  setSelectedDate: (date: string) => void;
  setTargetSpecies: (species: Species[]) => void;
  setClaudeApiKey: (key: string) => void;
  setMapboxToken: (token: string) => void;
  setNoaaStationId: (id: string) => void;
}
