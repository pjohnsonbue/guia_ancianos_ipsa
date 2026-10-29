import React, { useEffect, useMemo, useRef } from "react";
import { View, Text, StyleSheet, Pressable, FlatList, type FlatList as FlatListType } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { readingChapters, type DocBlock } from "../content/documents";
import { PACKS_BY_ID } from "../content/course";
import { useAppState } from "../state/AppState";
import { useT } from "../lib/i18n";
import { theme, fontFamily, palette } from "../theme/theme";
import { Icon } from "../components/icons/Icon";
import { RichText } from "../components/RichText";

type Props = NativeStackScreenProps<RootStackParamList, "Reader">;

const BODY_SIZES = [15, 17, 19, 21];

/** Reads one chapter of a study document, with previous/next navigation. */
export default function ReaderScreen({ route, navigation }: Props) {
  const { packId, chapterId } = route.params;
  const pack = PACKS_BY_ID[packId];
  const docId = pack.reading!.docId;
  const t = useT();
  const { setLastChapter, markChapterRead, readerTextSize, setReaderTextSize } = useAppState();
  // Prev/next stay within this reading's chapters.
  const chapters = useMemo(() => readingChapters(pack), [pack]);
  const chapter = chapters.find((c) => c.id === chapterId) ?? chapters[0];
  const prev = chapters[chapter.index - 1];
  const next = chapters[chapter.index + 1];
  const listRef = useRef<FlatListType<DocBlock>>(null);

  useEffect(() => {
    setLastChapter(packId, chapter.id);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [packId, chapter.id, setLastChapter]);

  const size = BODY_SIZES[Math.max(0, Math.min(BODY_SIZES.length - 1, readerTextSize))];
  const s = useMemo(() => makeTextStyles(size, pack.color), [size, pack.color]);
  const go = (id: string) => navigation.setParams({ chapterId: id });
  // A chapter counts as read once its end has been reached (or skipped past with «Siguiente»).
  const markRead = () => markChapterRead(docId, chapter.id);

  const renderBlock = ({ item }: { item: DocBlock }) => {
    const [kind, value] = item;
    switch (kind) {
      case "h":
        return <RichText text={value} style={s.h} boldFamily={fontFamily.displayBold} />;
      case "q":
        return (
          <View style={[styles.quote, { borderLeftColor: pack.color }]}>
            <RichText text={value} style={s.q} />
          </View>
        );
      case "li":
        return <RichText text={value} style={s.li} />;
      case "refs":
        return <Text style={s.refs}>{value}</Text>;
      case "note":
        return <RichText text={value} style={s.note} />;
      case "row":
        return (
          <View style={styles.row}>
            {value.map((cell, i) => (
              <RichText key={i} text={cell} style={[i === 0 ? s.rowHead : i === 2 ? s.refs : s.p, styles.cell]} />
            ))}
          </View>
        );
      default:
        return <RichText text={value} style={s.p} />;
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backRow} accessibilityRole="button">
          <Icon name="chevronLeft" size={18} color={theme.colors.accent} strokeWidth={2.4} />
          <Text style={styles.back}>{t("docs.contents")}</Text>
        </Pressable>
        <Pressable
          onPress={() => setReaderTextSize((readerTextSize + 1) % BODY_SIZES.length)}
          hitSlop={10}
          style={styles.sizeBtn}
          accessibilityRole="button"
          accessibilityLabel={t("docs.textSize")}
        >
          <Text style={styles.sizeSmall}>A</Text>
          <Text style={styles.sizeBig}>A</Text>
        </Pressable>
      </View>
      <FlatList
        ref={listRef}
        data={chapter.blocks}
        keyExtractor={(_, i) => `${chapter.id}-${i}`}
        renderItem={renderBlock}
        contentContainerStyle={styles.body}
        initialNumToRender={12}
        windowSize={11}
        onEndReached={markRead}
        onEndReachedThreshold={0.05}
        ListHeaderComponent={
          <View style={styles.titleWrap}>
            <Text style={[styles.part, { color: pack.color }]}>{chapter.partTitle}</Text>
            <Text style={styles.title}>{chapter.title}</Text>
            <View style={[styles.rule, { backgroundColor: pack.color }]} />
          </View>
        }
        ListFooterComponent={
          <View style={styles.footer}>
            {prev ? (
              <Pressable onPress={() => go(prev.id)} style={({ pressed }) => [styles.nav, pressed && { opacity: 0.85 }]} accessibilityRole="button">
                <Text style={styles.navLabel}>‹ {t("docs.previous")}</Text>
                <Text style={styles.navTitle} numberOfLines={2}>{prev.title}</Text>
              </Pressable>
            ) : (
              <View style={styles.navSpacer} />
            )}
            {next ? (
              <Pressable
                onPress={() => {
                  markRead();
                  go(next.id);
                }}
                style={({ pressed }) => [styles.nav, styles.navNext, { backgroundColor: pack.color }, pressed && { opacity: 0.9 }]}
                accessibilityRole="button"
              >
                <Text style={[styles.navLabel, { color: "rgba(255,255,255,0.85)", textAlign: "right" }]}>{t("docs.next")} ›</Text>
                <Text style={[styles.navTitle, { color: "#FFFFFF", textAlign: "right" }]} numberOfLines={2}>{next.title}</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => {
                  markRead();
                  navigation.popTo("Home");
                }}
                style={({ pressed }) => [styles.nav, styles.navNext, { backgroundColor: pack.color }, pressed && { opacity: 0.9 }]}
                accessibilityRole="button"
              >
                <Text style={[styles.navLabel, { color: "rgba(255,255,255,0.85)", textAlign: "right" }]}>{t("docs.finished")}</Text>
                <Text style={[styles.navTitle, { color: "#FFFFFF", textAlign: "right" }]} numberOfLines={2}>
                  {t("docs.backToCourse")} ›
                </Text>
              </Pressable>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}

function makeTextStyles(size: number, color: string) {
  const lh = Math.round(size * 1.6);
  return StyleSheet.create({
    p: { fontFamily: fontFamily.body, fontSize: size, lineHeight: lh, color: theme.colors.text, marginBottom: size * 0.9 },
    li: { fontFamily: fontFamily.body, fontSize: size, lineHeight: lh, color: theme.colors.text, marginBottom: size * 0.5, paddingLeft: 6 },
    h: { fontFamily: fontFamily.displayBold, fontSize: size + 3, lineHeight: Math.round((size + 3) * 1.3), color: theme.colors.text, marginTop: size * 0.8, marginBottom: size * 0.6 },
    q: { fontFamily: fontFamily.displayItalic, fontSize: size, lineHeight: lh, color: theme.colors.text },
    refs: { fontFamily: fontFamily.bodyMedium, fontSize: size - 3, lineHeight: Math.round((size - 3) * 1.55), color: theme.colors.textMuted, marginTop: -size * 0.4, marginBottom: size * 1.1 },
    note: { fontFamily: fontFamily.body, fontSize: size - 2, lineHeight: Math.round((size - 2) * 1.55), color: theme.colors.textMuted, marginBottom: size * 0.6 },
    rowHead: { fontFamily: fontFamily.bodyBold, fontSize: size, lineHeight: lh, color },
  });
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
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  back: { fontFamily: fontFamily.bodyBold, color: theme.colors.accent, fontSize: 15 },
  sizeBtn: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 1,
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingBottom: 6,
  },
  sizeSmall: { fontFamily: fontFamily.displayBold, fontSize: 13, color: theme.colors.text },
  sizeBig: { fontFamily: fontFamily.displayBold, fontSize: 19, color: theme.colors.text, lineHeight: 21 },
  body: { paddingHorizontal: theme.spacing(2.75), paddingBottom: theme.spacing(6), width: "100%", maxWidth: 640, alignSelf: "center" },
  titleWrap: { paddingTop: theme.spacing(3), paddingBottom: theme.spacing(2) },
  part: { fontFamily: theme.font.label.fontFamily, fontSize: 12, letterSpacing: 0.8, textTransform: "uppercase" },
  title: { marginTop: theme.spacing(1), fontFamily: theme.font.title.fontFamily, fontSize: 26, lineHeight: 32, color: theme.colors.text },
  rule: { marginTop: theme.spacing(2), width: 56, height: 4, borderRadius: 2 },
  quote: { borderLeftWidth: 3, paddingLeft: theme.spacing(1.75), marginBottom: theme.spacing(2), marginTop: theme.spacing(0.5) },
  row: {
    backgroundColor: palette.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing(1.75),
    marginBottom: theme.spacing(1.25),
  },
  cell: { marginTop: 0, marginBottom: 4 },
  footer: { flexDirection: "row", gap: theme.spacing(1.5), marginTop: theme.spacing(3) },
  nav: {
    flex: 1,
    padding: theme.spacing(1.75),
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    minHeight: 76,
  },
  navNext: { borderWidth: 0 },
  navSpacer: { flex: 1 },
  navLabel: { fontFamily: theme.font.label.fontFamily, fontSize: 11, letterSpacing: 0.6, textTransform: "uppercase", color: theme.colors.textMuted },
  navTitle: { marginTop: 4, fontFamily: fontFamily.bodySemiBold, fontSize: 14, lineHeight: 19, color: theme.colors.text },
});
