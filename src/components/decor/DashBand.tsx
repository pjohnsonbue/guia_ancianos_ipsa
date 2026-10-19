import React from "react";
import { View, StyleProp, ViewStyle } from "react-native";
import { palette } from "../../theme/theme";

/** A simple divider: a row of short dashes alternating blue and green. */
export function DashBand({
  dashes = 12,
  colors = [palette.azul, palette.verde],
  style,
}: {
  /** Number of dashes across the band. */
  dashes?: number;
  colors?: string[];
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ width: "100%", flexDirection: "row", gap: 6 }, style]} pointerEvents="none">
      {Array.from({ length: dashes }, (_, i) => (
        <View key={i} style={{ flex: 1, height: 3, borderRadius: 1.5, backgroundColor: colors[i % colors.length] }} />
      ))}
    </View>
  );
}
