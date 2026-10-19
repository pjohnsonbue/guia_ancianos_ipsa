import React from "react";
import { View, StyleProp, ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";
import { palette } from "../../theme/theme";

/**
 * A thin decorative divider: a hairline broken by small saltires (the
 * diagonal cross of Saint Andrew, after whom the presbytery is named), with
 * the first, middle and last crosses in the accent colour.
 *
 * Built from flex rows rather than one stretched SVG, so the crosses keep
 * their proportions at any width.
 */
export function SaltireBand({
  marks = 5,
  size = 9,
  color = palette.borravino,
  accentColor = palette.oro,
  style,
}: {
  /** Number of saltire marks across the band. */
  marks?: number;
  /** Size (px) of each cross. */
  size?: number;
  color?: string;
  accentColor?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const mid = Math.floor(marks / 2);
  return (
    <View style={[{ width: "100%", flexDirection: "row", alignItems: "center" }, style]} pointerEvents="none">
      {Array.from({ length: marks }, (_, i) => {
        const c = i === 0 || i === mid || i === marks - 1 ? accentColor : color;
        return (
          <React.Fragment key={i}>
            <View style={{ flex: 1, height: 1, backgroundColor: color, opacity: 0.35 }} />
            <Svg width={size} height={size} viewBox="0 0 10 10" style={{ marginHorizontal: 6 }}>
              <Path d="M1.5 1.5 L8.5 8.5 M8.5 1.5 L1.5 8.5" stroke={c} strokeWidth={1.8} strokeLinecap="round" />
            </Svg>
          </React.Fragment>
        );
      })}
      <View style={{ flex: 1, height: 1, backgroundColor: color, opacity: 0.35 }} />
    </View>
  );
}
