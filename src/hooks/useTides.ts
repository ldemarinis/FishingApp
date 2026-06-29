import { useQuery } from '@tanstack/react-query';
import { getTidePredictions, getTideMinutePredictions } from '../services/noaa';
import { useAppStore } from '../store/useAppStore';

export function useTides() {
  const { noaaStationId, selectedDate } = useAppStore();

  const hiLoQuery = useQuery({
    queryKey: ['tides-hilo', noaaStationId, selectedDate],
    queryFn: () => getTidePredictions(noaaStationId, selectedDate),
    staleTime: 1000 * 60 * 60, // 1 hour
    retry: 2,
  });

  const minuteQuery = useQuery({
    queryKey: ['tides-minute', noaaStationId, selectedDate],
    queryFn: () => getTideMinutePredictions(noaaStationId, selectedDate),
    staleTime: 1000 * 60 * 60,
    retry: 2,
  });

  return {
    predictions: hiLoQuery.data ?? [],
    minuteData: minuteQuery.data ?? [],
    isLoading: hiLoQuery.isLoading || minuteQuery.isLoading,
    isError: hiLoQuery.isError || minuteQuery.isError,
    error: hiLoQuery.error ?? minuteQuery.error,
  };
}
