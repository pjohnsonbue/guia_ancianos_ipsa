import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { buildExam, type ExamAnswer, type ExamQuestion, type ExamResult } from "../content/exam";
import { PACKS_BY_ID } from "../content/packs";
import { CATEGORIES_BY_ID } from "../content/categories";
import { useAppState } from "../state/AppState";
import { useT } from "../lib/i18n";
import { Icon } from "../components/icons/Icon";
import { theme, fontFamily, palette } from "../theme/theme";

type Props = NativeStackScreenProps<RootStackParamList, "Exam">;

const LETTERS = ["A", "B", "C", "D"];

export default function ExamScreen({ navigation }: Props) {
  const t = useT();
  const { saveExamResult } = useAppState();
  // Built once per screen mount; "Nuevo simulacro" replaces the screen.
  const [questions] = useState<ExamQuestion[]>(() => buildExam());
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<ExamAnswer[]>([]);
  const [chosen, setChosen] = useState<number | null>(null);
  const finishedRef = useRef(false);
  const scrollRef = useRef<ScrollView>(null);

  const current = questions[index];
  const isLast = index === questions.length - 1;
  const revealed = chosen !== null;
  const correctSoFar = answers.filter((a) => a.correct).length;

  // Leaving mid-exam (back button, Android hardware back) asks first.
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (finishedRef.current || answers.length === 0) return;
      e.preventDefault();
      const leave = () => {
        finishedRef.current = true;
        navigation.dispatch(e.data.action);
      };
      if (Platform.OS === "web") {
        // Alert.alert has no buttons on web; fall back to the browser dialog.
        // eslint-disable-next-line no-alert
        if (typeof window !== "undefined" && window.confirm(t("exam.leaveMessage"))) leave();
        return;
      }
      Alert.alert(t("exam.leaveTitle"), t("exam.leaveMessage"), [
        { text: t("exam.leaveCancel"), style: "cancel" },
        { text: t("exam.leaveConfirm"), style: "destructive", onPress: leave },
      ]);
    });
    return unsubscribe;
  }, [navigation, answers.length, t]);

  if (!current) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.emptyText}>{t("exam.noQuestions")}</Text>
      </SafeAreaView>
    );
  }

  const pack = PACKS_BY_ID[current.question.packId];
  const category = pack ? CATEGORIES_BY_ID[pack.category] : undefined;

  const choose = (i: number) => {
    if (revealed) return;
    setChosen(i);
    setAnswers((prev) => [...prev, { questionId: current.question.id, chosenIndex: i, correct: i === current.correctIndex }]);
  };

  const next = () => {
    if (!revealed) return;
    if (isLast) {
      const result: ExamResult = {
        finishedAt: Date.now(),
        total: questions.length,
        correct: answers.filter((a) => a.correct).length,
        answers,
        optionsById: Object.fromEntries(questions.map((q) => [q.question.id, q.options])),
      };
      saveExamResult(result);
      finishedRef.current = true;
      navigation.replace("ExamResult", { finishedAt: result.finishedAt });
      return;
    }
    setChosen(null);
    setIndex((i) => i + 1);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const optionStyle = (i: number) => {
    if (!revealed) return null;
    if (i === current.correctIndex) return styles.optionCorrect;
    if (i === chosen) return styles.optionWrong;
    return styles.optionDimmed;
  };

  const wasCorrect = revealed && chosen === current.correctIndex;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom", "left", "right"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={styles.closeBtn}
          accessibilityRole="button"
          accessibilityLabel={t("exam.a11yClose")}
        >
          <Icon name="close" size={18} color={theme.colors.text} strokeWidth={2.2} />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={styles.headerTitle}>{t("exam.title")}</Text>
          <Text style={styles.headerSub}>{t("exam.progress", { n: index + 1, total: questions.length })}</Text>
        </View>
        <View style={styles.scorePill}>
          <Icon name="check" size={12} color={theme.colors.success} strokeWidth={3} />
          <Text style={styles.scorePillText}>{correctSoFar}</Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${((index + (revealed ? 1 : 0)) / questions.length) * 100}%` }]} />
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll}>
        {pack && (
          <View style={[styles.packChip, { backgroundColor: pack.color }]}>
            <Text style={styles.packChipText} numberOfLines={1}>
              {category ? `${category.shortTitle} · ` : ""}
              {pack.title}
            </Text>
          </View>
        )}

        <Text style={styles.question}>{current.question.question}</Text>

        <View style={styles.options}>
          {current.options.map((opt, i) => (
            <Pressable
              key={`${current.question.id}-${i}`}
              onPress={() => choose(i)}
              disabled={revealed}
              style={({ pressed }) => [styles.option, pressed && !revealed && styles.optionPressed, optionStyle(i)]}
              accessibilityRole="button"
              accessibilityState={{ disabled: revealed, selected: chosen === i }}
            >
              <View
                style={[
                  styles.letter,
                  revealed && i === current.correctIndex && styles.letterCorrect,
                  revealed && i === chosen && i !== current.correctIndex && styles.letterWrong,
                ]}
              >
                {revealed && i === current.correctIndex ? (
                  <Icon name="check" size={14} color="#FFFFFF" strokeWidth={3} />
                ) : revealed && i === chosen ? (
                  <Icon name="close" size={13} color="#FFFFFF" strokeWidth={3} />
                ) : (
                  <Text style={styles.letterText}>{LETTERS[i]}</Text>
                )}
              </View>
              <Text style={styles.optionText}>{opt}</Text>
            </Pressable>
          ))}
        </View>

        {revealed && (
          <View style={[styles.feedback, wasCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
            <Text style={[styles.feedbackTitle, { color: wasCorrect ? palette.verdeDeep : palette.danger }]}>
              {wasCorrect ? t("exam.correct") : t("exam.incorrect")}
            </Text>
            {!wasCorrect && (
              <Text style={styles.feedbackBody}>
                {t("exam.correctAnswerIs")} <Text style={styles.feedbackStrong}>{current.question.correct}</Text>
              </Text>
            )}
            {current.question.ref ? (
              <View style={styles.refRow}>
                <Icon name="book" size={13} color={theme.colors.textMuted} strokeWidth={2} />
                <Text style={styles.refText}>{current.question.ref}</Text>
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={next}
          disabled={!revealed}
          style={({ pressed }) => [styles.nextBtn, !revealed && styles.nextBtnDisabled, pressed && revealed && { opacity: 0.9 }]}
          accessibilityRole="button"
        >
          <Text style={styles.nextBtnText}>
            {!revealed ? t("exam.chooseHint") : isLast ? t("exam.seeResults") : t("exam.next")}
          </Text>
          {revealed && <Icon name="chevronRight" size={16} color="#FFFFFF" strokeWidth={2.4} />}
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
    paddingHorizontal: theme.spacing(2.5),
    paddingTop: theme.spacing(1.5),
    paddingBottom: theme.spacing(1.5),
    gap: theme.spacing(1),
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontFamily: theme.font.heading.fontFamily, fontSize: 18, color: theme.colors.text },
  headerSub: { marginTop: 2, fontFamily: fontFamily.bodySemiBold, fontSize: 12, color: theme.colors.textMuted },
  scorePill: {
    minWidth: 38,
    height: 30,
    paddingHorizontal: 10,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: theme.colors.successTint,
  },
  scorePillText: { fontFamily: fontFamily.bodyExtraBold, fontSize: 13, color: palette.verdeDeep },
  progressTrack: {
    height: 6,
    marginHorizontal: theme.spacing(2.5),
    borderRadius: 3,
    backgroundColor: theme.colors.border,
    overflow: "hidden",
  },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: theme.colors.accentGold },
  scroll: { padding: theme.spacing(2.5), paddingBottom: theme.spacing(4), width: "100%", maxWidth: 560, alignSelf: "center" },
  packChip: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    paddingVertical: 5,
    paddingHorizontal: theme.spacing(1.25),
    borderRadius: theme.radius.pill,
  },
  packChipText: { fontFamily: theme.font.label.fontFamily, fontSize: 11, color: "#FFFFFF", letterSpacing: 0.3 },
  question: {
    marginTop: theme.spacing(2),
    fontFamily: fontFamily.displayBold,
    fontSize: 22,
    lineHeight: 29,
    color: theme.colors.text,
  },
  options: { marginTop: theme.spacing(2.5), gap: theme.spacing(1.25) },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing(1.5),
    padding: theme.spacing(1.75),
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  optionPressed: { borderColor: theme.colors.accent, backgroundColor: theme.colors.accentTint },
  optionCorrect: { borderColor: theme.colors.success, backgroundColor: theme.colors.successTint },
  optionWrong: { borderColor: theme.colors.danger, backgroundColor: theme.colors.dangerTint },
  optionDimmed: { opacity: 0.55 },
  letter: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: theme.colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
  },
  letterCorrect: { backgroundColor: theme.colors.success, borderColor: theme.colors.success },
  letterWrong: { backgroundColor: theme.colors.danger, borderColor: theme.colors.danger },
  letterText: { fontFamily: fontFamily.bodyExtraBold, fontSize: 13, color: theme.colors.textMuted },
  optionText: { flex: 1, fontFamily: fontFamily.bodySemiBold, fontSize: 16, lineHeight: 22, color: theme.colors.text },
  feedback: {
    marginTop: theme.spacing(2.5),
    padding: theme.spacing(2),
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: 6,
  },
  feedbackCorrect: { backgroundColor: theme.colors.successTint, borderColor: "rgba(31,138,91,0.35)" },
  feedbackWrong: { backgroundColor: theme.colors.dangerTint, borderColor: "rgba(194,65,59,0.35)" },
  feedbackTitle: { fontFamily: theme.font.heading.fontFamily, fontSize: 18 },
  feedbackBody: { fontFamily: fontFamily.body, fontSize: 15, lineHeight: 21, color: theme.colors.text },
  feedbackStrong: { fontFamily: fontFamily.bodyBold },
  refRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  refText: { flexShrink: 1, fontFamily: fontFamily.bodyBold, fontSize: 12, color: theme.colors.textMuted },
  footer: {
    paddingHorizontal: theme.spacing(2.5),
    paddingTop: theme.spacing(1.5),
    paddingBottom: theme.spacing(2),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: theme.spacing(1.75),
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accent,
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
  },
  nextBtnDisabled: { backgroundColor: theme.colors.borderStrong },
  nextBtnText: { fontFamily: theme.font.label.fontFamily, fontSize: 15, color: "#FFFFFF" },
  emptyText: { textAlign: "center", marginTop: 40, paddingHorizontal: 24, fontFamily: fontFamily.body, color: theme.colors.textMuted },
});
