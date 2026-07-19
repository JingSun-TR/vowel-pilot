import React from 'react'

// Live frequency spectrum bar visualization
// Maps FFT bins to colored bars, highlights formant regions
export default function SpectrumBars({ spectrum, formants, voicing }) {
  if (!spectrum || spectrum.length === 0) return null

  const bars = spectrum.length
  const barW = 2 / bars * 100
  const sr = 44100 / 2 // approx nyquist
  const binHz = sr / bars

  // Convert dB to 0-1 normalized height
  const minDb = -60, maxDb = -10

  // Formant frequency ranges for color highlighting
  const f1Range = [200, 800]
  const f2Range = [800, 2500]
  const f3Range = [2500, 4000]

  return (
    <div className="flex items-end gap-px h-12 w-full" style={{ imageRendering: 'pixelated' }}>
      {Array.from(spectrum).map((db, i) => {
        const freq = i * binHz
        const h = Math.max(0, Math.min(1, (db - minDb) / (maxDb - minDb)))

        // Color by frequency band
        let color = '#4b5563' // default gray
        if (freq >= f1Range[0] && freq < f1Range[1]) color = '#818cf8' // indigo for F1
        else if (freq >= f2Range[0] && freq < f2Range[1]) color = '#a78bfa' // purple for F2
        else if (freq >= f3Range[0] && freq < f3Range[1]) color = '#c084fc' // violet for F3

        // Dim if no voicing
        const opacity = voicing > 0.15 ? 0.4 + h * 0.6 : 0.15

        return (
          <div
            key={i}
            className="flex-1 rounded-t-sm transition-all duration-75"
            style={{
              height: `${h * 100}%`,
              backgroundColor: color,
              opacity,
              minWidth: '1px',
            }}
          />
        )
      })}
    </div>
  )
}
