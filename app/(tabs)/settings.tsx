import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../src/store/useAppStore';
import { getNearestStation } from '../../src/services/noaa';
import { ALL_SPECIES, type Species } from '../../src/types';

function SectionHeader({ title }: { title: string }) {
  return (
    <Text className="text-ocean-400 text-xs font-semibold uppercase tracking-wider mb-2 mt-6 first:mt-0">
      {title}
    </Text>
  );
}

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  hint,
  keyboardType = 'default',
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  hint?: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
}) {
  const [show, setShow] = useState(false);

  return (
    <View className="mb-3">
      <Text className="text-ocean-300 text-xs mb-1">{label}</Text>
      <View className="bg-ocean-800 rounded-xl flex-row items-center px-3">
        <TextInput
          className="flex-1 text-white text-sm py-3"
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#234a74"
          secureTextEntry={secureTextEntry && !show}
          keyboardType={keyboardType}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setShow(!show)}>
            <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={18} color="#5ba3e0" />
          </TouchableOpacity>
        )}
      </View>
      {hint && <Text className="text-ocean-500 text-xs mt-1">{hint}</Text>}
    </View>
  );
}

function SpeciesChip({ species, selected, onToggle }: {
  species: Species;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      className={`rounded-full px-3 py-1.5 mr-2 mb-2 border ${
        selected
          ? 'bg-tide-high border-tide-high'
          : 'bg-transparent border-ocean-600'
      }`}
      onPress={onToggle}
    >
      <Text className={`text-sm font-medium ${selected ? 'text-white' : 'text-ocean-400'}`}>
        {species}
      </Text>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const store = useAppStore();

  const [claudeKey, setClaudeKey] = useState(store.claudeApiKey);
  const [mapboxToken, setMapboxToken] = useState(store.mapboxToken);
  const [stationId, setStationId] = useState(store.noaaStationId);
  const [homeLat, setHomeLat] = useState(store.homePort?.lat.toString() ?? '');
  const [homeLon, setHomeLon] = useState(store.homePort?.lon.toString() ?? '');
  const [homePortName, setHomePortName] = useState(store.homePort?.name ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [isFindingStation, setIsFindingStation] = useState(false);

  const toggleSpecies = (s: Species) => {
    const current = store.targetSpecies;
    if (current.includes(s)) {
      store.setTargetSpecies(current.filter((x) => x !== s));
    } else {
      store.setTargetSpecies([...current, s]);
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    try {
      store.setClaudeApiKey(claudeKey.trim());
      store.setMapboxToken(mapboxToken.trim());
      store.setNoaaStationId(stationId.trim());

      const lat = parseFloat(homeLat);
      const lon = parseFloat(homeLon);
      if (!isNaN(lat) && !isNaN(lon)) {
        store.setHomePort({ lat, lon, name: homePortName || undefined });
        store.setLocation({ lat, lon, name: homePortName || undefined });
      }

      Alert.alert('Saved', 'Settings saved successfully.');
    } catch (e) {
      Alert.alert('Error', 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const findNearestStation = async () => {
    const lat = parseFloat(homeLat);
    const lon = parseFloat(homeLon);
    if (isNaN(lat) || isNaN(lon)) {
      Alert.alert('Error', 'Enter valid latitude and longitude first.');
      return;
    }

    setIsFindingStation(true);
    try {
      const station = await getNearestStation(lat, lon);
      setStationId(station.id);
      Alert.alert(
        'Station Found',
        `Nearest NOAA station:\n${station.name} (${station.id})\n${station.distance?.toFixed(1) ?? '?'} km away`
      );
    } catch (e) {
      Alert.alert('Error', 'Could not find nearby NOAA station. Check your internet connection.');
    } finally {
      setIsFindingStation(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-ocean-950" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Text className="text-white text-xl font-bold mb-1">Settings</Text>
        <Text className="text-ocean-400 text-xs mb-6">
          Configure TideMaster with your API keys and preferences
        </Text>

        {/* API Keys */}
        <SectionHeader title="API Keys" />
        <View className="bg-ocean-800 rounded-xl p-4 mb-2">
          <InputField
            label="Claude API Key (Anthropic)"
            value={claudeKey}
            onChangeText={setClaudeKey}
            placeholder="sk-ant-..."
            secureTextEntry
            hint="Required for AI fishing plan generation. Get yours at console.anthropic.com"
          />
          <InputField
            label="Mapbox Access Token"
            value={mapboxToken}
            onChangeText={setMapboxToken}
            placeholder="pk.eyJ1Ij..."
            secureTextEntry
            hint="Required for NOAA nautical chart map. Get yours at mapbox.com"
          />
        </View>

        {/* Home Port */}
        <SectionHeader title="Home Port" />
        <View className="bg-ocean-800 rounded-xl p-4 mb-2">
          <InputField
            label="Port Name"
            value={homePortName}
            onChangeText={setHomePortName}
            placeholder="e.g. Tampa Bay, FL"
          />
          <View className="flex-row gap-2">
            <View className="flex-1">
              <InputField
                label="Latitude"
                value={homeLat}
                onChangeText={setHomeLat}
                placeholder="27.7676"
                keyboardType="decimal-pad"
              />
            </View>
            <View className="flex-1">
              <InputField
                label="Longitude"
                value={homeLon}
                onChangeText={setHomeLon}
                placeholder="-82.6403"
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          {/* NOAA station */}
          <View className="flex-row items-end gap-2">
            <View className="flex-1">
              <InputField
                label="NOAA Tide Station ID"
                value={stationId}
                onChangeText={setStationId}
                placeholder="8726520"
                keyboardType="numeric"
                hint="Find your station at tidesandcurrents.noaa.gov"
              />
            </View>
            <TouchableOpacity
              className="bg-ocean-600 rounded-xl px-3 py-3 mb-3"
              onPress={findNearestStation}
              disabled={isFindingStation}
            >
              <Text className="text-white text-xs font-semibold">
                {isFindingStation ? 'Finding...' : 'Auto-find'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Target species */}
        <SectionHeader title="Target Species" />
        <View className="bg-ocean-800 rounded-xl p-4 mb-2">
          <Text className="text-ocean-300 text-xs mb-3">
            Select your preferred species for AI plan generation
          </Text>
          <View className="flex-row flex-wrap">
            {ALL_SPECIES.map((s) => (
              <SpeciesChip
                key={s}
                species={s}
                selected={store.targetSpecies.includes(s)}
                onToggle={() => toggleSpecies(s)}
              />
            ))}
          </View>
        </View>

        {/* Save button */}
        <TouchableOpacity
          className="bg-tide-high rounded-2xl py-4 items-center mt-6 flex-row justify-center gap-2"
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.85}
        >
          <Ionicons name="save-outline" size={18} color="white" />
          <Text className="text-white font-bold text-base">
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Text>
        </TouchableOpacity>

        {/* Info */}
        <View className="mt-6 bg-ocean-900 rounded-xl p-4">
          <Text className="text-ocean-300 text-xs font-semibold mb-2">About TideMaster</Text>
          <Text className="text-ocean-500 text-xs leading-4">
            Tide data provided by NOAA CO-OPS (tidesandcurrents.noaa.gov).{'\n'}
            Weather data from Open-Meteo (open-meteo.com) — no key required.{'\n'}
            Solunar calculations use astronomical algorithms (Meeus).{'\n'}
            AI fishing plans powered by Anthropic Claude.{'\n'}
            Nautical charts from NOAA Office of Coast Survey.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
