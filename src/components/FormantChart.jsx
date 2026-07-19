import React, { useMemo } from 'react'

const F1F2 = {
  i:[270,2290],y:[260,2100],e:[390,1990],ɛ:[530,1840],æ:[660,1720],a:[730,1090],
  ɨ:[300,1500],ʉ:[300,1400],ɘ:[400,1400],ɵ:[400,1300],ɜ:[500,1350],ɞ:[500,1250],
  u:[300,870],o:[420,1020],ɔ:[550,900],ɑ:[750,1100],ɒ:[750,950],
}

function toSvg(f1, f2, w, h, pad) {
  const f1Lo=220,f1Hi=850,f2Lo=750,f2Hi=2400
  const y=clamp((f1-f1Lo)/(f1Hi-f1Lo),0,1)
  const x=clamp(1-(f2-f2Lo)/(f2Hi-f2Lo),0,1)
  return { x: pad+x*(w-pad*2), y: pad+y*(h-pad*2) }
}

export default function FormantChart({ formants, voicing, target }) {
  const W=170,H=140,P=26
  const tS = useMemo(()=>{ const f=F1F2[target.ipa]; return f?toSvg(f[0],f[1],W,H,P):null },[target.ipa])
  const pS = formants[0]>0 ? toSvg(formants[0],formants[1],W,H,P) : null

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <defs><radialGradient id="fcG"><stop offset="0%" stopColor="#f472b6" stopOpacity="0.5" /><stop offset="100%" stopColor="#f472b6" stopOpacity="0" /></radialGradient></defs>
      <line x1={P} y1={P} x2={P} y2={H-P} stroke="#374151" strokeWidth="0.5" />
      <line x1={P} y1={H-P} x2={W-P} y2={H-P} stroke="#374151" strokeWidth="0.5" />
      <text x={P} y={P-6} fill="#6b7280" fontSize="7">Close↑</text>
      <text x={P} y={H-P+10} fill="#6b7280" fontSize="7">Open↓</text>
      <text x={P+4} y={H-P+17} fill="#6b7280" fontSize="6">Front</text>
      <text x={W-P} y={H-P+17} fill="#6b7280" fontSize="6" textAnchor="end">Back</text>
      {Object.entries(F1F2).map(([ipa,[f1,f2]])=>{
        const s=toSvg(f1,f2,W,H,P); const isT=ipa===target.ipa
        return <g key={ipa}>
          <circle cx={s.x} cy={s.y} r={isT?6:3} fill={isT?'#34d399':'#6366f1'} opacity={isT?0.85:0.4} />
          <text x={s.x} y={s.y-6} fill={isT?'#34d399':'#818cf8'} fontSize={isT?'8':'6'} fontWeight={isT?'bold':'normal'}
            textAnchor="middle" opacity={isT?1:0.55}>{ipa}</text>
        </g>
      })}
      {tS&&<circle cx={tS.x} cy={tS.y} r={14} fill="#34d399" opacity={0.12} />}
      {pS&&voicing>0.1&&<>
        <circle cx={pS.x} cy={pS.y} r={20} fill="url(#fcG)" />
        <circle cx={pS.x} cy={pS.y} r={6} fill="#f472b6" stroke="#ec4899" strokeWidth="1" opacity={0.9} />
        <circle cx={pS.x} cy={pS.y} r={2} fill="white" opacity={0.8} />
      </>}
      {pS&&tS&&voicing>0.1&&<line x1={pS.x} y1={pS.y} x2={tS.x} y2={tS.y} stroke="#f472b6" strokeWidth="0.5" opacity="0.35" strokeDasharray="2 2" />}
    </svg>
  )
}
function clamp(v,lo,hi){return Math.max(lo,Math.min(hi,v))}
