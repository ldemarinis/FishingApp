import React from 'react';
import { View, Text } from 'react-native';
import type { SolunarData } from '../types';

interface SolunarTableProps {
  data: SolunarData;
}

function MoonPhaseIcon({ phase }: { phase: number }) {
  // Simple text-based moon phase
  if (phase < 0.0625 || phase >= 0.9375) return <Text className="text-2xl">🌑</Text>;
  if (phase < 0.1875) return <Text className="text-2xl">🌒</Text>;
  if (phase < 0.3125) return <Text className="text-2xl">🌓</Text>;
  if (phase < 0.4375) return <Text className="text-2xl">🌔</Text>;
  if (phase < 0.5625) return <Text className="text-2xl">🌕</Text>;
  if (phase < 0.6875) return <Text className="text-2xl">🌖</Text>;
  if (phase < 0.8125) return <Text className="text-2xl">🌗</Text>;
  return <Text className="text-2xl">🌘</Text>;
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View className="flex-row justify-between items-center py-2 border-b border-ocean-700">
      <Text className="text-ocean-300 text-sm">{label}</Text>
      <Text className={`text-sm font-medium ${accent ? 'text-yellow-300' : 'text-white'}`}>
        {value}
      </Text>
    </View>
  );
}

function PeriodBadge({ period, type }: { period: [string, string]; type: 'major' | 'minor' }) {
  const bgColor = type === 'major' ? 'bg-blue-600' : 'bg-blue-900';
  const textColor = type === 'major' ? 'text-white' : 'text-blue-300';
  const label = type === 'major' ? 'MAJOR' : 'Minor';
  const dot = type === 'major' ? '●●●' : '●●';

  return (
    <View className={`${bgColor} rounded-lg px-3 py-2 mb-2`}>
      <View className="flex-row justify-between items-center">
        <Text className={`${textColor} text-xs font-bold`}>{label} {dot}</Text>
        <Text className={`${textColor} text-sm font-semibold`}>
          {period[0]} – {period[1]}
        </Text>
      </View>
    </View>
  );
}

export function SolunarTable({ data }: SolunarTableProps) {
  const moonPct = Math.round(data.moonPhase * 100);

  return (
    <View className="bg-ocean-800 rounded-xl p-4">
      {/* Moon phase header */}
      <View className="flex-row items-center mb-4">
        <MoonPhaseIcon phase={data.moonPhase} />
        <View className="ml-3">
          <Text className="text-white font-bold text-base">{data.moonPhaseName}</Text>
          <Text className="text-ocean-300 text-xs">{moonPct}% illuminated</Text>
        </View>
      </View>

      {/* Sun/moon times */}
      <View className="mb-4">
        <Row label="☀️ Sunrise" value={data.sunrise} />
        <Row label="☀️ Sunset" value={data.sunset} />
        <Row label="🌙 Moonrise" value={data.moonrise} accent />
        <Row label="🌙 Moonset" value={data.moonset} accent />
      </View>

      {/* Solunar periods */}
      <View>
        <Text className="text-ocean-300 text-xs font-semibold uppercase tracking-wider mb-2">
          Solunar Feeding Periods
        </Text>

        {data.majorPeriods.map((p, i) => (
          <PeriodBadge key={`major-${i}`} period={p} type="major" />
        ))}

        {data.minorPeriods.map((p, i) => (
          <PeriodBadge key={`minor-${i}`} period={p} type="minor" />
        ))}

        <Text className="text-ocean-400 text-xs mt-2 leading-4">
          Major periods (2h) = moon overhead/underfoot. Minor periods (1h) = moonrise/moonset.
          Periods coinciding with tide changes produce the best bite.
        </Text>
      </View>
    </View>
  );
}
