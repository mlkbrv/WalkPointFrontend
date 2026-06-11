export const isAvailable = () => false;

export const checkStatus = async () => ({ available: false, status: 'PREVIEW' });

export const initialize = async () => true;

export const requestPermissions = async () => true;

export const getGrantedPermissions = async () => [];

export const getTodaySteps = async () => 8420;

export const getStepsInRange = async () => 8420;

export const getTodayDistance = async () => 5200;

export const getTodayActiveCalories = async () => 312;

export const getDailyMetrics = async () => ({
  steps: 8420,
  distanceM: 5200,
  activeCalories: 312,
  activeMinutes: 84,
});

export const getStepsHistory = async (days = 7) => {
  const result = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const dateKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
    result.push({ date: dateKey, steps: 5000 + i * 420 });
  }
  return result;
};

export const openSettings = () => {};

export const openSamsungHealth = async () => {};

export const getBodyProfile = async () => ({
  weightKg: 72,
  heightCm: 175,
});
