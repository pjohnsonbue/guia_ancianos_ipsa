import { Linking } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as StoreReview from "expo-store-review";

/**
 * "Rate this app" prompting.
 *
 * requestRating() opens the platform's native in-app rating flow (the user
 * never leaves the app) via expo-store-review, falling back to the store
 * listing's review page if that's not available on this platform/build —
 * e.g. TestFlight, where Apple disables the native prompt entirely.
 *
 * The automatic nudge (shouldOfferRatingPrompt / markRatingPromptShown) is
 * separate from that: it decides *whether* to ask, once, after a genuine
 * "happy moment" (a run of correct answers) rather than on first launch.
 * It deliberately does NOT gate on a "having a good experience?" yes/no
 * question first — Apple's guidelines prohibit steering only happy users
 * toward the review flow while deflecting unhappy ones elsewhere. Everyone
 * who crosses the threshold sees the same offer to rate.
 *
 * A manual "Rate the App" row also lives in Settings (always available,
 * no threshold) and calls requestRating() directly — see SettingsScreen.tsx.
 */

const PROMPTED_KEY = "guiaancianos.ratingPrompted.v1";

/** Correct answers required before the one-time automatic nudge can appear. */
const CORRECT_ANSWER_THRESHOLD = 25;

/** True once the automatic nudge has been shown (regardless of the user's
 *  choice) — it only ever offers itself once per install. */
async function hasBeenPrompted(): Promise<boolean> {
  return (await AsyncStorage.getItem(PROMPTED_KEY)) === "1";
}

/** Call after a card is marked "correct", passing the new total correct
 *  count. Resolves true if the automatic nudge should be shown right now. */
export async function shouldOfferRatingPrompt(correctCount: number): Promise<boolean> {
  if (correctCount < CORRECT_ANSWER_THRESHOLD) return false;
  return !(await hasBeenPrompted());
}

/** Record that the automatic nudge has been shown, so it never appears
 *  again on this device — call this once the user has dismissed it either
 *  way (rated or not now). */
export async function markRatingPromptShown(): Promise<void> {
  await AsyncStorage.setItem(PROMPTED_KEY, "1");
}

/** Opens the native in-app rating flow, falling back to the store page. */
export async function requestRating(): Promise<void> {
  try {
    if (await StoreReview.hasAction()) {
      await StoreReview.requestReview();
      return;
    }
  } catch {
    // fall through to the store-URL fallback below
  }
  const url = StoreReview.storeUrl();
  if (url) {
    try {
      await Linking.openURL(url);
    } catch {
      // nothing more we can do
    }
  }
}
