// Global localStorage shim for node:test workers.
//
// A few integration tests bootstrap the live-world stores, which incidentally trigger an autosave. Plain
// `node --test` has no DOM, so that autosave throws `localStorage is not defined`. This installs a minimal
// in-memory localStorage before any test module loads — wired via `node --import` (per spawned worker).
//
// IMPORTANT: install ONLY `localStorage`. Do NOT define `window` — code (and tests like perfLogger's
// "non-browser debug ... does not expose window") branch on `typeof window`, and exposing it flips
// server-mode paths into browser-mode. The autosave path uses the bare `localStorage` global, so that alone
// suffices. The guard means DOM-free tests (and assertions about localStorage being absent, of which there
// are none) are untouched.

class MemoryStorage {
  #data = new Map();

  get length() {
    return this.#data.size;
  }

  clear() {
    this.#data.clear();
  }

  getItem(key) {
    return this.#data.get(key) ?? null;
  }

  key(index) {
    return Array.from(this.#data.keys())[index] ?? null;
  }

  removeItem(key) {
    this.#data.delete(key);
  }

  setItem(key, value) {
    this.#data.set(key, String(value));
  }
}

if (!globalThis.localStorage) {
  globalThis.localStorage = new MemoryStorage();
}
