import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../store/useAppStore';
import { getNearestStation } from '../services/noaa';
import type { Location } from '../types';

interface Suggestion {
  name: string;
  lat: number;
  lon: number;
}

// Well-known inshore fishing locations with good NOAA coverage
const POPULAR_LOCATIONS: Suggestion[] = [
  { name: 'Tampa Bay, FL', lat: 27.7676, lon: -82.6403 },
  { name: 'Charlotte Harbor, FL', lat: 26.9, lon: -82.05 },
  { name: 'Indian River Lagoon, FL', lat: 27.95, lon: -80.57 },
  { name: 'Mosquito Lagoon, FL', lat: 28.75, lon: -80.83 },
  { name: 'Galveston Bay, TX', lat: 29.45, lon: -94.85 },
  { name: 'Matagorda Bay, TX', lat: 28.5, lon: -96.3 },
  { name: 'Chesapeake Bay, VA', lat: 37.0, lon: -76.3 },
  { name: 'Pamlico Sound, NC', lat: 35.5, lon: -76.0 },
  { name: 'Charleston Harbor, SC', lat: 32.78, lon: -79.94 },
  { name: 'Mobile Bay, AL', lat: 30.55, lon: -87.9 },
  { name: 'Pensacola Bay, FL', lat: 30.4, lon: -87.22 },
  { name: 'Mississippi Sound, MS', lat: 30.3, lon: -89.1 },
];

interface LocationSearchProps {
  onSelect?: (location: Location) => void;
}

export function LocationSearch({ onSelect }: LocationSearchProps) {
  const { setLocation, setNoaaStationId } = useAppStore();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    if (text.length < 2) {
      setSuggestions(POPULAR_LOCATIONS);
      return;
    }
    const lower = text.toLowerCase();
    const filtered = POPULAR_LOCATIONS.filter((l) =>
      l.name.toLowerCase().includes(lower)
    );
    setSuggestions(filtered);
  }, []);

  const handleSelect = useCallback(
    async (suggestion: Suggestion) => {
      setIsOpen(false);
      setQuery(suggestion.name);
      setIsLoading(true);
      try {
        const loc: Location = {
          lat: suggestion.lat,
          lon: suggestion.lon,
          name: suggestion.name,
        };
        setLocation(loc);
        onSelect?.(loc);

        // Find nearest NOAA station
        const station = await getNearestStation(suggestion.lat, suggestion.lon);
        setNoaaStationId(station.id);
      } catch {
        // Non-fatal — station lookup failure just means we keep the default
      } finally {
        setIsLoading(false);
      }
    },
    [setLocation, setNoaaStationId, onSelect]
  );

  const handleFocus = useCallback(() => {
    setIsOpen(true);
    setSuggestions(query.length >= 2 ? suggestions : POPULAR_LOCATIONS);
  }, [query, suggestions]);

  return (
    <View className="relative">
      <View className="flex-row items-center bg-ocean-800 rounded-xl px-3 py-2">
        <Ionicons name="search-outline" size={18} color="#5ba3e0" />
        <TextInput
          className="flex-1 text-white text-sm ml-2"
          placeholder="Search fishing location..."
          placeholderTextColor="#5ba3e0"
          value={query}
          onChangeText={handleSearch}
          onFocus={handleFocus}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        />
        {isLoading && <ActivityIndicator size="small" color="#5ba3e0" />}
        {query.length > 0 && !isLoading && (
          <TouchableOpacity onPress={() => { setQuery(''); setIsOpen(false); }}>
            <Ionicons name="close-circle" size={18} color="#5ba3e0" />
          </TouchableOpacity>
        )}
      </View>

      {isOpen && suggestions.length > 0 && (
        <View className="absolute top-12 left-0 right-0 bg-ocean-800 rounded-xl overflow-hidden z-50 shadow-lg">
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.name}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                className="flex-row items-center px-4 py-3 border-b border-ocean-700"
                onPress={() => handleSelect(item)}
              >
                <Ionicons name="location-outline" size={14} color="#5ba3e0" />
                <Text className="text-white text-sm ml-2">{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}
