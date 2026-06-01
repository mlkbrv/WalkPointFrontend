import { NativeModule, requireNativeModule } from 'expo';

import type { TodayStats } from './ExpoStepCounter.types';

declare class ExpoStepCounterNative extends NativeModule {
  isStepCounterSupported(): boolean;
  getTodayStats(): TodayStats;
  startTracking(): Promise<void>;
  stopTracking(): Promise<void>;
}

export default requireNativeModule<ExpoStepCounterNative>('ExpoStepCounter');
