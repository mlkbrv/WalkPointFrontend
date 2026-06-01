import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { stepConvertAuthFields } from '../utils/stepSignature';

const PROD_API = 'https://walkpoint-backend.onrender.com/api';

const DEV_API_HOST = '192.168.0.165';

const API_BASE_URL = __DEV__
  ? Platform.select({
      web: 'http://127.0.0.1:8000/api',
      android: `http://${DEV_API_HOST}:8000/api`,
      default: 'http://127.0.0.1:8000/api',
    })
  : PROD_API;

const TOKENS_KEY = 'auth_tokens';

const getTokens = async () => {
  const raw = await AsyncStorage.getItem(TOKENS_KEY);
  return raw ? JSON.parse(raw) : null;
};

const saveTokens = async (tokens) => {
  await AsyncStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
};

const clearTokens = async () => {
  await AsyncStorage.removeItem(TOKENS_KEY);
};

const refreshAccessToken = async () => {
  const tokens = await getTokens();
  if (!tokens?.refresh) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/users/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: tokens.refresh }),
    });

    if (!res.ok) {
      await clearTokens();
      return null;
    }

    const data = await res.json();
    const newTokens = { ...tokens, access: data.access };
    await saveTokens(newTokens);
    return newTokens;
  } catch {
    return null;
  }
};

const apiFetch = async (path, options = {}) => {
  let tokens = await getTokens();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (tokens?.access) {
    headers['Authorization'] = `Bearer ${tokens.access}`;
  }

  let res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401 && tokens?.refresh) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${refreshed.access}`;
      res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
    }
  }

  return res;
};

// ── Auth ──────────────────────────────────────────────

export const login = async (email, password) => {
  const res = await fetch(`${API_BASE_URL}/users/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Login failed');
  await saveTokens(data);
  return data;
};

