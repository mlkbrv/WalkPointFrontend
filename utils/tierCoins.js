const MIN_STEPS = 5000;
const BASE_COINS = 5;
const BONUS_CHUNK = 1000;
const MAX_STEPS = 30000;

export const tierCoinsForSteps = (steps) => {
  const n = Math.floor(Number(steps) || 0);
  if (n < MIN_STEPS) return 0;
  const capped = Math.min(n, MAX_STEPS);
  const bonus = Math.floor((capped - MIN_STEPS) / BONUS_CHUNK);
  return BASE_COINS + bonus;
};

export const incrementalCoins = (reportedSteps, convertedSteps = 0) => {
  const total = tierCoinsForSteps(reportedSteps);
  const paid = tierCoinsForSteps(convertedSteps);
  return Math.max(0, total - paid);
};

export const stepsToReachMin = (steps) => Math.max(0, MIN_STEPS - Math.floor(Number(steps) || 0));

export const TIER_MIN_STEPS = MIN_STEPS;
export const TIER_MAX_STEPS = MAX_STEPS;
