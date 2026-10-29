import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useEventListener } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { VIDEOS_BY_ID } from "../content/videos";
import { useAppState } from "../state/AppState";
import { useT } from "../lib/i18n";
import { Icon } from "../components/icons/Icon";
import { theme } from "../theme/theme";

type Props = NativeStackScreenProps<RootStackParamList, "Video">;

/** A video counts as watched once 90% of it has played. */
const WATCHED_FRACTION = 0.9;

export default function VideoScreen({ route, navigation }: Props) {
  const video = VIDEOS_BY_ID[route.params.videoId];
  const { markVideoWatched } = useAppState();
  const t = useT();

  const player = useVideoPlayer(video?.source ?? null, (p) => {
    p.timeUpdateEventInterval = 1;
    p.play();
  });

  useEventListener(player, "timeUpdate", ({ currentTime }) => {
    if (video && player.duration > 0 && currentTime >= player.duration * WATCHED_FRACTION) markVideoWatched(video.id);
  });
  useEventListener(player, "playToEnd", () => {
    if (video) markVideoWatched(video.id);
  });

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom", "left", "right"]}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={styles.closeBtn}
          accessibilityRole="button"
          accessibilityLabel={t("video.close")}
        >
          <Icon name="close" size={18} color="#FFFFFF" strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.title} numberOfLines={2}>
          {video?.title ?? ""}
        </Text>
      </View>
      {video ? (
        <VideoView player={player} style={styles.video} contentFit="contain" nativeControls allowsPictureInPicture={false} />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing(1.5),
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(1),
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { flex: 1, fontFamily: theme.font.heading.fontFamily, fontSize: 17, color: "#FFFFFF" },
  video: { flex: 1 },
});
