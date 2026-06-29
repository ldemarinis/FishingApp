import { useState, useCallback } from 'react';
import { generateFishingPlan } from '../services/claude';
import { getTidePredictions } from '../services/noaa';
import { computeSolunar, lonToUtcOffset } from '../services/solunar';
import { getWeatherForecast } from '../services/openmeteo';
import { useAppStore } from '../store/useAppStore';
import type { FishingPlan } from '../types';

interface UseFishingPlanResult {
  plan: FishingPlan | null;
  isGenerating: boolean;
  progress: string;
  error: string | null;
  generate: () => Promise<void>;
  reset: () => void;
}

export function useFishingPlan(): UseFishingPlanResult {
  const { location, selectedDate, noaaStationId, targetSpecies, claudeApiKey } = useAppStore();

  const [plan, setPlan] = useState<FishingPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    if (!location) {
      setError('No location set. Please set your location in Settings.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setPlan(null);
    setProgress('');

    try {
      // Step 1: Fetch tides
      setProgress('Fetching tide predictions...');
      const tides = await getTidePredictions(noaaStationId, selectedDate);

      // Step 2: Compute solunar (pure computation, no API)
      setProgress('Computing solunar periods...');
      const utcOffset = lonToUtcOffset(location.lon);
      const solunar = computeSolunar(selectedDate, location.lat, location.lon, utcOffset);

      // Step 3: Fetch weather
      setProgress('Fetching weather forecast...');
      const weather = await getWeatherForecast(location.lat, location.lon, selectedDate);

      // Step 4: Generate plan with Claude
      setProgress('Generating your fishing plan with AI...');
      let streamText = '';

      const result = await generateFishingPlan(
        {
          location,
          date: selectedDate,
          tides,
          solunar,
          weather,
          targetSpecies: targetSpecies.length > 0 ? targetSpecies : undefined,
        },
        claudeApiKey,
        (chunk) => {
          streamText += chunk;
          // Show a snippet of the stream to indicate progress
          setProgress(`Generating plan... (${streamText.length} chars)`);
        }
      );

      setPlan(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(message);
    } finally {
      setIsGenerating(false);
      setProgress('');
    }
  }, [location, selectedDate, noaaStationId, targetSpecies, claudeApiKey]);

  const reset = useCallback(() => {
    setPlan(null);
    setError(null);
    setProgress('');
  }, []);

  return { plan, isGenerating, progress, error, generate, reset };
}
