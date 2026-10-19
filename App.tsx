import React, { useCallback, useEffect, useRef, useState } from "react";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useFonts } from "expo-font";
// Imported from each weight's own subpath (rather than the package root)
// so Metro only bundles the specific font files this app actually uses.
import { Fraunces_600SemiBold } from "@expo-google-fonts/fraunces/600SemiBold";
import { Fraunces_700Bold } from "@expo-google-fonts/fraunces/700Bold";
import { Fraunces_900Black } from "@expo-google-fonts/fraunces/900Black";
import { Fraunces_600SemiBold_Italic } from "@expo-google-fonts/fraunces/600SemiBold_Italic";
import { Fraunces_700Bold_Italic } from "@expo-google-fonts/fraunces/700Bold_Italic";
import { Manrope_400Regular } from "@expo-google-fonts/manrope/400Regular";
import { Manrope_500Medium } from "@expo-google-fonts/manrope/500Medium";
import { Manrope_600SemiBold } from "@expo-google-fonts/manrope/600SemiBold";
import { Manrope_700Bold } from "@expo-google-fonts/manrope/700Bold";
import { Manrope_800ExtraBold } from "@expo-google-fonts/manrope/800ExtraBold";
import { AppStateProvider } from "./src/state/AppState";
import RootNavigator from "./src/navigation/RootNavigator";
import CustomSplashScreen from "./src/components/CustomSplashScreen";
import { theme } from "./src/theme/theme";

// Keep the native splash up until we hide it ourselves (hideNativeSplashOnce),
// so the first real frame is already in Fraunces/Manrope and there's no gap
// between the native splash and CustomSplashScreen.
SplashScreen.preventAutoHideAsync().catch(() => {});

// Floors how long CustomSplashScreen stays up, so a fast font load doesn't
// make it flash by unnoticed.
const MIN_SPLASH_DURATION_MS = 800;

export default function App() {
  const nativeSplashHidden = useRef(false);
  const hideNativeSplashOnce = useCallback(() => {
    if (nativeSplashHidden.current) return;
    nativeSplashHidden.current = true;
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  const [fontsLoaded] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Fraunces_900Black,
    Fraunces_600SemiBold_Italic,
    Fraunces_700Bold_Italic,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  const [minDurationElapsed, setMinDurationElapsed] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMinDurationElapsed(true), MIN_SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  const appReady = fontsLoaded && minDurationElapsed;

  return (
    // GestureHandlerRootView must wrap everything that uses
    // react-native-gesture-handler (the Flashcard's swipe-to-navigate) —
    // without it gestures silently fail on Android.
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SafeAreaProvider onLayout={hideNativeSplashOnce} style={{ backgroundColor: theme.colors.background }}>
        {appReady ? (
          <AppStateProvider>
            <StatusBar style="dark" />
            <RootNavigator />
          </AppStateProvider>
        ) : (
          <CustomSplashScreen />
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
