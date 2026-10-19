import React from "react";
import { Image, StyleSheet, View, useWindowDimensions, LayoutChangeEvent } from "react-native";

/**
 * A large, full-screen replacement for Android's native splash screen.
 *
 * Android 12+'s platform SplashScreen API (which expo-splash-screen uses
 * under the hood via androidx.core.splashscreen) only supports a small,
 * fixed-size icon on a solid background — there's no way to make the native
 * splash itself show a big hero image. The standard workaround (used by
 * Instagram, Gmail, etc.) is this: let the native splash flash briefly as
 * normal, then immediately swap to a custom full-screen view rendered by
 * the JS app itself, and keep *that* up until the real app is ready.
 *
 * App.tsx renders this in place of the real app tree until fonts (and
 * anything else `appReady` depends on) are loaded, and calls
 * SplashScreen.hideAsync() from this component's onLayout — i.e. the moment
 * this view has actually painted, so the native splash disappears straight
 * into this one with no gap or flash of blank content underneath.
 */

// The IPSA logo's navy (scripts/make_icons.py prints it). Must match the
// native splash backgroundColor in app.json so the hand-off is seamless.
const ICON_BACKGROUND = "#1A2B51";

interface Props {
  onLayout?: (event: LayoutChangeEvent) => void;
}

export default function CustomSplashScreen({ onLayout }: Props) {
  const { width, height } = useWindowDimensions();
  // The emblem (assets/splash-icon.png, transparent, 1:1) shown large on the
  // logo's navy, with a margin so it never touches the edges on narrow phones.
  const size = Math.min(width * 0.7, height * 0.5);

  return (
    <View style={styles.container} onLayout={onLayout}>
      <Image
        source={require("../../assets/splash-icon.png")}
        style={{ width: size, height: size }}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: ICON_BACKGROUND,
    alignItems: "center",
    justifyContent: "center",
  },
});
