// MOCK DATA (illustrative, not real results). Shape follows the "rotations" contract in Frontend Guide s9,
// simplified for the picture-first UI. Replace with the real API response when the backend is ready.
// stars = 1-5 (never show raw scores), water = 'enough' | 'risky' | 'notEnough'.
export const PLANS = [
  {
    id: 'safest',
    stars: 4,
    best: true,
    water: 'enough',
    sequence: [
      { crop: 'maize', emoji: '🌽', status: 'ok' },
      { crop: 'groundnut', emoji: '🥜', status: 'ok' },
      { crop: 'cassava', emoji: '🥔', status: 'warn' },
    ],
    warnings: ['wetYear'],
  },
  {
    id: 'soil',
    stars: 3,
    water: 'risky',
    sequence: [
      { crop: 'beans', emoji: '🫘', status: 'ok' },
      { crop: 'maize', emoji: '🌽', status: 'ok' },
      { crop: 'fallow', emoji: '🌱', status: 'ok' },
    ],
    warnings: ['dryYear'],
  },
  {
    id: 'money',
    stars: 3,
    water: 'notEnough',
    sequence: [
      { crop: 'tomato', emoji: '🍅', status: 'warn' },
      { crop: 'maize', emoji: '🌽', status: 'ok' },
      { crop: 'tomato', emoji: '🍅', status: 'bad' },
    ],
    warnings: ['dryYear', 'fertilizer'],
  },
]

export const getPlan = (id) => PLANS.find((p) => p.id === id) || PLANS[0]
