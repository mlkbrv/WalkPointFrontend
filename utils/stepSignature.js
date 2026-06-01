import Constants from 'expo-constants';

const DEFAULT_DEV_SECRET = 'walkpoint-hmac-secret-change-me';

export const getStepHmacSecret = () =>
  Constants.expoConfig?.extra?.stepHmacSecret ??
  Constants.manifest?.extra?.stepHmacSecret ??
  DEFAULT_DEV_SECRET;

const toHex = (buffer) =>
  Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

export const buildStepSignature = async (steps, timestamp) => {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Web Crypto unavailable');
  }
  const secret = getStepHmacSecret();
  const message = `${steps}:${timestamp}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return toHex(sig);
};

export const stepConvertAuthFields = async (steps) => {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = await buildStepSignature(steps, timestamp);
  return { timestamp, signature };
};
