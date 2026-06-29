import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { useFishingPlan } from '../../src/hooks/useFishingPlan';
import { FishingPlan } from '../../src/components/FishingPlan';
import { useAppStore } from '../../src/store/useAppStore';

function EmptyState({ onGenerate, claudeApiKey }: { onGenerate: () => void; claudeApiKey: string }) {
  const hasKey = claudeApiKey.length > 10;

  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className="bg-ocean-800 rounded-full p-6 mb-6">
        <Ionicons name="fish" size={48} color="#3a7fbe" />
      </View>
      <Text className="text-white text-xl font-bold text-center mb-2">
        Generate Your Fishing Plan
      </Text>
      <Text className="text-ocean-300 text-sm text-center leading-5 mb-8">
        TideMaster analyzes today's tides, solunar periods, and weather conditions to generate
        an expert AI-powered fishing itinerary for your location.
      </Text>

      {!hasKey && (
        <View className="bg-yellow-900/40 border border-yellow-600/50 rounded-xl p-4 mb-6 w-full">
          <View className="flex-row items-center">
            <Ionicons name="warning-outline" size={16} color="#fbbf24" />
            <Text className="text-yellow-300 text-sm font-semibold ml-2">Claude API Key Required</Text>
          </View>
          <Text className="text-yellow-200/70 text-xs mt-1 leading-4">
            Add your Anthropic Claude API key in Settings to generate fishing plans.
          </Text>
        </View>
      )}

      <TouchableOpacity
        className={`w-full rounded-2xl py-4 items-center flex-row justify-center gap-2 ${
          hasKey ? 'bg-tide-high' : 'bg-ocean-700'
        }`}
        onPress={hasKey ? onGenerate : undefined}
        activeOpacity={hasKey ? 0.85 : 1}
      >
        <Ionicons name="sparkles" size={18} color={hasKey ? 'white' : '#5ba3e0'} />
        <Text className={`font-bold text-base ${hasKey ? 'text-white' : 'text-ocean-400'}`}>
          {hasKey ? 'Generate Plan' : 'Add API Key First'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function LoadingState({ progress }: { progress: string }) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <ActivityIndicator size="large" color="#3a7fbe" />
      <Text className="text-white font-semibold text-base mt-4 text-center">
        {progress || 'Generating your fishing plan...'}
      </Text>
      <Text className="text-ocean-400 text-xs mt-2 text-center">
        Analyzing tides, solunar periods, and weather conditions
      </Text>
    </View>
  );
}

export default function PlanScreen() {
  const { selectedDate, location, claudeApiKey } = useAppStore();
  const { plan, isGenerating, progress, error, generate, reset } = useFishingPlan();

  const displayDate = format(parseISO(selectedDate), 'MMMM d, yyyy');

  return (
    <SafeAreaView className="flex-1 bg-ocean-950" edges={['top']}>
      {/* Header */}
      <View className="px-4 pt-4 pb-3 border-b border-ocean-800">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white text-xl font-bold">Fishing Plan</Text>
            <Text className="text-ocean-400 text-xs mt-0.5">
              {location?.name ?? 'No location'} · {displayDate}
            </Text>
          </View>

          {plan && (
            <TouchableOpacity
              className="bg-ocean-800 rounded-xl px-3 py-2 flex-row items-center gap-1"
              onPress={reset}
            >
              <Ionicons name="refresh" size={16} color="#5ba3e0" />
              <Text className="text-ocean-300 text-sm">New</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      {isGenerating ? (
        <LoadingState progress={progress} />
      ) : error ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="warning-outline" size={40} color="#ef4444" />
          <Text className="text-red-400 text-base font-semibold mt-3 text-center">
            Plan Generation Failed
          </Text>
          <Text className="text-ocean-300 text-sm mt-2 text-center leading-5">{error}</Text>
          <TouchableOpacity
            className="mt-6 bg-ocean-800 rounded-xl px-6 py-3 flex-row items-center gap-2"
            onPress={generate}
          >
            <Ionicons name="refresh" size={18} color="#5ba3e0" />
            <Text className="text-ocean-200 font-semibold">Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : plan ? (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          <FishingPlan plan={plan} />

          <TouchableOpacity
            className="mt-4 border border-ocean-700 rounded-xl py-3 items-center flex-row justify-center gap-2"
            onPress={generate}
          >
            <Ionicons name="refresh-outline" size={16} color="#5ba3e0" />
            <Text className="text-ocean-300 text-sm">Regenerate Plan</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <EmptyState onGenerate={generate} claudeApiKey={claudeApiKey} />
      )}
    </SafeAreaView>
  );
}
