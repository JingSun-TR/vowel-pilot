import React, { useMemo } from 'react'
import { VOWELS } from '../data/vowels'

// Empirical F1/F2 values for each vowel (Peterson & Barney 1952, Hillenbrand 1995 averages)
const F1F2 = {
  i: [270, 2290], y: [260, 2100], e: [390, 1990],
  ɛ: [530, 1840], æ: [660, 1720], a: [730, 1090],
  ɨ: [300, 1500], ʉ: [300, 1400], ɘ: [400, 1400],
  ɵ: [400, 1300], ɜ: [500, 1350], ɞ: [500, 1250],
  u: [300, 870], o: [420, 1020], ɔ: [550, 900],
  ɑ: [750, 1100], ɒ: [750, 950],
}

// Map F1/F2 to SVG using same log-scale as AudioEngine
function f1f2ToSvg(f1, f2, w, h, pad) {
  const f1Close = 250, f1Open = 850
  const f2Front = 2400, f2Back = 750
  const ny = clamp((Math.log2(Math.max(f1, 200)) - Math.log2(f1Close)) / (Math.log2(f1Open) - Math.log2(f1Close)), 0, 1)
  const nx = clamp(1 - (Math.log2(Math.max(f2, 200)) - Math.log2(f2Back)) / (Math.log2(f2Front) - Math.log2(f2Back)), 0, 1)
  return { x: pad + nx * (w - pad * 2), y: pad + ny * (h - pad * 2) }
}

export default function FormantChart({ formants, player, target, voicing }) {
  const w = 170, h = 140, pad = 26

  const targetSvg = useMemo(() => {
    const f = F1F2[target.ipa]
    return f ? f1f2ToSvg(f[0], f[1], w, h, pad) : null
  }, [target.ipa])

  const playerSvg = formants[0] > 0
    ? f1f2ToSvg(formants[0], formants[1], w, h, pad)
    : null

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="fcGlow">
          <stop offset="0%" stopColor="#f472b6" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#f472b6" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Axes */}
      <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="#374151" strokeWidth="0.5" />
      <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#374151" strokeWidth="0.5" />

      {/* Axis labels */}
      <text x={pad} y={pad - 6} fill="#6b7280" fontSize="7" fontFamily="system-ui">
        Close ↑
      </text>
      <text x={pad} y={h - pad + 10} fill="#6b7280" fontSize="7" fontFamily="system-ui">
        Open ↓
      </text>
      <text x={pad} y={h - pad + 18} fill="#6b7280" fontSize="7" fontFamily="system-ui">
        Front
      </text>
      <text x={w - pad} y={h - pad + 18} fill="#6b7280" fontSize="7" textAnchor="end" fontFamily="system-ui">
        Back
      </text>

      {/* All vowel reference positions */}
      {Object.entries(F1F2).map(([ipa, [f1, f2]]) => {
        const pos = f1f2ToSvg(f1, f2, w, h, pad)
        const isTarget = ipa === target.ipa
        return (
          <g key={ipa}>
            <circle cx={pos.x} cy={pos.y} r={isTarget ? 6 : 3}
              fill={isTarget ? '#34d399' : '#6366f1'}
              opacity={isTarget ? 0.85 : 0.4} />
            <text x={pos.x} y={pos.y - 6}
              fill={isTarget ? '#34d399' : '#818cf8'}
              fontSize={isTarget ? '8' : '6'}
              fontWeight={isTarget ? 'bold' : 'normal'}
              textAnchor="middle" fontFamily="system-ui"
              opacity={isTarget ? 1 : 0.55}>
              {ipa}
            </text>
          </g>
        )
      })}

      {/* Target glow */}
      {targetSvg && (
        <circle cx={targetSvg.x} cy={targetSvg.y} r={14} fill="#34d399" opacity={0.12} />
      )}

      {/* Player position */}
      {playerSvg && voicing > 0.1 && (
        <>
          <circle cx={playerSvg.x} cy={playerSvg.y} r={20} fill="url(#fcGlow)" />
          <circle cx={playerSvg.x} cy={playerSvg.y} r={6}
            fill="#f472b6" stroke="#ec4899" strokeWidth="1" opacity={0.9} />
          <circle cx={playerSvg.x} cy={playerSvg.y} r={2}
            fill="white" opacity={0.8} />
        </>
      )}

      {/* Connection line */}
      {playerSvg && targetSvg && voicing > 0.1 && (
        <line x1={playerSvg.x} y1={playerSvg.y} x2={targetSvg.x} y2={targetSvg.y}
          stroke="#f472b6" strokeWidth="0.5" opacity="0.35" strokeDasharray="2 2" />
      )}
    </svg>
  )
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)) }
