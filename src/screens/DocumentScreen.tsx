import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable, SectionList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { DOCUMENTS_BY_ID, loadDocument, flatChapters } from "../content/documents";
import { useAppState } from "../state/AppState";
import { useT } from "../lib/i18n";
import { theme, fontFamily, packGradient } from "../theme/theme";
import { Icon } from "../components/icons/Icon";

type Props = NativeStackScreenProps<RootStackParamList, "Document">;

/** Table of contents of one study document. */
export default function DocumentScreen({ route, navigation }: Props) {
  const { docId } = route.params;
  const meta = DOCUMENTS_BY_ID[docId];
  const t = useT();
  const { lastChapterByDoc, readChaptersByDoc } = useAppState();
  const read = useMemo(() => new Set(readChaptersByDoc[docId] ?? []), [readChaptersByDoc, docId]);
  const doc = useMemo(() => loadDocument(docId), [docId]);
  const chapters = useMemo(() => flatChapters(doc), [doc]);
  const last = chapters.find((c) => c.id === lastChapterByDoc[docId]);
  const sections = useMemo(
    () => doc.parts.map((p) => ({ title: p.title, data: p.chapters.map((c) => ({ id: c.id, title: c.title })) })),
    [doc]
  );
  const open = (chapterId: string) => navigation.navigate("Reader", { docId, chapterId });

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
            <LinearGradient colors={packGradient(meta.color)} start={{ x: 0.05, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cover}>
              <Text style={styles.coverIcon}>{meta.icon}</Text>
              <Text style={styles.coverTitle}>{t(meta.titleKey)}</Text>
              <Text style={styles.coverDesc}>{t(meta.descriptionKey)}</Text>
              <Text style={styles.coverMeta}>
                {read.size > 0 ? t("docs.readProgress", { n: read.size, total: chapters.length }) : t("docs.chapters", { n: chapters.length })}
              </Text>
            </LinearGradient>
            <Pressable
              onPress={() => open(last ? last.id : chapters[0].id)}
              style={({ pressed }) => [styles.resume, { borderColor: meta.color }, pressed && { opacity: 0.9 }]}
              accessibilityRole="button"
            >
              <Icon name="book" size={20} color={meta.color} strokeWidth={2} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.resumeLabel, { color: meta.color }]}>{last ? t("docs.continue") : t("docs.start")}</Text>
                <Text style={styles.resumeTitle} numberOfLines={2}>
                  {(last ?? chapters[0]).title}
                </Text>
              </View>
              <Icon name="chevronRight" size={18} color={theme.colors.textMuted} strokeWidth={2.2} />
            </Pressable>
          </View>
        }
        renderSectionHeader={({ section }) =>
          doc.parts.length > 1 ? <Text style={[styles.partTitle, { color: meta.color }]}>{section.title}</Text> : null
        }
        renderItem={({ item, index, section }) => (
          <Pressable
            onPress={() => open(item.id)}
            style={({ pressed }) => [
              styles.row,
              index === 0 && styles.rowFirst,
              index === section.data.length - 1 && styles.rowLast,
              pressed && { backgroundColor: theme.colors.backgroundDeep },
            ]}
            accessibilityRole="button"
          >
            <Text style={styles.rowText}>{item.title}</Text>
            {read.has(item.id) ? <Text style={[styles.check, { color: meta.color }]}>✓</Text> : null}
            {item.id === last?.id ? <View style={[styles.dot, { backgroundColor: meta.color }]} /> : null}
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
  coverIcon: { fontSize: 30 },
  coverTitle: { marginTop: theme.spacing(1), fontFamily: theme.font.title.fontFamily, fontSize: 26, lineHeight: 31, color: "#FFFFFF" },
  coverDesc: { marginTop: theme.spacing(1), fontFamily: fontFamily.body, fontSize: 14, lineHeight: 20, color: "rgba(255,255,255,0.92)" },
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
