import { useCallback, useEffect, useState } from 'react';
import { fetchLocationEnvironmentalData, reverseGeocode } from '../services/openMeteo';
import type { EnvironmentalData, LocationInfo } from '../types/airQuality';
import { useLocalStorage } from './useLocalStorage';

export const DEFAULT_LOCATIONS: LocationInfo[] = [
  {
    id: '28.6139,77.2090',
    name: 'New Delhi',
    country: 'India',
    admin1: 'Delhi',
    latitude: 28.6139,
    longitude: 77.209,
  },
  {
    id: '51.5074,-0.1278',
    name: 'London',
    country: 'United Kingdom',
    admin1: 'England',
    latitude: 51.5074,
    longitude: -0.1278,
  },
  {
    id: '40.7128,-74.0060',
    name: 'New York',
    country: 'United States',
    admin1: 'New York',
    latitude: 40.7128,
    longitude: -74.006,
  },
];

export function useAirQuality() {
  const [selectedLocation, setSelectedLocation] = useLocalStorage<LocationInfo>(
    'airaware_selected_location',
    DEFAULT_LOCATIONS[0]
  );
  const [favorites, setFavorites] = useLocalStorage<LocationInfo[]>(
    'airaware_favorites',
    DEFAULT_LOCATIONS
  );

  const [data, setData] = useState<EnvironmentalData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState<boolean>(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const loadData = useCallback(async (loc: LocationInfo) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchLocationEnvironmentalData(loc);
      setData(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch air quality data.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData(selectedLocation);
  }, [selectedLocation, loadData]);

  const selectLocation = useCallback(
    (loc: LocationInfo) => {
      setGeoError(null);
      setSelectedLocation(loc);
    },
    [setSelectedLocation]
  );

  const refresh = useCallback(() => {
    void loadData(selectedLocation);
  }, [loadData, selectedLocation]);

  const detectCurrentLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const resolved = await reverseGeocode(latitude, longitude);
          setSelectedLocation(resolved);
        } catch {
          setGeoError('Detected coordinates, but could not resolve city name.');
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError('Location permission was denied. You can search for any city manually.');
        } else if (err.code === err.TIMEOUT) {
          setGeoError('Location detection timed out. Please try again or search manually.');
        } else {
          setGeoError('Unable to determine your current location.');
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, [setSelectedLocation]);

  const toggleFavorite = useCallback(
    (loc: LocationInfo) => {
      setFavorites((prev) => {
        const exists = prev.some((f) => f.id === loc.id);
        if (exists) {
          return prev.filter((f) => f.id !== loc.id);
        }
        return [loc, ...prev].slice(0, 8);
      });
    },
    [setFavorites]
  );

  const isFavorite = useCallback(
    (locId: string) => favorites.some((f) => f.id === locId),
    [favorites]
  );

  return {
    selectedLocation,
    selectLocation,
    data,
    loading,
    error,
    refresh,
    detectCurrentLocation,
    locating,
    geoError,
    favorites,
    toggleFavorite,
    isFavorite,
  };
}

