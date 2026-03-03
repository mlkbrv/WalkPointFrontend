import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://walkpoint-backend.onrender.com/api';

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

export const register = async ({ email, password, first_name, last_name }) => {
  const res = await fetch(`${API_BASE_URL}/users/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, first_name, last_name }),
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

export const convertSteps = async (steps) => {
  const res = await apiFetch('/activity/convert/', {
    method: 'POST',
    body: JSON.stringify({ steps }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || data.steps?.[0] || 'Conversion failed');
  return data;
};

export const getTodayStat = async () => {
  const res = await apiFetch('/activity/today/');
  if (!res.ok) throw new Error('Failed to load today stat');
  return res.json();
};

export const getStats = async () => {
  const res = await apiFetch('/activity/stats/');
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
