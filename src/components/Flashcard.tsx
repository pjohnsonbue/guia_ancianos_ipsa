import React, { useLayoutEffect, useRef, useState } from "react";
import { Animated, Dimensions, StyleSheet, Text, View } from "react-native";
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  PanGestureHandlerStateChangeEvent,
  Pressable as GHPressable,
  ScrollView,
  State,
} from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";
import type { Card } from "../content/types";
import { Icon } from "./icons/Icon";
import { CornerFlourish } from "./decor/Flourish";
import { SourceModal } from "./SourceModal";
import { useT } from "../lib/i18n";
import { theme, packGradient, fontFamily } from "../theme/theme";

export type Answer = "correct";

// How far (px) a card travels off-screen on a committed swipe, and where an
// incoming card starts before sliding in.
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_EXIT_DISTANCE = SCREEN_WIDTH * 1.15;
// A drag past this many px, OR a fast-enough flick, commits the swipe.
const SWIPE_DISTANCE_THRESHOLD = 90;
// Compared against velocityX / 1000 (gesture-handler reports points/second).
const SWIPE_VELOCITY_THRESHOLD = 0.55;
// activeOffsetX: horizontal travel before the swipe engages at all.
// failOffsetY: vertical travel before it gives up and leaves the touch to the
// back face's ScrollView.
const SWIPE_ACTIVE_OFFSET_X = 12;
const SWIPE_FAIL_OFFSET_Y = 20;
// Dragging toward a deck edge still moves the card, at a quarter of the
// distance — a soft "can't go further" rubber band.
const RUBBER_BAND_FACTOR = 0.25;
const CANCEL_SPRING = { useNativeDriver: true, friction: 9, tension: 60 } as const;
const ENTRY_SPRING = { useNativeDriver: true, friction: 10, tension: 120 } as const;

interface Props {
  card: Card;
  accentColor: string;
  /** Small label above the question (e.g. the pack title in the review deck). */
  label?: string;
  /** Swipe left / call to move to the next or previous card. Omit to disable that direction. */
  onSwipeNext?: () => void;
  onSwipePrev?: () => void;
  /** Current saved mark for this card, if any (drives the "La saqué" toggle). */
  answer?: Answer;
  /** Called when the user toggles "La saqué" on the back face. */
  onAnswer?: (answer: Answer | undefined) => void;
  /** +1 = slide in from the right, -1 = from the left, 0 = appear in place. */
  enterDirection?: 1 | -1 | 0;
  /** Shows a small "deslizá" hint on the front face (first card of a deck). */
  showSwipeHint?: boolean;
}

