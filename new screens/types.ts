/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum Screen {
  HOME = 'HOME',
  TRACK = 'TRACK',
  REPORT = 'REPORT',
  SCOREBOARD = 'SCOREBOARD',
  STORE = 'STORE',
  PROFILE = 'PROFILE',
  NOTIFICATIONS = 'NOTIFICATIONS',
  BRAND_STORE = 'BRAND_STORE',
  WORKOUT_SUMMARY = 'WORKOUT_SUMMARY',
  COUPON_DETAIL = 'COUPON_DETAIL',
  SECURE_VERIFICATION = 'SECURE_VERIFICATION',
  WALLET = 'WALLET'
}

export interface UserStats {
  stepsToday: number;
  stepsGoal: number;
  caloriesBurned: number; // kcal
  distanceCovered: number; // km
  activeMinutes: number; // mins
  walletBalance: number; // step-tokens
  weeklyGoalProgress: number; // e.g. 850 / 1000
}

export interface UserProfile {
  name: string;
  avatar: string;
  stepsGoal: number;
  weight: number; // kg
  height: number; // cm
  joinYear: number;
  appleHealthConnected: boolean;
  googleFitConnected: boolean;
  privacyEnabled: boolean;
}

export interface LeaderboardUser {
  rank: number;
  name: string;
  avatar: string;
  steps: number; // e.g. 18400
  stepsFormatted: string; // e.g. "18.4k"
  statusText: string;
  isMe?: boolean;
}

export interface ProductReward {
  id: string;
  title: string;
  brand: string;
  category: 'Food' | 'Coffee' | 'Fitness' | 'Shopping' | 'All';
  stepsPrice: number;
  image: string;
  badgeText: string;
}

export interface Coupon {
  id: string;
  title: string;
  brand: string;
  brandLogo: string;
  category: string;
  expiryDateText: string;
  isActive: boolean;
  stepRequirement?: number;
  stepCurrent?: number;
  about?: string;
  code?: string;
  revealed?: boolean;
}

export interface NotificationItem {
  id: string;
  type: 'social' | 'milestone' | 'offer' | 'stats';
  title: string;
  description: string;
  timeText: string;
  timestamp: Date;
  isToday: boolean;
  avatar?: string;
  badgeIcon?: string;
  actionText?: string;
  couponCode?: string;
}

export interface WorkoutData {
  duration: string; // "00:42:15"
  avgSpeed: number; // 5.2 km/h
  distance: number; // 3.84 km
  calories: number; // 312 kcal
  name: string; // "Morning Run Route"
  tokensEarned: number; // 250
}