export const register = async ({ email, password, first_name, last_name, referral_code }) => {
  const body = { email, password, first_name, last_name };
  if (referral_code?.trim()) body.referral_code = referral_code.trim();
  const res = await fetch(`${API_BASE_URL}/users/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Registration failed';
    throw new Error(msg);
  }
  return data;
};

export const logout = async () => {
  await clearTokens();
};

export { clearTokens, getTokens, saveTokens };

// ── Profile ───────────────────────────────────────────

export const getProfile = async () => {
  const res = await apiFetch('/users/profile/');
  if (!res.ok) throw new Error('Failed to load profile');
  return res.json();
};

export const updateProfile = async (data) => {
  const res = await apiFetch('/users/profile/', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update profile');
  return res.json();
};

// ── Activity ──────────────────────────────────────────
// Contract: optional `date` (YYYY-MM-DD, user's local calendar day), `source`,
// `duration_sec`, `distance_m` (meters), `calories` (kcal). See backend API_GUIDE.

/** @param {number | Record<string, unknown>} payload - steps only, or full body for convert */
export const convertSteps = async (payload) => {
  const body = typeof payload === 'number' ? { steps: payload } : { ...payload };
  const steps = Math.floor(body.steps ?? 0);
  if (steps > 0) {
    try {
      const auth = await stepConvertAuthFields(steps);
      Object.assign(body, auth);
    } catch (_) {}
  }
  const res = await apiFetch('/activity/convert/', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || data.steps?.[0] || 'Conversion failed');
  return data;
};

/** Sync daily activity without coin conversion. Requires `date` + `steps` (≥ 0). */
export const syncActivity = async (body) => {
  const res = await apiFetch('/activity/sync/', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || data.steps?.[0] || 'Activity sync failed');
  return data;
};

/** @param {string} [date] - YYYY-MM-DD local calendar day (recommended for mobile) */
export const getEconomyRules = async () => {
  const res = await apiFetch('/activity/economy/');
  if (!res.ok) throw new Error('Failed to load economy rules');
  return res.json();
};

export const getTodayStat = async (date) => {
  const params = new URLSearchParams();
  if (date) params.set('date', date);
  const qs = params.toString();
  const res = await apiFetch(`/activity/today/${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error('Failed to load today stat');
  return res.json();
};

/** @param {{ from?: string, to?: string, page?: number }} [opts] - dates YYYY-MM-DD inclusive */
export const getStats = async (opts = {}) => {
  const params = new URLSearchParams();
  if (opts.from) params.set('from', opts.from);
  if (opts.to) params.set('to', opts.to);
  if (opts.page != null) params.set('page', String(opts.page));
  const qs = params.toString();
  const res = await apiFetch(`/activity/stats/${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error('Failed to load stats');
  return res.json();
};

// ── Wallet ────────────────────────────────────────────

export const getWallet = async () => {
  const res = await apiFetch('/wallet/');
  if (!res.ok) throw new Error('Failed to load wallet');
  return res.json();
};

export const getTransactions = async () => {
  const res = await apiFetch('/wallet/transactions/');
  if (!res.ok) throw new Error('Failed to load transactions');
  return res.json();
};

// ── Stories ───────────────────────────────────────────

export const getStories = async () => {
  const res = await apiFetch('/partners/stories/');
  if (!res.ok) throw new Error('Failed to load stories');
  return res.json();
};

export const viewStory = async (storyId) => {
  const res = await apiFetch('/partners/stories/view/', {
    method: 'POST',
    body: JSON.stringify({ story_id: storyId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Failed to view story');
  return data;
};

// ── Market ────────────────────────────────────────────

export const getCoupons = async () => {
  const res = await apiFetch('/market/');
  if (!res.ok) throw new Error('Failed to load coupons');
  return res.json();
};

export const buyCoupon = async (templateId) => {
  const res = await apiFetch('/market/buy/', {
    method: 'POST',
    body: JSON.stringify({ template_id: templateId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Purchase failed');
  return data;
};

export const getMyCoupons = async () => {
  const res = await apiFetch('/market/my-coupons/');
  if (!res.ok) throw new Error('Failed to load my coupons');
  return res.json();
};

// ── Leaderboard ───────────────────────────────────────

export const getLeaderboard = async () => {
  const res = await apiFetch('/partners/leaderboard/');
  if (!res.ok) throw new Error('Failed to load leaderboard');
  return res.json();
};

export const getPartnerProfile = async () => {
  const res = await apiFetch('/partners/profile/');
  if (!res.ok) throw new Error('Failed to load partner profile');
  return res.json();
};

export const updatePartnerProfile = async (data) => {
  const res = await apiFetch('/partners/profile/', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update partner profile');
  return res.json();
};

export const createStory = async (data) => {
  const res = await apiFetch('/partners/stories/create/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || 'Failed to create story');
  return json;
};

export const createCouponTemplate = async (data) => {
  const res = await apiFetch('/market/templates/create/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || 'Failed to create coupon');
  return json;
};

export const redeemCouponByCode = async (uniqueCode) => {
  const res = await apiFetch('/market/redeem/', {
    method: 'POST',
    body: JSON.stringify({ unique_code: uniqueCode }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || 'Redeem failed');
  return json;
};

export const getCouponsByCategory = async (category) => {
  const qs = category ? `?category=${encodeURIComponent(category)}` : '';
  const res = await apiFetch(`/market${qs}`);
  if (!res.ok) throw new Error('Failed to load coupons');
  return res.json();
};

export const getFavoriteCoupons = async () => {
  const res = await apiFetch('/market/favorites/');
  if (!res.ok) throw new Error('Failed to load favorites');
  return res.json();
};

export const toggleFavoriteCoupon = async (templateId) => {
  const res = await apiFetch('/market/favorites/toggle/', {
    method: 'POST',
    body: JSON.stringify({ template_id: templateId }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || 'Failed');
  return {
    ...json,
    is_favorite: json.favorited ?? json.is_favorite ?? false,
  };
};

export const requestPasswordReset = async (email) => {
  const res = await fetch(`${API_BASE_URL}/users/password-reset/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return res.json();
};

export const confirmPasswordReset = async (uid, token, password) => {
  const res = await fetch(`${API_BASE_URL}/users/password-reset/confirm/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid, token, password }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || 'Reset failed');
  return json;
};

export const getStreak = async () => {
  const res = await apiFetch('/engagement/streak/');
  if (!res.ok) throw new Error('Failed to load streak');
  return res.json();
};

export const getActiveChallenge = async () => {
  const res = await apiFetch('/challenges/active/');
  if (!res.ok) throw new Error('Failed to load challenge');
  return res.json();
};

export const claimChallenge = async () => {
  const res = await apiFetch('/challenges/claim/', { method: 'POST', body: '{}' });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || 'Claim failed');
  return json;
};

export const getAchievements = async () => {
  const res = await apiFetch('/challenges/achievements/');
  if (!res.ok) throw new Error('Failed to load achievements');
  return res.json();
};

export const getFriends = async () => {
  const res = await apiFetch('/social/friends/');
  if (!res.ok) throw new Error('Failed to load friends');
  return res.json();
};

export const addFriend = async (email) => {
  const res = await apiFetch('/social/friends/', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || 'Failed');
  return json;
};

export const getFriendsLeaderboard = async () => {
  const res = await apiFetch('/social/friends/leaderboard/');
  if (!res.ok) throw new Error('Failed to load friends leaderboard');
  return res.json();
};

export const getTeams = async () => {
  const res = await apiFetch('/social/teams/');
  if (!res.ok) throw new Error('Failed to load teams');
  return res.json();
};

export const createTeam = async (name) => {
  const res = await apiFetch('/social/teams/', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || 'Failed');
  return json;
};

export const joinTeam = async (inviteCode) => {
  const res = await apiFetch('/social/teams/join/', {
    method: 'POST',
    body: JSON.stringify({ invite_code: inviteCode }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || 'Failed');
  return json;
};

export const getTeamLeaderboard = async (teamId) => {
  const res = await apiFetch(`/social/teams/${teamId}/leaderboard/`);
  if (!res.ok) throw new Error('Failed to load team leaderboard');
  return res.json();
};

export const getBoosts = async () => {
  const res = await apiFetch('/shop/boosts/');
  if (!res.ok) throw new Error('Failed to load boosts');
  return res.json();
};

export const buyBoost = async (slug) => {
  const res = await apiFetch('/shop/boosts/buy/', {
    method: 'POST',
    body: JSON.stringify({ slug }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || 'Purchase failed');
  return json;
};

export const getPremiumStatus = async () => {
  const res = await apiFetch('/shop/premium/');
  if (!res.ok) throw new Error('Failed to load premium');
  return res.json();
};

export const buyPremium = async () => {
  const res = await apiFetch('/shop/premium/', { method: 'POST', body: '{}' });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || 'Purchase failed');
  return json;
};
