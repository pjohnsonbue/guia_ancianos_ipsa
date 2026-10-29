import React, { useEffect, useRef, useState } from "react";
import { Text, ScrollView, Alert, Platform, type ScrollViewInstance } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { buildExam, type ExamAnswer, type ExamQuestion, type ExamResult } from "../content/exam";
import { PACKS_BY_ID } from "../content/course";
import { CATEGORY_SHORT_TITLE } from "../content/categories";
import { useAppState } from "../state/AppState";
import { useT } from "../lib/i18n";
import { QuestionView, QuizHeader, QuizProgress, QuizFooterButton, quizStyles } from "../components/QuestionView";

type Props = NativeStackScreenProps<RootStackParamList, "Exam">;

export default function ExamScreen({ navigation }: Props) {
  const t = useT();
  const { saveExamResult } = useAppState();
  // Built once per screen mount; "Nuevo simulacro" replaces the screen.
  const [questions] = useState<ExamQuestion[]>(() => buildExam());
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<ExamAnswer[]>([]);
  const [chosen, setChosen] = useState<number | null>(null);
  const finishedRef = useRef(false);
  const scrollRef = useRef<ScrollViewInstance>(null);

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
      <SafeAreaView style={quizStyles.safe}>
        <Text style={quizStyles.emptyText}>{t("exam.noQuestions")}</Text>
      </SafeAreaView>
    );
  }

  const pack = PACKS_BY_ID[current.question.packId];

  const choose = (i: number) => {
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

  return (
    <SafeAreaView style={quizStyles.safe} edges={["top", "bottom", "left", "right"]}>
      <QuizHeader
        title={t("exam.title")}
        subtitle={t("exam.progress", { n: index + 1, total: questions.length })}
        correctCount={correctSoFar}
        onClose={() => navigation.goBack()}
        closeLabel={t("exam.a11yClose")}
      />
      <QuizProgress fraction={(index + (revealed ? 1 : 0)) / questions.length} />
      <ScrollView ref={scrollRef} contentContainerStyle={quizStyles.scroll}>
        <QuestionView
          item={current}
          chosen={chosen}
          onChoose={choose}
          chip={pack ? { label: `${CATEGORY_SHORT_TITLE[pack.category]} · ${pack.title}`, color: pack.color } : undefined}
        />
      </ScrollView>
      <QuizFooterButton
        label={!revealed ? t("exam.chooseHint") : isLast ? t("exam.seeResults") : t("exam.next")}
        enabled={revealed}
        onPress={next}
      />
    </SafeAreaView>
  );
}
