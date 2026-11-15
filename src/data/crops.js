// Shared crop table (MVP, 12 crops). Names as people say them. Add, don't rename ids.
export const CROPS = {
  maize:     { emoji: '🌽', en: 'Maize',     fr: 'Maïs',      legume: false },
  groundnut: { emoji: '🥜', en: 'Groundnut', fr: 'Arachide',  legume: true },
  cassava:   { emoji: '🍠', en: 'Cassava',   fr: 'Manioc',    legume: false },
  plantain:  { emoji: '🍌', en: 'Plantain',  fr: 'Plantain',  legume: false },
  cocoyam:   { emoji: '🥔', en: 'Cocoyam',   fr: 'Macabo',    legume: false },
  cowpea:    { emoji: '🫘', en: 'Cowpea',    fr: 'Niébé',     legume: true },
  soybean:   { emoji: '🌱', en: 'Soybean',   fr: 'Soja',      legume: true },
  millet:    { emoji: '🌾', en: 'Millet',    fr: 'Mil',       legume: false },
  sorghum:   { emoji: '🌾', en: 'Sorghum',   fr: 'Sorgho',    legume: false },
  rice:      { emoji: '🍚', en: 'Rice',      fr: 'Riz',       legume: false },
  tomato:    { emoji: '🍅', en: 'Tomato',    fr: 'Tomate',    legume: false },
  beans:     { emoji: '🫛', en: 'Beans',     fr: 'Haricot',   legume: true },
}
export const cropName = (id, lang) => CROPS[id]?.[lang] ?? id
