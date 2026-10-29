import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { PASS_PERCENT, QUESTIONS_BY_ID, percentOf, scoreByCategory } from "../content/exam";
import { CATEGORY_SHORT_TITLE } from "../content/categories";
import { PACKS_BY_ID } from "../content/course";
import { useAppState } from "../state/AppState";
import { useT } from "../lib/i18n";
import { Icon } from "../components/icons/Icon";
import { theme, fontFamily, palette, gradients } from "../theme/theme";

type Props = NativeStackScreenProps<RootStackParamList, "ExamResult">;

function formatDate(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ExamResultScreen({ route, navigation }: Props) {
  const t = useT();
  const { examHistory } = useAppState();
  const finishedAt = route.params?.finishedAt;
  const result = useMemo(
    () => (finishedAt ? examHistory.find((r) => r.finishedAt === finishedAt) : examHistory[0]) ?? examHistory[0],
    [examHistory, finishedAt]
  );
  const [showAll, setShowAll] = useState(false);

  if (!result) {
    return (
      <SafeAreaView style={styles.safe}>
        <Pressable onPress={() => navigation.popToTop()} hitSlop={12} style={[styles.backRow, { padding: theme.spacing(2.5) }]}>
          <Icon name="chevronLeft" size={18} color={theme.colors.accent} strokeWidth={2.4} />
          <Text style={styles.back}>{t("result.home")}</Text>
        </Pressable>
        <Text style={styles.emptyText}>{t("result.none")}</Text>
      </SafeAreaView>
    );
  }

  const percent = percentOf(result);
  const passed = percent >= PASS_PERCENT;
  const message =
    percent >= 90 ? t("result.msgExcellent") : passed ? t("result.msgPassed") : percent >= 50 ? t("result.msgClose") : t("result.msgStudy");
  const byCategory = scoreByCategory(result, QUESTIONS_BY_ID);
  const listed = result.answers.filter((a) => showAll || !a.correct);
  const wrongCount = result.total - result.correct;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.popToTop()} hitSlop={12} style={[styles.headerSide, styles.backRow]}>
          <Icon name="chevronLeft" size={18} color={theme.colors.accent} strokeWidth={2.4} />
          <Text style={styles.back}>{t("result.home")}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{t("result.title")}</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <LinearGradient colors={passed ? gradients.verde : gradients.borravino} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.scoreCard}>
          <View style={styles.scoreBadge}>
            <Icon name="award" size={16} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.scoreBadgeText}>{passed ? t("result.passed") : t("result.notPassed")}</Text>
          </View>
          <Text style={styles.scoreBig}>{percent}%</Text>
          <Text style={styles.scoreSub}>{t("result.score", { n: result.correct, total: result.total })}</Text>
          <Text style={styles.scoreMsg}>{message}</Text>
          <Text style={styles.scoreDate}>
            {formatDate(result.finishedAt)} · {t("result.passMark", { n: PASS_PERCENT })}
          </Text>
        </LinearGradient>

        <Text style={styles.sectionTitle}>{t("result.byCategory")}</Text>
        <View style={styles.panel}>
          {byCategory.map((c, i) => {
            const pct = c.total ? Math.round((c.correct / c.total) * 100) : 0;
            return (
              <View key={c.category} style={[styles.catRow, i === byCategory.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={styles.catRowTop}>
                  <Text style={styles.catName}>{CATEGORY_SHORT_TITLE[c.category]}</Text>
                  <Text style={styles.catScore}>
                    {c.correct}/{c.total}
                  </Text>
                </View>
                <View style={styles.catTrack}>
                  <View
                    style={[
                      styles.catFill,
                      { width: `${pct}%`, backgroundColor: pct >= PASS_PERCENT ? theme.colors.success : theme.colors.accentGold },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.reviewHeader}>
          <Text style={[styles.sectionTitle, { marginTop: 0 }]}>
            {showAll ? t("result.allQuestions") : t("result.missedQuestions", { n: wrongCount })}
          </Text>
          <Pressable onPress={() => setShowAll((s) => !s)} hitSlop={8}>
            <Text style={styles.toggleText}>{showAll ? t("result.showMissed") : t("result.showAll")}</Text>
          </Pressable>
        </View>

        {listed.length === 0 ? (
          <View style={styles.panel}>
            <Text style={styles.perfectText}>{t("result.perfect")}</Text>
          </View>
        ) : (
          listed.map((a) => {
            const q = QUESTIONS_BY_ID[a.questionId];
            if (!q) return null;
            const options = result.optionsById[a.questionId] ?? [q.correct, ...q.wrong];
            const chosenText = options[a.chosenIndex];
            const pack = PACKS_BY_ID[q.packId];
            return (
              <View key={a.questionId} style={styles.qCard}>
                {pack && (
                  <Text style={[styles.qPack, { color: pack.color }]} numberOfLines={1}>
                    {pack.title}
                  </Text>
                )}
                <Text style={styles.qText}>{q.question}</Text>
                {!a.correct && chosenText ? (
                  <View style={styles.answerLine}>
                    <View style={[styles.answerDot, { backgroundColor: theme.colors.danger }]}>
                      <Icon name="close" size={10} color="#FFFFFF" strokeWidth={3} />
                    </View>
                    <Text style={[styles.answerText, styles.answerWrong]}>{chosenText}</Text>
                  </View>
                ) : null}
                <View style={styles.answerLine}>
                  <View style={[styles.answerDot, { backgroundColor: theme.colors.success }]}>
                    <Icon name="check" size={11} color="#FFFFFF" strokeWidth={3} />
                  </View>
                  <Text style={[styles.answerText, styles.answerRight]}>{q.correct}</Text>
                </View>
                {q.ref ? (
                  <View style={styles.refRow}>
                    <Icon name="book" size={12} color={theme.colors.textMuted} strokeWidth={2} />
                    <Text style={styles.refText}>{q.ref}</Text>
                  </View>
                ) : null}
              </View>
            );
          })
        )}

        {examHistory.length > 1 && (
          <>
            <Text style={styles.sectionTitle}>{t("result.history")}</Text>
            <View style={styles.panel}>
              {examHistory.slice(0, 8).map((r, i, arr) => {
                const p = percentOf(r);
                const isThis = r.finishedAt === result.finishedAt;
                return (
                  <Pressable
                    key={r.finishedAt}
                    onPress={() => navigation.setParams({ finishedAt: r.finishedAt })}
                    style={[styles.histRow, i === arr.length - 1 && { borderBottomWidth: 0 }, isThis && styles.histRowActive]}
                  >
                    <Text style={styles.histDate}>{formatDate(r.finishedAt)}</Text>
                    <Text style={[styles.histScore, { color: p >= PASS_PERCENT ? palette.verdeDeep : palette.borravino }]}>
                      {r.correct}/{r.total} · {p}%
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable onPress={() => navigation.replace("Exam")} style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}>
          <Icon name="refresh" size={16} color="#FFFFFF" strokeWidth={2.2} />
          <Text style={styles.primaryBtnText}>{t("result.again")}</Text>
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
    paddingBottom: theme.spacing(1),
  },
  headerSide: { minWidth: 80 },
  headerTitle: { fontFamily: theme.font.heading.fontFamily, fontSize: 18, color: theme.colors.text },
  backRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  back: { fontFamily: fontFamily.bodyBold, color: theme.colors.accent, fontSize: 15 },
  scroll: { padding: theme.spacing(2.5), paddingBottom: theme.spacing(4), width: "100%", maxWidth: 560, alignSelf: "center" },
  scoreCard: { borderRadius: theme.radius.lg, padding: theme.spacing(3), alignItems: "center" },
  scoreBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: theme.spacing(1.5),
    borderRadius: theme.radius.pill,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  scoreBadgeText: { fontFamily: theme.font.label.fontFamily, fontSize: 12, color: "#FFFFFF", letterSpacing: 0.6, textTransform: "uppercase" },
  scoreBig: { marginTop: theme.spacing(1.5), fontFamily: fontFamily.displayBlack, fontSize: 64, lineHeight: 72, color: "#FFFFFF" },
  scoreSub: { fontFamily: fontFamily.bodyBold, fontSize: 16, color: "rgba(255,255,255,0.92)" },
  scoreMsg: { marginTop: theme.spacing(1.5), fontFamily: fontFamily.bodyMedium, fontSize: 15, lineHeight: 21, color: "#FFFFFF", textAlign: "center" },
  scoreDate: { marginTop: theme.spacing(1.5), fontFamily: fontFamily.bodySemiBold, fontSize: 12, color: "rgba(255,255,255,0.75)" },
  sectionTitle: { marginTop: theme.spacing(3), marginBottom: theme.spacing(1.25), fontFamily: theme.font.heading.fontFamily, fontSize: 19, color: theme.colors.text },
  panel: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
  },
  catRow: { padding: theme.spacing(1.75), borderBottomWidth: 1, borderBottomColor: theme.colors.border, gap: 8 },
  catRowTop: { flexDirection: "row", justifyContent: "space-between" },
  catName: { fontFamily: fontFamily.bodySemiBold, fontSize: 15, color: theme.colors.text },
  catScore: { fontFamily: fontFamily.bodyExtraBold, fontSize: 14, color: theme.colors.text },
  catTrack: { height: 6, borderRadius: 3, backgroundColor: theme.colors.border, overflow: "hidden" },
  catFill: { height: 6, borderRadius: 3 },
  reviewHeader: {
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(1.25),
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: theme.spacing(1),
  },
  toggleText: { fontFamily: fontFamily.bodyBold, fontSize: 13, color: theme.colors.accent },
  perfectText: { padding: theme.spacing(2), fontFamily: fontFamily.bodySemiBold, fontSize: 15, color: theme.colors.text, textAlign: "center" },
  qCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing(2),
    marginBottom: theme.spacing(1.25),
    gap: 8,
  },
  qPack: { fontFamily: theme.font.label.fontFamily, fontSize: 11, letterSpacing: 0.4, textTransform: "uppercase" },
  qText: { fontFamily: fontFamily.displayBold, fontSize: 16, lineHeight: 22, color: theme.colors.text },
  answerLine: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  answerDot: { width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center", marginTop: 1 },
  answerText: { flex: 1, fontFamily: fontFamily.bodySemiBold, fontSize: 14, lineHeight: 20 },
  answerWrong: { color: theme.colors.danger, textDecorationLine: "line-through" },
  answerRight: { color: palette.verdeDeep },
  refRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  refText: { flexShrink: 1, fontFamily: fontFamily.bodyBold, fontSize: 12, color: theme.colors.textMuted },
  histRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: theme.spacing(1.5),
    paddingHorizontal: theme.spacing(1.75),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  histRowActive: { backgroundColor: theme.colors.accentTint },
  histDate: { fontFamily: fontFamily.bodyMedium, fontSize: 14, color: theme.colors.text },
  histScore: { fontFamily: fontFamily.bodyExtraBold, fontSize: 14 },
  footer: {
    paddingHorizontal: theme.spacing(2.5),
    paddingTop: theme.spacing(1.5),
    paddingBottom: theme.spacing(1.5),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: theme.spacing(1.75),
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accent,
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
  },
  primaryBtnText: { fontFamily: theme.font.label.fontFamily, fontSize: 15, color: "#FFFFFF" },
  emptyText: { textAlign: "center", marginTop: 40, paddingHorizontal: 24, fontFamily: fontFamily.body, color: theme.colors.textMuted },
});
