import test from "node:test";
import assert from "node:assert/strict";
import {
  RECOVERY_BACKUP_KEY,
  SAVED_STATE_KEY,
  quarantineSavedState,
} from "../app/storageRecovery.ts";

const fakeStorage = ({ value = "saved-plan", failBackup = false } = {}) => {
  const values = new Map([[SAVED_STATE_KEY, value]]);
  return {
    values,
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, nextValue) {
      if (failBackup && key === RECOVERY_BACKUP_KEY) {
        const error = new Error("Quota exceeded");
        error.name = "QuotaExceededError";
        throw error;
      }
      values.set(key, nextValue);
    },
    removeItem(key) {
      values.delete(key);
    },
  };
};

test("recovery preserves one backup and clears the blocking state", () => {
  const storage = fakeStorage();
  assert.equal(quarantineSavedState(storage), true);
  assert.equal(storage.getItem(SAVED_STATE_KEY), null);
  assert.equal(storage.getItem(RECOVERY_BACKUP_KEY), "saved-plan");
});

test("quota errors can never trap the app in the recovery screen", () => {
  const storage = fakeStorage({ failBackup: true });
  assert.doesNotThrow(() => quarantineSavedState(storage));
  assert.equal(storage.getItem(SAVED_STATE_KEY), null);
});
