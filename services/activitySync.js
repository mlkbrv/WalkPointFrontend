import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStats } from './apiService';
import { getDateKey } from '../utils/calculations';

export const dailyStatsStorageKey = (dateKey) => `dailyStats_${dateKey}`;

export const serverStatToLocal = (stat) => {
  const dateKey = typeof stat.date === 'string' ? stat.date.slice(0, 10) : getDateKey();
  const steps = Number(stat.steps) || 0;
  const durationSec = Number(stat.duration_sec) || 0;
  return {
    steps,
    time: durationSec > 0 ? Math.round(durationSec / 60) : 0,
    calories: Number(stat.calories) || 0,
    distance: Number(stat.distance_km) || 0,
    date: dateKey,
    activitySource: stat.source || undefined,
    isConverted: Boolean(stat.is_converted),
    convertedSteps: Number(stat.converted_steps) || 0,
    lastUpdated: new Date().toISOString(),
  };
};

export const mergeLocalStat = (local, incoming) => {
  if (!local) return incoming;
  if (!incoming) return local;
  const steps = Math.max(Number(local.steps) || 0, Number(incoming.steps) || 0);
  const time = Math.max(Number(local.time) || 0, Number(incoming.time) || 0);
  const calories = Math.max(Number(local.calories) || 0, Number(incoming.calories) || 0);
  const distance = Math.max(Number(local.distance) || 0, Number(incoming.distance) || 0);
  return {
    ...local,
    ...incoming,
    steps,
    time,
    calories,
    distance,
    date: incoming.date || local.date,
    lastUpdated: new Date().toISOString(),
  };
};

export const saveLocalDailyStat = async (stat) => {
  if (!stat?.date) return stat;
  const key = dailyStatsStorageKey(stat.date);
  const existingRaw = await AsyncStorage.getItem(key);
  const existing = existingRaw ? JSON.parse(existingRaw) : null;
  const merged = mergeLocalStat(existing, stat);
  await AsyncStorage.setItem(key, JSON.stringify(merged));
  return merged;
};

const collectPagedStats = async (from, to) => {
  const rows = [];
  let page = 1;
  for (;;) {
    const data = await getStats({ from, to, page });
    const batch = Array.isArray(data) ? data : data?.results;
    if (!batch?.length) break;
    rows.push(...batch);
    if (!data?.next) break;
    page += 1;
    if (page > 50) break;
  }
  return rows;
};

export const syncActivityStatsFromServer = async (daysBack = 90) => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - daysBack);
  const from = getDateKey(start);
  const to = getDateKey(end);
  const remote = await collectPagedStats(from, to);
  const mergedByDate = {};
  for (const stat of remote) {
    const local = serverStatToLocal(stat);
    mergedByDate[local.date] = local;
  }
  const results = [];
  for (const dateKey of Object.keys(mergedByDate)) {
    const merged = await saveLocalDailyStat(mergedByDate[dateKey]);
    results.push(merged);
  }
  return results;
};

export const getMergedHistoricalStats = async (date) => {
  const dateKey = getDateKey(date);
  const storageKey = dailyStatsStorageKey(dateKey);
  let local = null;
  try {
    const raw = await AsyncStorage.getItem(storageKey);
    local = raw ? JSON.parse(raw) : null;
  } catch (_) {}
  return local;
};
