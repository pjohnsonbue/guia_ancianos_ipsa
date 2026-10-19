import React from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";

type Corner = "tl" | "tr" | "bl" | "br";

const ROTATION: Record<Corner, string> = {
  tl: "0deg",
  tr: "90deg",
  br: "180deg",
  bl: "270deg",
};

/** A small engraved-looking corner ornament — a paired curl with two dot
 * terminals, echoing the frame corners of fileteado sign-painting without
 * trying to reproduce its full acanthus-and-scroll detail at UI scale.
 * Positioned absolutely by the caller; pass `corner` to orient it. */
export function CornerFlourish({
  corner,
  size = 30,
  color = "rgba(255,255,255,0.55)",
}: {
  corner: Corner;
  size?: number;
  color?: string;
}) {
  const positionStyle =
    corner === "tl"
      ? { top: 10, left: 10 }
      : corner === "tr"
      ? { top: 10, right: 10 }
      : corner === "bl"
      ? { bottom: 10, left: 10 }
      : { bottom: 10, right: 10 };

  return (
    <View style={[styles.corner, positionStyle, { transform: [{ rotate: ROTATION[corner] }] }]} pointerEvents="none">
      <Svg width={size} height={size} viewBox="0 0 32 32">
        <Path d="M4 27C4 13 13 4 27 4" stroke={color} strokeWidth={1.4} fill="none" strokeLinecap="round" />
        <Path d="M9 26C9 16 16 9 26 9" stroke={color} strokeWidth={1.4} fill="none" strokeLinecap="round" opacity={0.7} />
        <Circle cx="4" cy="27" r="1.6" fill={color} />
        <Circle cx="27" cy="4" r="1.6" fill={color} />
      </Svg>
    </View>
  );
}

/** A thin horizontal rule with a small centered diamond — a restrained
 * stand-in for a fileteado divider line, used under headers and titles. */
export function DividerFlourish({
  color,
  style,
}: {
  color: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.dividerRow, style]}>
      <View style={[styles.dividerLine, { backgroundColor: color }]} />
      <View style={[styles.dividerDiamond, { backgroundColor: color }]} />
      <View style={[styles.dividerLine, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  corner: { position: "absolute", width: 30, height: 30 },
  dividerRow: { flexDirection: "row", alignItems: "center", width: "100%" },
  dividerLine: { flex: 1, height: 1, opacity: 0.4 },
  dividerDiamond: {
    width: 6,
    height: 6,
    marginHorizontal: 8,
    opacity: 0.7,
    transform: [{ rotate: "45deg" }],
  },
});
