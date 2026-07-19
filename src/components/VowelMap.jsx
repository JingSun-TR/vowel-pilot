import React, { useMemo } from 'react'
import { VOWELS } from '../data/vowels'

function ipaToSvg(x, y, w, h, pad) {
  const ti = w * 0.12
  const lx = pad + ti * x, rx = pad + w - ti * (1 - x)
  return { x: lx + (rx - lx) * x, y: pad + y * h }
}

function nearestVowel(px, py) {
  let best = null, minD = Infinity
  for (const v of VOWELS) { const d = Math.hypot(v.x-px, v.y-py); if (d < minD) { minD = d; best = v } }
  return best
}

export default function VowelMap({ player, target, distance, captureRadius, voicing = 0 }) {
  const W = 500, H = 400, P = 50, iW = W-P*2, iH = H-P*2
  const vPos = useMemo(() => VOWELS.map(v => ({ ...v, svg: ipaToSvg(v.x, v.y, iW, iH, P) })), [iW, iH])
  const pS = ipaToSvg(player.x, player.y, iW, iH, P)
  const tS = ipaToSvg(target.x, target.y, iW, iH, P)
  const near = nearestVowel(player.x, player.y)
  const prox = Math.max(0, 1 - distance / 0.6)
  const capR = captureRadius * iW
  const zC = prox > 0.85 ? '#22c55e' : prox > 0.5 ? '#eab308' : '#f59e0b'

  const corners = [ipaToSvg(0,0,iW,iH,P), ipaToSvg(1,0,iW,iH,P), ipaToSvg(1,1,iW,iH,P), ipaToSvg(0,1,iW,iH,P)]
  const quad = corners.map((c,i)=>`${i?'L':'M'}${c.x} ${c.y}`).join(' ')+' Z'
  const hL = [0,0.33,0.67,1].map(y=>({l:ipaToSvg(0,y,iW,iH,P),r:ipaToSvg(1,y,iW,iH,P),t:y===0?'Close':y===0.33?'Mid':y===0.67?'Open-mid':'Open'}))
  const vL = [0,0.5,1].map(x=>({t:ipaToSvg(x,0,iW,iH,P),b:ipaToSvg(x,1,iW,iH,P),t2:x===0?'Front':x===0.5?'Central':'Back'}))

  return (
    <div className="w-full max-w-[500px] aspect-square">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
        <defs>
          <radialGradient id="pG"><stop offset="0%" stopColor="#f472b6" stopOpacity="0.6" /><stop offset="100%" stopColor="#f472b6" stopOpacity="0" /></radialGradient>
          <radialGradient id="tG"><stop offset="0%" stopColor="#34d399" stopOpacity="0.4" /><stop offset="100%" stopColor="#34d399" stopOpacity="0" /></radialGradient>
          <filter id="gw"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id="sg"><feGaussianBlur stdDeviation="6" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id="bg"><feGaussianBlur stdDeviation="10" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <path d={quad} fill="#4f46e5" opacity="0.05" />
        <path d={quad} fill="none" stroke="#4f46e5" strokeWidth="1.5" opacity="0.4" />
        {hL.map((l,i)=><line key={`h${i}`} x1={l.l.x} y1={l.l.y} x2={l.r.x} y2={l.r.y} stroke="#4f46e5" strokeWidth="0.5" opacity="0.2" strokeDasharray="4 4" />)}
        {vL.map((l,i)=><line key={`v${i}`} x1={l.t.x} y1={l.t.y} x2={l.b.x} y2={l.b.y} stroke="#4f46e5" strokeWidth="0.5" opacity="0.2" strokeDasharray="4 4" />)}
        {hL.map((l,i)=><text key={`hl${i}`} x={l.l.x-8} y={l.l.y+4} fill="#6b7280" fontSize="9" textAnchor="end">{l.t}</text>)}
        {vL.map((l,i)=><text key={`vl${i}`} x={l.t.x} y={l.t.y-8} fill="#6b7280" fontSize="9" textAnchor="middle">{l.t2}</text>)}
        <circle cx={tS.x} cy={tS.y} r={capR} fill={zC} opacity={(0.2+prox*0.5)*0.15} />
        <circle cx={tS.x} cy={tS.y} r={capR} fill="none" stroke={zC} strokeWidth={prox>0.7?2:1} opacity={0.2+prox*0.5} strokeDasharray={prox>0.85?'none':'4 4'} />
        <circle cx={tS.x} cy={tS.y} r={30} fill="url(#tG)" filter="url(#sg)" />
        <circle cx={tS.x} cy={tS.y} r={14} fill="none" stroke="#34d399" strokeWidth="2" opacity="0.8" />
        <text x={tS.x} y={tS.y+5} fill="#34d399" fontSize="16" fontWeight="bold" textAnchor="middle">{target.ipa}</text>
        {vPos.map((v,i)=>{
          if(v.ipa===target.ipa) return null
          const isN=near?.ipa===v.ipa&&voicing>0.15
          return <g key={i}>
            <circle cx={v.svg.x} cy={v.svg.y} r={isN?8:v.rounded?6:5} fill={isN?'#f472b6':'none'} fillOpacity={isN?0.2:0}
              stroke={isN?'#f472b6':'#6366f1'} strokeWidth={isN?1.5:1} opacity={isN?0.9:0.3}
              strokeDasharray={v.rounded&&!isN?'none':isN?'none':'2 2'} />
            <text x={v.svg.x} y={v.svg.y+3} fill={isN?'#f9a8d4':'#818cf8'} fontSize={isN?'11':'9'} fontWeight={isN?'bold':'normal'}
              textAnchor="middle" opacity={isN?1:0.5}>{v.ipa}</text>
          </g>
        })}
        {voicing>0.15&&<line x1={pS.x} y1={pS.y} x2={tS.x} y2={tS.y} stroke={prox>0.85?'#22c55e':'#f472b6'} strokeWidth="1" opacity="0.35" strokeDasharray="6 4" />}
        {voicing>0.05&&<>
          <circle cx={pS.x} cy={pS.y} r={25+voicing*20} fill="url(#pG)" filter="url(#bg)" />
          <circle cx={pS.x} cy={pS.y} r={10+voicing*4} fill="#f472b6" stroke={player.rounded?'#ec4899':'#f9a8d4'}
            strokeWidth={player.rounded?3:1.5} filter="url(#gw)" opacity="0.9" />
          {player.rounded
            ?<circle cx={pS.x} cy={pS.y} r={4} fill="none" stroke="white" strokeWidth="1.5" opacity="0.7" />
            :<line x1={pS.x-4} y1={pS.y} x2={pS.x+4} y2={pS.y} stroke="white" strokeWidth="1.5" opacity="0.7" />}
          {near&&<text x={pS.x} y={pS.y-18-voicing*6} fill="#f9a8d4" fontSize="11" fontWeight="bold" textAnchor="middle" opacity="0.9">{near.ipa}</text>}
        </>}
      </svg>
    </div>
  )
}
