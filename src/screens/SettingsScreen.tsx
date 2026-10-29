import React from "react";
import { View, Text, StyleSheet, Pressable, Alert, Linking, ScrollView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { useAppState } from "../state/AppState";
import { QUESTIONS } from "../content/questions";
import { VIDEOS } from "../content/videos";
import { getVisiblePacks } from "../content/categories";
import { useT } from "../lib/i18n";
import { theme, fontFamily } from "../theme/theme";
import { Icon } from "../components/icons/Icon";
import { DashBand } from "../components/decor/DashBand";
import { BrandMark } from "../components/decor/BrandMark";
import { requestRating } from "../lib/rating";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

// Hosted separately from the app (required by the store listings).
// TODO before release: publish release/privacy-policy.html at this URL, or
// update it to wherever it ends up hosted.
const PRIVACY_POLICY_URL = "https://lumenadev.wordpress.com/guia-ancianos-privacidad/";

/** Destructive confirm that also works on web (where Alert has no buttons). */
function confirmDestructive(title: string, message: string, cancel: string, confirm: string, onConfirm: () => void) {
  if (Platform.OS === "web") {
    // eslint-disable-next-line no-alert
    if (typeof window !== "undefined" && window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: cancel, style: "cancel" },
    { text: confirm, style: "destructive", onPress: onConfirm },
  ]);
}

export default function SettingsScreen({ navigation }: Props) {
  const { resetProgress, clearExamHistory, questionAnswers, examHistory } = useAppState();
  const t = useT();
  const correctCount = Object.values(questionAnswers).filter((a) => a === "correct").length;
  const readingCount = getVisiblePacks().filter((p) => p.reading).length;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backRow}>
          <Icon name="chevronLeft" size={18} color={theme.colors.accent} strokeWidth={2.4} />
          <Text style={styles.back}>{t("settings.back")}</Text>
        </Pressable>
        <Text style={styles.title}>{t("settings.title")}</Text>
        <View style={styles.headerMark}>
          <BrandMark size={28} />
        </View>
      </View>

      <DashBand dashes={12} style={{ marginBottom: theme.spacing(2.5), paddingHorizontal: theme.spacing(2.5) }} />

      <ScrollView contentContainerStyle={{ paddingBottom: theme.spacing(4), width: "100%", maxWidth: 560, alignSelf: "center" }}>
        <Text style={styles.sectionLabel}>{t("settings.progressSection")}</Text>
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.rowText}>{t("settings.correctQuestions")}</Text>
            <Text style={styles.rowValue}>
              {correctCount} / {QUESTIONS.length}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowText}>{t("settings.examsTaken")}</Text>
            <Text style={styles.rowValue}>{examHistory.length}</Text>
          </View>
          <Pressable
            style={styles.row}
            onPress={() =>
              confirmDestructive(
                t("settings.resetAlertTitle"),
                t("settings.resetAlertMessage"),
                t("settings.cancel"),
                t("settings.resetAlertConfirm"),
                () => resetProgress()
              )
            }
          >
            <Text style={[styles.rowText, { color: theme.colors.danger }]}>{t("settings.resetProgress")}</Text>
          </Pressable>
          <Pressable
            style={[styles.row, styles.rowLast]}
            onPress={() =>
              confirmDestructive(
                t("settings.clearExamsTitle"),
                t("settings.clearExamsMessage"),
                t("settings.cancel"),
                t("settings.clearExamsConfirm"),
                () => clearExamHistory()
              )
            }
          >
            <Text style={[styles.rowText, { color: theme.colors.danger }]}>{t("settings.clearExams")}</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>{t("settings.contentSection")}</Text>
        <View style={styles.section}>
          <View style={[styles.row, styles.rowLast, { flexDirection: "column", alignItems: "stretch" }]}>
            <Text style={styles.rowText}>{t("settings.contentSummary", { readings: readingCount, questions: QUESTIONS.length, videos: VIDEOS.length })}</Text>
            <Text style={styles.rowSub}>{t("settings.sources")}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>{t("settings.appSection")}</Text>
        <View style={styles.section}>
          <Pressable style={styles.row} onPress={() => requestRating()}>
            <Text style={styles.rowText}>{t("settings.rateApp")}</Text>
            <Icon name="chevronRight" size={15} color={theme.colors.textMuted} strokeWidth={2.2} />
          </Pressable>
          <Pressable style={styles.row} onPress={() => Alert.alert(t("settings.about"), t("settings.aboutMessage"))}>
            <Text style={styles.rowText}>{t("settings.about")}</Text>
            <Icon name="chevronRight" size={15} color={theme.colors.textMuted} strokeWidth={2.2} />
          </Pressable>
          <Pressable style={[styles.row, styles.rowLast]} onPress={() => Linking.openURL(PRIVACY_POLICY_URL).catch(() => {})}>
            <Text style={styles.rowText}>{t("settings.privacyPolicy")}</Text>
            <Icon name="chevronRight" size={15} color={theme.colors.textMuted} strokeWidth={2.2} />
          </Pressable>
        </View>

        <Text style={styles.footer}>{t("settings.footer")}</Text>
      </ScrollView>
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
    paddingBottom: theme.spacing(2),
  },
  backRow: { flexDirection: "row", alignItems: "center", gap: 2, width: 80 },
  back: { fontFamily: fontFamily.bodyBold, color: theme.colors.accent, fontSize: 15 },
  headerMark: { width: 80, alignItems: "flex-end" },
  title: { fontFamily: theme.font.heading.fontFamily, fontSize: 18, color: theme.colors.text },
  sectionLabel: {
    fontFamily: theme.font.label.fontFamily,
    fontSize: 12,
    color: theme.colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: theme.spacing(0.75),
    marginLeft: theme.spacing(3.5),
  },
  section: {
    marginHorizontal: theme.spacing(2.5),
    marginBottom: theme.spacing(3),
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing(2),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: theme.spacing(1),
  },
  rowLast: { borderBottomWidth: 0 },
  rowText: { flexShrink: 1, fontFamily: fontFamily.bodySemiBold, fontSize: 16, color: theme.colors.text },
  rowSub: { fontFamily: fontFamily.body, fontSize: 13, color: theme.colors.textMuted, marginTop: 8, lineHeight: 19 },
  rowValue: { fontFamily: fontFamily.bodyBold, fontSize: 15, color: theme.colors.textMuted },
  footer: {
    textAlign: "center",
    fontFamily: fontFamily.body,
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: theme.spacing(1),
    paddingHorizontal: theme.spacing(3),
  },
});
