import React, { useMemo } from 'react'
import { VOWELS } from '../data/vowels'

function ipaToSvg(x, y, w, h, pad) {
  const topInset = w * 0.12
  const leftX = pad + topInset * x
  const rightX = pad + w - topInset * (1 - x)
  return { x: leftX + (rightX - leftX) * x, y: pad + y * h }
}

function findNearestVowel(px, py) {
  let minD = Infinity, best = null
  for (const v of VOWELS) {
    const d = Math.hypot(v.x - px, v.y - py)
    if (d < minD) { minD = d; best = v }
  }
  return best
}

export default function VowelMap({ player, target, distance, roundedMatch, captureRadius, voicing = 0 }) {
  const W = 500, H = 400, P = 50
  const iW = W - P * 2, iH = H - P * 2

  const vowelPos = useMemo(() => VOWELS.map(v => ({ ...v, svg: ipaToSvg(v.x, v.y, iW, iH, P) })), [iW, iH])
  const pSvg = ipaToSvg(player.x, player.y, iW, iH, P)
  const tSvg = ipaToSvg(target.x, target.y, iW, iH, P)
  const nearest = findNearestVowel(player.x, player.y)
  const prox = Math.max(0, 1 - distance / 0.6)
  const capR = captureRadius * iW

  const zoneColor = prox > 0.85 ? '#22c55e' : prox > 0.5 ? '#eab308' : '#f59e0b'
  const zoneOp = 0.2 + prox * 0.5

  const corners = [ipaToSvg(0,0,iW,iH,P), ipaToSvg(1,0,iW,iH,P), ipaToSvg(1,1,iW,iH,P), ipaToSvg(0,1,iW,iH,P)]
  const quad = corners.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ') + ' Z'

  const hLines = [0, 0.33, 0.67, 1].map(y => ({
    l: ipaToSvg(0, y, iW, iH, P), r: ipaToSvg(1, y, iW, iH, P),
    label: y === 0 ? 'Close' : y === 0.33 ? 'Mid' : y === 0.67 ? 'Open-mid' : 'Open',
  }))
  const vLines = [0, 0.5, 1].map(x => ({
    t: ipaToSvg(x, 0, iW, iH, P), b: ipaToSvg(x, 1, iW, iH, P),
    label: x === 0 ? 'Front' : x === 0.5 ? 'Central' : 'Back',
  }))

  return (
    <div className="w-full max-w-[500px] aspect-square relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="pGlow"><stop offset="0%" stopColor="#f472b6" stopOpacity="0.6" /><stop offset="100%" stopColor="#f472b6" stopOpacity="0" /></radialGradient>
          <radialGradient id="tGlow"><stop offset="0%" stopColor="#34d399" stopOpacity="0.4" /><stop offset="100%" stopColor="#34d399" stopOpacity="0" /></radialGradient>
          <filter id="glow"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id="softGlow"><feGaussianBlur stdDeviation="6" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id="bigGlow"><feGaussianBlur stdDeviation="10" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>

        <path d={quad} fill="#4f46e5" opacity="0.05" />
        <path d={quad} fill="none" stroke="#4f46e5" strokeWidth="1.5" opacity="0.4" />

        {hLines.map((l, i) => <line key={`h${i}`} x1={l.l.x} y1={l.l.y} x2={l.r.x} y2={l.r.y} stroke="#4f46e5" strokeWidth="0.5" opacity="0.2" strokeDasharray="4 4" />)}
        {vLines.map((l, i) => <line key={`v${i}`} x1={l.t.x} y1={l.t.y} x2={l.b.x} y2={l.b.y} stroke="#4f46e5" strokeWidth="0.5" opacity="0.2" strokeDasharray="4 4" />)}
        {hLines.map((l, i) => <text key={`hl${i}`} x={l.l.x - 8} y={l.l.y + 4} fill="#6b7280" fontSize="9" textAnchor="end" fontFamily="system-ui">{l.label}</text>)}
        {vLines.map((l, i) => <text key={`vl${i}`} x={l.t.x} y={l.t.y - 8} fill="#6b7280" fontSize="9" textAnchor="middle" fontFamily="system-ui">{l.label}</text>)}

        {/* Capture zone */}
        <circle cx={tSvg.x} cy={tSvg.y} r={capR} fill={zoneColor} opacity={zoneOp * 0.15} />
        <circle cx={tSvg.x} cy={tSvg.y} r={capR} fill="none" stroke={zoneColor} strokeWidth={prox > 0.7 ? 2 : 1} opacity={zoneOp} strokeDasharray={prox > 0.85 ? 'none' : '4 4'} />
        {prox > 0.7 && <circle cx={tSvg.x} cy={tSvg.y} r={capR * 1.3} fill="none" stroke={zoneColor} strokeWidth="1" opacity={0.2} />}

        {/* Target */}
        <circle cx={tSvg.x} cy={tSvg.y} r={30} fill="url(#tGlow)" filter="url(#softGlow)" />
        <circle cx={tSvg.x} cy={tSvg.y} r={14} fill="none" stroke="#34d399" strokeWidth="2" opacity="0.8" />
        <text x={tSvg.x} y={tSvg.y + 5} fill="#34d399" fontSize="16" fontWeight="bold" textAnchor="middle" fontFamily="system-ui">{target.ipa}</text>

        {/* Vowel dots */}
        {vowelPos.map((v, i) => {
          if (v.ipa === target.ipa) return null
          const isN = nearest?.ipa === v.ipa && voicing > 0.15
          return (
            <g key={i}>
              <circle cx={v.svg.x} cy={v.svg.y} r={isN ? 8 : v.rounded ? 6 : 5}
                fill={isN ? '#f472b6' : 'none'} fillOpacity={isN ? 0.2 : 0}
                stroke={isN ? '#f472b6' : '#6366f1'} strokeWidth={isN ? 1.5 : 1}
                opacity={isN ? 0.9 : 0.3} strokeDasharray={v.rounded && !isN ? 'none' : isN ? 'none' : '2 2'} />
              <text x={v.svg.x} y={v.svg.y + 3} fill={isN ? '#f9a8d4' : '#818cf8'}
                fontSize={isN ? '11' : '9'} fontWeight={isN ? 'bold' : 'normal'}
                textAnchor="middle" fontFamily="system-ui" opacity={isN ? 1 : 0.5}>{v.ipa}</text>
            </g>
          )
        })}

        {/* Connection line */}
        {voicing > 0.15 && (
          <line x1={pSvg.x} y1={pSvg.y} x2={tSvg.x} y2={tSvg.y}
            stroke={prox > 0.85 ? '#22c55e' : '#f472b6'} strokeWidth="1" opacity="0.35" strokeDasharray="6 4" />
        )}

        {/* Player */}
        {voicing > 0.05 && (
          <>
            <circle cx={pSvg.x} cy={pSvg.y} r={25 + voicing * 20} fill="url(#pGlow)" filter="url(#bigGlow)" />
            <circle cx={pSvg.x} cy={pSvg.y} r={10 + voicing * 4}
              fill="#f472b6" stroke={player.rounded ? '#ec4899' : '#f9a8d4'}
              strokeWidth={player.rounded ? 3 : 1.5} filter="url(#glow)" opacity="0.9" />
            {player.rounded
              ? <circle cx={pSvg.x} cy={pSvg.y} r={4} fill="none" stroke="white" strokeWidth="1.5" opacity="0.7" />
              : <line x1={pSvg.x - 4} y1={pSvg.y} x2={pSvg.x + 4} y2={pSvg.y} stroke="white" strokeWidth="1.5" opacity="0.7" />
            }
            {nearest && (
              <text x={pSvg.x} y={pSvg.y - 18 - voicing * 6}
                fill="#f9a8d4" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="system-ui" opacity="0.9">{nearest.ipa}</text>
            )}
          </>
        )}
      </svg>
    </div>
  )
}
