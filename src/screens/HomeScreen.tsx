import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import type { Pack, Video } from "../content/types";
import { COURSE, PACKS_BY_ID } from "../content/course";
import { getVideosForReading } from "../content/videos";
import { getReviewQuestions, readingProgressKey, REVIEW_PACK_ID } from "../content/categories";
import { EXAM_LENGTH, percentOf } from "../content/exam";
import { useT, type TFunction } from "../lib/i18n";
import { useAppState } from "../state/AppState";
import { theme, palette, packGradient, gradients, fontFamily } from "../theme/theme";
import { PACK_ICONS } from "../theme/packIcons";
import { Icon } from "../components/icons/Icon";
import { BrandMark } from "../components/decor/BrandMark";
import { DashBand } from "../components/decor/DashBand";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

// «Lectura»: light and outlined, so reading reads differently from the
// gradient question packs. Tracks chapters read.
const ReadingCard = React.memo(function ReadingCard({
  pack,
  readCount,
  t,
  navigation,
}: {
  pack: Pack;
  readCount: number;
  t: TFunction;
  navigation: Props["navigation"];
}) {
  const reading = pack.reading!;
  const total = reading.chapterIds.length;
  const n = Math.min(readCount, total);
  return (
    <Pressable
      onPress={() => navigation.navigate("Reading", { packId: pack.id })}
      style={({ pressed }) => [styles.readingCard, pressed && { opacity: 0.92 }]}
      accessibilityRole="button"
    >
      <View style={styles.readingIcon}>
        <Icon name="book" size={20} color={theme.colors.accent} strokeWidth={2.2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.readingTitle}>
          {t("home.readingPrefix")} {reading.title}
        </Text>
        {reading.subtitle ? <Text style={styles.readingSubtitle}>{reading.subtitle}</Text> : null}
        <Text style={styles.readingMeta}>
          {t(readingProgressKey(reading.docId, total), { n, total })}
        </Text>
        <View style={styles.readingTrack}>
          <View style={[styles.readingFill, { width: `${Math.round((n / total) * 100)}%` }]} />
        </View>
      </View>
      <Icon name="chevronRight" size={18} color={theme.colors.textMuted} strokeWidth={2.2} />
    </Pressable>
  );
});

