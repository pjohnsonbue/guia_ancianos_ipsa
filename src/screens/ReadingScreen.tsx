import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable, SectionList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { PACKS_BY_ID, COURSE } from "../content/course";
import { readingChapters } from "../content/documents";
import { useAppState } from "../state/AppState";
import { readingProgressKey } from "../content/categories";
import { useT } from "../lib/i18n";
import { theme, fontFamily, packGradient } from "../theme/theme";
import { Icon } from "../components/icons/Icon";

type Props = NativeStackScreenProps<RootStackParamList, "Reading">;

/** The contents of one «Lectura»: only the chapters it includes. */
export default function ReadingScreen({ route, navigation }: Props) {
  const { packId } = route.params;
  const pack = PACKS_BY_ID[packId];
  const reading = pack.reading!;
  const t = useT();
  const { lastChapterByPack, readChaptersByDoc } = useAppState();
  const chapters = useMemo(() => readingChapters(pack), [pack]);
  const read = useMemo(() => new Set(readChaptersByDoc[reading.docId] ?? []), [readChaptersByDoc, reading.docId]);
  const readCount = chapters.filter((c) => read.has(c.id)).length;
  const last = chapters.find((c) => c.id === lastChapterByPack[packId]);
  const section = COURSE.find((s) => s.groups.some((g) => g.packIds.includes(packId)));
  const group = section?.groups.find((g) => g.packIds.includes(packId));
  // Group the chapters by the document part they come from.
  const sections = useMemo(() => {
    const out: { title: string; data: { id: string; title: string }[] }[] = [];
    for (const c of chapters) {
      if (!out.length || out[out.length - 1].title !== c.partTitle) out.push({ title: c.partTitle, data: [] });
      out[out.length - 1].data.push({ id: c.id, title: c.title });
    }
    return out;
  }, [chapters]);
  const open = (chapterId: string) => navigation.navigate("Reader", { packId, chapterId });
  const resumeTarget = last ?? chapters.find((c) => !read.has(c.id)) ?? chapters[0];

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backRow} accessibilityRole="button">
          <Icon name="chevronLeft" size={18} color={theme.colors.accent} strokeWidth={2.4} />
          <Text style={styles.back}>{t("docs.back")}</Text>
        </Pressable>
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <LinearGradient colors={packGradient(pack.color)} start={{ x: 0.05, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cover}>
              <Text style={styles.coverEyebrow}>
                {[section?.title, group?.title].filter(Boolean).join(" · ")}
              </Text>
              <Text style={styles.coverTitle}>
                {t("home.readingPrefix")} {reading.title}
              </Text>
              <Text style={styles.coverMeta}>
                {t(readingProgressKey(reading.docId, chapters.length), { n: readCount, total: chapters.length })}
              </Text>
            </LinearGradient>
            <Pressable
              onPress={() => open(resumeTarget.id)}
              style={({ pressed }) => [styles.resume, { borderColor: pack.color }, pressed && { opacity: 0.9 }]}
              accessibilityRole="button"
            >
              <Icon name="book" size={20} color={pack.color} strokeWidth={2} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.resumeLabel, { color: pack.color }]}>{last || readCount ? t("docs.continue") : t("docs.start")}</Text>
                <Text style={styles.resumeTitle} numberOfLines={2}>
                  {resumeTarget.title}
                </Text>
              </View>
              <Icon name="chevronRight" size={18} color={theme.colors.textMuted} strokeWidth={2.2} />
            </Pressable>
          </View>
        }
        renderSectionHeader={({ section: s }) =>
          sections.length > 1 ? <Text style={[styles.partTitle, { color: pack.color }]}>{s.title}</Text> : <View style={{ height: theme.spacing(2.5) }} />
        }
        renderItem={({ item, index, section: s }) => (
          <Pressable
            onPress={() => open(item.id)}
            style={({ pressed }) => [
              styles.row,
              index === 0 && styles.rowFirst,
              index === s.data.length - 1 && styles.rowLast,
              pressed && { backgroundColor: theme.colors.backgroundDeep },
            ]}
            accessibilityRole="button"
          >
            <Text style={styles.rowText}>{item.title}</Text>
            {read.has(item.id) ? <Text style={[styles.check, { color: pack.color }]}>✓</Text> : null}
            {item.id === last?.id ? <View style={[styles.dot, { backgroundColor: pack.color }]} /> : null}
            <Icon name="chevronRight" size={16} color={theme.colors.textMuted} strokeWidth={2.2} />
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  header: { paddingHorizontal: theme.spacing(2.5), paddingTop: theme.spacing(1.5), paddingBottom: theme.spacing(1) },
  backRow: { flexDirection: "row", alignItems: "center", gap: 2, alignSelf: "flex-start" },
  back: { fontFamily: fontFamily.bodyBold, color: theme.colors.accent, fontSize: 15 },
  list: { paddingHorizontal: theme.spacing(2.5), paddingBottom: theme.spacing(6), width: "100%", maxWidth: 560, alignSelf: "center" },
  cover: { borderRadius: theme.radius.lg, padding: theme.spacing(2.5) },
  coverEyebrow: {
    fontFamily: theme.font.label.fontFamily,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.85)",
  },
  coverTitle: { marginTop: theme.spacing(1), fontFamily: theme.font.title.fontFamily, fontSize: 26, lineHeight: 31, color: "#FFFFFF" },
  coverMeta: {
    marginTop: theme.spacing(1.5),
    fontFamily: theme.font.label.fontFamily,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.88)",
  },
  resume: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing(1.5),
    marginTop: theme.spacing(1.5),
    padding: theme.spacing(2),
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    backgroundColor: theme.colors.surface,
  },
  resumeLabel: { fontFamily: theme.font.label.fontFamily, fontSize: 11, letterSpacing: 0.6, textTransform: "uppercase" },
  resumeTitle: { marginTop: 2, fontFamily: theme.font.heading.fontFamily, fontSize: 16, lineHeight: 21, color: theme.colors.text },
  partTitle: {
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(1),
    fontFamily: theme.font.label.fontFamily,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing(1),
    paddingVertical: theme.spacing(1.75),
    paddingHorizontal: theme.spacing(2),
    backgroundColor: theme.colors.surface,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  rowFirst: { borderTopWidth: 1, borderTopLeftRadius: theme.radius.md, borderTopRightRadius: theme.radius.md },
  rowLast: { borderBottomLeftRadius: theme.radius.md, borderBottomRightRadius: theme.radius.md },
  rowText: { flex: 1, fontFamily: fontFamily.bodySemiBold, fontSize: 15, lineHeight: 21, color: theme.colors.text },
  check: { fontFamily: fontFamily.bodyBold, fontSize: 15 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
