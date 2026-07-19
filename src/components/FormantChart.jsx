import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { VOWELS } from '../data/vowels'

// F1/F2 → SVG coordinates (log scale, reversed axes)
function f1f2ToSvg(f1, f2, w, h, pad) {
  const f1Min = 200, f1Max = 900
  const f2Min = 700, f2Max = 2600
  const logMin1 = Math.log2(f1Min), logMax1 = Math.log2(f1Max)
  const logMin2 = Math.log2(f2Min), logMax2 = Math.log2(f2Max)
  const nf2 = clamp((Math.log2(f2) - logMin2) / (logMax2 - logMin2), 0, 1)
  const nf1 = clamp((Math.log2(f1) - logMin1) / (logMax1 - logMin1), 0, 1)
  return { x: pad + nf2 * (w - pad * 2), y: pad + nf1 * (h - pad * 2) }
}

// Empirical F1/F2 for display vowels
const VOWEL_FORMANTS = {
  i: [270, 2300], y: [270, 2100], e: [390, 1990],
  ɛ: [530, 1840], æ: [660, 1720], a: [730, 1090],
  ɨ: [300, 1500], ʉ: [300, 1400], ɘ: [400, 1400],
  ɵ: [400, 1300], ɜ: [500, 1350], ɞ: [500, 1250],
  u: [300, 870], o: [420, 1020], ɔ: [550, 900],
  ɑ: [750, 1100], ɒ: [750, 950],
}

export default function FormantChart({ formants, player, target, voicing }) {
  const w = 160, h = 130, pad = 22

  const targetSvg = useMemo(() => {
    const vf = VOWEL_FORMANTS[target.ipa]
    return vf ? f1f2ToSvg(vf[0], vf[1], w, h, pad) : null
  }, [target.ipa])

  const playerSvg = formants[0] > 0
    ? f1f2ToSvg(formants[0], formants[1], w, h, pad)
    : null

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="fc-glow">
            <stop offset="0%" stopColor="#f472b6" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#f472b6" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Axes */}
        <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="#4b5563" strokeWidth="0.5" />
        <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#4b5563" strokeWidth="0.5" />

        {/* Axis labels */}
        <text x={pad - 2} y={pad - 4} fill="#6b7280" fontSize="6" textAnchor="start" fontFamily="system-ui">Close(F1↓)</text>
        <text x={pad - 2} y={h - pad + 8} fill="#6b7280" fontSize="6" textAnchor="start" fontFamily="system-ui">Open</text>
        <text x={pad} y={h - pad + 8} fill="#6b7280" fontSize="6" textAnchor="start" fontFamily="system-ui">Front(F2→)</text>
        <text x={w - pad} y={h - pad + 8} fill="#6b7280" fontSize="6" textAnchor="end" fontFamily="system-ui">Back</text>

        {/* Vowel reference dots */}
        {Object.entries(VOWEL_FORMANTS).map(([ipa, [f1, f2]]) => {
          const pos = f1f2ToSvg(f1, f2, w, h, pad)
          const isTarget = ipa === target.ipa
          return (
            <g key={ipa}>
              <circle cx={pos.x} cy={pos.y} r={isTarget ? 5 : 2.5}
                fill={isTarget ? '#34d399' : '#6366f1'}
                opacity={isTarget ? 0.8 : 0.35}
              />
              <text x={pos.x} y={pos.y - 5} fill={isTarget ? '#34d399' : '#818cf8'}
                fontSize={isTarget ? "7" : "5"} fontWeight={isTarget ? "bold" : "normal"}
                textAnchor="middle" fontFamily="system-ui"
                opacity={isTarget ? 1 : 0.5}
              >
                {ipa}
              </text>
            </g>
          )
        })}

        {/* Target glow */}
        {targetSvg && (
          <circle cx={targetSvg.x} cy={targetSvg.y} r={12}
            fill="#34d399" opacity={0.15} />
        )}

        {/* Player trail glow */}
        {playerSvg && voicing > 0.15 && (
          <>
            <circle cx={playerSvg.x} cy={playerSvg.y} r={18}
              fill="url(#fc-glow)" />
            <circle cx={playerSvg.x} cy={playerSvg.y} r={5}
              fill="#f472b6" opacity={0.8} />
            <circle cx={playerSvg.x} cy={playerSvg.y} r={2}
              fill="white" opacity={0.9} />
          </>
        )}

        {/* Connection line */}
        {playerSvg && targetSvg && voicing > 0.15 && (
          <line x1={playerSvg.x} y1={playerSvg.y} x2={targetSvg.x} y2={targetSvg.y}
            stroke="#f472b6" strokeWidth="0.5" opacity="0.4" strokeDasharray="2 2" />
        )}
      </svg>

      {/* F1/F2 value overlay */}
      <div className="absolute bottom-0 right-0 text-right">
        <div className="text-[9px] font-mono text-indigo-300/70">
          F1 {formants[0]?.toFixed(0) || '—'}
        </div>
        <div className="text-[9px] font-mono text-purple-300/70">
          F2 {formants[1]?.toFixed(0) || '—'}
        </div>
      </div>
    </div>
  )
}

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)) }