// «Preguntas de repaso» (or a Biblia pack): gradient card with answer progress.
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
  const total = pack.questionIds.length;
  return (
    <Pressable
      onPress={() => navigation.navigate("Practice", { packId: pack.id })}
      style={({ pressed }) => [styles.packCardShadow, pressed && { opacity: 0.92 }]}
      accessibilityRole="button"
    >
      <LinearGradient colors={packGradient(pack.color)} start={{ x: 0.05, y: 0 }} end={{ x: 1, y: 1 }} style={styles.packCard}>
        <View style={styles.packTitleRow}>
          <Text style={styles.packIconInline}>{PACK_ICONS[pack.id] ?? "📘"}</Text>
          <Text style={styles.packTitle}>{pack.reading ? `${t("home.questionsPrefix")} ${pack.title}` : pack.title}</Text>
        </View>
        {pack.description ? <Text style={styles.packDescription}>{pack.description}</Text> : null}
        <View style={styles.packFooter}>
          <Text style={styles.packMeta}>{t("home.questionsCount", { n: total })}</Text>
          {correctCount > 0 && <Text style={styles.packMeta}>{t("home.questionsCorrect", { n: correctCount, total })}</Text>}
        </View>
        {correctCount > 0 && (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round((correctCount / total) * 100)}%` }]} />
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
});

function formatDuration(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

// A video sits between a reading and its questions: outlined in the pack's
// colour so it reads as part of the topic, but light so it doesn't look like
// a question pack.
const VideoCard = React.memo(function VideoCard({
  video,
  color,
  watched,
  t,
  navigation,
}: {
  video: Video;
  color: string;
  watched: boolean;
  t: TFunction;
  navigation: Props["navigation"];
}) {
  const prefix = t(video.position === "after" ? "home.videoPrefix" : "home.videoIntroPrefix");
  return (
    <Pressable
      onPress={() => navigation.navigate("Video", { videoId: video.id })}
      style={({ pressed }) => [styles.videoCard, { borderColor: color }, pressed && { opacity: 0.92 }]}
      accessibilityRole="button"
      accessibilityLabel={`${prefix} ${video.title}`}
    >
      <View style={styles.videoThumbWrap}>
        <Image source={video.poster} style={styles.videoThumb} />
        <View style={styles.videoPlay}>
          <Icon name="play" size={16} color="#FFFFFF" />
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.videoTitle}>
          <Text style={{ color }}>{prefix} </Text>
          {video.title}
        </Text>
        <Text style={styles.videoMeta}>
          {t("home.videoLength", { n: formatDuration(video.duration) })}
          {watched ? <Text style={styles.videoWatched}>{"  ·  ✓ "}{t("home.videoWatched")}</Text> : null}
        </Text>
      </View>
      <Icon name="chevronRight" size={18} color={theme.colors.textMuted} strokeWidth={2.2} />
    </Pressable>
  );
});

export default function HomeScreen({ navigation }: Props) {
  const { questionAnswers, examHistory, watchedVideoIds, readChaptersByDoc } = useAppState();
  const t = useT();

  const reviewCount = useMemo(() => getReviewQuestions((id) => questionAnswers[id] === "wrong").length, [questionAnswers]);
  const readSets = useMemo(
    () => Object.fromEntries(Object.entries(readChaptersByDoc).map(([doc, ids]) => [doc, new Set(ids)])),
    [readChaptersByDoc]
  );
  const correctIn = (pack: Pack) => pack.questionIds.filter((id) => questionAnswers[id] === "correct").length;
  const readIn = (pack: Pack) => {
    const set = pack.reading ? readSets[pack.reading.docId] : undefined;
    return set ? pack.reading!.chapterIds.filter((id) => set.has(id)).length : 0;
  };

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

        {reviewCount > 0 && (
          <Pressable
            onPress={() => navigation.navigate("Practice", { packId: REVIEW_PACK_ID })}
            style={({ pressed }) => [styles.reviewCard, pressed && { opacity: 0.92 }]}
            accessibilityRole="button"
          >
            <View style={styles.reviewIcon}>
              <Icon name="refresh" size={20} color={theme.colors.accent} strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.reviewTitle}>{t("home.reviewTitle")}</Text>
              <Text style={styles.reviewSubtitle}>{reviewCount === 1 ? t("home.reviewSubtitleOne") : t("home.reviewSubtitle", { n: reviewCount })}</Text>
            </View>
            <Icon name="chevronRight" size={18} color={theme.colors.textMuted} strokeWidth={2.2} />
          </Pressable>
        )}

        {COURSE.map((section) => {
          const renderVideos = (packId: string, position: Video["position"]) =>
            getVideosForReading(packId, position).map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                color={PACKS_BY_ID[packId].color}
                watched={!!watchedVideoIds[video.id]}
                t={t}
                navigation={navigation}
              />
            ));
          // «section» videos introduce the whole document: right under its
          // heading, above the first sub-heading, with a gap after them. In a
          // section with sub-headings they get their own «Introducción» one.
          const sectionIntro = section.groups.flatMap((g) => g.packIds).flatMap((id) => renderVideos(id, "section"));
          const hasSubheadings = section.groups.some((g) => g.title);
          return (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {sectionIntro.length > 0 && (
                <View style={styles.sectionIntro}>
                  {hasSubheadings && <Text style={[styles.groupTitle, styles.introHeading]}>{t("home.introHeading")}</Text>}
                  {sectionIntro}
                </View>
              )}
              {section.groups.map((group, gi) => (
                <View key={group.title ?? gi}>
                  {group.title ? <Text style={styles.groupTitle}>{group.title}</Text> : null}
                  <View style={{ height: theme.spacing(1.5) }} />
                  {group.packIds.map((id) => {
                    const pack = PACKS_BY_ID[id];
                    return (
                      <View key={id} style={pack.reading ? styles.unit : undefined}>
                        {renderVideos(id, "before")}
                        {pack.reading && <ReadingCard pack={pack} readCount={readIn(pack)} t={t} navigation={navigation} />}
                        {renderVideos(id, "after")}
                        <PackCard pack={pack} correctCount={correctIn(pack)} t={t} navigation={navigation} />
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          );
        })}

        <DashBand dashes={14} style={{ marginTop: theme.spacing(2) }} />

        {/* Simulacro: 30 multiple-choice questions from the whole course. */}
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
  examShadow: {
    marginTop: theme.spacing(3),
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
    // Same gap above as the section heading below it has.
    marginTop: theme.spacing(4),
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
  readingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing(1.5),
    marginBottom: theme.spacing(1),
    padding: theme.spacing(2),
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.accent,
  },
  readingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.accentTint,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  readingTitle: { fontFamily: theme.font.heading.fontFamily, fontSize: 17, lineHeight: 22, color: theme.colors.text },
  readingSubtitle: { marginTop: 3, fontFamily: fontFamily.body, fontSize: 13, lineHeight: 18, color: theme.colors.textMuted },
  readingMeta: {
    marginTop: theme.spacing(1),
    fontFamily: theme.font.label.fontFamily,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: theme.colors.accent,
  },
  readingTrack: { marginTop: 6, height: 4, borderRadius: 2, backgroundColor: theme.colors.accentTint, overflow: "hidden" },
  readingFill: { height: 4, borderRadius: 2, backgroundColor: theme.colors.accent },
  section: { marginTop: theme.spacing(4) },
  sectionTitle: { fontFamily: theme.font.title.fontFamily, fontSize: 25, lineHeight: 30, color: theme.colors.text },
  groupTitle: {
    marginTop: theme.spacing(2.5),
    fontFamily: theme.font.label.fontFamily,
    fontSize: 13,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    color: theme.colors.accentWarm,
  },
  sectionIntro: { marginTop: theme.spacing(1.5), marginBottom: theme.spacing(1.5) },
  // The «Introducción» sub-heading sits right under the section title.
  introHeading: { marginTop: theme.spacing(1), marginBottom: theme.spacing(1.5) },
  // A reading with its videos and questions, spaced apart from the next one.
  unit: { marginBottom: theme.spacing(1.5) },
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
  videoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing(1.5),
    marginBottom: theme.spacing(1),
    padding: theme.spacing(1.25),
    paddingRight: theme.spacing(1.75),
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
  },
  videoThumbWrap: { width: 64, height: 64, borderRadius: theme.radius.md, overflow: "hidden", backgroundColor: palette.azulDeep },
  videoThumb: { width: 64, height: 64 },
  videoPlay: {
    position: "absolute",
    left: 18,
    top: 18,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 2,
  },
  videoTitle: { fontFamily: theme.font.heading.fontFamily, fontSize: 16, lineHeight: 21, color: theme.colors.text },
  videoMeta: {
    marginTop: 4,
    fontFamily: theme.font.label.fontFamily,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: theme.colors.textMuted,
  },
  videoWatched: { color: palette.verde },
  footer: {
    marginTop: theme.spacing(2),
    textAlign: "center",
    fontFamily: fontFamily.body,
    fontSize: 12,
    lineHeight: 17,
    color: theme.colors.textMuted,
  },
});
