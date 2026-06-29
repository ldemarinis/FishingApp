import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ExpoLocation from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { MapViewComponent } from '../../src/components/MapView';
import { LocationSearch } from '../../src/components/LocationSearch';
import { useAppStore } from '../../src/store/useAppStore';
import { useTides } from '../../src/hooks/useTides';
import { getCurrentTideStatus, parseNoaaTime } from '../../src/services/noaa';
import { format } from 'date-fns';

function TideStatusCard() {
  const { predictions, isLoading } = useTides();
  const status = getCurrentTideStatus(predictions);

  if (isLoading) {
    return (
      <View className="bg-ocean-900/95 rounded-2xl p-4 mx-4 mb-4 border border-ocean-700">
        <ActivityIndicator size="small" color="#3a7fbe" />
      </View>
    );
  }

  if (predictions.length === 0) return null;

  const trendColor =
    status.trend === 'rising'
      ? '#22c55e'
      : status.trend === 'falling'
      ? '#ef4444'
      : '#9ca3af';

  const trendIcon =
    status.trend === 'rising' ? 'arrow-up' : status.trend === 'falling' ? 'arrow-down' : 'remove';

  return (
    <View className="bg-ocean-900/95 rounded-2xl p-4 mx-4 mb-4 border border-ocean-700">
      <View className="flex-row items-center justify-between">
        {/* Current height */}
        <View>
          <Text className="text-ocean-400 text-xs uppercase tracking-wider">Current Tide</Text>
          <View className="flex-row items-center mt-1">
            <Text className="text-white text-2xl font-bold">
              {status.currentHeight != null ? status.currentHeight.toFixed(1) : '--'}
            </Text>
            <Text className="text-ocean-300 text-sm ml-1">ft</Text>
            <Ionicons
              name={trendIcon as keyof typeof Ionicons.glyphMap}
              size={18}
              color={trendColor}
              style={{ marginLeft: 6 }}
            />
          </View>
        </View>

        {/* Divider */}
        <View className="w-px bg-ocean-700 h-12 mx-4" />

        {/* Next event */}
        {status.nextEvent && (
          <View className="flex-1">
            <Text className="text-ocean-400 text-xs uppercase tracking-wider">
              Next {status.nextEvent.type === 'H' ? 'High' : 'Low'}
            </Text>
            <Text className="text-white font-bold text-lg mt-1">
              {status.nextEvent.time.split(' ')[1] ?? status.nextEvent.time}
            </Text>
            <Text className="text-ocean-300 text-xs">
              {status.nextEvent.height.toFixed(1)} ft
            </Text>
          </View>
        )}

        {/* All tides today */}
        <View className="ml-2">
          {predictions.slice(0, 4).map((p, i) => (
            <View key={i} className="flex-row items-center mb-0.5">
              <View
                className="w-1.5 h-1.5 rounded-full mr-1.5"
                style={{ backgroundColor: p.type === 'H' ? '#3a7fbe' : '#d97706' }}
              />
              <Text className="text-ocean-300 text-xs">
                {p.time.split(' ')[1]} {p.type === 'H' ? '↑' : '↓'} {p.height.toFixed(1)}ft
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

export default function MapScreen() {
  const router = useRouter();
  const { location, setLocation, setNoaaStationId } = useAppStore();
  const [locatingUser, setLocatingUser] = useState(false);

  const requestLocation = async () => {
    setLocatingUser(true);
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocatingUser(false);
        return;
      }
      const pos = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced,
      });
      const { latitude, longitude } = pos.coords;

      // Reverse geocode for name
      let name = `${latitude.toFixed(3)}°N, ${Math.abs(longitude).toFixed(3)}°W`;
      try {
        const geo = await ExpoLocation.reverseGeocodeAsync({ latitude, longitude });
        if (geo.length > 0) {
          const g = geo[0];
          name = [g.city, g.region].filter(Boolean).join(', ');
        }
      } catch { /* non-fatal */ }

      setLocation({ lat: latitude, lon: longitude, name });
    } catch { /* non-fatal */ }
    setLocatingUser(false);
  };

  return (
    <View className="flex-1 bg-ocean-950">
      {/* Map takes full screen */}
      <MapViewComponent style={{ flex: 1 }} />

      {/* Overlay: search + locate */}
      <SafeAreaView
        className="absolute top-0 left-0 right-0"
        edges={['top']}
        pointerEvents="box-none"
      >
        <View className="flex-row items-center px-4 pt-2 gap-2">
          <View className="flex-1">
            <LocationSearch />
          </View>
          <TouchableOpacity
            className="bg-ocean-800 rounded-xl p-2.5 items-center justify-center"
            onPress={requestLocation}
            disabled={locatingUser}
          >
            {locatingUser ? (
              <ActivityIndicator size="small" color="#3a7fbe" />
            ) : (
              <Ionicons name="locate" size={20} color="#3a7fbe" />
            )}
          </TouchableOpacity>
        </View>

        {/* Location name badge */}
        {location?.name && (
          <View className="mx-4 mt-2 bg-ocean-900/80 rounded-lg px-3 py-1.5 self-start">
            <Text className="text-ocean-200 text-xs font-medium">{location.name}</Text>
          </View>
        )}
      </SafeAreaView>

      {/* Bottom: tide status + FAB */}
      <SafeAreaView className="absolute bottom-0 left-0 right-0" edges={['bottom']}>
        <TideStatusCard />

        {/* Plan My Day FAB */}
        <View className="px-4 mb-2">
          <TouchableOpacity
            className="bg-tide-high rounded-2xl py-4 items-center flex-row justify-center gap-2"
            onPress={() => router.push('/(tabs)/plan')}
            activeOpacity={0.85}
          >
            <Ionicons name="fish" size={20} color="white" />
            <Text className="text-white font-bold text-base">Plan My Day</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}
