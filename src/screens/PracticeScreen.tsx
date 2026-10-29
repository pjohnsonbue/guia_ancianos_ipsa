import React, { useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, Platform, type ScrollViewInstance } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import type { Question } from "../content/types";
import { PACKS_BY_ID } from "../content/course";
import { getQuestionsForPack } from "../content/questions";
import { REVIEW_PACK_ID, CATEGORY_SHORT_TITLE, getReviewQuestions } from "../content/categories";
import { withShuffledOptions, type ExamQuestion } from "../content/exam";
import { useAppState } from "../state/AppState";
import { useT } from "../lib/i18n";
import { shouldOfferRatingPrompt, markRatingPromptShown, requestRating } from "../lib/rating";
import { QuestionView, QuizHeader, QuizProgress, QuizFooterButton, quizStyles } from "../components/QuestionView";
import { theme, fontFamily, palette } from "../theme/theme";

type Props = NativeStackScreenProps<RootStackParamList, "Practice">;

/** «Preguntas de repaso» for one pack, or «Repasá» (every question last
 *  answered wrong). Answers are saved as you go, so leaving mid-way loses
 *  nothing; the end screen offers to retry the misses. */
export default function PracticeScreen({ route, navigation }: Props) {
  const { packId } = route.params;
  const isReview = packId === REVIEW_PACK_ID;
  const pack = isReview ? undefined : PACKS_BY_ID[packId];
  const t = useT();
  const { questionAnswers, recordAnswer } = useAppState();

  // The question list is fixed when the round starts (a review round must not
  // shrink while you answer it).
  const initial = useMemo<Question[]>(
    () => (isReview ? getReviewQuestions((id) => questionAnswers[id] === "wrong") : getQuestionsForPack(packId)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [packId]
  );
  const [round, setRound] = useState<ExamQuestion[]>(() => initial.map((q) => withShuffledOptions(q)));
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const scrollRef = useRef<ScrollViewInstance>(null);

  const title = isReview ? t("practice.reviewTitle") : (pack?.title ?? "");
  const color = pack?.color ?? theme.colors.accent;
  const done = index >= round.length;
  const current = round[index];
  const revealed = chosen !== null;
  const correctSoFar = results.filter(Boolean).length;

  const startRound = (questions: Question[]) => {
    setRound(questions.map((q) => withShuffledOptions(q)));
    setIndex(0);
    setChosen(null);
    setResults([]);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const choose = (i: number) => {
    const correct = i === current.correctIndex;
    setChosen(i);
    setResults((prev) => [...prev, correct]);
    recordAnswer(current.question.id, correct);
  };

  const next = async () => {
    if (!revealed) return;
    setChosen(null);
    setIndex((n) => n + 1);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    if (index === round.length - 1) maybeAskForRating();
  };

  // One-time "rate the app" nudge after a good amount of correct answers
  // (see src/lib/rating.ts). Not on web.
  const maybeAskForRating = async () => {
    if (Platform.OS === "web") return;
    const total = Object.values(questionAnswers).filter((a) => a === "correct").length + 1;
    if (!(await shouldOfferRatingPrompt(total))) return;
    await markRatingPromptShown();
    Alert.alert(t("practice.rateTitle"), t("practice.rateMessage"), [
      { text: t("practice.rateNotNow"), style: "cancel" },
      { text: t("practice.rateNow"), onPress: () => requestRating() },
    ]);
  };

  if (round.length === 0) {
    return (
      <SafeAreaView style={quizStyles.safe} edges={["top", "bottom", "left", "right"]}>
        <QuizHeader title={title} subtitle="" correctCount={0} onClose={() => navigation.goBack()} closeLabel={t("practice.close")} />
        <Text style={quizStyles.emptyText}>{t("practice.empty")}</Text>
      </SafeAreaView>
    );
  }

  if (done) {
    const missed = round.filter((_, i) => !results[i]).map((q) => q.question);
    const allRight = missed.length === 0;
    return (
      <SafeAreaView style={quizStyles.safe} edges={["top", "bottom", "left", "right"]}>
        <QuizHeader
          title={title}
          subtitle={t("practice.doneTitle")}
          correctCount={correctSoFar}
          onClose={() => navigation.goBack()}
          closeLabel={t("practice.close")}
        />
        <QuizProgress fraction={1} color={color} />
        <ScrollView contentContainerStyle={quizStyles.scroll}>
          <View style={[styles.doneCard, { borderColor: color }]}>
            <Text style={styles.doneEmoji}>{allRight ? "🎉" : "📖"}</Text>
            <Text style={styles.doneTitle}>{t("practice.doneTitle")}</Text>
            <Text style={[styles.doneScore, { color }]}>{t("practice.doneScore", { n: correctSoFar, total: round.length })}</Text>
            <Text style={styles.doneBody}>{allRight ? t("practice.doneAll") : t("practice.doneSome")}</Text>
          </View>
          {!allRight && (
            <Pressable
              onPress={() => startRound(missed)}
              style={({ pressed }) => [styles.primaryBtn, { backgroundColor: color }, pressed && { opacity: 0.9 }]}
              accessibilityRole="button"
            >
              <Text style={styles.primaryBtnText}>{t("practice.retryMissed")}</Text>
            </Pressable>
          )}
          {!isReview && (
            <Pressable
              onPress={() => startRound(initial)}
              style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.85 }]}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryBtnText}>{t("practice.retryAll")}</Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.85 }]}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryBtnText}>{t("practice.backToCourse")}</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const currentPack = PACKS_BY_ID[current.question.packId];
  const isLast = index === round.length - 1;

  return (
    <SafeAreaView style={quizStyles.safe} edges={["top", "bottom", "left", "right"]}>
      <QuizHeader
        title={title}
        subtitle={t("exam.progress", { n: index + 1, total: round.length })}
        correctCount={correctSoFar}
        onClose={() => navigation.goBack()}
        closeLabel={t("practice.close")}
      />
      <QuizProgress fraction={(index + (revealed ? 1 : 0)) / round.length} color={color} />
      <ScrollView ref={scrollRef} contentContainerStyle={quizStyles.scroll}>
        <QuestionView
          item={current}
          chosen={chosen}
          onChoose={choose}
          chip={
            isReview && currentPack
              ? { label: `${CATEGORY_SHORT_TITLE[currentPack.category]} · ${currentPack.title}`, color: currentPack.color }
              : undefined
          }
        />
      </ScrollView>
      <QuizFooterButton
        label={!revealed ? t("exam.chooseHint") : isLast ? t("practice.finish") : t("practice.next")}
        enabled={revealed}
        onPress={next}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  doneCard: {
    alignItems: "center",
    padding: theme.spacing(3),
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    backgroundColor: theme.colors.surface,
  },
  doneEmoji: { fontSize: 40 },
  doneTitle: { marginTop: theme.spacing(1), fontFamily: theme.font.title.fontFamily, fontSize: 26, color: theme.colors.text },
  doneScore: { marginTop: theme.spacing(1), fontFamily: fontFamily.bodyExtraBold, fontSize: 17 },
  doneBody: {
    marginTop: theme.spacing(1.5),
    textAlign: "center",
    fontFamily: fontFamily.body,
    fontSize: 15,
    lineHeight: 21,
    color: theme.colors.textMuted,
  },
  primaryBtn: {
    marginTop: theme.spacing(2.5),
    alignItems: "center",
    paddingVertical: theme.spacing(1.75),
    borderRadius: theme.radius.pill,
  },
  primaryBtnText: { fontFamily: theme.font.label.fontFamily, fontSize: 15, color: "#FFFFFF" },
  secondaryBtn: {
    marginTop: theme.spacing(1.5),
    alignItems: "center",
    paddingVertical: theme.spacing(1.6),
    borderRadius: theme.radius.pill,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  secondaryBtnText: { fontFamily: theme.font.label.fontFamily, fontSize: 15, color: palette.azulDeep },
});
