import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { CardSource } from "../content/types";
import { Icon } from "./icons/Icon";
import { useT } from "../lib/i18n";
import { theme, fontFamily } from "../theme/theme";

interface Props {
  visible: boolean;
  source: CardSource;
  /** Short reference shown on the card (e.g. "LG §16-12"), repeated as the sheet's heading. */
  refLabel?: string;
  accentColor: string;
  onClose: () => void;
}

// Bible quotes that join several passages put each on its own line as
// "Juan 6:35 — Yo soy el pan de vida…"; the passage label is set in bold.
const PASSAGE_LINE = /^(.+? \d+:\d+(?:[-–]\d+(?::\d+)?)?) — (.*)$/;

/** Popup with the verbatim source text behind a card's answer. */
export function SourceModal({ visible, source, refLabel, accentColor, onClose }: Props) {
  const t = useT();
  const lines = source.quote.split("\n");

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={t("source.close")} />
        <View style={styles.sheet} accessibilityViewIsModal>
          <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
          <View style={styles.headerRow}>
            <Icon name="book" size={16} color={accentColor} strokeWidth={2} />
            <Text style={styles.eyebrow}>{t("source.title")}</Text>
            {refLabel ? (
              <Text style={[styles.refLabel, { color: accentColor }]} numberOfLines={1}>
                {refLabel}
              </Text>
            ) : null}
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel={t("source.close")}>
              <Icon name="close" size={16} color={theme.colors.textMuted} strokeWidth={2.4} />
            </Pressable>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator>
            <View style={[styles.quoteBox, { borderLeftColor: theme.colors.accentGold }]}>
              {lines.map((line, i) => {
                const m = PASSAGE_LINE.exec(line);
                return (
                  <Text key={i} style={[styles.quote, i > 0 && styles.quoteGap]}>
                    {m ? (
                      <>
                        <Text style={styles.passage}>{m[1]} </Text>
                        {m[2]}
                      </>
                    ) : (
                      line
                    )}
                  </Text>
                );
              })}
            </View>

            <Text style={styles.whereLabel}>{t("source.whereLabel")}</Text>
            <Text style={styles.where}>{source.location}</Text>
          </ScrollView>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.doneBtn, { backgroundColor: accentColor }, pressed && { opacity: 0.88 }]}
            accessibilityRole="button"
          >
            <Text style={styles.doneText}>{t("source.close")}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(21,34,56,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing(2.5),
  },
  sheet: {
    width: "100%",
    maxWidth: 460,
    maxHeight: "82%",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    paddingTop: theme.spacing(2.5),
    paddingHorizontal: theme.spacing(2.5),
    paddingBottom: theme.spacing(2),
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  accentBar: { position: "absolute", top: 0, left: 0, right: 0, height: 5 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  eyebrow: {
    fontFamily: theme.font.label.fontFamily,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: theme.colors.text,
  },
  refLabel: { flex: 1, fontFamily: fontFamily.bodyBold, fontSize: 13 },
  closeBtn: {
    marginLeft: "auto",
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
  },
  body: { marginTop: theme.spacing(2), flexGrow: 0 },
  bodyContent: { paddingBottom: theme.spacing(1) },
  quoteBox: {
    borderLeftWidth: 3,
    paddingLeft: theme.spacing(1.75),
    paddingVertical: theme.spacing(0.5),
  },
  quote: {
    fontFamily: fontFamily.displayItalic,
    fontSize: 17,
    lineHeight: 25,
    color: theme.colors.text,
  },
  quoteGap: { marginTop: theme.spacing(1) },
  passage: { fontFamily: fontFamily.bodyBold, fontStyle: "normal", fontSize: 13, color: theme.colors.textMuted },
  whereLabel: {
    marginTop: theme.spacing(2.5),
    fontFamily: theme.font.label.fontFamily,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: theme.colors.accentWarm,
  },
  where: {
    marginTop: 4,
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textMuted,
  },
  doneBtn: {
    marginTop: theme.spacing(2),
    alignSelf: "stretch",
    alignItems: "center",
    paddingVertical: theme.spacing(1.5),
    borderRadius: theme.radius.pill,
  },
  doneText: { fontFamily: fontFamily.bodyBold, fontSize: 15, color: "#FFFFFF" },
});
