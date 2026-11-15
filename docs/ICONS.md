# Illustration set (inline SVG)

All illustrations live in ONE file: `src/components/SciFarmIcons.jsx`, which exports
`export const ICONS = { 'crop-maize': (props) => <svg ...>, ... }`.
`src/components/Pic.jsx` looks an icon up by name in `ICONS`. If a name is not in `ICONS` yet, the old
emoji is shown instead, so the app never breaks while the set is being completed.

## Rules for every icon
- Key = the exact hyphenated name from the table below (quoted string key).
- `viewBox="0 0 96 96"`, no fixed width/height, and `{...props}` spread on the `<svg>` (the app sets the size).
- Transparent background: no background `<rect>`.
- No text, no embedded images, no external fonts.
- Palette: dark green `#134227`, leaf green `#2C6B43`, light green `#75C78E`, warm yellow `#F4C446`, plus the
  natural colours of the subject and earthy browns. Same outline weight (about 3.5) on every icon.
- Valid JSX: `strokeWidth`, `strokeLinecap`, `className`. Gradient ids must be unique per icon
  (e.g. `crop-maize-g1`).
- Keep each icon under about 3 KB. Add them in batches of 6 to 8.

## Status
All 30 icons are in `SciFarmIcons.jsx`. See them all in the dev gallery (`/dev`, section "Icon set").
The emoji fallback in `Pic.jsx` only applies to a name that is not in `ICONS`.

## Names and subject lines
| File name | Subject line |
|---|---|
| crop-maize | a ripe maize cob with golden kernels and a partly peeled green husk |
| crop-groundnut | three groundnut (peanut) pods, one cracked open showing two nuts |
| crop-cassava | two brown cassava (manioc) roots, one cut to show white flesh, with a few green leaves |
| crop-plantain | a small bunch of four or five green-yellow plantains |
| crop-cocoyam | two hairy brown cocoyam (macabo, taro) corms with one heart-shaped green leaf |
| crop-cowpea | a few curved green cowpea pods, one open showing cream seeds with a dark eye spot |
| crop-soybean | a soybean plant sprig with fuzzy green pods and a few beige beans |
| crop-millet | a golden millet head: one dense, cylindrical grain spike on a stalk |
| crop-sorghum | a sorghum seed head: a rounded cluster of reddish-brown grains on a stalk (clearly different from millet) |
| crop-rice | a drooping rice panicle with golden grains on a green stalk |
| crop-tomato | two ripe red tomatoes with green tops, one cut in half |
| crop-beans | three green bean pods and a few speckled beans |
| priority-money | a small stack of gold coins next to a little money bag, no currency symbols or text |
| priority-water | a blue bucket full of water with one large water drop above it |
| priority-soil | a mound of dark rich soil with a small green seedling and an earthworm |
| priority-safety | a sturdy shield with a small green leaf on it, no text |
| zone-sahel | dry sandy land with cracked ground, a sparse thorny acacia tree and a strong sun |
| zone-savanna | open golden grassland with one flat-topped acacia tree and a baobab in the distance |
| zone-forest | dense tropical forest with tall green trees, a palm and a small rain cloud |
| zone-highlands | green terraced hills with a mountain peak and a small cloud |
| zone-southern | open woodland with scattered trees and a small maize field |
| zone-arid | sand dunes with one dry shrub and a strong sun |
| zone-floodplain | a flat river floodplain with water covering the fields, reeds and a small canoe |
| cond-water | a watering can pouring water onto small seedlings |
| cond-fertilizer | a blank (no text) sack of fertilizer with a few granules and a small plant beside it |
| voice-iris | friendly young woman, head and shoulders, short curly hair, warm smile, wearing a headset with microphone |
| voice-jarvis | calm woman in her forties with a colourful head wrap, head and shoulders, wearing a headset with microphone |
| voice-marc | young man with short hair and a friendly smile, head and shoulders, wearing a headset with microphone |
| voice-clark | older man with a short grey beard and glasses, head and shoulders, wearing a headset with microphone |
| advisor | a simple line icon of a head in side view wearing a headset with a microphone, single colour dark green #134227, thick uniform line, no fill |

Notes for the people icons: stylised, warm, respectful, not caricatures; each of the four clearly different.

## Before you ship them
- Say in the README that the illustrations were AI-generated (Space Apps asks teams to declare AI use).
- Test the set on a cheap Android phone: icons must be readable at about 48 px.
- Keep `alt=""`: the label next to every picture already carries the meaning.
