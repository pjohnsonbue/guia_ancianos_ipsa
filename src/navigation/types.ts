export type RootStackParamList = {
  Home: undefined;
  /** A pack's «Preguntas de repaso» (multiple choice). `packId` is a real
   *  pack id, or REVIEW_PACK_ID for «Repasá». */
  Practice: { packId: string };
  /** A fresh Simulacro of 30 multiple-choice questions. */
  Exam: undefined;
  /** Results of a finished Simulacro. `finishedAt` identifies it in the
   *  stored history (omitted = the most recent one). */
  ExamResult: { finishedAt?: number } | undefined;
  Settings: undefined;
  /** Full-screen player for one of the Home videos. */
  Video: { videoId: string };
  /** A «Lectura»: the contents of one pack's reading. */
  Reading: { packId: string };
  /** Reading one chapter of a pack's reading. */
  Reader: { packId: string; chapterId: string };
};
