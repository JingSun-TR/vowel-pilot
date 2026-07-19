import React, { useMemo } from 'react'
import { VOWELS, getVowelByIpa } from '../data/vowels'

// IPA trapezoid mapping
function ipaToSvg(x, y, w, h, pad) {
  const topInset = w * 0.12
  const leftX = pad + topInset * x
  const rightX = pad + w - topInset * (1 - x)
  const svgX = leftX + (rightX - leftX) * x
  const svgY = pad + y * h
  return { x: svgX, y: svgY }
}

// Find nearest vowel to current position
function findNearestVowel(px, py) {
  let minDist = Infinity, nearest = null
  for (const v of VOWELS) {
    const d = Math.hypot(v.x - px, v.y - py)
    if (d < minDist) { minDist = d; nearest = v }
  }
  return nearest
}

export default function VowelMap({ player, target, distance, roundedMatch, captureRadius, voicing = 0 }) {
  const mapW = 500
  const mapH = 400
  const pad = 50
  const innerW = mapW - pad * 2
  const innerH = mapH - pad * 2

  const vowelPositions = useMemo(() =>
    VOWELS.map(v => ({ ...v, svg: ipaToSvg(v.x, v.y, innerW, innerH, pad) })),
    [innerW, innerH]
  )

  const playerSvg = ipaToSvg(player.x, player.y, innerW, innerH, pad)
  const targetSvg = ipaToSvg(target.x, target.y, innerW, innerH, pad)

  const nearest = findNearestVowel(player.x, player.y)
  const proximity = Math.max(0, 1 - distance / 0.6)
  const captureR = captureRadius * innerW

  // Proximity-based capture zone color
  const zoneColor = proximity > 0.85 ? '#22c55e' : proximity > 0.5 ? '#eab308' : '#f59e0b'
  const zoneOpacity = 0.2 + proximity * 0.5

  // Trapezoid
  const corners = [
    ipaToSvg(0, 0, innerW, innerH, pad),
    ipaToSvg(1, 0, innerW, innerH, pad),
    ipaToSvg(1, 1, innerW, innerH, pad),
    ipaToSvg(0, 1, innerW, innerH, pad),
  ]
  const quadPath = corners.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ') + ' Z'

  const hLines = [0, 0.33, 0.67, 1].map(y => ({
    left: ipaToSvg(0, y, innerW, innerH, pad),
    right: ipaToSvg(1, y, innerW, innerH, pad),
    label: y === 0 ? 'Close' : y === 0.33 ? 'Mid' : y === 0.67 ? 'Open-mid' : 'Open',
  }))
  const vLines = [0, 0.5, 1].map(x => ({
    top: ipaToSvg(x, 0, innerW, innerH, pad),
    bottom: ipaToSvg(x, 1, innerW, innerH, pad),
    label: x === 0 ? 'Front' : x === 0.5 ? 'Central' : 'Back',
  }))

  return (
    <div className="w-full max-w-[500px] aspect-square relative">
      <svg viewBox={`0 0 ${mapW} ${mapH}`} className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="playerGlow">
            <stop offset="0%" stopColor="#f472b6" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#f472b6" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="targetGlow">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="bigGlow">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Quadrilateral */}
        <path d={quadPath} fill="#4f46e5" opacity="0.05" />
        <path d={quadPath} fill="none" stroke="#4f46e5" strokeWidth="1.5" opacity="0.4" />

        {/* Grid */}
        {hLines.map((l, i) => (
          <line key={`h${i}`} x1={l.left.x} y1={l.left.y} x2={l.right.x} y2={l.right.y}
            stroke="#4f46e5" strokeWidth="0.5" opacity="0.2" strokeDasharray="4 4" />
        ))}
        {vLines.map((l, i) => (
          <line key={`v${i}`} x1={l.top.x} y1={l.top.y} x2={l.bottom.x} y2={l.bottom.y}
            stroke="#4f46e5" strokeWidth="0.5" opacity="0.2" strokeDasharray="4 4" />
        ))}
        {hLines.map((l, i) => (
          <text key={`hl${i}`} x={l.left.x - 8} y={l.left.y + 4}
            fill="#6b7280" fontSize="9" textAnchor="end" fontFamily="system-ui">{l.label}</text>
        ))}
        {vLines.map((l, i) => (
          <text key={`vl${i}`} x={l.top.x} y={l.top.y - 8}
            fill="#6b7280" fontSize="9" textAnchor="middle" fontFamily="system-ui">{l.label}</text>
        ))}

        {/* Capture zone — dynamic color + pulse based on proximity */}
        <circle cx={targetSvg.x} cy={targetSvg.y} r={captureR}
          fill={zoneColor} opacity={zoneOpacity * 0.15} />
        <circle cx={targetSvg.x} cy={targetSvg.y} r={captureR}
          fill="none" stroke={zoneColor} strokeWidth={proximity > 0.7 ? 2 : 1}
          opacity={zoneOpacity} strokeDasharray={proximity > 0.85 ? 'none' : '4 4'} />
        {proximity > 0.7 && (
          <circle cx={targetSvg.x} cy={targetSvg.y} r={captureR * 1.3}
            fill="none" stroke={zoneColor} strokeWidth="1" opacity={0.2} />
        )}

        {/* Target glow + label */}
        <circle cx={targetSvg.x} cy={targetSvg.y} r={30} fill="url(#targetGlow)" filter="url(#softGlow)" />
        <circle cx={targetSvg.x} cy={targetSvg.y} r={14}
          fill="none" stroke="#34d399" strokeWidth="2" opacity="0.8" />
        <text x={targetSvg.x} y={targetSvg.y + 5}
          fill="#34d399" fontSize="16" fontWeight="bold" textAnchor="middle" fontFamily="system-ui">
          {target.ipa}
        </text>

        {/* All vowel dots */}
        {vowelPositions.map((v, i) => {
          const isTarget = v.ipa === target.ipa
          const isNearest = nearest?.ipa === v.ipa && voicing > 0.15
          if (isTarget) return null
          return (
            <g key={i}>
              <circle cx={v.svg.x} cy={v.svg.y}
                r={isNearest ? 8 : v.rounded ? 6 : 5}
                fill={isNearest ? '#f472b6' : 'none'}
                fillOpacity={isNearest ? 0.2 : 0}
                stroke={isNearest ? '#f472b6' : '#6366f1'}
                strokeWidth={isNearest ? 1.5 : 1}
                opacity={isNearest ? 0.9 : 0.3}
                strokeDasharray={v.rounded && !isNearest ? 'none' : isNearest ? 'none' : '2 2'} />
              <text x={v.svg.x} y={v.svg.y + (isNearest ? 3 : 3.5)}
                fill={isNearest ? '#f9a8d4' : '#818cf8'}
                fontSize={isNearest ? '11' : '9'} fontWeight={isNearest ? 'bold' : 'normal'}
                textAnchor="middle" fontFamily="system-ui"
                opacity={isNearest ? 1 : 0.5}>{v.ipa}</text>
            </g>
          )
        })}

        {/* Connection line */}
        {voicing > 0.15 && (
          <line x1={playerSvg.x} y1={playerSvg.y} x2={targetSvg.x} y2={targetSvg.y}
            stroke={proximity > 0.85 ? '#22c55e' : '#f472b6'} strokeWidth="1"
            opacity="0.35" strokeDasharray="6 4" />
        )}

        {/* Player — size and glow scale with voicing */}
        {voicing > 0.05 && (
          <>
            <circle cx={playerSvg.x} cy={playerSvg.y} r={25 + voicing * 20}
              fill="url(#playerGlow)" filter="url(#bigGlow)" />
            <circle cx={playerSvg.x} cy={playerSvg.y} r={10 + voicing * 4}
              fill="#f472b6" stroke={player.rounded ? '#ec4899' : '#f9a8d4'}
              strokeWidth={player.rounded ? 3 : 1.5} filter="url(#glow)" opacity="0.9" />
            {player.rounded ? (
              <circle cx={playerSvg.x} cy={playerSvg.y} r={4}
                fill="none" stroke="white" strokeWidth="1.5" opacity="0.7" />
            ) : (
              <line x1={playerSvg.x - 4} y1={playerSvg.y} x2={playerSvg.x + 4} y2={playerSvg.y}
                stroke="white" strokeWidth="1.5" opacity="0.7" />
            )}
            {/* Nearest vowel label floating above player */}
            {nearest && (
              <text x={playerSvg.x} y={playerSvg.y - 18 - voicing * 6}
                fill="#f9a8d4" fontSize="11" fontWeight="bold" textAnchor="middle"
                fontFamily="system-ui" opacity="0.9">
                {nearest.ipa}
              </text>
            )}
          </>
        )}
      </svg>
    </div>
  )
}
