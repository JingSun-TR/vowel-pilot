import React from 'react'

export default function SpectrumBars({ spectrum, formants, voicing }) {
  if (!spectrum || spectrum.length === 0) return null
  const bars = spectrum.length
  const sr = 44100 / 2
  const binHz = sr / bars
  const minDb = -60, maxDb = -10
  const f1R = [200, 800], f2R = [800, 2500], f3R = [2500, 4000]

  return (
    <div className="flex items-end gap-px h-12 w-full" style={{ imageRendering: 'pixelated' }}>
      {Array.from(spectrum).map((db, i) => {
        const freq = i * binHz
        const h = Math.max(0, Math.min(1, (db - minDb) / (maxDb - minDb)))
        let color = '#4b5563'
        if (freq >= f1R[0] && freq < f1R[1]) color = '#818cf8'
        else if (freq >= f2R[0] && freq < f2R[1]) color = '#a78bfa'
        else if (freq >= f3R[0] && freq < f3R[1]) color = '#c084fc'
        const opacity = voicing > 0.15 ? 0.4 + h * 0.6 : 0.15
        return <div key={i} className="flex-1 rounded-t-sm transition-all duration-75"
          style={{ height: `${h * 100}%`, backgroundColor: color, opacity, minWidth: '1px' }} />
      })}
    </div>
  )
}
