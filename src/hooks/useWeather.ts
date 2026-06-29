import { useQuery } from '@tanstack/react-query';
import { getWeatherForecast } from '../services/openmeteo';
import { useAppStore } from '../store/useAppStore';

export function useWeather() {
  const { location, selectedDate } = useAppStore();

  return useQuery({
    queryKey: ['weather', location?.lat, location?.lon, selectedDate],
    queryFn: () => {
      if (!location) throw new Error('No location set');
      return getWeatherForecast(location.lat, location.lon, selectedDate);
    },
    enabled: !!location,
    staleTime: 1000 * 60 * 30, // 30 minutes
    retry: 2,
  });
}
