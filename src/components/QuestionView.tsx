import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import type { ExamQuestion } from "../content/exam";
import { useT } from "../lib/i18n";
import { Icon } from "./icons/Icon";
import { theme, fontFamily, palette } from "../theme/theme";

// The multiple-choice building blocks shared by the Simulacro (ExamScreen)
// and the «Preguntas de repaso» (PracticeScreen).

const LETTERS = ["A", "B", "C", "D"];

/** Question text, four options and — once answered — the feedback box. */
export function QuestionView({
  item,
  chosen,
  onChoose,
  chip,
}: {
  item: ExamQuestion;
  /** Index of the chosen option, or null while unanswered. */
  chosen: number | null;
  onChoose: (index: number) => void;
  /** Small coloured label above the question (e.g. the pack). */
  chip?: { label: string; color: string };
}) {
  const t = useT();
  const revealed = chosen !== null;
  const wasCorrect = revealed && chosen === item.correctIndex;

  const optionStyle = (i: number) => {
    if (!revealed) return null;
    if (i === item.correctIndex) return styles.optionCorrect;
    if (i === chosen) return styles.optionWrong;
    return styles.optionDimmed;
  };

  return (
    <View>
      {chip && (
        <View style={[styles.chip, { backgroundColor: chip.color }]}>
          <Text style={styles.chipText} numberOfLines={1}>
            {chip.label}
          </Text>
        </View>
      )}

      <Text style={styles.question}>{item.question.question}</Text>

      <View style={styles.options}>
        {item.options.map((opt, i) => (
          <Pressable
            key={`${item.question.id}-${i}`}
            onPress={() => !revealed && onChoose(i)}
            disabled={revealed}
            style={({ pressed }) => [styles.option, pressed && !revealed && styles.optionPressed, optionStyle(i)]}
            accessibilityRole="button"
            accessibilityState={{ disabled: revealed, selected: chosen === i }}
          >
            <View
              style={[
                styles.letter,
                revealed && i === item.correctIndex && styles.letterCorrect,
                revealed && i === chosen && i !== item.correctIndex && styles.letterWrong,
              ]}
            >
              {revealed && i === item.correctIndex ? (
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
              {t("exam.correctAnswerIs")} <Text style={styles.feedbackStrong}>{item.question.correct}</Text>
            </Text>
          )}
          {item.question.explanation ? <Text style={styles.feedbackBody}>{item.question.explanation}</Text> : null}
          {item.question.ref ? (
            <View style={styles.refRow}>
              <Icon name="book" size={13} color={theme.colors.textMuted} strokeWidth={2} />
              <Text style={styles.refText}>{item.question.ref}</Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

/** Close button · title + "Pregunta n de N" · correct-so-far pill. */
export function QuizHeader({
  title,
  subtitle,
  correctCount,
  onClose,
  closeLabel,
}: {
  title: string;
  subtitle: string;
  correctCount: number;
  onClose: () => void;
  closeLabel: string;
}) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel={closeLabel}>
        <Icon name="close" size={18} color={theme.colors.text} strokeWidth={2.2} />
      </Pressable>
      <View style={{ flex: 1, alignItems: "center" }}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.headerSub}>{subtitle}</Text>
      </View>
      <View style={styles.scorePill}>
        <Icon name="check" size={12} color={theme.colors.success} strokeWidth={3} />
        <Text style={styles.scorePillText}>{correctCount}</Text>
      </View>
    </View>
  );
}

export function QuizProgress({ fraction, color = theme.colors.accentGold }: { fraction: number; color?: string }) {
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${Math.round(fraction * 100)}%`, backgroundColor: color }]} />
    </View>
  );
}

/** The full-width button at the bottom of a quiz screen. */
export function QuizFooterButton({ label, enabled, onPress }: { label: string; enabled: boolean; onPress: () => void }) {
  return (
    <View style={styles.footer}>
      <Pressable
        onPress={onPress}
        disabled={!enabled}
        style={({ pressed }) => [styles.nextBtn, !enabled && styles.nextBtnDisabled, pressed && enabled && { opacity: 0.9 }]}
        accessibilityRole="button"
      >
        <Text style={styles.nextBtnText}>{label}</Text>
        {enabled && <Icon name="chevronRight" size={16} color="#FFFFFF" strokeWidth={2.4} />}
      </Pressable>
    </View>
  );
}

export const quizStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { padding: theme.spacing(2.5), paddingBottom: theme.spacing(4), width: "100%", maxWidth: 560, alignSelf: "center" },
  emptyText: { textAlign: "center", marginTop: 40, paddingHorizontal: 24, fontFamily: fontFamily.body, color: theme.colors.textMuted },
});

const styles = StyleSheet.create({
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
  progressFill: { height: 6, borderRadius: 3 },
  chip: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    paddingVertical: 5,
    paddingHorizontal: theme.spacing(1.25),
    borderRadius: theme.radius.pill,
  },
  chipText: { fontFamily: theme.font.label.fontFamily, fontSize: 11, color: "#FFFFFF", letterSpacing: 0.3 },
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
});
