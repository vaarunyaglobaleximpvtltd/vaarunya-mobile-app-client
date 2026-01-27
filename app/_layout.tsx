import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Vaarunya Prices', headerShown: false }} />
        <Stack.Screen name="details" options={{ title: 'Price Details' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
