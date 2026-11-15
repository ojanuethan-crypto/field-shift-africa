// SciFarm illustration set: inline SVGs, transparent background, viewBox 0 0 96 96.
// Keys are the exact icon names from docs/ICONS.md. Pic.jsx looks icons up here and falls back to an
// emoji for any key that is not in this table yet.
export const ICONS = {
  'crop-maize': (props) => (
    <svg viewBox="0 0 96 96" fill="none" {...props}>
      <g transform="rotate(-16 48 48)">
        {/* Back husk tip */}
        <path
          d="M 55 34 C 66 36, 72 48, 66 64 L 52 68 Z"
          fill="#75C78E"
          stroke="#134227"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Golden maize cob */}
        <path
          d="M 48 12 C 58 12, 62 26, 60 66 L 36 66 C 34 26, 38 12, 48 12 Z"
          fill="#F4C446"
          stroke="#134227"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Subtle kernel texture lines */}
        <path
          d="M 43 18 C 42 32, 42 46, 42 58 M 53 18 C 54 32, 54 46, 54 58 M 38 28 Q 48 31 58 28 M 37 40 Q 48 43 59 40 M 36 52 Q 48 55 60 52"
          stroke="#C88D1E"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        {/* Left peeled husk */}
        <path
          d="M 36 38 C 24 42, 20 56, 28 70 C 34 76, 44 76, 48 76 C 42 66, 38 52, 36 38 Z"
          fill="#2C6B43"
          stroke="#134227"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Right peeled husk */}
        <path
          d="M 60 40 C 70 46, 74 58, 66 70 C 60 76, 52 76, 48 76 C 54 66, 58 52, 60 40 Z"
          fill="#75C78E"
          stroke="#134227"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Center front husk & stem */}
        <path
          d="M 45 76 L 45 84 L 51 84 L 51 76"
          fill="#2C6B43"
          stroke="#134227"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 36 60 Q 48 68 60 60 L 54 76 L 42 76 Z"
          fill="#2C6B43"
          stroke="#134227"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  ),

  'crop-cassava': (props) => (
    <svg viewBox="0 0 96 96" fill="none" {...props}>
      {/* Palmate 5-lobe cassava leaf */}
      <path
        d="M 48 44 L 48 34"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M 48 34 C 36 36, 24 34, 20 28 C 26 24, 38 26, 48 34 Z"
        fill="#2C6B43"
        stroke="#134227"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M 48 34 C 60 36, 72 34, 76 28 C 70 24, 58 26, 48 34 Z"
        fill="#2C6B43"
        stroke="#134227"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M 48 34 C 36 28, 28 20, 28 14 C 36 16, 44 24, 48 34 Z"
        fill="#75C78E"
        stroke="#134227"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M 48 34 C 60 28, 68 20, 68 14 C 60 16, 52 24, 48 34 Z"
        fill="#75C78E"
        stroke="#134227"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M 48 34 C 42 22, 42 12, 48 8 C 54 12, 54 22, 48 34 Z"
        fill="#2C6B43"
        stroke="#134227"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Left whole cassava tuber */}
      <path
        d="M 46 42 C 34 46, 22 60, 16 74 C 14 79, 19 83, 24 80 C 36 72, 46 58, 49 46 Z"
        fill="#8B5A3C"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 33 56 L 38 61 M 25 66 L 29 70"
        stroke="#5C3822"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Right cut cassava tuber */}
      <path
        d="M 49 42 C 61 44, 73 54, 78 68 L 66 76 C 56 68, 49 56, 47 46 Z"
        fill="#8B5A3C"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* White inner flesh cross-section */}
      <ellipse
        cx="72"
        cy="72"
        rx="9"
        ry="6"
        transform="rotate(-35 72 72)"
        fill="#FAF6EE"
        stroke="#134227"
        strokeWidth="3.5"
      />
      <circle cx="72" cy="72" r="2.2" fill="#D6C6B2" />
    </svg>
  ),

  'crop-sorghum': (props) => (
    <svg viewBox="0 0 96 96" fill="none" {...props}>
      {/* Green stalk */}
      <path
        d="M 45 48 L 45 86 L 51 86 L 51 48 Z"
        fill="#2C6B43"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Left leaf */}
      <path
        d="M 45 72 C 30 70, 20 62, 16 52 C 28 54, 38 60, 45 66 Z"
        fill="#2C6B43"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Right leaf */}
      <path
        d="M 51 64 C 66 62, 76 54, 80 44 C 68 46, 58 52, 51 58 Z"
        fill="#75C78E"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Sorghum rounded reddish-brown panicle cluster */}
      <path
        d="M 48 12 C 62 12, 68 24, 66 36 C 64 46, 56 50, 48 50 C 40 50, 32 46, 30 36 C 28 24, 34 12, 48 12 Z"
        fill="#8E2D22"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Distinct plump sorghum grains */}
      <circle cx="48" cy="20" r="5.5" fill="#B94535" stroke="#134227" strokeWidth="2.4" />
      <circle cx="38" cy="25" r="5.5" fill="#B94535" stroke="#134227" strokeWidth="2.4" />
      <circle cx="58" cy="25" r="5.5" fill="#D15B47" stroke="#134227" strokeWidth="2.4" />
      <circle cx="48" cy="31" r="6" fill="#D15B47" stroke="#134227" strokeWidth="2.4" />
      <circle cx="36" cy="37" r="5.5" fill="#B94535" stroke="#134227" strokeWidth="2.4" />
      <circle cx="60" cy="37" r="5.5" fill="#B94535" stroke="#134227" strokeWidth="2.4" />
      <circle cx="48" cy="43" r="5.5" fill="#B94535" stroke="#134227" strokeWidth="2.4" />
    </svg>
  ),

  'priority-water': (props) => (
    <svg viewBox="0 0 96 96" fill="none" {...props}>
      {/* Large water droplet above bucket */}
      <path
        d="M 48 10 C 48 10, 60 24, 60 31 A 12 12 0 1 1 36 31 C 36 24, 48 10, 48 10 Z"
        fill="#4EB5EC"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="M 43 32 A 5 5 0 0 0 47 37"
        stroke="#FFFFFF"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      {/* Bucket body */}
      <path
        d="M 24 50 L 72 50 L 65 82 C 64 85, 61 86, 58 86 L 38 86 C 35 86, 32 85, 31 82 Z"
        fill="#2E8BC0"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Water surface & rim */}
      <ellipse
        cx="48"
        cy="50"
        rx="24"
        ry="6.5"
        fill="#7AD1FA"
        stroke="#134227"
        strokeWidth="3.5"
      />
      {/* Bucket handle resting forward */}
      <path
        d="M 24 51 C 20 68, 76 68, 72 51"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  ),

  'zone-sahel': (props) => (
    <svg viewBox="0 0 96 96" fill="none" {...props}>
      {/* Strong warm yellow sun */}
      <circle
        cx="69"
        cy="25"
        r="11"
        fill="#F4C446"
        stroke="#134227"
        strokeWidth="3.5"
      />
      <path
        d="M 69 9 L 69 11 M 69 39 L 69 41 M 53 25 L 55 25 M 83 25 L 85 25 M 58 14 L 60 16 M 78 34 L 80 36 M 80 14 L 78 16"
        stroke="#134227"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Cracked dry sandy ground */}
      <path
        d="M 10 68 Q 48 62 86 68 L 86 82 C 86 85, 83 86, 80 86 L 16 86 C 13 86, 10 85, 10 82 Z"
        fill="#DDA655"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Ground cracks */}
      <path
        d="M 22 72 L 30 77 L 26 83 M 60 71 L 67 76 L 76 74 M 50 75 L 46 82"
        stroke="#134227"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Sparse thorny acacia tree */}
      <path
        d="M 38 66 L 38 40 M 38 50 L 26 42 M 38 46 L 49 39"
        stroke="#7A4E2D"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <path
        d="M 38 66 L 38 40 M 38 50 L 26 42 M 38 46 L 49 39"
        stroke="#134227"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M 16 40 C 16 32, 26 28, 38 28 C 50 28, 58 32, 58 40 Z"
        fill="#2C6B43"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="M 24 35 C 28 31, 46 31, 50 35"
        stroke="#75C78E"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  ),

  'voice-iris': (props) => (
    <svg viewBox="9 8 78 78" fill="none" {...props}>
      {/* Curly hair back puff */}
      <path
        d="M 24 44 C 19 38, 21 28, 28 25 C 31 17, 40 14, 48 16 C 56 14, 65 17, 68 25 C 75 28, 77 38, 72 44 Z"
        fill="#231F20"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Leaf green shirt shoulders */}
      <path
        d="M 20 84 C 22 69, 34 64, 48 64 C 62 64, 74 69, 76 84 Z"
        fill="#2C6B43"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Neck */}
      <rect
        x="42"
        y="56"
        width="12"
        height="11"
        rx="4"
        fill="#8D5534"
        stroke="#134227"
        strokeWidth="3.2"
      />
      {/* Head / face */}
      <path
        d="M 31 38 C 31 28, 39 24, 48 24 C 57 24, 65 28, 65 38 C 65 50, 57 59, 48 59 C 39 59, 31 50, 31 38 Z"
        fill="#9E623D"
        stroke="#134227"
        strokeWidth="3.5"
      />
      {/* Curly fringe */}
      <path
        d="M 31 36 C 34 29, 41 28, 48 30 C 55 28, 62 29, 65 36 C 65 26, 57 21, 48 21 C 39 21, 31 26, 31 36 Z"
        fill="#231F20"
        stroke="#134227"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Eyes & warm smile */}
      <circle cx="41.5" cy="42" r="2.2" fill="#134227" />
      <circle cx="54.5" cy="42" r="2.2" fill="#134227" />
      <path
        d="M 42.5 50 Q 48 55 53.5 50"
        stroke="#134227"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      {/* Headset band, yellow earcup & mic */}
      <path
        d="M 27 42 C 27 21, 69 21, 69 42"
        stroke="#134227"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <rect
        x="63"
        y="37"
        width="8"
        height="14"
        rx="4"
        fill="#F4C446"
        stroke="#134227"
        strokeWidth="3"
      />
      <path
        d="M 67 51 C 66 57, 59 58, 54 57"
        stroke="#134227"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="53" cy="57" r="2.6" fill="#F4C446" stroke="#134227" strokeWidth="2.2" />
    </svg>
  ),

  'crop-groundnut': (props) => (
    <svg viewBox="0 0 96 96" fill="none" {...props}>
      {/* Back-left peanut pod */}
      <g transform="rotate(-28 32 34)">
        <path
          d="M 18 28 C 22 22, 29 24, 32 27 C 35 24, 42 22, 46 28 C 50 34, 46 41, 40 40 C 36 39, 34 37, 32 37 C 30 37, 28 39, 24 40 C 18 41, 14 34, 18 28 Z"
          fill="#D9A76A"
          stroke="#134227"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <path
          d="M 23 32 L 41 32 M 26 28 L 26 36 M 38 28 L 38 36"
          stroke="#A8743A"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>

      {/* Back-right peanut pod */}
      <g transform="rotate(26 64 38)">
        <path
          d="M 50 32 C 54 26, 61 28, 64 31 C 67 28, 74 26, 78 32 C 82 38, 78 45, 72 44 C 68 43, 66 41, 64 41 C 62 41, 60 43, 56 44 C 50 45, 46 38, 50 32 Z"
          fill="#C99355"
          stroke="#134227"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <path
          d="M 55 36 L 73 36 M 58 32 L 58 40 M 70 32 L 70 40"
          stroke="#99642C"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>

      {/* Front cracked-open pod */}
      <path
        d="M 20 64 C 20 53, 33 50, 48 54 C 63 50, 76 53, 76 64 C 76 76, 63 80, 48 76 C 33 80, 20 76, 20 64 Z"
        fill="#D9A76A"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="M 26 64 C 26 57, 36 55, 48 58 C 60 55, 70 57, 70 64 C 70 71, 60 74, 48 70 C 36 74, 26 71, 26 64 Z"
        fill="#FAF0DC"
        stroke="#134227"
        strokeWidth="2.5"
      />
      {/* Two groundnut kernels inside */}
      <ellipse
        cx="38"
        cy="64"
        rx="8.5"
        ry="6.5"
        fill="#B85D3B"
        stroke="#134227"
        strokeWidth="3"
      />
      <ellipse
        cx="58"
        cy="64"
        rx="8.5"
        ry="6.5"
        fill="#C96D49"
        stroke="#134227"
        strokeWidth="3"
      />
    </svg>
  ),

  'crop-plantain': (props) => (
    <svg viewBox="0 0 96 96" fill="none" {...props}>
      {/* Top green crown stalk */}
      <path
        d="M 44 12 L 54 12 L 56 26 L 40 26 Z"
        fill="#2C6B43"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Back-left green plantain */}
      <path
        d="M 42 25 C 24 34, 16 54, 24 72 C 26 75, 30 74, 30 70 C 26 54, 32 38, 44 30 Z"
        fill="#2C6B43"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Back-right green-yellow plantain */}
      <path
        d="M 55 25 C 72 34, 78 54, 70 74 C 68 77, 64 76, 64 72 C 68 54, 64 38, 52 30 Z"
        fill="#75C78E"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Front-left ripe yellow plantain */}
      <path
        d="M 45 26 C 32 38, 30 58, 38 78 C 40 82, 45 81, 45 77 C 41 58, 42 40, 49 28 Z"
        fill="#F4C446"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Front-right ripe yellow plantain */}
      <path
        d="M 52 26 C 62 40, 62 60, 54 80 C 52 84, 48 82, 48 78 C 53 60, 53 42, 47 28 Z"
        fill="#F4C446"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Subtle ridge lines */}
      <path
        d="M 39 46 C 37 56, 38 66, 41 74 M 55 46 C 56 56, 55 66, 52 74"
        stroke="#C88D1E"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  ),

  'crop-cocoyam': (props) => (
    <svg viewBox="0 0 96 96" fill="none" {...props}>
      {/* Heart-shaped taro / macabo leaf */}
      <path
        d="M 48 20 C 40 10, 20 12, 20 30 C 20 46, 38 54, 48 60 C 58 54, 76 46, 76 30 C 76 12, 56 10, 48 20 Z"
        fill="#2C6B43"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="M 48 22 L 48 56 M 48 33 L 33 25 M 48 33 L 63 25 M 48 44 L 34 39 M 48 44 L 62 39"
        stroke="#75C78E"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      {/* Left hairy brown cocoyam corm */}
      <ellipse
        cx="35"
        cy="68"
        rx="16"
        ry="13"
        transform="rotate(-12 35 68)"
        fill="#7D5338"
        stroke="#134227"
        strokeWidth="3.5"
      />
      <path
        d="M 24 65 Q 35 69 46 63 M 26 73 Q 36 77 45 72"
        stroke="#4D2F1C"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Right cocoyam corm */}
      <ellipse
        cx="61"
        cy="70"
        rx="15"
        ry="12.5"
        transform="rotate(14 61 70)"
        fill="#8E6042"
        stroke="#134227"
        strokeWidth="3.5"
      />
      <path
        d="M 50 67 Q 61 72 72 68 M 52 75 Q 61 79 70 75"
        stroke="#4D2F1C"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Fine root hairs at bottom */}
      <path
        d="M 29 81 L 27 86 M 37 81 L 38 86 M 57 82 L 56 87 M 65 82 L 67 86"
        stroke="#134227"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  ),

  'crop-cowpea': (props) => (
    <svg viewBox="0 0 96 96" fill="none" {...props}>
      {/* Upper curved green cowpea pod */}
      <path
        d="M 20 26 C 34 14, 62 16, 78 34 C 72 38, 64 36, 56 32 C 42 26, 30 28, 22 34 C 19 32, 18 28, 20 26 Z"
        fill="#75C78E"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Second slender pod */}
      <path
        d="M 16 44 C 30 32, 58 34, 74 52 C 66 56, 56 52, 48 48 C 36 42, 26 44, 18 52 C 15 49, 14 46, 16 44 Z"
        fill="#2C6B43"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Two prominent cream-white black-eyed cowpeas */}
      <g transform="rotate(-15 36 69)">
        <path
          d="M 24 69 C 24 60, 34 57, 42 60 C 48 62, 48 76, 42 78 C 34 81, 24 78, 24 69 Z"
          fill="#FAF5E8"
          stroke="#134227"
          strokeWidth="3.5"
        />
        <ellipse cx="38" cy="69" rx="4.2" ry="5.5" fill="#134227" />
      </g>
      <g transform="rotate(14 63 70)">
        <path
          d="M 51 70 C 51 61, 61 58, 69 61 C 75 63, 75 77, 69 79 C 61 82, 51 79, 51 70 Z"
          fill="#FAF5E8"
          stroke="#134227"
          strokeWidth="3.5"
        />
        <ellipse cx="59" cy="70" rx="4.2" ry="5.5" fill="#134227" />
      </g>
    </svg>
  ),

  'crop-soybean': (props) => (
    <svg viewBox="0 0 96 96" fill="none" {...props}>
      {/* Main upright stem */}
      <path
        d="M 48 84 L 48 26"
        stroke="#134227"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Trifoliate 3-leaf soybean cluster */}
      <path
        d="M 48 28 C 42 18, 42 10, 48 8 C 54 10, 54 18, 48 28 Z"
        fill="#75C78E"
        stroke="#134227"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
      <path
        d="M 46 30 C 34 32, 24 28, 22 20 C 30 18, 40 22, 46 30 Z"
        fill="#75C78E"
        stroke="#134227"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
      <path
        d="M 50 30 C 62 32, 72 28, 74 20 C 66 18, 56 22, 50 30 Z"
        fill="#75C78E"
        stroke="#134227"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
      {/* Left plump pod */}
      <path
        d="M 46 42 C 34 40, 22 46, 20 55 C 24 60, 38 56, 46 48 Z"
        fill="#2C6B43"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Right plump pod */}
      <path
        d="M 50 48 C 62 46, 74 52, 76 61 C 72 66, 58 62, 50 54 Z"
        fill="#2C6B43"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Lower left pod */}
      <path
        d="M 46 62 C 34 62, 24 68, 24 76 C 30 80, 40 76, 46 68 Z"
        fill="#75C78E"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Beige soybeans at base */}
      <circle cx="62" cy="77" r="6.5" fill="#E8D5A7" stroke="#134227" strokeWidth="3.2" />
      <circle cx="74" cy="79" r="6.5" fill="#DFC68E" stroke="#134227" strokeWidth="3.2" />
    </svg>
  ),

  'crop-millet': (props) => (
    <svg viewBox="0 0 96 96" fill="none" {...props}>
      {/* Upright stalk */}
      <path
        d="M 45 54 L 45 86 L 51 86 L 51 54 Z"
        fill="#2C6B43"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Slender upright leaves */}
      <path
        d="M 45 78 C 32 72, 24 60, 22 44 C 30 52, 38 62, 45 70 Z"
        fill="#75C78E"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="M 51 74 C 64 68, 72 56, 74 42 C 66 50, 58 60, 51 66 Z"
        fill="#2C6B43"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Cylindrical golden pearl millet spike */}
      <rect
        x="38"
        y="10"
        width="20"
        height="46"
        rx="10"
        fill="#F4C446"
        stroke="#134227"
        strokeWidth="3.5"
      />
      {/* Dense grain pattern inside spike */}
      <path
        d="M 43 18 L 43 48 M 48 15 L 48 51 M 53 18 L 53 48 M 40 24 L 56 24 M 40 32 L 56 32 M 40 40 L 56 40 M 40 48 L 56 48"
        stroke="#C88D1E"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Fine millet bristles on outer edge */}
      <path
        d="M 35 20 L 38 22 M 35 30 L 38 31 M 35 40 L 38 41 M 61 20 L 58 22 M 61 30 L 58 31 M 61 40 L 58 41"
        stroke="#134227"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  ),

  'crop-rice': (props) => (
    <svg viewBox="0 0 96 96" fill="none" {...props}>
      {/* Base green rice leaves */}
      <path
        d="M 32 84 C 24 68, 18 54, 16 38 C 24 48, 30 62, 34 78 Z"
        fill="#75C78E"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="M 38 84 C 46 70, 56 60, 68 54 C 58 66, 48 74, 40 84 Z"
        fill="#2C6B43"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Main gracefully drooping stalk */}
      <path
        d="M 35 84 C 32 54, 34 22, 52 16 C 64 13, 74 24, 76 40"
        stroke="#134227"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Drooping golden rice grains */}
      <ellipse cx="51" cy="24" rx="4" ry="6.5" transform="rotate(20 51 24)" fill="#F4C446" stroke="#134227" strokeWidth="2.8" />
      <ellipse cx="61" cy="23" rx="4" ry="6.5" transform="rotate(35 61 23)" fill="#F4C446" stroke="#134227" strokeWidth="2.8" />
      <ellipse cx="68" cy="31" rx="4" ry="6.5" transform="rotate(28 68 31)" fill="#F4C446" stroke="#134227" strokeWidth="2.8" />
      <ellipse cx="75" cy="41" rx="4" ry="6.5" transform="rotate(14 75 41)" fill="#F4C446" stroke="#134227" strokeWidth="2.8" />
      <ellipse cx="58" cy="34" rx="4" ry="6.5" transform="rotate(24 58 34)" fill="#E4AF32" stroke="#134227" strokeWidth="2.8" />
      <ellipse cx="65" cy="43" rx="4" ry="6.5" transform="rotate(16 65 43)" fill="#E4AF32" stroke="#134227" strokeWidth="2.8" />
      <ellipse cx="74" cy="52" rx="4" ry="6.5" transform="rotate(8 74 52)" fill="#F4C446" stroke="#134227" strokeWidth="2.8" />
    </svg>
  ),

  'crop-tomato': (props) => (
    <svg viewBox="0 0 96 96" fill="none" {...props}>
      {/* Whole ripe red tomato */}
      <ellipse cx="38" cy="44" rx="23" ry="21" fill="#E04638" stroke="#134227" strokeWidth="3.5" />
      {/* Highlight */}
      <path d="M 24 36 C 26 31, 30 28, 34 27" stroke="#F68E83" strokeWidth="3" strokeLinecap="round" />
      {/* Green calyx crown & stem */}
      <path d="M 38 14 L 38 24" stroke="#134227" strokeWidth="4" strokeLinecap="round" />
      <path
        d="M 38 25 L 28 20 L 33 27 L 25 32 L 36 30 L 38 37 L 41 30 L 51 32 L 43 27 L 48 20 Z"
        fill="#2C6B43"
        stroke="#134227"
        strokeWidth="2.8"
        strokeLinejoin="round"
      />
      {/* Cut tomato half in front-right */}
      <circle cx="61" cy="63" r="21" fill="#C93529" stroke="#134227" strokeWidth="3.5" />
      <circle cx="61" cy="63" r="16" fill="#F27968" />
      <circle cx="61" cy="63" r="4" fill="#FCE39D" />
      {/* Seed pockets */}
      <ellipse cx="53" cy="56" rx="4.5" ry="3" transform="rotate(-35 53 56)" fill="#FCE39D" />
      <ellipse cx="69" cy="56" rx="4.5" ry="3" transform="rotate(35 69 56)" fill="#FCE39D" />
      <ellipse cx="53" cy="70" rx="4.5" ry="3" transform="rotate(35 53 70)" fill="#FCE39D" />
      <ellipse cx="69" cy="70" rx="4.5" ry="3" transform="rotate(-35 69 70)" fill="#FCE39D" />
    </svg>
  ),

  'crop-beans': (props) => (
    <svg viewBox="0 0 96 96" fill="none" {...props}>
      {/* Two green bean pods behind */}
      <path
        d="M 18 34 C 30 18, 56 14, 76 26 C 72 34, 62 34, 52 32 C 38 30, 28 34, 22 42 C 18 40, 16 37, 18 34 Z"
        fill="#75C78E"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="M 24 50 C 36 36, 60 32, 78 44 C 74 52, 64 52, 54 50 C 42 48, 32 52, 26 58 C 22 56, 22 53, 24 50 Z"
        fill="#2C6B43"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Three reddish-brown speckled kidney beans in foreground */}
      <g transform="rotate(-18 31 69)">
        <path d="M 20 69 C 20 61, 29 58, 37 61 C 43 63, 43 75, 37 77 C 29 80, 20 77, 20 69 Z" fill="#A63A2E" stroke="#134227" strokeWidth="3.5" />
        <circle cx="28" cy="67" r="1.8" fill="#631E17" />
        <circle cx="34" cy="72" r="1.5" fill="#631E17" />
      </g>
      <g transform="rotate(14 54 74)">
        <path d="M 43 74 C 43 66, 52 63, 60 66 C 66 68, 66 80, 60 82 C 52 85, 43 82, 43 74 Z" fill="#BD4B3D" stroke="#134227" strokeWidth="3.5" />
        <circle cx="52" cy="71" r="1.8" fill="#631E17" />
        <circle cx="58" cy="76" r="1.5" fill="#631E17" />
      </g>
      <g transform="rotate(-8 69 61)">
        <path d="M 59 61 C 59 54, 67 51, 74 54 C 80 56, 80 66, 74 68 C 67 71, 59 68, 59 61 Z" fill="#963126" stroke="#134227" strokeWidth="3.5" />
        <circle cx="67" cy="59" r="1.6" fill="#591A13" />
      </g>
    </svg>
  ),

  'priority-money': (props) => (
    <svg viewBox="0 0 96 96" fill="none" {...props}>
      {/* Little money bag (no symbols or text) */}
      <path
        d="M 28 24 L 33 16 L 40 20 L 47 16 L 51 24 L 45 31 L 34 31 Z"
        fill="#E8C98E"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="M 33 31 C 21 38, 16 54, 18 70 C 19 78, 27 82, 40 82 C 53 82, 60 78, 61 70 C 63 54, 58 38, 46 31 Z"
        fill="#E8C98E"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Green tie ribbon around bag neck */}
      <rect x="31" y="29" width="17" height="6" rx="3" fill="#2C6B43" stroke="#134227" strokeWidth="3" />
      {/* Stack of golden coins */}
      <ellipse cx="66" cy="77" rx="15" ry="6" fill="#D99B26" stroke="#134227" strokeWidth="3.5" />
      <ellipse cx="66" cy="69" rx="15" ry="6" fill="#F4C446" stroke="#134227" strokeWidth="3.5" />
      <ellipse cx="66" cy="61" rx="15" ry="6" fill="#D99B26" stroke="#134227" strokeWidth="3.5" />
      <ellipse cx="66" cy="53" rx="15" ry="6" fill="#F4C446" stroke="#134227" strokeWidth="3.5" />
    </svg>
  ),

  'priority-soil': (props) => (
    <svg viewBox="0 0 96 96" fill="none" {...props}>
      {/* Small green seedling */}
      <path d="M 48 56 L 48 34" stroke="#134227" strokeWidth="3.8" strokeLinecap="round" />
      <path
        d="M 48 38 C 36 38, 28 30, 28 20 C 38 20, 46 28, 48 38 Z"
        fill="#75C78E"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="M 48 34 C 58 32, 68 24, 68 14 C 58 14, 50 24, 48 34 Z"
        fill="#2C6B43"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Rich dark soil mound */}
      <path
        d="M 12 82 C 16 62, 30 52, 48 52 C 66 52, 80 62, 84 82 Z"
        fill="#6D452B"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Soil texture dots */}
      <circle cx="32" cy="70" r="2.2" fill="#442816" />
      <circle cx="44" cy="64" r="2.2" fill="#442816" />
      <circle cx="42" cy="75" r="2" fill="#442816" />
      {/* Friendly earthworm peeking out on the right */}
      <path d="M 58 74 C 60 66, 68 65, 72 71 C 75 76, 82 75, 84 68" stroke="#134227" strokeWidth="9" strokeLinecap="round" />
      <path d="M 58 74 C 60 66, 68 65, 72 71 C 75 76, 82 75, 84 68" stroke="#E08B74" strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  ),

  'priority-safety': (props) => (
    <svg viewBox="0 0 96 96" fill="none" {...props}>
      {/* Sturdy shield body */}
      <path
        d="M 48 12 L 78 22 L 78 46 C 78 65, 64 78, 48 85 C 32 78, 18 65, 18 46 L 18 22 Z"
        fill="#E9F6EC"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Inner shield border accent */}
      <path
        d="M 48 18 L 71 26 L 71 45 C 71 60, 60 71, 48 77 C 36 71, 25 60, 25 45 L 25 26 Z"
        fill="#75C78E"
        stroke="#134227"
        strokeWidth="2.8"
        strokeLinejoin="round"
      />
      {/* Center green leaf */}
      <path
        d="M 48 64 C 38 56, 34 46, 36 37 C 38 30, 43 27, 48 27 C 53 27, 58 30, 60 37 C 62 46, 58 56, 48 64 Z"
        fill="#2C6B43"
        stroke="#134227"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
      <path d="M 48 31 L 48 61 M 48 44 L 42 38 M 48 51 L 54 45" stroke="#F4C446" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  ),

  'zone-savanna': (props) => (
    <svg viewBox="0 0 96 96" fill="none" {...props}>
      {/* Rolling golden-green savanna ground */}
      <path
        d="M 10 70 Q 48 60 86 70 L 86 82 C 86 85, 83 86, 80 86 L 16 86 C 13 86, 10 85, 10 82 Z"
        fill="#E5B952"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Flat-topped acacia tree */}
      <path d="M 52 66 L 52 40 M 52 50 L 38 40 M 52 46 L 66 39" stroke="#7A4E2D" strokeWidth="5" strokeLinecap="round" />
      <path d="M 52 66 L 52 40 M 52 50 L 38 40 M 52 46 L 66 39" stroke="#134227" strokeWidth="2.4" strokeLinecap="round" />
      <path
        d="M 22 40 C 22 28, 36 22, 52 22 C 68 22, 82 28, 82 40 Z"
        fill="#2C6B43"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path d="M 32 33 C 38 28, 66 28, 72 33" stroke="#75C78E" strokeWidth="3.2" strokeLinecap="round" />
      {/* Bold golden savanna grass tufts */}
      <path
        d="M 18 76 L 15 64 M 22 76 L 22 61 M 26 76 L 30 65 M 68 78 L 65 67 M 72 78 L 74 65 M 76 78 L 80 68"
        stroke="#134227"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  ),

  'zone-forest': (props) => (
    <svg viewBox="0 0 96 96" fill="none" {...props}>
      {/* Small rain cloud & droplets at top-left */}
      <path
        d="M 18 28 C 14 28, 12 24, 14 21 C 15 17, 20 15, 24 17 C 27 13, 34 14, 36 19 C 40 20, 41 26, 36 28 Z"
        fill="#DCEFF9"
        stroke="#134227"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M 20 33 L 18 37 M 28 33 L 26 37" stroke="#3B9ED8" strokeWidth="2.8" strokeLinecap="round" />
      {/* Tropical palm tree on right */}
      <path d="M 68 74 C 70 58, 70 46, 66 36" stroke="#7A4E2D" strokeWidth="5" strokeLinecap="round" />
      <path
        d="M 66 36 C 58 28, 48 30, 44 36 M 66 36 C 62 24, 72 20, 80 26 M 66 36 C 76 32, 84 38, 84 46 M 66 36 C 56 38, 52 44, 52 50"
        stroke="#134227"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <path
        d="M 66 36 C 58 28, 48 30, 44 36 M 66 36 C 62 24, 72 20, 80 26 M 66 36 C 76 32, 84 38, 84 46 M 66 36 C 56 38, 52 44, 52 50"
        stroke="#75C78E"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      {/* Tall rainforest trees on left & center */}
      <rect x="23" y="64" width="6" height="16" fill="#7A4E2D" stroke="#134227" strokeWidth="3" />
      <path
        d="M 12 68 C 10 52, 16 40, 26 36 C 36 40, 42 52, 40 68 Z"
        fill="#2C6B43"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <rect x="45" y="62" width="6" height="18" fill="#7A4E2D" stroke="#134227" strokeWidth="3" />
      <path
        d="M 32 66 C 30 48, 38 30, 48 24 C 58 30, 66 48, 64 66 Z"
        fill="#75C78E"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Forest floor */}
      <path d="M 10 82 L 86 82" stroke="#134227" strokeWidth="4" strokeLinecap="round" />
    </svg>
  ),

  'zone-highlands': (props) => (
    <svg viewBox="0 0 96 96" fill="none" {...props}>
      {/* Small cloud at top-left */}
      <path
        d="M 16 28 C 12 28, 10 24, 12 21 C 14 16, 20 15, 24 17 C 28 13, 35 15, 36 20 C 40 21, 41 27, 36 28 Z"
        fill="#EBF6FC"
        stroke="#134227"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Back tall mountain peak */}
      <path d="M 28 74 L 56 20 L 84 74 Z" fill="#2C6B43" stroke="#134227" strokeWidth="3.5" strokeLinejoin="round" />
      {/* Front terraced green hill */}
      <path
        d="M 10 82 C 16 56, 28 42, 42 42 C 56 42, 72 56, 86 82 Z"
        fill="#75C78E"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Curved agricultural terrace stripes */}
      <path
        d="M 24 58 Q 42 52 60 58 M 18 68 Q 42 61 68 68 M 14 77 Q 44 70 76 77"
        stroke="#134227"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
    </svg>
  ),

  'zone-southern': (props) => (
    <svg viewBox="0 0 96 96" fill="none" {...props}>
      {/* Open woodland trees in background */}
      <rect x="23" y="54" width="6" height="18" fill="#7A4E2D" stroke="#134227" strokeWidth="3" />
      <circle cx="26" cy="40" r="15" fill="#2C6B43" stroke="#134227" strokeWidth="3.5" />
      <rect x="67" y="54" width="6" height="18" fill="#7A4E2D" stroke="#134227" strokeWidth="3" />
      <circle cx="70" cy="42" r="14" fill="#75C78E" stroke="#134227" strokeWidth="3.5" />
      {/* Cultivated soil strip */}
      <path
        d="M 10 72 Q 48 66 86 72 L 86 82 C 86 85, 83 86, 80 86 L 16 86 C 13 86, 10 85, 10 82 Z"
        fill="#8B5A3C"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Prominent golden maize plant in foreground */}
      <path d="M 48 80 L 48 44" stroke="#134227" strokeWidth="4" strokeLinecap="round" />
      <path
        d="M 48 70 C 36 68, 30 60, 32 52 C 40 54, 46 60, 48 66 Z"
        fill="#75C78E"
        stroke="#134227"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M 48 68 C 60 66, 66 58, 64 50 C 56 52, 50 58, 48 64 Z"
        fill="#2C6B43"
        stroke="#134227"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <ellipse cx="48" cy="42" rx="7.5" ry="13" fill="#F4C446" stroke="#134227" strokeWidth="3.2" />
    </svg>
  ),

  'zone-arid': (props) => (
    <svg viewBox="0 0 96 96" fill="none" {...props}>
      {/* Blazing yellow sun */}
      <circle cx="48" cy="28" r="13" fill="#F4C446" stroke="#134227" strokeWidth="3.5" />
      <path
        d="M 48 8 L 48 11 M 28 28 L 31 28 M 65 28 L 68 28 M 34 14 L 36 16 M 62 14 L 60 16"
        stroke="#134227"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Back sand dune */}
      <path
        d="M 10 68 C 28 48, 44 48, 62 62 C 72 68, 80 64, 86 60 L 86 84 L 10 84 Z"
        fill="#E8B968"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Front sweeping sand dune */}
      <path
        d="M 10 74 C 24 72, 42 58, 62 56 C 74 55, 81 62, 86 68 L 86 82 C 86 85, 83 86, 80 86 L 16 86 C 13 86, 10 85, 10 82 Z"
        fill="#D49B4B"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Single dry desert shrub */}
      <path d="M 28 76 L 28 65 M 28 71 L 21 66 M 28 70 L 35 65" stroke="#134227" strokeWidth="2.8" strokeLinecap="round" />
    </svg>
  ),

  'zone-floodplain': (props) => (
    <svg viewBox="0 0 96 96" fill="none" {...props}>
      {/* Lush distant riverbank */}
      <path
        d="M 10 48 Q 34 40 58 46 Q 74 50 86 44 L 86 58 L 10 58 Z"
        fill="#75C78E"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Floodplain blue water */}
      <path
        d="M 10 54 Q 28 50 48 54 Q 68 58 86 54 L 86 82 C 86 85, 83 86, 80 86 L 16 86 C 13 86, 10 85, 10 82 Z"
        fill="#4EB5EC"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Water ripple highlights */}
      <path d="M 42 74 Q 52 71 62 74 M 54 80 Q 66 77 76 80" stroke="#BAE6FD" strokeWidth="2.8" strokeLinecap="round" />
      {/* Tall reeds on the left */}
      <path d="M 20 76 L 18 32 M 26 78 L 28 28 M 32 75 L 36 38" stroke="#134227" strokeWidth="3.5" strokeLinecap="round" />
      <rect x="15.5" y="26" width="5" height="10" rx="2.5" fill="#7A4E2D" stroke="#134227" strokeWidth="2.4" />
      <rect x="25.5" y="22" width="5" height="10" rx="2.5" fill="#7A4E2D" stroke="#134227" strokeWidth="2.4" />
      {/* Wooden canoe floating on floodplain */}
      <path
        d="M 44 60 L 80 56 C 78 65, 70 68, 62 68 C 52 68, 46 65, 44 60 Z"
        fill="#8B5A3C"
        stroke="#134227"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
      <path d="M 64 52 L 56 69" stroke="#134227" strokeWidth="2.8" strokeLinecap="round" />
    </svg>
  ),

  'cond-water': (props) => (
    <svg viewBox="0 0 96 96" fill="none" {...props}>
      {/* Soil patch & small seedling on bottom-left */}
      <path d="M 10 82 C 14 73, 34 73, 38 82 Z" fill="#7A4E2D" stroke="#134227" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M 24 76 L 24 58" stroke="#134227" strokeWidth="3.5" strokeLinecap="round" />
      <path
        d="M 24 62 C 16 62, 12 56, 12 49 C 19 49, 24 55, 24 62 Z"
        fill="#75C78E"
        stroke="#134227"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M 24 60 C 31 58, 36 52, 36 45 C 29 46, 25 52, 24 60 Z"
        fill="#2C6B43"
        stroke="#134227"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Watering can tilted on top-right */}
      <g transform="rotate(-24 63 36)">
        {/* Handle */}
        <path d="M 70 24 C 84 20, 88 42, 74 46" stroke="#134227" strokeWidth="4" strokeLinecap="round" />
        {/* Spout */}
        <path d="M 48 38 L 28 32 L 28 26 L 48 30 Z" fill="#75C78E" stroke="#134227" strokeWidth="3.5" strokeLinejoin="round" />
        {/* Spout rose */}
        <ellipse cx="26" cy="29" rx="3.5" ry="6" fill="#F4C446" stroke="#134227" strokeWidth="3" />
        {/* Can body */}
        <rect x="46" y="22" width="28" height="26" rx="5" fill="#2C6B43" stroke="#134227" strokeWidth="3.5" />
      </g>
      {/* Pouring blue water drops */}
      <path d="M 32 42 L 28 48 M 38 45 L 34 52 M 26 48 L 22 54" stroke="#4EB5EC" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  ),

  'cond-fertilizer': (props) => (
    <svg viewBox="0 0 96 96" fill="none" {...props}>
      {/* Blank fertilizer sack */}
      <path
        d="M 26 24 L 30 14 L 38 18 L 46 14 L 50 24 L 46 31 L 30 31 Z"
        fill="#E8D5A7"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="M 29 31 C 18 40, 16 58, 18 76 C 19 82, 26 84, 38 84 C 50 84, 57 82, 58 76 C 60 58, 58 40, 47 31 Z"
        fill="#E8D5A7"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Yellow tie ribbon */}
      <rect x="28" y="29" width="20" height="6" rx="3" fill="#F4C446" stroke="#134227" strokeWidth="3" />
      {/* Healthy leafy sprout beside sack */}
      <path d="M 70 76 L 70 46" stroke="#134227" strokeWidth="3.5" strokeLinecap="round" />
      <path
        d="M 70 54 C 60 52, 54 44, 56 36 C 64 38, 69 44, 70 54 Z"
        fill="#75C78E"
        stroke="#134227"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
      <path
        d="M 70 50 C 80 48, 86 40, 84 32 C 76 34, 71 40, 70 50 Z"
        fill="#2C6B43"
        stroke="#134227"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
      {/* Fertilizer granules */}
      <circle cx="62" cy="80" r="3.5" fill="#75C78E" stroke="#134227" strokeWidth="2.4" />
      <circle cx="71" cy="82" r="3.5" fill="#F4C446" stroke="#134227" strokeWidth="2.4" />
      <circle cx="79" cy="79" r="3.5" fill="#75C78E" stroke="#134227" strokeWidth="2.4" />
    </svg>
  ),

  'voice-jarvis': (props) => (
    <svg viewBox="0 0 96 96" fill="none" {...props}>
      {/* Light green shoulders */}
      <path
        d="M 20 84 C 22 69, 34 64, 48 64 C 62 64, 74 69, 76 84 Z"
        fill="#75C78E"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Neck */}
      <rect x="42" y="56" width="12" height="11" rx="4" fill="#844D2E" stroke="#134227" strokeWidth="3.2" />
      {/* Face */}
      <path
        d="M 31 40 C 31 30, 39 26, 48 26 C 57 26, 65 30, 65 40 C 65 52, 57 60, 48 60 C 39 60, 31 52, 31 40 Z"
        fill="#844D2E"
        stroke="#134227"
        strokeWidth="3.5"
      />
      {/* Colourful patterned head wrap */}
      <path
        d="M 28 36 C 26 20, 38 12, 48 12 C 58 12, 70 20, 68 36 C 60 32, 36 32, 28 36 Z"
        fill="#F4C446"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path d="M 31 27 Q 48 20 65 27" stroke="#2C6B43" strokeWidth="4.5" strokeLinecap="round" />
      {/* Calm eyes & gentle smile */}
      <circle cx="41.5" cy="43" r="2.2" fill="#134227" />
      <circle cx="54.5" cy="43" r="2.2" fill="#134227" />
      <path d="M 43 51 Q 48 54.5 53 51" stroke="#134227" strokeWidth="2.8" strokeLinecap="round" />
      {/* Headset band, green earcup & mic */}
      <path d="M 27 42 C 27 17, 69 17, 69 42" stroke="#134227" strokeWidth="4" strokeLinecap="round" />
      <rect x="63" y="37" width="8" height="14" rx="4" fill="#2C6B43" stroke="#134227" strokeWidth="3" />
      <path d="M 67 51 C 66 57, 59 58, 54 57" stroke="#134227" strokeWidth="3" strokeLinecap="round" />
      <circle cx="53" cy="57" r="2.6" fill="#F4C446" stroke="#134227" strokeWidth="2.2" />
    </svg>
  ),

  'voice-marc': (props) => (
    <svg viewBox="0 0 96 96" fill="none" {...props}>
      {/* Leaf green shirt shoulders */}
      <path
        d="M 20 84 C 22 69, 34 64, 48 64 C 62 64, 74 69, 76 84 Z"
        fill="#2C6B43"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path d="M 40 65 L 48 73 L 56 65" stroke="#75C78E" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Neck */}
      <rect x="42" y="56" width="12" height="11" rx="4" fill="#754225" stroke="#134227" strokeWidth="3.2" />
      {/* Face */}
      <path
        d="M 31 38 C 31 28, 39 24, 48 24 C 57 24, 65 28, 65 38 C 65 50, 57 59, 48 59 C 39 59, 31 50, 31 38 Z"
        fill="#754225"
        stroke="#134227"
        strokeWidth="3.5"
      />
      {/* Short tapered dark hair */}
      <path
        d="M 31 35 C 30 22, 39 18, 48 18 C 57 18, 66 22, 65 35 C 61 29, 55 27, 48 27 C 41 27, 35 29, 31 35 Z"
        fill="#231F20"
        stroke="#134227"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
      {/* Eyes & friendly smile */}
      <circle cx="41.5" cy="42" r="2.2" fill="#134227" />
      <circle cx="54.5" cy="42" r="2.2" fill="#134227" />
      <path d="M 42 50 Q 48 56 54 50" stroke="#134227" strokeWidth="2.8" strokeLinecap="round" />
      {/* Headset band, yellow earcup & mic */}
      <path d="M 27 42 C 27 19, 69 19, 69 42" stroke="#134227" strokeWidth="4" strokeLinecap="round" />
      <rect x="63" y="37" width="8" height="14" rx="4" fill="#F4C446" stroke="#134227" strokeWidth="3" />
      <path d="M 67 51 C 66 57, 59 58, 54 57" stroke="#134227" strokeWidth="3" strokeLinecap="round" />
      <circle cx="53" cy="57" r="2.6" fill="#F4C446" stroke="#134227" strokeWidth="2.2" />
    </svg>
  ),

  'voice-clark': (props) => (
    <svg viewBox="0 0 96 96" fill="none" {...props}>
      {/* Dark green collared shirt */}
      <path
        d="M 20 84 C 22 69, 34 64, 48 64 C 62 64, 74 69, 76 84 Z"
        fill="#1D5635"
        stroke="#134227"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Neck */}
      <rect x="42" y="56" width="12" height="11" rx="4" fill="#9A5F3B" stroke="#134227" strokeWidth="3.2" />
      {/* Face */}
      <path
        d="M 31 38 C 31 28, 39 24, 48 24 C 57 24, 65 28, 65 38 C 65 50, 57 59, 48 59 C 39 59, 31 50, 31 38 Z"
        fill="#9A5F3B"
        stroke="#134227"
        strokeWidth="3.5"
      />
      {/* Short grey hair */}
      <path
        d="M 31 35 C 31 23, 39 19, 48 19 C 57 19, 65 23, 65 35 C 61 29, 55 28, 48 28 C 41 28, 35 29, 31 35 Z"
        fill="#B8C2C8"
        stroke="#134227"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Short grey beard */}
      <path
        d="M 31 44 C 31 55, 39 62, 48 62 C 57 62, 65 55, 65 44 C 61 48, 56 49, 48 49 C 40 49, 35 48, 31 44 Z"
        fill="#B8C2C8"
        stroke="#134227"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Glasses */}
      <circle cx="41" cy="40" r="5" fill="#FFFFFF" fillOpacity="0.25" stroke="#134227" strokeWidth="2.6" />
      <circle cx="55" cy="40" r="5" fill="#FFFFFF" fillOpacity="0.25" stroke="#134227" strokeWidth="2.6" />
      <path d="M 46 40 L 50 40" stroke="#134227" strokeWidth="2.6" />
      <circle cx="41" cy="40" r="1.7" fill="#134227" />
      <circle cx="55" cy="40" r="1.7" fill="#134227" />
      {/* Warm smile */}
      <path d="M 43 53 Q 48 56.5 53 53" stroke="#134227" strokeWidth="2.6" strokeLinecap="round" />
      {/* Headset band, mint earcup & mic */}
      <path d="M 27 42 C 27 19, 69 19, 69 42" stroke="#134227" strokeWidth="4" strokeLinecap="round" />
      <rect x="63" y="37" width="8" height="14" rx="4" fill="#75C78E" stroke="#134227" strokeWidth="3" />
      <path d="M 67 51 C 66 57, 59 58, 54 57" stroke="#134227" strokeWidth="3" strokeLinecap="round" />
      <circle cx="53" cy="57" r="2.6" fill="#F4C446" stroke="#134227" strokeWidth="2.2" />
    </svg>
  ),

  advisor: (props) => (
    <svg viewBox="0 0 96 96" fill="none" {...props}>
      {/* Head side profile facing right */}
      <path
        d="M 32 78 L 32 62 C 24 57, 20 48, 22 37 C 24 23, 35 16, 48 16 C 60 16, 68 23, 69 34 L 74 44 C 75 46, 73 48, 70 48 L 68 48 L 68 54 C 68 56, 66 58, 63 59 L 63 62 C 63 66, 59 69, 53 69 L 53 78"
        stroke="#134227"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Headset headband */}
      <path d="M 42 42 L 42 26 C 42 15, 56 13, 62 18" stroke="#134227" strokeWidth="4.5" strokeLinecap="round" />
      {/* Earcup */}
      <rect x="35" y="38" width="13" height="18" rx="6.5" stroke="#134227" strokeWidth="4.5" />
      {/* Boom microphone toward mouth */}
      <path d="M 45 55 C 50 61, 59 62, 66 60" stroke="#134227" strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  ),
};
