// Flip to false once the backend is live. Override with VITE_USE_MOCK=false.
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'
export const API_URL = import.meta.env.VITE_API_URL || ''
