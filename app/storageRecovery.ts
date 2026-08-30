type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export const SAVED_STATE_KEY = "vivapiatto-v1";
export const RECOVERY_BACKUP_KEY = "vivapiatto-recovery-backup";

/**
 * Keeps one recovery copy when storage has room, but always removes the state
 * that is preventing the application from starting. In particular, a full
 * localStorage must never trap the user in the recovery screen.
 */
export const quarantineSavedState = (storage: StorageLike | null | undefined): boolean => {
  if (!storage) return false;
  let saved: string | null = null;
  try {
    saved = storage.getItem(SAVED_STATE_KEY);
  } catch {
    return false;
  }

  if (!saved) return false;

  try {
    // Keep the first failing snapshot: a second failed boot must not overwrite
    // the only recoverable copy with another partially rewritten state.
    if (!storage.getItem(RECOVERY_BACKUP_KEY)) {
      storage.setItem(RECOVERY_BACKUP_KEY, saved);
    }
  } catch {
    // The backup is best-effort: quota errors must not block recovery.
  } finally {
    try {
      storage.removeItem(SAVED_STATE_KEY);
    } catch {
      // Storage may be unavailable; the caller can still reload safely.
    }
  }

  return true;
};

export const browserLocalStorage = (): StorageLike | null => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

export const browserSessionStorage = (): StorageLike | null => {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

export const removeSessionItem = (storage: StorageLike | null | undefined, key: string) => {
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch {
    // Recovery must also work when session storage is unavailable.
  }
};

export const readSessionItem = (storage: StorageLike | null | undefined, key: string) => {
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
};

export const writeSessionItem = (storage: StorageLike | null | undefined, key: string, value: string) => {
  if (!storage) return false;
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    // Storage can be full, disabled or temporarily unavailable.
    return false;
  }
};

/**
 * Browser persistence must never be able to make the application unusable.
 * A full or unavailable store is treated as a failed best-effort save.
 */
export const writeStorageItem = (storage: StorageLike, key: string, value: string): boolean => {
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};
