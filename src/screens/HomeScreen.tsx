import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useIsFocused } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import type { Pack } from "../content/types";
import { getHomeSections, getReviewCards, REVIEW_PACK_ID } from "../content/categories";
import { EXAM_LENGTH, percentOf } from "../content/exam";
import { useT, type TFunction } from "../lib/i18n";
import { useAppState } from "../state/AppState";
import { theme, palette, packGradient, gradients, fontFamily } from "../theme/theme";
import { PACK_ICONS } from "../theme/packIcons";
import { Icon } from "../components/icons/Icon";
import { BrandMark } from "../components/decor/BrandMark";
import { DashBand } from "../components/decor/DashBand";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

// Memoised so a change to one pack's progress doesn't re-render every card.
const PackCard = React.memo(function PackCard({
  pack,
  correctCount,
  t,
  navigation,
}: {
  pack: Pack;
  correctCount: number;
  t: TFunction;
  navigation: Props["navigation"];
}) {
  const cardCount = pack.cardIds.length;
  return (
    <Pressable
      onPress={() => navigation.navigate("Study", { packId: pack.id })}
      style={({ pressed }) => [styles.packCardShadow, pressed && { opacity: 0.92 }]}
      accessibilityRole="button"
    >
      <LinearGradient colors={packGradient(pack.color)} start={{ x: 0.05, y: 0 }} end={{ x: 1, y: 1 }} style={styles.packCard}>
        <View style={styles.packTitleRow}>
          <Text style={styles.packIconInline}>{PACK_ICONS[pack.id] ?? "📘"}</Text>
          <Text style={styles.packTitle}>{pack.title}</Text>
        </View>
        {pack.description ? <Text style={styles.packDescription}>{pack.description}</Text> : null}
        <View style={styles.packFooter}>
          <Text style={styles.packMeta}>
            {cardCount} {t("home.cardsSuffix")}
          </Text>
          {correctCount > 0 && (
            <Text style={styles.packMeta}>
              {correctCount}/{cardCount} {t("home.correctSuffix")}
            </Text>
          )}
        </View>
        {correctCount > 0 && (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round((correctCount / cardCount) * 100)}%` }]} />
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
});

export default function HomeScreen({ navigation }: Props) {
  const { cardAnswers, hasSeen, examHistory } = useAppState();
  const t = useT();
  // hasSeen() reads a ref (see AppState), so the review count is recomputed
  // whenever Home regains focus — i.e. on the way back from studying.
  const isFocused = useIsFocused();

  const sections = useMemo(() => getHomeSections(), []);
  const reviewCount = useMemo(
    () => getReviewCards({ hasSeen, isKnown: (id) => cardAnswers[id] === "correct" }).length,
    // isFocused is a deliberate dependency: it's what refreshes hasSeen().
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasSeen, cardAnswers, isFocused]
  );

  const lastExam = examHistory[0];
  const bestPercent = examHistory.length ? Math.max(...examHistory.map((r) => percentOf(r))) : null;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>{t("app.eyebrow")}</Text>
            <View style={styles.titleRow}>
              <BrandMark size={52} />
              <Text style={styles.title}>{t("app.titleShort")}</Text>
            </View>
          </View>
          <Pressable
            onPress={() => navigation.navigate("Settings")}
            hitSlop={12}
            style={styles.settingsBtn}
            accessibilityRole="button"
            accessibilityLabel={t("settings.title")}
          >
            <Icon name="settings" size={18} color={theme.colors.text} strokeWidth={2} />
          </Pressable>
        </View>

        <DashBand dashes={14} style={{ marginTop: theme.spacing(2) }} />

        <Text style={styles.subtitle}>{t("app.subtitle")}</Text>

        {reviewCount > 0 && (
          <Pressable
            onPress={() => navigation.navigate("Study", { packId: REVIEW_PACK_ID })}
            style={({ pressed }) => [styles.reviewCard, pressed && { opacity: 0.92 }]}
            accessibilityRole="button"
          >
            <View style={styles.reviewIcon}>
              <Icon name="refresh" size={20} color={theme.colors.accent} strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.reviewTitle}>{t("home.reviewTitle")}</Text>
              <Text style={styles.reviewSubtitle}>{t("home.reviewSubtitle", { n: reviewCount })}</Text>
            </View>
            <Icon name="chevronRight" size={18} color={theme.colors.textMuted} strokeWidth={2.2} />
          </Pressable>
        )}

        {sections.map((section) => (
          <View key={section.category.id} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.category.title}</Text>
            <Text style={styles.sectionSubtitle}>{section.category.subtitle}</Text>
            <View style={{ height: theme.spacing(1.5) }} />
            {section.packs.map((pack) => (
              <PackCard
                key={pack.id}
                pack={pack}
                correctCount={pack.cardIds.filter((id) => cardAnswers[id] === "correct").length}
                t={t}
                navigation={navigation}
              />
            ))}
          </View>
        ))}

        {/* Simulacro: the 30-question practice exam, after all the study packs. */}
        <Pressable
          onPress={() => navigation.navigate("Exam")}
          style={({ pressed }) => [styles.examShadow, pressed && { opacity: 0.94 }]}
          accessibilityRole="button"
        >
          <LinearGradient colors={gradients.azul} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.examCard}>
            <View style={styles.examIcon}>
              <Icon name="clipboard" size={24} color={palette.oro} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.examTitle}>{t("home.examTitle")}</Text>
              <Text style={styles.examSubtitle}>{t("home.examSubtitle", { n: EXAM_LENGTH })}</Text>
              {bestPercent !== null && lastExam && (
                <Text style={styles.examStats}>
                  {t("home.examLast", { n: percentOf(lastExam) })} · {t("home.examBest", { n: bestPercent })}
                </Text>
              )}
            </View>
            <Icon name="chevronRight" size={20} color="#FFFFFF" strokeWidth={2.2} />
          </LinearGradient>
        </Pressable>

        {lastExam && (
          <Pressable onPress={() => navigation.navigate("ExamResult", { finishedAt: lastExam.finishedAt })} hitSlop={8} style={styles.lastResultLink}>
            <Text style={styles.lastResultLinkText}>{t("home.examReviewLast")}</Text>
          </Pressable>
        )}

        <Text style={styles.footer}>{t("home.footer")}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  // Capped and centred so pack cards don't stretch edge to edge on tablets.
  scroll: { padding: theme.spacing(2.5), paddingBottom: theme.spacing(6), width: "100%", maxWidth: 520, alignSelf: "center" },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: theme.spacing(1) },
  eyebrow: {
    fontFamily: theme.font.label.fontFamily,
    fontSize: 12,
    color: theme.colors.accentWarm,
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8 },
  title: { flex: 1, fontFamily: theme.font.title.fontFamily, fontSize: 27, lineHeight: 31, color: theme.colors.text },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  subtitle: {
    marginTop: theme.spacing(2),
    fontFamily: theme.font.body.fontFamily,
    fontSize: 15,
    lineHeight: 21,
    color: theme.colors.textMuted,
  },
  examShadow: {
    marginTop: theme.spacing(4),
    borderRadius: theme.radius.lg,
    shadowColor: palette.azulDeep,
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  examCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing(1.75),
    padding: theme.spacing(2.25),
    borderRadius: theme.radius.lg,
  },
  examIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  examTitle: { fontFamily: theme.font.heading.fontFamily, fontSize: 21, color: "#FFFFFF" },
  examSubtitle: { marginTop: 2, fontFamily: fontFamily.bodyMedium, fontSize: 13, lineHeight: 18, color: "rgba(255,255,255,0.88)" },
  examStats: {
    marginTop: 6,
    fontFamily: theme.font.label.fontFamily,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: palette.oro,
  },
  lastResultLink: { alignSelf: "flex-end", marginTop: theme.spacing(1) },
  lastResultLinkText: { fontFamily: fontFamily.bodyBold, fontSize: 13, color: theme.colors.accent },
  reviewCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing(1.5),
    marginTop: theme.spacing(2),
    padding: theme.spacing(2),
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.accent,
  },
  reviewIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.accentTint,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewTitle: { fontFamily: theme.font.heading.fontFamily, fontSize: 17, color: theme.colors.text },
  reviewSubtitle: { marginTop: 2, fontFamily: fontFamily.body, fontSize: 13, color: theme.colors.textMuted },
  section: { marginTop: theme.spacing(3.5) },
  sectionTitle: { fontFamily: theme.font.heading.fontFamily, fontSize: 22, color: theme.colors.text },
  sectionSubtitle: { marginTop: 4, fontFamily: fontFamily.body, fontSize: 13, lineHeight: 18, color: theme.colors.textMuted },
  packCardShadow: {
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing(1.75),
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  packCard: { borderRadius: theme.radius.lg, padding: theme.spacing(2.25), overflow: "hidden" },
  packTitleRow: { flexDirection: "row", alignItems: "center", gap: theme.spacing(1) },
  packIconInline: { fontSize: 20 },
  packTitle: { flexShrink: 1, fontFamily: theme.font.heading.fontFamily, fontSize: 19, color: "#FFFFFF" },
  packDescription: {
    marginTop: theme.spacing(0.75),
    fontFamily: theme.font.body.fontFamily,
    color: "rgba(255,255,255,0.92)",
    fontSize: 14,
    lineHeight: 20,
  },
  packFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: theme.spacing(1.5) },
  packMeta: {
    fontFamily: theme.font.label.fontFamily,
    color: "rgba(255,255,255,0.88)",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  progressTrack: { marginTop: theme.spacing(1), height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.25)", overflow: "hidden" },
  progressFill: { height: 4, borderRadius: 2, backgroundColor: "#FFFFFF" },
  footer: {
    marginTop: theme.spacing(2),
    textAlign: "center",
    fontFamily: fontFamily.body,
    fontSize: 12,
    lineHeight: 17,
    color: theme.colors.textMuted,
  },
});
