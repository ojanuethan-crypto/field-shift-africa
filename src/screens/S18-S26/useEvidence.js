import { api } from '../../api/client.js'
import { USE_MOCK } from '../../api/config.js'
import { useData } from '../S9-S17/lib/useData.js'

// S20 / S21 evidence. With the real API the numbers come from the database (dataset registry and backtest, misses included);
// in mock mode the screens keep the labelled sample numbers from evidence.js and these hooks load nothing.
export const usePassport = () => useData(() => (USE_MOCK ? Promise.resolve(null) : api('/api/passport')), [])
export const useProof = () => useData(() => (USE_MOCK ? Promise.resolve(null) : api('/api/proof')), [])
