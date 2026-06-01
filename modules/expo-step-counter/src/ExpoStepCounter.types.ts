export type TodayStats = {
  steps: number;
  activeWalkingMs: number;
  tracking: boolean;
  /** True once after native code cleared a stale "tracking" flag (e.g. app was killed from recents). */
  trackingInterrupted?: boolean;
};
