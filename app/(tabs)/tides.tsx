import React from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { TideChart } from '../../src/components/TideChart';
import { SolunarTable } from '../../src/components/SolunarTable';
import { useTides } from '../../src/hooks/useTides';
import { useSolunar } from '../../src/hooks/useSolunar';
import { useWeather } from '../../src/hooks/useWeather';
import { useAppStore } from '../../src/store/useAppStore';

function WeatherBar() {
  const { data: weather, isLoading } = useWeather();

  if (isLoading) {
    return (
      <View className="bg-ocean-800 rounded-xl p-3 mb-4 flex-row items-center">
        <ActivityIndicator size="small" color="#3a7fbe" />
        <Text className="text-ocean-300 text-sm ml-2">Loading weather...</Text>
      </View>
    );
  }

  if (!weather) return null;

  return (
    <View className="bg-ocean-800 rounded-xl p-3 mb-4">
      <View className="flex-row items-center justify-between">
        <View className="items-center">
          <Text className="text-ocean-400 text-xs">Wind</Text>
          <Text className="text-white font-bold text-sm mt-0.5">
            {weather.windSpeed} mph {weather.windDirectionCardinal}
          </Text>
        </View>
        <View className="items-center">
          <Text className="text-ocean-400 text-xs">Temp</Text>
          <Text className="text-white font-bold text-sm mt-0.5">{weather.temperature}°F</Text>
        </View>
        {weather.waveHeight != null && (
          <View className="items-center">
            <Text className="text-ocean-400 text-xs">Waves</Text>
            <Text className="text-white font-bold text-sm mt-0.5">{weather.waveHeight} ft</Text>
          </View>
        )}
        <View className="items-center flex-1 ml-2">
          <Text className="text-ocean-400 text-xs">Conditions</Text>
          <Text className="text-white text-xs font-medium mt-0.5 text-right">
            {weather.weatherDescription}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function TidesScreen() {
  const { selectedDate, setSelectedDate, noaaStationId } = useAppStore();
  const { predictions, minuteData, isLoading, isError } = useTides();
  const solunar = useSolunar();

  const dateObj = parseISO(selectedDate);
  const displayDate = format(dateObj, 'EEEE, MMMM d');

  const prevDay = () => setSelectedDate(format(subDays(dateObj, 1), 'yyyy-MM-dd'));
  const nextDay = () => setSelectedDate(format(addDays(dateObj, 1), 'yyyy-MM-dd'));

  return (
    <SafeAreaView className="flex-1 bg-ocean-950" edges={['top']}>
      {/* Header */}
      <View className="px-4 pt-4 pb-2">
        <Text className="text-white text-xl font-bold">Tides & Solunar</Text>
        <Text className="text-ocean-400 text-xs mt-0.5">Station: {noaaStationId}</Text>
      </View>

      {/* Date navigator */}
      <View className="flex-row items-center justify-between px-4 py-2">
        <TouchableOpacity
          className="bg-ocean-800 rounded-lg p-2"
          onPress={prevDay}
        >
          <Ionicons name="chevron-back" size={20} color="#5ba3e0" />
        </TouchableOpacity>

        <View className="items-center">
          <Text className="text-white font-semibold text-base">{displayDate}</Text>
          <TouchableOpacity onPress={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}>
            <Text className="text-ocean-400 text-xs mt-0.5 underline">Today</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          className="bg-ocean-800 rounded-lg p-2"
          onPress={nextDay}
        >
          <Ionicons name="chevron-forward" size={20} color="#5ba3e0" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Weather */}
        <WeatherBar />

        {/* Tide chart */}
        <Text className="text-ocean-300 text-xs font-semibold uppercase tracking-wider mb-2">
          Tide Curve — MLLW (ft)
        </Text>

        {isLoading ? (
          <View className="bg-ocean-800 rounded-xl items-center justify-center py-16 mb-4">
            <ActivityIndicator size="large" color="#3a7fbe" />
            <Text className="text-ocean-300 text-sm mt-3">Fetching NOAA tide data...</Text>
          </View>
        ) : isError ? (
          <View className="bg-ocean-800 rounded-xl items-center justify-center py-12 mb-4">
            <Ionicons name="warning-outline" size={32} color="#ef4444" />
            <Text className="text-red-400 text-sm mt-2">Failed to load tide data</Text>
            <Text className="text-ocean-400 text-xs mt-1">Check your connection and station ID</Text>
          </View>
        ) : (
          <View className="mb-4">
            <TideChart
              minuteData={minuteData}
              predictions={predictions}
              date={selectedDate}
            />

            {/* Hi/Lo table */}
            <View className="bg-ocean-800 rounded-xl mt-3 overflow-hidden">
              <View className="bg-ocean-700 px-4 py-2">
                <Text className="text-ocean-200 text-xs font-semibold uppercase tracking-wider">
                  Hi / Lo Predictions
                </Text>
              </View>
              {predictions.map((p, i) => (
                <View
                  key={i}
                  className={`flex-row items-center px-4 py-3 ${
                    i < predictions.length - 1 ? 'border-b border-ocean-700' : ''
                  }`}
                >
                  <View
                    className="w-2 h-2 rounded-full mr-3"
                    style={{ backgroundColor: p.type === 'H' ? '#3a7fbe' : '#d97706' }}
                  />
                  <Text className="text-ocean-300 text-sm flex-1">{p.time}</Text>
                  <Text
                    className="font-bold text-sm"
                    style={{ color: p.type === 'H' ? '#8cc4f0' : '#fbbf24' }}
                  >
                    {p.type === 'H' ? 'HIGH' : 'LOW'} {p.height.toFixed(2)} ft
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Solunar table */}
        <Text className="text-ocean-300 text-xs font-semibold uppercase tracking-wider mb-2">
          Solunar Data
        </Text>

        {solunar ? (
          <SolunarTable data={solunar} />
        ) : (
          <View className="bg-ocean-800 rounded-xl p-4 items-center">
            <Text className="text-ocean-400 text-sm">Set a location to see solunar data</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
