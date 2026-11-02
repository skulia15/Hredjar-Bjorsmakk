export type TastingFetch<T> =
  | { kind: 'ok'; data: T }
  | { kind: 'not-found' }
  /** A 5xx, a timeout or no connection: the tasting may well exist, we just couldn't reach it */
  | { kind: 'unavailable' }

/**
 * GET /api/tastings/{id}, telling a tasting that doesn't exist (404) apart from one we couldn't
 * load right now. Brief outages (a dropped database connection, a phone just waking up) are
 * retried, and pages should keep showing what they had rather than "Smökkun fannst ekki".
 */
export async function fetchTasting<T>(id: string, retries = 2): Promise<TastingFetch<T>> {
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await fetch(`/api/tastings/${id}`)
      if (response.ok) return { kind: 'ok', data: (await response.json()) as T }
      if (response.status === 404) return { kind: 'not-found' }
    } catch {
      // Network error; retry below
    }
    if (attempt >= retries) return { kind: 'unavailable' }
    await new Promise(resolve => setTimeout(resolve, 500 * 2 ** attempt))
  }
}
