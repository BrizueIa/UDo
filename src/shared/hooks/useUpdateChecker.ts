import { useState, useEffect, useCallback } from 'react';
import { APP_VERSION, GITHUB_RELEASES_API, GITHUB_RELEASES_URL } from '../constants/appVersion';

export interface UpdateInfo {
  available: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseName: string;
  releaseUrl: string;
  releaseNotes: string;
  publishedAt: string;
}

const DISMISSED_KEY = 'udo_dismissed_update';
const LAST_CHECK_KEY = 'udo_last_update_check';
const CHECK_INTERVAL_MS = 2 * 60 * 60 * 1000; // 2 hours

export function isNewerVersion(remoteTag: string, currentVer: string): boolean {
  const cleanRemote = remoteTag.trim().replace(/^v/i, '');
  const cleanCurrent = currentVer.trim().replace(/^v/i, '');

  const remoteParts = cleanRemote.split('.').map((p) => parseInt(p, 10) || 0);
  const currentParts = cleanCurrent.split('.').map((p) => parseInt(p, 10) || 0);

  for (let i = 0; i < Math.max(remoteParts.length, currentParts.length); i++) {
    const r = remoteParts[i] || 0;
    const c = currentParts[i] || 0;
    if (r > c) return true;
    if (r < c) return false;
  }
  return false;
}

export function useUpdateChecker() {
  const [appVersion, setAppVersion] = useState<string>(APP_VERSION);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [checkError, setCheckError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      import('@tauri-apps/api/app')
        .then(({ getVersion }) => getVersion())
        .then((ver) => {
          if (ver) setAppVersion(ver);
        })
        .catch(() => {});
    }
  }, []);

  const checkForUpdates = useCallback(async (force = false) => {
    if (!force) {
      const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
      if (lastCheck && Date.now() - parseInt(lastCheck, 10) < CHECK_INTERVAL_MS) {
        return;
      }
    }

    setIsChecking(true);
    setCheckError(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(GITHUB_RELEASES_API, {
        headers: { Accept: 'application/vnd.github.v3+json' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`GitHub API returned status ${res.status}`);
      }

      const data = await res.json();
      localStorage.setItem(LAST_CHECK_KEY, Date.now().toString());

      const remoteTag = data.tag_name || '';
      const currentVer = appVersion || APP_VERSION;
      const hasUpdate = isNewerVersion(remoteTag, currentVer);
      const dismissedTag = localStorage.getItem(DISMISSED_KEY);

      if (hasUpdate && (force || dismissedTag !== remoteTag)) {
        setUpdateInfo({
          available: true,
          currentVersion: currentVer,
          latestVersion: remoteTag,
          releaseName: data.name || remoteTag,
          releaseUrl: data.html_url || GITHUB_RELEASES_URL,
          releaseNotes: data.body || '',
          publishedAt: data.published_at || '',
        });
      } else {
        setUpdateInfo({
          available: false,
          currentVersion: currentVer,
          latestVersion: remoteTag || currentVer,
          releaseName: data.name || '',
          releaseUrl: data.html_url || GITHUB_RELEASES_URL,
          releaseNotes: '',
          publishedAt: data.published_at || '',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setCheckError(msg);
    } finally {
      setIsChecking(false);
    }
  }, [appVersion]);

  const dismissUpdate = useCallback(() => {
    if (updateInfo?.latestVersion) {
      localStorage.setItem(DISMISSED_KEY, updateInfo.latestVersion);
    }
    setUpdateInfo(null);
  }, [updateInfo]);

  const openReleasePage = useCallback(async (targetUrl?: unknown) => {
    const url =
      typeof targetUrl === 'string' && (targetUrl.startsWith('http://') || targetUrl.startsWith('https://'))
        ? targetUrl
        : updateInfo?.releaseUrl || GITHUB_RELEASES_URL;
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('open_external_url', { url });
    } catch {
      window.open(url, '_blank');
    }
  }, [updateInfo]);

  useEffect(() => {
    // Check quietly on startup after a small delay (2.5s) to avoid competing with app init
    const timer = setTimeout(() => {
      checkForUpdates(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, [checkForUpdates]);

  return {
    appVersion,
    updateInfo,
    isChecking,
    checkError,
    checkForUpdates,
    dismissUpdate,
    openReleasePage,
  };
}
