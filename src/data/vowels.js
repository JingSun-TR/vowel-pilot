// IPA vowel data with articulatory features
// Coordinates: x = backness (0=front, 1=back), y = height (0=close, 1=open)
// rounded: whether lips are rounded

export const VOWELS = [
  // Front vowels
  { ipa: 'i', label: 'い', name: 'close front unrounded', x: 0.0, y: 0.0, rounded: false, examples: ['fleece', 'seat'] },
  { ipa: 'y', label: 'Ü', name: 'close front rounded', x: 0.0, y: 0.0, rounded: true, examples: ['French lune'] },
  { ipa: 'e', label: 'え', name: 'close-mid front unrounded', x: 0.0, y: 0.33, rounded: false, examples: ['dress', 'set'] },
  { ipa: 'ɛ', label: 'ェ', name: 'open-mid front unrounded', x: 0.0, y: 0.67, rounded: false, examples: ['trap', 'bed'] },
  { ipa: 'æ', label: 'ア', name: 'near-open front unrounded', x: 0.0, y: 0.85, rounded: false, examples: ['cat', 'bat'] },
  { ipa: 'a', label: 'あ', name: 'open front unrounded', x: 0.0, y: 1.0, rounded: false, examples: ['Japanese あ'] },

  // Central vowels
  { ipa: 'ɨ', label: 'Ψ', name: 'close central unrounded', x: 0.5, y: 0.0, rounded: false, examples: ['Russian ы'] },
  { ipa: 'ʉ', label: 'Υ', name: 'close central rounded', x: 0.5, y: 0.0, rounded: true, examples: ['Swedish]'] },
  { ipa: 'ɘ', label: 'ə', name: 'close-mid central unrounded', x: 0.5, y: 0.33, rounded: false, examples: ['commA'] },
  { ipa: 'ɵ', label: 'Θ', name: 'close-mid central rounded', x: 0.5, y: 0.33, rounded: true, examples: ['French peur'] },
  { ipa: 'ɜ', label: 'З', name: 'open-mid central unrounded', x: 0.5, y: 0.67, rounded: false, examples: ['nurse', 'bird'] },
  { ipa: 'ɞ', label: 'ɞ', name: 'open-mid central rounded', x: 0.5, y: 0.67, rounded: true, examples: ['Irish'] },

  // Back vowels
  { ipa: 'u', label: 'う', name: 'close back rounded', x: 1.0, y: 0.0, rounded: true, examples: ['goose', 'food'] },
  { ipa: 'o', label: 'お', name: 'close-mid back rounded', x: 1.0, y: 0.33, rounded: true, examples: ['goat', 'home'] },
  { ipa: 'ɔ', label: 'オ', name: 'open-mid back rounded', x: 1.0, y: 0.67, rounded: true, examples: ['thought', 'caught'] },
  { ipa: 'ɑ', label: 'ɑ', name: 'open back unrounded', x: 1.0, y: 1.0, rounded: false, examples: ['palm', 'father'] },
  { ipa: 'ɒ', label: 'ɒ', name: 'open back rounded', x: 1.0, y: 1.0, rounded: true, examples: ['British lot'] },
]

// Levels: each level has a target vowel and optional hints
export const LEVELS = [
  {
    id: 1,
    target: 'i',
    hint: '舌を前上方に、口を少し開けて',
    hintEn: 'Tongue forward & high, mouth slightly open',
    timeLimit: 15,
  },
  {
    id: 2,
    target: 'u',
    hint: '舌を後上方に、唇を丸めて',
    hintEn: 'Tongue back & high, round your lips',
    timeLimit: 15,
  },
  {
    id: 3,
    target: 'a',
    hint: '舌を下に下げて、口を大きく開けて',
    hintEn: 'Drop your tongue low, open mouth wide',
    timeLimit: 15,
  },
  {
    id: 4,
    target: 'e',
    hint: '舌を前に、口を半分開けて',
    hintEn: 'Tongue forward, half-open mouth',
    timeLimit: 12,
  },
  {
    id: 5,
    target: 'o',
    hint: '舌を後ろに、唇を丸めて',
    hintEn: 'Tongue back, round your lips',
    timeLimit: 12,
  },
  {
    id: 6,
    target: 'ɛ',
    hint: '舌を前に、口をやや開けて',
    hintEn: 'Tongue forward, open a bit more',
    timeLimit: 12,
  },
  {
    id: 7,
    target: 'ɔ',
    hint: '舌を後ろに、口を大きく開けて',
    hintEn: 'Tongue back, open mouth wide',
    timeLimit: 10,
  },
  {
    id: 8,
    target: 'æ',
    hint: '舌を前下方に、口を広く開けて',
    hintEn: 'Tongue forward-down, open wide',
    timeLimit: 10,
  },
  {
    id: 9,
    target: 'y',
    hint: '「い」のように舌を前に、唇を丸めて',
    hintEn: 'Like 「い」 but round your lips',
    timeLimit: 10,
  },
  {
    id: 10,
    target: 'ɨ',
    hint: '舌を中央上方に、唇を広げて',
    hintEn: 'Tongue center-high, lips spread',
    timeLimit: 10,
  },
]

export function getVowelByIpa(ipa) {
  return VOWELS.find(v => v.ipa === ipa)
}

export function distance(a, b) {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}
