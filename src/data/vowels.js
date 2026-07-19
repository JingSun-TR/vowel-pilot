export const VOWELS = [
  { ipa: 'i', x: 0.0, y: 0.0, rounded: false, name: 'close front unrounded' },
  { ipa: 'y', x: 0.0, y: 0.0, rounded: true, name: 'close front rounded' },
  { ipa: 'e', x: 0.0, y: 0.33, rounded: false, name: 'close-mid front' },
  { ipa: 'ɛ', x: 0.0, y: 0.67, rounded: false, name: 'open-mid front' },
  { ipa: 'æ', x: 0.0, y: 0.85, rounded: false, name: 'near-open front' },
  { ipa: 'a', x: 0.0, y: 1.0, rounded: false, name: 'open front' },
  { ipa: 'ɨ', x: 0.5, y: 0.0, rounded: false, name: 'close central' },
  { ipa: 'ʉ', x: 0.5, y: 0.0, rounded: true, name: 'close central rounded' },
  { ipa: 'ɘ', x: 0.5, y: 0.33, rounded: false, name: 'close-mid central' },
  { ipa: 'ɵ', x: 0.5, y: 0.33, rounded: true, name: 'close-mid central rounded' },
  { ipa: 'ɜ', x: 0.5, y: 0.67, rounded: false, name: 'open-mid central' },
  { ipa: 'ɞ', x: 0.5, y: 0.67, rounded: true, name: 'open-mid central rounded' },
  { ipa: 'u', x: 1.0, y: 0.0, rounded: true, name: 'close back rounded' },
  { ipa: 'o', x: 1.0, y: 0.33, rounded: true, name: 'close-mid back' },
  { ipa: 'ɔ', x: 1.0, y: 0.67, rounded: true, name: 'open-mid back' },
  { ipa: 'ɑ', x: 1.0, y: 1.0, rounded: false, name: 'open back' },
  { ipa: 'ɒ', x: 1.0, y: 1.0, rounded: true, name: 'open back rounded' },
]

export const LEVELS = [
  { id: 1, target: 'i', hint: '舌を前上方に、口を少し開けて', timeLimit: 15 },
  { id: 2, target: 'u', hint: '舌を後上方に、唇を丸めて', timeLimit: 15 },
  { id: 3, target: 'a', hint: '舌を下に下げて、口を大きく開けて', timeLimit: 15 },
  { id: 4, target: 'e', hint: '舌を前に、口を半分開けて', timeLimit: 12 },
  { id: 5, target: 'o', hint: '舌を後ろに、唇を丸めて', timeLimit: 12 },
  { id: 6, target: 'ɛ', hint: '舌を前に、口をやや開けて', timeLimit: 12 },
  { id: 7, target: 'ɔ', hint: '舌を後ろに、口を大きく開けて', timeLimit: 10 },
  { id: 8, target: 'æ', hint: '舌を前下方に、口を広く開けて', timeLimit: 10 },
  { id: 9, target: 'y', hint: '「い」のように舌を前に、唇を丸めて', timeLimit: 10 },
  { id: 10, target: 'ɨ', hint: '舌を中央上方に、唇を広げて', timeLimit: 10 },
]
export function getVowelByIpa(ipa) { return VOWELS.find(v => v.ipa === ipa) }
