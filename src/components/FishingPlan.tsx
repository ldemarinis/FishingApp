import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { FishingPlan as FishingPlanType, TimeSlot } from '../types';

interface FishingPlanProps {
  plan: FishingPlanType;
}

function ConfidenceBar({ score }: { score: number }) {
  const pct = Math.min(10, Math.max(0, score)) * 10;
  const color = score >= 7 ? '#22c55e' : score >= 5 ? '#f59e0b' : '#ef4444';
  return (
    <View className="mt-1">
      <View className="flex-row justify-between mb-1">
        <Text className="text-ocean-300 text-xs">Confidence</Text>
        <Text className="text-xs font-bold" style={{ color }}>{score}/10</Text>
      </View>
      <View className="bg-ocean-700 rounded-full h-1.5 overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </View>
    </View>
  );
}

function TagList({ items, color }: { items: string[]; color: string }) {
  if (items.length === 0) return null;
  return (
    <View className="flex-row flex-wrap gap-1 mt-1">
      {items.map((item, i) => (
        <View key={i} className="rounded-full px-2 py-0.5" style={{ backgroundColor: color + '33' }}>
          <Text className="text-xs" style={{ color }}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function TimeSlotCard({ slot, index }: { slot: TimeSlot; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);

  return (
    <View className="bg-ocean-800 rounded-xl mb-3 overflow-hidden">
      <TouchableOpacity
        className="p-4"
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View className="bg-ocean-600 rounded-lg px-2 py-1 mr-3">
              <Text className="text-white text-xs font-bold">
                {slot.startTime}–{slot.endTime}
              </Text>
            </View>
            <Text className="text-white font-semibold flex-1" numberOfLines={1}>
              {slot.locationDesc}
            </Text>
          </View>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color="#5ba3e0"
          />
        </View>

        <View className="flex-row flex-wrap gap-1 mt-2">
          {slot.species.map((s, i) => (
            <View key={i} className="bg-tide-high/20 rounded-full px-2 py-0.5">
              <Text className="text-tide-high text-xs font-medium">{s}</Text>
            </View>
          ))}
        </View>

        <ConfidenceBar score={slot.confidence} />
      </TouchableOpacity>

      {expanded && (
        <View className="px-4 pb-4 border-t border-ocean-700">
          {/* Strategy */}
          <Text className="text-ocean-200 text-sm leading-5 mt-3">{slot.strategy}</Text>

          {/* Rigs */}
          {slot.rigs.length > 0 && (
            <View className="mt-3">
              <Text className="text-ocean-400 text-xs font-semibold uppercase tracking-wider mb-1">
                Rigs
              </Text>
              <TagList items={slot.rigs} color="#8cc4f0" />
            </View>
          )}

          {/* Baits */}
          {slot.baits.length > 0 && (
            <View className="mt-2">
              <Text className="text-ocean-400 text-xs font-semibold uppercase tracking-wider mb-1">
                Live/Cut Baits
              </Text>
              <TagList items={slot.baits} color="#86efac" />
            </View>
          )}

          {/* Lures */}
          {slot.lures.length > 0 && (
            <View className="mt-2">
              <Text className="text-ocean-400 text-xs font-semibold uppercase tracking-wider mb-1">
                Artificials
              </Text>
              <TagList items={slot.lures} color="#fcd34d" />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

export function FishingPlan({ plan }: FishingPlanProps) {
  return (
    <View>
      {/* Summary card */}
      <View className="bg-ocean-700 rounded-xl p-4 mb-4">
        <View className="flex-row items-center mb-2">
          <Ionicons name="fish" size={18} color="#3a7fbe" />
          <Text className="text-white font-bold text-base ml-2">Today's Plan</Text>
        </View>
        <Text className="text-ocean-100 text-sm leading-5">{plan.summary}</Text>
      </View>

      {/* Time slots */}
      <Text className="text-ocean-300 text-xs font-semibold uppercase tracking-wider mb-3">
        Fishing Schedule — {plan.timeSlots.length} windows
      </Text>

      {plan.timeSlots.map((slot, i) => (
        <TimeSlotCard key={i} slot={slot} index={i} />
      ))}

      {/* General advice */}
      <View className="bg-ocean-800 rounded-xl p-4 mt-2">
        <View className="flex-row items-center mb-2">
          <Ionicons name="bulb-outline" size={16} color="#fbbf24" />
          <Text className="text-yellow-300 font-semibold text-sm ml-1">Pro Tips</Text>
        </View>
        <Text className="text-ocean-200 text-sm leading-5">{plan.generalAdvice}</Text>
      </View>
    </View>
  );
}
