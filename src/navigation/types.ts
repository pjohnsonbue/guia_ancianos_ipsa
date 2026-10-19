export type RootStackParamList = {
  Home: undefined;
  /** packId is a real pack id, or REVIEW_PACK_ID for the review deck. */
  Study: { packId: string };
  /** A fresh Simulacro of 30 multiple-choice questions. */
  Exam: undefined;
  /** Results of a finished Simulacro. `finishedAt` identifies it in the
   *  stored history (omitted = the most recent one). */
  ExamResult: { finishedAt?: number } | undefined;
  Settings: undefined;
};
