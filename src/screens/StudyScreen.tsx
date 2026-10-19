import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { PACKS_BY_ID, getCardsForPack } from "../content/packs";
import { getReviewCards, REVIEW_PACK_ID } from "../content/categories";
import { Flashcard, type Answer } from "../components/Flashcard";
import { ProgressScrubber } from "../components/ProgressScrubber";
import { Icon } from "../components/icons/Icon";
import { useAppState } from "../state/AppState";
import { useT } from "../lib/i18n";
import { theme, fontFamily } from "../theme/theme";
import { DashBand } from "../components/decor/DashBand";
import { shouldOfferRatingPrompt, markRatingPromptShown, requestRating } from "../lib/rating";

type Props = NativeStackScreenProps<RootStackParamList, "Study">;

// Above this many cards, individual progress dots wrap into an unreadable
// wall — a single progress bar (tap or drag to move) is shown instead.
const MAX_DOTS = 48;

export default function StudyScreen({ route, navigation }: Props) {
  const { packId } = route.params;
  const isReview = packId === REVIEW_PACK_ID;
  const pack = isReview ? undefined : PACKS_BY_ID[packId];
  const { loading: appStateLoading, markSeen, hasSeen, cardAnswers, markAnswer, getLastCardId, setLastCardId } =
    useAppState();
  // The review deck is built once, when the screen opens: ticking a card off
  // mid-session shouldn't yank it out from under the reader.
  const cards = useMemo(() => {
    if (isReview) return getReviewCards({ hasSeen, isKnown: (id) => cardAnswers[id] === "correct" });
    return getCardsForPack(packId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packId]);
  const accentColor = pack?.color ?? theme.colors.accent;
  const t = useT();
  const title = isReview ? t("study.reviewTitle") : pack?.title ?? "";
  const [index, setIndex] = useState(0);
  const [hideCorrect, setHideCorrect] = useState(isReview);
  // Which side the next card should slide in from (0 = no slide, for jumps).
  const [navDir, setNavDir] = useState<1 | -1 | 0>(0);
  const restoredRef = useRef(false);

  // Resume where the user left off in this pack, once AppState has loaded.
  useEffect(() => {
    if (restoredRef.current || appStateLoading) return;
    restoredRef.current = true;
    const savedId = getLastCardId(packId);
    if (savedId) {
      const i = cards.findIndex((c) => c.id === savedId);
      if (i > 0) setIndex(i);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appStateLoading, cards, packId]);

  const isHiddenAt = (i: number) => hideCorrect && cardAnswers[cards[i]?.id] === "correct";

  // "Ocultar las que ya saqué" skips over known cards rather than re-indexing the
  // deck, so every progress dot always corresponds to the same card.
  const visibleCards = useMemo(
    () => (hideCorrect ? cards.filter((c) => cardAnswers[c.id] !== "correct") : cards),
    [cards, hideCorrect, cardAnswers]
  );

  const current = cards[index];

  // If the card on screen becomes hidden, hop to the nearest visible one.
  useEffect(() => {
    if (!current || !isHiddenAt(index)) return;
    let i = index + 1;
    while (i < cards.length && isHiddenAt(i)) i++;
    if (i >= cards.length) {
      i = index - 1;
      while (i >= 0 && isHiddenAt(i)) i--;
    }
    if (i >= 0 && i < cards.length) setIndex(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hideCorrect, current?.id, current && cardAnswers[current.id]]);

  useEffect(() => {
    if (current) {
      markSeen(current.id);
      setLastCardId(packId, current.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  const findStep = (from: number, dir: 1 | -1) => {
    let i = from + dir;
    while (i >= 0 && i < cards.length) {
      if (!isHiddenAt(i)) return i;
      i += dir;
    }
    return -1;
  };

  const canGoPrev = current ? findStep(index, -1) !== -1 : false;
  const canGoNext = current ? findStep(index, 1) !== -1 : false;

  const go = (dir: 1 | -1) => {
    const next = findStep(index, dir);
    if (next === -1) return;
    setNavDir(dir);
    setIndex(next);
  };

  // Jumping straight to a dot always shows that exact card, hidden or not.
  const jumpTo = (i: number) => {
    if (i === index) return;
    setNavDir(0);
    setIndex(i);
  };

  const allHidden = hideCorrect && cards.length > 0 && visibleCards.length === 0;

  const visibleCountThrough = useMemo(
    () =>
      current ? cards.slice(0, index + 1).filter((c) => !hideCorrect || cardAnswers[c.id] !== "correct").length : 0,
    [current, cards, index, hideCorrect, cardAnswers]
  );

  // One-time "rate this app" nudge after enough cards are ticked off.
  const maybeOfferRating = (merged: Record<string, Answer>) => {
    const correctCount = Object.values(merged).filter((a) => a === "correct").length;
    shouldOfferRatingPrompt(correctCount).then((should) => {
      if (!should) return;
      Alert.alert(t("study.rateTitle"), t("study.rateMessage"), [
        { text: t("study.rateNotNow"), style: "cancel", onPress: () => markRatingPromptShown() },
        {
          text: t("study.rateNow"),
          onPress: () => {
            markRatingPromptShown();
            requestRating();
          },
        },
      ]);
    });
  };

  const handleAnswer = (a: Answer | undefined) => {
    if (!current) return;
    markAnswer(current.id, a);
    if (a === "correct") maybeOfferRating({ ...cardAnswers, [current.id]: a });
  };

  const correctTotal = cards.filter((c) => cardAnswers[c.id] === "correct").length;

  if ((!isReview && !pack) || cards.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={[styles.backRow, { padding: theme.spacing(2.5) }]}>
          <Icon name="chevronLeft" size={18} color={theme.colors.accent} strokeWidth={2.4} />
          <Text style={styles.back}>{t("study.back")}</Text>
        </Pressable>
        <Text style={styles.emptyText}>{isReview ? t("study.reviewDone") : t("study.noCards")}</Text>
      </SafeAreaView>
    );
  }

  const currentPack = current ? PACKS_BY_ID[current.packId] : undefined;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom", "left", "right"]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={[styles.headerSide, styles.backRow]}>
          <Icon name="chevronLeft" size={18} color={theme.colors.accent} strokeWidth={2.4} />
          <Text style={styles.back}>{t("study.back")}</Text>
        </Pressable>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <View style={styles.headerSide} />
      </View>

      <DashBand dashes={12} style={{ marginTop: theme.spacing(1.25), paddingHorizontal: theme.spacing(3) }} />

      {cards.length > MAX_DOTS ? (
        <View style={styles.barWrap}>
          <ProgressScrubber
            count={cards.length}
            index={index}
            doneFraction={correctTotal / cards.length}
            accentColor={accentColor}
            onSeek={jumpTo}
            accessibilityLabel={t("study.a11yScrubber", { n: index + 1, total: cards.length })}
          />
          <Text style={styles.barLabel}>
            {correctTotal} / {cards.length} {t("home.correctSuffix")}
          </Text>
        </View>
      ) : (
        <View style={styles.progressRow}>
          {cards.map((c, i) => {
            const isCurrent = current?.id === c.id;
            const isHidden = hideCorrect && cardAnswers[c.id] === "correct";
            const dotColor = cardAnswers[c.id] === "correct" ? theme.colors.success : theme.colors.border;
            return (
              <Pressable
                key={c.id}
                onPress={() => jumpTo(i)}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel={t("study.a11yJump", { n: i + 1, total: cards.length })}
              >
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: dotColor },
                    isCurrent && { width: 18, backgroundColor: accentColor },
                    isHidden && !isCurrent && { opacity: 0.25 },
                  ]}
                />
              </Pressable>
            );
          })}
        </View>
      )}

      <Pressable
        onPress={() => setHideCorrect((h) => !h)}
        hitSlop={8}
        style={[styles.hideToggle, hideCorrect && { backgroundColor: theme.colors.success, borderColor: theme.colors.success }]}
      >
        <View style={[styles.hideToggleCircle, hideCorrect && styles.hideToggleCircleActive]}>
          {hideCorrect && <Icon name="check" size={11} color="#FFFFFF" strokeWidth={3} />}
        </View>
        <Text style={[styles.hideToggleText, hideCorrect && styles.hideToggleTextActive]}>
          {hideCorrect ? t("study.hideToggleOn") : t("study.hideToggleOff")}
        </Text>
      </Pressable>

      <View style={styles.cardArea}>
        {allHidden ? (
          <View style={styles.allDoneCenter}>
            <View style={styles.allDoneWrap}>
              <Text style={styles.allDoneText}>{isReview ? t("study.reviewDone") : t("study.allDone")}</Text>
              <Pressable onPress={() => setHideCorrect(false)} style={styles.navBtn}>
                <Text style={styles.navBtnText}>{t("study.showAllCards")}</Text>
              </Pressable>
            </View>
          </View>
        ) : current ? (
          <View style={{ width: "100%", alignItems: "center" }}>
            <Flashcard
              card={current}
              label={isReview ? currentPack?.title : undefined}
              accentColor={isReview ? currentPack?.color ?? accentColor : accentColor}
              onSwipeNext={canGoNext ? () => go(1) : undefined}
              onSwipePrev={canGoPrev ? () => go(-1) : undefined}
              answer={cardAnswers[current.id]}
              onAnswer={handleAnswer}
              enterDirection={navDir}
              showSwipeHint={index === 0}
            />
          </View>
        ) : null}
      </View>

      <View style={styles.navRow}>
        <Pressable onPress={() => go(-1)} disabled={!canGoPrev} style={[styles.navBtn, styles.navBtnRow, !canGoPrev && styles.navBtnDisabled]}>
          <Icon name="chevronLeft" size={15} color={theme.colors.text} strokeWidth={2.4} />
          <Text style={styles.navBtnText}>{t("study.prev")}</Text>
        </Pressable>
        <Text style={styles.counter}>
          {visibleCards.length === 0 ? 0 : visibleCountThrough} / {visibleCards.length}
        </Text>
        <Pressable onPress={() => go(1)} disabled={!canGoNext} style={[styles.navBtn, styles.navBtnRow, !canGoNext && styles.navBtnDisabled]}>
          <Text style={styles.navBtnText}>{t("study.next")}</Text>
          <Icon name="chevronRight" size={15} color={theme.colors.text} strokeWidth={2.4} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing(2.5),
    paddingTop: theme.spacing(1.5),
    gap: theme.spacing(1),
  },
  headerSide: { minWidth: 76 },
  barWrap: { paddingHorizontal: theme.spacing(3), paddingTop: theme.spacing(1), alignItems: "center", gap: 2 },
  barLabel: { fontFamily: fontFamily.bodySemiBold, fontSize: 12, color: theme.colors.textMuted },
  backRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  back: { fontFamily: fontFamily.bodyBold, color: theme.colors.accent, fontSize: 15 },
  title: { flex: 1, fontFamily: theme.font.heading.fontFamily, fontSize: 17, color: theme.colors.text, textAlign: "center" },
  hideToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing(1),
    alignSelf: "center",
    paddingVertical: theme.spacing(0.875),
    paddingHorizontal: theme.spacing(2),
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1.5),
  },
  hideToggleCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  hideToggleCircleActive: { borderColor: "#FFFFFF", backgroundColor: "rgba(255,255,255,0.18)" },
  hideToggleText: { fontFamily: theme.font.label.fontFamily, fontSize: 12, color: theme.colors.textMuted, textAlign: "center" },
  hideToggleTextActive: { color: "#FFFFFF" },
  allDoneCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  allDoneWrap: { alignItems: "center", gap: theme.spacing(2), paddingHorizontal: theme.spacing(3) },
  allDoneText: { fontFamily: theme.font.heading.fontFamily, fontSize: 17, color: theme.colors.text, textAlign: "center" },
  progressRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
    paddingTop: theme.spacing(2),
    flexWrap: "wrap",
    paddingHorizontal: theme.spacing(3),
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  // Card sits right under the toggle; leftover space goes below it.
  cardArea: { flex: 1, alignItems: "center", justifyContent: "flex-start", paddingHorizontal: theme.spacing(3) },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing(3),
    paddingVertical: theme.spacing(2.5),
  },
  navBtn: {
    paddingVertical: theme.spacing(1.25),
    paddingHorizontal: theme.spacing(2.25),
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  navBtnRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  navBtnDisabled: { opacity: 0.35 },
  navBtnText: { fontFamily: theme.font.label.fontFamily, fontSize: 13, color: theme.colors.text },
  counter: { fontFamily: fontFamily.bodySemiBold, fontSize: 13, color: theme.colors.textMuted },
  emptyText: { textAlign: "center", marginTop: 40, paddingHorizontal: 24, fontFamily: fontFamily.body, color: theme.colors.textMuted },
});
