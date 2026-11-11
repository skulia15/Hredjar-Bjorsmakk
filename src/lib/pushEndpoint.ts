// Browsers hand out endpoints on these push services. Anything else is refused, so a crafted
// subscription can't make the server POST to an arbitrary URL
const PUSH_SERVICE_HOSTS = [
  'fcm.googleapis.com', // Chrome, Edge, Samsung Internet, Opera
  'updates.push.services.mozilla.com', // Firefox
  'web.push.apple.com', // Safari, and iOS home-screen apps
]
const PUSH_SERVICE_SUFFIXES = ['.push.apple.com', '.notify.windows.com']

export function isPushServiceEndpoint(endpoint: string): boolean {
  let url: URL
  try {
    url = new URL(endpoint)
  } catch {
    return false
  }
  if (url.protocol !== 'https:') return false
  return PUSH_SERVICE_HOSTS.includes(url.hostname)
    || PUSH_SERVICE_SUFFIXES.some(suffix => url.hostname.endsWith(suffix))
}
