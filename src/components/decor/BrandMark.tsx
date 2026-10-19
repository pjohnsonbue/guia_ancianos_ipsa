import React from "react";
import { Image } from "react-native";

/**
 * The app mark: the app icon itself (assets/icon.png), with rounded
 * corners like it has on a home screen, so the in-app logo always matches
 * the store/home-screen icon. Regenerate the icon with scripts/make_icons.py.
 */
export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <Image
      source={require("../../../assets/icon.png")}
      style={{ width: size, height: size, borderRadius: size * 0.22 }}
      resizeMode="cover"
      accessibilityIgnoresInvertColors
    />
  );
}
