// Patient and honest "find my location".
//
// Two different problems look the same to a user, so we tell them apart:
//  1. SLOW: the browser answers "unavailable" / "timeout" because the device needs a few seconds for its
//     first fix. The position arrives moments later, so we keep waiting (getCurrentPosition, then
//     watchPosition) until GIVE_UP_MS and never show an error early.
//  2. DENIED (error code 1): we ask the browser's Permissions API what it thinks:
//        'denied'            -> the SITE is blocked in the browser            -> reason 'site'
//        'granted'           -> the browser allows it, so the DEVICE's own location setting is off
//                              (Windows "Location services", phone Location). Chromium reports that as
//                              "denied" too. We retry once first, in case it is a hiccup  -> 'device'
//        'prompt' / unknown  -> the user dismissed or refused the question               -> 'site'
//  A page that is not a secure context (plain http on a LAN address) can never get a position: 'insecure'.
//
//   const cancel = findMe({ onFound(pos), onFail(reason, info) })
//   reason: 'site' | 'device' | 'insecure' | 'unavailable'
//   info:   { code, permission, secure, origin }  (for diagnostics)
export const GIVE_UP_MS = 30000

export function findMe({ onFound, onFail }) {
  const secure = typeof window === 'undefined' ? true : window.isSecureContext !== false
  const info = (extra) => ({ secure, origin: window.location.origin, ...extra })

  if (!secure) {
    queueMicrotask(() => onFail('insecure', info({ code: null, permission: 'n/a' })))
    return () => {}
  }
  if (!('geolocation' in navigator)) {
    queueMicrotask(() => onFail('unavailable', info({ code: null, permission: 'no geolocation' })))
    return () => {}
  }

  let done = false
  let watchId = null
  let timer = null
  let retried = false

  const stop = () => {
    done = true
    clearTimeout(timer)
    if (watchId !== null) navigator.geolocation.clearWatch(watchId)
  }
  const found = (pos) => {
    if (done) return
    stop()
    onFound(pos)
  }
  const fail = (reason, extra) => {
    if (done) return
    stop()
    onFail(reason, info(extra))
  }

  const permissionState = async () => {
    try {
      return (await navigator.permissions.query({ name: 'geolocation' })).state
    } catch {
      return 'unknown'
    }
  }

  // code 1: decide between "site blocked" and "device location off"
  const denied = async (retry) => {
    const permission = await permissionState()
    if (done) return
    if (permission === 'granted' && retry && !retried) {
      retried = true // the browser allows it: try once more shortly, it may be a hiccup
      setTimeout(() => {
        if (!done) navigator.geolocation.getCurrentPosition(found, (e2) => (e2.code === 1 ? denied(false) : listen()), opts)
      }, 1500)
      return
    }
    fail(permission === 'granted' ? 'device' : 'site', { code: 1, permission })
  }

  // slow device: keep listening instead of giving up
  const listen = () => {
    if (done || watchId !== null) return
    watchId = navigator.geolocation.watchPosition(
      found,
      (e) => {
        if (e.code === 1) denied(true)
        // other errors: keep waiting until GIVE_UP_MS
      },
      { ...opts, timeout: 20000 },
    )
  }

  // a recent cached fix is fine for choosing a farm
  const opts = { enableHighAccuracy: false, maximumAge: 5 * 60 * 1000 }
  timer = setTimeout(() => fail('unavailable', { code: 'give-up', permission: 'n/a' }), GIVE_UP_MS)
  navigator.geolocation.getCurrentPosition(
    found,
    (err) => {
      if (done) return
      if (err.code === 1) denied(true)
      else listen()
    },
    { ...opts, timeout: 10000 },
  )

  return () => {
    if (!done) stop()
  }
}
