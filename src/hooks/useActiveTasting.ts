const STORAGE_KEY = 'activeTastingId'

export function getActiveTastingId(): string | null {
  return localStorage.getItem(STORAGE_KEY)
}

// Module-level so callers get stable references (safe in effect deps)
function setActiveTasting(tastingId: string) {
  if (localStorage.getItem(STORAGE_KEY) === tastingId) return
  localStorage.setItem(STORAGE_KEY, tastingId)
  // Same-tab listeners don't receive native storage events
  window.dispatchEvent(new Event('storage'))
}

function clearActiveTasting() {
  localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new Event('storage'))
}

export function useActiveTasting() {
  return { setActiveTasting, clearActiveTasting }
}
