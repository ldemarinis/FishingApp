import { useMemo } from 'react';
import { computeSolunar, lonToUtcOffset } from '../services/solunar';
import { useAppStore } from '../store/useAppStore';
import type { SolunarData } from '../types';

export function useSolunar(): SolunarData | null {
  const { location, selectedDate } = useAppStore();

  return useMemo(() => {
    if (!location) return null;
    const utcOffset = lonToUtcOffset(location.lon);
    return computeSolunar(selectedDate, location.lat, location.lon, utcOffset);
  }, [location, selectedDate]);
}
