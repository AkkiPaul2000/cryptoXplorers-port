const store = new Map();

export function readCache(key) {
  const row = store.get(key);
  if (!row) return null;
  if (Date.now() > row.expires) {
    store.delete(key);
    return null;
  }
  return row.value;
}

export function writeCache(key, value, ttlMs = 60000) {
  store.set(key, { value, expires: Date.now() + ttlMs });
}
