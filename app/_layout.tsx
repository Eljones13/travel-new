import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { DatabaseProvider } from '@nozbe/watermelondb/react';
import { database } from '../src/db';
import { seedDatabase } from '../src/db/seed_data';
import { seedFestivals } from '../src/db/seeds';
import { seedSchedule } from '../src/db/seeds_schedule';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// Prevent splash screen from auto-hiding before DB + fonts are ready
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({});

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      // Seed runs before splash hides — list is never seen empty on first launch
      Promise.all([seedDatabase(database), seedFestivals(database), seedSchedule(database)]).finally(() => {
        SplashScreen.hideAsync();
      });
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <DatabaseProvider database={database}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" />
    </DatabaseProvider>
  );
}
