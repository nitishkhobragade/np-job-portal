import { AdSenseConfig } from '../types';

export const DEFAULT_ADSENSE_CONFIG: AdSenseConfig = {
  enabled: false,
  client: '',
  slots: {
    leaderboard: '',
    inFeed: '',
    sidebar: ''
  },
  rewardedAdEnabled: false,
  rewardedIntervalHours: 12
};

const STORAGE_KEY = 'np_adsense_config';
const UNLOCK_STORAGE_KEY = 'np_rewarded_unlocked_until';

export function getAdSenseConfig(): AdSenseConfig {
  if (typeof window === 'undefined') return DEFAULT_ADSENSE_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ADSENSE_CONFIG;
    return { ...DEFAULT_ADSENSE_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_ADSENSE_CONFIG;
  }
}

export function saveAdSenseConfig(config: AdSenseConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new Event('np_adsense_config_updated'));
  } catch (err) {
    console.error('Failed to save AdSense config', err);
  }
}

/**
 * Checks if the user currently has the 12-hour AdSense Rewarded Ad unlocked.
 */
export function isRewardedAdUnlocked(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const until = localStorage.getItem(UNLOCK_STORAGE_KEY);
    if (!until) return false;
    const expiry = Number(until);
    return Date.now() < expiry;
  } catch {
    return false;
  }
}

/**
 * Unlocks the portal for the specified interval (default 12 hours).
 */
export function unlockRewardedAd(hours: number = 12): void {
  if (typeof window === 'undefined') return;
  try {
    const expiry = Date.now() + hours * 60 * 60 * 1000;
    localStorage.setItem(UNLOCK_STORAGE_KEY, String(expiry));
    window.dispatchEvent(new Event('np_rewarded_unlocked'));
  } catch (err) {
    console.error('Failed to unlock rewarded ad', err);
  }
}

/**
 * Gets remaining time in hours & minutes for the 12-hour unlocked pass.
 */
export function getRewardedTimeRemaining(): { hours: number; minutes: number } {
  if (typeof window === 'undefined') return { hours: 0, minutes: 0 };
  try {
    const until = localStorage.getItem(UNLOCK_STORAGE_KEY);
    if (!until) return { hours: 0, minutes: 0 };
    const diff = Number(until) - Date.now();
    if (diff <= 0) return { hours: 0, minutes: 0 };
    const totalMinutes = Math.floor(diff / (1000 * 60));
    return {
      hours: Math.floor(totalMinutes / 60),
      minutes: totalMinutes % 60
    };
  } catch {
    return { hours: 0, minutes: 0 };
  }
}