// The outer shell (gesture handler + slide position) is deliberately NOT
// remounted per card: a freshly created native gesture view can take a moment
// to attach on Android, during which taps on the card get dropped. Only
// FlashcardFace (flip state, back-face scroll) remounts, via its own key.
export function Flashcard({
  card,
  accentColor,
  label,
  onSwipeNext,
  onSwipePrev,
  answer,
  onAnswer,
  enterDirection = 0,
  showSwipeHint = false,
}: Props) {
  const translateX = useRef(new Animated.Value(0)).current;
  const dragStartX = useRef(0);
  const dragging = useRef(false);
  const t = useT();

  // Seed the incoming card off-screen and spring it in, before this frame
  // paints (so it never flashes at center first).
  useLayoutEffect(() => {
    if (enterDirection) {
      translateX.setValue(enterDirection * SWIPE_EXIT_DISTANCE);
      Animated.spring(translateX, { toValue: 0, ...ENTRY_SPRING }).start();
    }
    // Only the value at the moment `card` changes matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.id]);

  const onGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    if (!dragging.current) return;
    let dx = event.nativeEvent.translationX;
    if (dx < 0 && !onSwipeNext) dx *= RUBBER_BAND_FACTOR;
    else if (dx > 0 && !onSwipePrev) dx *= RUBBER_BAND_FACTOR;
    translateX.setValue(dragStartX.current + dx);
  };

  const onHandlerStateChange = (event: PanGestureHandlerStateChangeEvent) => {
    const { state, translationX, translationY, velocityX } = event.nativeEvent;
    // Interrupt running springs only once a drag is really ACTIVE: iOS can emit
    // a spurious BEGAN right after END, and stopping the animation there froze
    // cards mid-slide.
    if (state === State.ACTIVE) {
      dragging.current = true;
      translateX.stopAnimation((value) => {
        dragStartX.current = value;
      });
      return;
    }
    if (state === State.END || state === State.FAILED || state === State.CANCELLED) {
      dragging.current = false;
    }
    if (state === State.END) {
      const isHorizontal = Math.abs(translationX) > Math.abs(translationY) * 1.5;
      const isSwipe =
        isHorizontal &&
        (Math.abs(translationX) > SWIPE_DISTANCE_THRESHOLD || Math.abs(velocityX) / 1000 > SWIPE_VELOCITY_THRESHOLD);
      const callback = translationX < 0 ? onSwipeNext : onSwipePrev;
      if (isSwipe && callback) callback();
      else Animated.spring(translateX, { toValue: 0, ...CANCEL_SPRING }).start();
      return;
    }
    if (state === State.FAILED || state === State.CANCELLED) {
      Animated.spring(translateX, { toValue: 0, ...CANCEL_SPRING }).start();
    }
  };

  return (
    <PanGestureHandler
      activeOffsetX={[-SWIPE_ACTIVE_OFFSET_X, SWIPE_ACTIVE_OFFSET_X]}
      failOffsetY={[-SWIPE_FAIL_OFFSET_Y, SWIPE_FAIL_OFFSET_Y]}
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
    >
      {/* `wrap` stays untransformed so PanGestureHandler's hit area is stable;
          the slide applies one level deeper. */}
      <Animated.View style={styles.wrap} accessible accessibilityRole="button" accessibilityLabel={t("flashcard.a11yFlip")}>
        <Animated.View style={[styles.wrapInner, { transform: [{ translateX }] }]}>
          <FlashcardFace
            key={card.id}
            card={card}
            label={label}
            accentColor={accentColor}
            answer={answer}
            onAnswer={onAnswer}
            showSwipeHint={showSwipeHint}
          />
        </Animated.View>
      </Animated.View>
    </PanGestureHandler>
  );
}

interface FaceProps {
  card: Card;
  label?: string;
  accentColor: string;
  answer?: Answer;
  onAnswer?: (answer: Answer | undefined) => void;
  showSwipeHint: boolean;
}

function FlashcardFace({ card, label, accentColor, answer, onAnswer, showSwipeHint }: FaceProps) {
  const [flipped, setFlipped] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
  // "More below" hint on the back face when the answer overflows.
  const [backScrollMetrics, setBackScrollMetrics] = useState({ containerH: 0, contentH: 0 });
  const [backAtBottom, setBackAtBottom] = useState(false);
  const canScrollBack = backScrollMetrics.contentH > backScrollMetrics.containerH + 4;
  const showScrollHint = canScrollBack && !backAtBottom;
  const updateBackAtBottom = (nativeEvent: {
    contentOffset: { y: number };
    contentSize: { height: number };
    layoutMeasurement: { height: number };
  }) => {
    const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
    setBackAtBottom(contentSize.height - contentOffset.y - layoutMeasurement.height < 16);
  };
  const anim = useRef(new Animated.Value(0)).current;
  const t = useT();

  const toggle = () => {
    Animated.spring(anim, { toValue: flipped ? 0 : 1, useNativeDriver: true, friction: 16, tension: 40 }).start();
    setFlipped((f) => !f);
  };

  const frontRotate = anim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] });
  const backRotate = anim.interpolate({ inputRange: [0, 1], outputRange: ["180deg", "360deg"] });
  const frontOpacity = anim.interpolate({ inputRange: [0, 0.5, 0.5, 1], outputRange: [1, 1, 0, 0] });
  const backOpacity = anim.interpolate({ inputRange: [0, 0.5, 0.5, 1], outputRange: [0, 0, 1, 1] });

  const gradientColors = packGradient(accentColor);
  const deepAccent = gradientColors[1];
  // Long questions get a slightly smaller type size so they still fit.
  const frontLen = card.front.text.length;
  const frontSize = frontLen > 110 ? 19 : frontLen > 70 ? 21 : theme.font.cardFront.fontSize;

  return (
    <>
      <Animated.View
        style={[styles.face, { opacity: frontOpacity, transform: [{ rotateY: frontRotate }] }]}
        // Both faces stay mounted and stacked; the hidden one opts out of touches.
        pointerEvents={flipped ? "none" : "auto"}
      >
        {/* RNGH's Pressable (not RN's) so taps take part in the same native
            gesture arbitration as the parent PanGestureHandler. */}
        <GHPressable style={styles.tapArea} onPress={toggle} accessible={false}>
          <LinearGradient colors={gradientColors} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />
          <CornerFlourish corner="tl" />
          <CornerFlourish corner="br" />
          <Text style={styles.frontLabel}>{label ?? t("flashcard.question")}</Text>
          <Text style={[styles.frontText, { fontSize: frontSize, lineHeight: Math.round(frontSize * 1.28) }]}>{card.front.text}</Text>
          {showSwipeHint && (
            <View style={styles.swipeHint} pointerEvents="none">
              <Icon name="chevronLeft" size={13} color="rgba(255,255,255,0.85)" strokeWidth={2.4} />
              <Text style={styles.swipeHintText}>{t("flashcard.swipeHint")}</Text>
              <Icon name="chevronRight" size={13} color="rgba(255,255,255,0.85)" strokeWidth={2.4} />
            </View>
          )}
          <View style={styles.hint}>
            <Text style={styles.hintText}>{t("flashcard.tapToFlip")}</Text>
          </View>
        </GHPressable>
      </Animated.View>

      <Animated.View
        style={[styles.face, styles.back, { opacity: backOpacity, transform: [{ rotateY: backRotate }] }]}
        pointerEvents={flipped ? "auto" : "none"}
      >
        <View style={[styles.backAccentBar, { backgroundColor: accentColor }]} />
        {/* A ScrollView must not sit inside a Pressable (the Pressable would
            claim the touch first), so the tap-to-flip target lives inside the
            scroll content instead. */}
        <View style={styles.backContainer}>
          <View style={styles.scrollArea}>
            <ScrollView
              style={styles.backScroll}
              contentContainerStyle={styles.backScrollContent}
              showsVerticalScrollIndicator={false}
              scrollEventThrottle={16}
              onLayout={(e) => {
                const containerH = e.nativeEvent.layout.height;
                setBackScrollMetrics((m) => ({ ...m, containerH }));
              }}
              onContentSizeChange={(_, contentH) => setBackScrollMetrics((m) => ({ ...m, contentH }))}
              onScroll={(e) => updateBackAtBottom(e.nativeEvent)}
              onScrollEndDrag={(e) => updateBackAtBottom(e.nativeEvent)}
              onMomentumScrollEnd={(e) => updateBackAtBottom(e.nativeEvent)}
            >
              <GHPressable onPress={toggle} style={styles.backPressable} accessible={false}>
                <Text style={styles.backQuestion} numberOfLines={3}>
                  {card.front.text}
                </Text>
                <Text style={[styles.backText, { color: theme.colors.text }]}>{card.back.text}</Text>
                {card.back.note ? <Text style={styles.noteText}>{card.back.note}</Text> : null}
                {onAnswer && (
                  <View style={styles.answerRow}>
                    {/* GHPressable so tapping it never also flips the card. */}
                    <GHPressable
                      onPress={() => onAnswer(answer === "correct" ? undefined : "correct")}
                      hitSlop={8}
                      style={[styles.gotItBtn, answer === "correct" && styles.gotItBtnActive]}
                    >
                      <View style={[styles.gotItCheck, answer === "correct" && styles.gotItCheckActive]}>
                        {answer === "correct" && <Icon name="check" size={13} color="#FFFFFF" strokeWidth={3} />}
                      </View>
                      <Text style={[styles.gotItText, answer === "correct" && styles.gotItTextActive]}>{t("flashcard.gotIt")}</Text>
                    </GHPressable>
                  </View>
                )}

                {/* "Fuente" sits under the toggle; tapping it opens the verbatim quote. */}
                {card.back.ref ? (
                  <GHPressable
                    onPress={card.back.source ? () => setSourceOpen(true) : undefined}
                    disabled={!card.back.source}
                    hitSlop={8}
                    style={[styles.refChip, { borderColor: accentColor }]}
                    accessibilityRole={card.back.source ? "button" : undefined}
                    accessibilityLabel={card.back.source ? `${t("flashcard.a11ySource")}: ${card.back.ref}` : undefined}
                  >
                    <Icon name="book" size={13} color={deepAccent} strokeWidth={2} />
                    <Text style={[styles.refText, { color: deepAccent }]}>
                      <Text style={styles.refPrefix}>{t("flashcard.sourcePrefix")} </Text>
                      {card.back.ref}
                    </Text>
                    {card.back.source ? <Icon name="chevronRight" size={12} color={deepAccent} strokeWidth={2.4} /> : null}
                  </GHPressable>
                ) : null}
              </GHPressable>
            </ScrollView>

            {showScrollHint && (
              <LinearGradient pointerEvents="none" colors={["rgba(255,255,255,0)", theme.colors.surface]} style={styles.scrollFade}>
                <View style={styles.scrollHintIcon}>
                  <Icon name="triangleDown" size={42} color={theme.colors.accentGold} />
                </View>
              </LinearGradient>
            )}
          </View>

          <GHPressable onPress={toggle} style={styles.hintBack} accessible={false}>
            <Text style={styles.hintTextDark}>{t("flashcard.tapToFlipBack")}</Text>
          </GHPressable>
        </View>
      </Animated.View>

      {card.back.source ? (
        <SourceModal
          visible={sourceOpen}
          source={card.back.source}
          refLabel={card.back.ref}
          accentColor={deepAccent}
          onClose={() => setSourceOpen(false)}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    // Capped so the card keeps its portrait proportions on tablets.
    maxWidth: 420,
    aspectRatio: 0.78,
    maxHeight: 480,
  },
  wrapInner: { flex: 1 },
  face: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: theme.radius.lg,
    padding: theme.spacing(3),
    alignItems: "center",
    justifyContent: "center",
    backfaceVisibility: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
    overflow: "hidden",
  },
  back: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tapArea: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: theme.spacing(3.5),
    alignItems: "center",
    justifyContent: "center",
  },
  backAccentBar: {
    position: "absolute",
    top: 0,
    left: theme.spacing(4),
    right: theme.spacing(4),
    height: 5,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  backContainer: { flex: 1, width: "100%" },
  scrollArea: { flex: 1, width: "100%" },
  backScroll: { flex: 1, width: "100%" },
  backScrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing(1),
  },
  backPressable: {
    width: "100%",
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 4,
  },
  scrollHintIcon: { opacity: 0.3 },
  frontLabel: {
    fontFamily: theme.font.label.fontFamily,
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: theme.spacing(1.5),
    textAlign: "center",
  },
  frontText: {
    fontFamily: theme.font.cardFront.fontFamily,
    color: "#FFFFFF",
    textAlign: "center",
  },
  backQuestion: {
    fontFamily: fontFamily.displayItalic,
    fontSize: 14,
    lineHeight: 19,
    color: theme.colors.textMuted,
    textAlign: "center",
    marginBottom: theme.spacing(1.5),
  },
  backText: {
    fontFamily: theme.font.cardBack.fontFamily,
    fontSize: theme.font.cardBack.fontSize,
    lineHeight: 25,
    textAlign: "center",
  },
  noteText: {
    marginTop: theme.spacing(1.5),
    fontFamily: theme.font.body.fontFamily,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textMuted,
    textAlign: "center",
  },
  refChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: theme.spacing(1.75),
    paddingVertical: 6,
    paddingHorizontal: theme.spacing(1.25),
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    backgroundColor: theme.colors.background,
    maxWidth: "100%",
  },
  refText: {
    flexShrink: 1,
    fontFamily: fontFamily.bodyBold,
    fontSize: 12,
  },
  refPrefix: { fontFamily: fontFamily.bodyExtraBold },
  answerRow: { flexDirection: "row", marginTop: theme.spacing(2.5) },
  gotItBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing(1),
    paddingVertical: theme.spacing(1),
    paddingHorizontal: theme.spacing(1.75),
    borderRadius: theme.radius.pill,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  gotItBtnActive: { backgroundColor: theme.colors.success, borderColor: theme.colors.success },
  gotItCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  gotItCheckActive: { borderColor: "#FFFFFF", backgroundColor: "rgba(255,255,255,0.18)" },
  gotItText: { fontFamily: theme.font.label.fontFamily, fontSize: 13, color: theme.colors.textMuted },
  gotItTextActive: { color: "#FFFFFF" },
  swipeHint: {
    position: "absolute",
    top: theme.spacing(2.5),
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  swipeHintText: {
    fontFamily: theme.font.label.fontFamily,
    color: "rgba(255,255,255,0.85)",
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  hint: { position: "absolute", bottom: theme.spacing(2.5) },
  hintText: {
    fontFamily: theme.font.label.fontFamily,
    color: "rgba(255,255,255,0.8)",
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  hintTextDark: {
    fontFamily: theme.font.label.fontFamily,
    color: theme.colors.textMuted,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  hintBack: { paddingTop: theme.spacing(1.25) },
});
