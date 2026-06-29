import { create } from 'zustand';
import { format } from 'date-fns';
import type { AppState, Location, Species } from '../types';

export const useAppStore = create<AppState>((set) => ({
  // Default to Tampa Bay area (good inshore fishing, well-covered by NOAA)
  location: {
    lat: 27.7676,
    lon: -82.6403,
    name: 'Tampa Bay, FL',
  },
  homePort: {
    lat: 27.7676,
    lon: -82.6403,
    name: 'Tampa Bay, FL',
  },
  selectedDate: format(new Date(), 'yyyy-MM-dd'),
  targetSpecies: ['Redfish', 'Speckled Trout', 'Flounder'],
  claudeApiKey: process.env.EXPO_PUBLIC_CLAUDE_API_KEY ?? '',
  mapboxToken: process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '',
  // NOAA station 8726520 = St. Petersburg, FL (Tampa Bay)
  noaaStationId: '8726520',

  setLocation: (loc: Location) => set({ location: loc }),
  setHomePort: (loc: Location) => set({ homePort: loc }),
  setSelectedDate: (date: string) => set({ selectedDate: date }),
  setTargetSpecies: (species: Species[]) => set({ targetSpecies: species }),
  setClaudeApiKey: (key: string) => set({ claudeApiKey: key }),
  setMapboxToken: (token: string) => set({ mapboxToken: token }),
  setNoaaStationId: (id: string) => set({ noaaStationId: id }),
}));
