import { useEffect, useState } from 'react'

// Tiny fetch hook (no extra dependency). fn() returns a promise; deps re-run it.
// Returns { data, isLoading, isError, refetch }.
export function useData(fn, deps = []) {
  const [state, setState] = useState({ data: null, isLoading: true, isError: false })
  const [tick, setTick] = useState(0)
  useEffect(() => {
    let live = true
    setState((s) => ({ ...s, isLoading: true, isError: false }))
    fn()
      .then((data) => live && setState({ data, isLoading: false, isError: false }))
      .catch(() => live && setState({ data: null, isLoading: false, isError: true }))
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])
  return { ...state, refetch: () => setTick((n) => n + 1) }
}
