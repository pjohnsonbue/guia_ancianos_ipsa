import React, { useMemo, useRef, useState } from "react";
import { PanResponder, StyleSheet, View, type GestureResponderEvent, type ViewInstance } from "react-native";
import { theme } from "../theme/theme";

interface Props {
  /** Number of positions (cards) on the track. */
  count: number;
  /** Current position, 0-based. */
  index: number;
  /** Fraction (0–1) of the track filled in green (cards already "sacadas"). */
  doneFraction: number;
  accentColor: string;
  /** Called with the new position while tapping or dragging. */
  onSeek: (index: number) => void;
  accessibilityLabel?: string;
}

const THUMB = 22;

/**
 * Progress bar for long decks: tap anywhere on the track to jump there, or drag
 * the thumb to scrub through the cards.
 */
export function ProgressScrubber({ count, index, doneFraction, accentColor, onSeek, accessibilityLabel }: Props) {
  const trackRef = useRef<ViewInstance>(null);
  const track = useRef({ x: 0, width: 1 });
  const lastSent = useRef(index);
  const [dragging, setDragging] = useState(false);

  // Latest props, read from inside the (created-once) responder.
  const latest = useRef({ count, onSeek });
  latest.current = { count, onSeek };

  const seekTo = (pageX: number) => {
    const { count: n, onSeek: seek } = latest.current;
    const ratio = Math.min(1, Math.max(0, (pageX - track.current.x) / track.current.width));
    const i = Math.round(ratio * Math.max(0, n - 1));
    if (i !== lastSent.current) {
      lastSent.current = i;
      seek(i);
    }
  };

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        // Keep the drag even if the finger wanders vertically.
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e: GestureResponderEvent) => {
          const pageX = e.nativeEvent.pageX;
          setDragging(true);
          // Re-measure on every touch: the track can move (rotation, layout).
          trackRef.current?.measureInWindow((x, _y, width) => {
            track.current = { x, width: Math.max(1, width) };
            seekTo(pageX);
          });
        },
        onPanResponderMove: (e) => seekTo(e.nativeEvent.pageX),
        onPanResponderRelease: () => setDragging(false),
        onPanResponderTerminate: () => setDragging(false),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  lastSent.current = index;
  const position = index / Math.max(1, count - 1);

  return (
    <View
      style={styles.hitArea}
      {...responder.panHandlers}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 1, max: count, now: index + 1 }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(e) => {
        const step = e.nativeEvent.actionName === "increment" ? 1 : -1;
        const next = Math.min(count - 1, Math.max(0, index + step));
        if (next !== index) onSeek(next);
      }}
    >
      <View ref={trackRef} style={styles.track} pointerEvents="none">
        <View style={[styles.done, { width: `${doneFraction * 100}%` }]} />
        <View
          style={[
            styles.thumb,
            { left: `${position * 100}%`, backgroundColor: accentColor },
            dragging && styles.thumbActive,
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Generous vertical padding: the visible track is thin, the touch target isn't.
  hitArea: { width: "100%", paddingVertical: 12, paddingHorizontal: THUMB / 2 },
  track: { width: "100%", height: 8, borderRadius: 4, backgroundColor: theme.colors.border, justifyContent: "center" },
  done: { position: "absolute", left: 0, top: 0, bottom: 0, borderRadius: 4, backgroundColor: theme.colors.success },
  thumb: {
    position: "absolute",
    width: THUMB,
    height: THUMB,
    marginLeft: -THUMB / 2,
    borderRadius: THUMB / 2,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  thumbActive: { transform: [{ scale: 1.2 }] },
});
