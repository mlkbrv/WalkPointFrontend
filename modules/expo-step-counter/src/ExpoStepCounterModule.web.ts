import type { TodayStats } from './ExpoStepCounter.types';

const noop = async () => {};

export default {
  isStepCounterSupported: () => false,
  getTodayStats: (): TodayStats => ({
    steps: 0,
    activeWalkingMs: 0,
    tracking: false,
    trackingInterrupted: false,
  }),
  startTracking: noop,
  stopTracking: noop,
};
