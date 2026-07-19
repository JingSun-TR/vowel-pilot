// Real-time vowel detection via microphone + Web Audio API
// Proper formant extraction: F0 (autocorrelation) → harmonic-informed peak search → F1/F2/F3

export class AudioEngine {
  constructor() {
    this.audioCtx = null
    this.analyser = null
    this.source = null
    this.stream = null
    this.fftSize = 4096
    this.freqData = null
    this.timeData = null
    this.running = false
    this._prevF = [0, 0, 0]
  }

  async start() {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: true }
    })
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    this.analyser = this.audioCtx.createAnalyser()
    this.analyser.fftSize = this.fftSize
    this.analyser.smoothingTimeConstant = 0.6
    this.source = this.audioCtx.createMediaStreamSource(this.stream)
    this.source.connect(this.analyser)
    this.freqData = new Float32Array(this.analyser.frequencyBinCount)
    this.timeData = new Float32Array(this.analyser.fftSize)
    this.running = true
  }

  stop() {
    this.running = false
    if (this.stream) this.stream.getTracks().forEach(t => t.stop())
    if (this.audioCtx) this.audioCtx.close()
  }

  detect() {
    if (!this.running || !this.analyser) return null

    this.analyser.getFloatFrequencyData(this.freqData)
    this.analyser.getFloatTimeDomainData(this.timeData)

    const rms = this._rms(this.timeData)
    if (rms < 0.008) {
      return { x: 0.5, y: 0.5, rounded: false, voicing: 0, f0: 0, formants: [0, 0, 0], spectrum: this._spectrum() }
    }

    const sr = this.audioCtx.sampleRate
    const nyquist = sr / 2
    const nBins = this.freqData.length
    const binHz = nyquist / nBins

    // Step 1: detect F0 (fundamental frequency) via autocorrelation
    const f0 = this._detectF0(this.timeData, sr)

    // Step 2: Gaussian-smooth the magnitude spectrum
    const mag = new Float32Array(nBins)
    for (let i = 0; i < nBins; i++) mag[i] = this.freqData[i]
    const smoothed = this._gaussianSmooth(mag, 5)

    // Step 3: formant search — find peaks in expected formant bands
    // Use harmonic-informed search: F1 is above F0, F2 above F1+150, etc.
    const f1 = this._findFormantInBand(smoothed, binHz, f0 * 1.5, f0 * 8, 250)
    const f2 = this._findFormantInBand(smoothed, binHz, f1 + 150, 2800, 200)
    const f3 = this._findFormantInBand(smoothed, binHz, f2 + 150, 4000, 200)

    // Smooth formant tracks (IIR lowpass)
    const sf = [
      this._smooth(f1, this._prevF[0], 0.4),
      this._smooth(f2, this._prevF[1], 0.4),
      this._smooth(f3, this._prevF[2], 0.4),
    ]
    this._prevF = [...sf]

    const { x, y, rounded } = this._mapToVowel(sf[0], sf[1])

    return {
      x, y, rounded,
      voicing: Math.min(1, rms * 6),
      f0,
      formants: sf,
      spectrum: this._spectrum(),
    }
  }

  // ─── F0 via autocorrelation ───
  _detectF0(buf, sr) {
    const minLag = Math.floor(sr / 500)  // 500 Hz max
    const maxLag = Math.floor(sr / 60)   // 60 Hz min
    let bestCorr = -1, bestLag = minLag

    for (let lag = minLag; lag <= Math.min(maxLag, buf.length / 2); lag++) {
      let corr = 0, n = 0
      for (let i = 0; i < buf.length - lag; i++) {
        corr += buf[i] * buf[i + lag]
        n++
      }
      corr /= n
      if (corr > bestCorr) { bestCorr = corr; bestLag = lag }
    }

    // Refine with parabolic interpolation
    if (bestLag > minLag && bestLag < maxLag) {
      const c0 = this._autocorr(buf, bestLag - 1)
      const c1 = this._autocorr(buf, bestLag)
      const c2 = this._autocorr(buf, bestLag + 1)
      const d = 0.5 * (c0 - c2) / (c0 - 2 * c1 + c2)
      if (isFinite(d)) bestLag += d
    }

    return bestCorr > 0.1 ? sr / bestLag : 150 // fallback 150 Hz
  }

  _autocorr(buf, lag) {
    let corr = 0
    for (let i = 0; i < buf.length - lag; i++) corr += buf[i] * buf[i + lag]
    return corr / (buf.length - lag)
  }

  // ─── Find strongest peak in a frequency band ───
  _findFormantInBand(smoothed, binHz, fLow, fHigh, minWidthHz) {
    const minBin = Math.max(1, Math.floor(fLow / binHz))
    const maxBin = Math.min(smoothed.length - 2, Math.floor(fHigh / binHz))
    const halfWidth = Math.max(1, Math.floor(minWidthHz / binHz / 2))

    let bestBin = minBin, bestMag = -Infinity

    for (let i = minBin; i <= maxBin; i++) {
      // Must be a local max within ±halfWidth
      let isMax = true
      for (let d = 1; d <= halfWidth; d++) {
        if (smoothed[i] <= smoothed[i - d] || smoothed[i] <= smoothed[i + d]) {
          isMax = false; break
        }
      }
      if (isMax && smoothed[i] > bestMag) {
        bestMag = smoothed[i]; bestBin = i
      }
    }

    // Parabolic interpolation
    if (bestBin > 1 && bestBin < smoothed.length - 2) {
      const a = smoothed[bestBin - 1], b = smoothed[bestBin], c = smoothed[bestBin + 1]
      const denom = a - 2 * b + c
      if (denom !== 0 && a > -80) {
        const p = 0.5 * (a - c) / denom
        return (bestBin + p) * binHz
      }
    }
    return bestBin * binHz
  }

  // ─── Helpers ───
  _rms(buf) {
    let s = 0
    for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i]
    return Math.sqrt(s / buf.length)
  }

  _smooth(raw, prev, a) { return prev === 0 ? raw : prev + (raw - prev) * a }

  _gaussianSmooth(arr, r) {
    const out = new Float32Array(arr.length)
    const sigma = r / 2.5
    const k = [], ks = Array.from({ length: 2 * r + 1 }, (_, i) => {
      const v = Math.exp(-((i - r) ** 2) / (2 * sigma * sigma))
      k.push(v); return v
    }).reduce((a, b) => a + b)
    for (let i = 0; i < arr.length; i++) {
      let s = 0
      for (let d = -r; d <= r; d++) {
        const j = i + d
        if (j >= 0 && j < arr.length) s += arr[j] * k[d + r]
      }
      out[i] = s / ks
    }
    return out
  }

  _spectrum() {
    if (!this.freqData) return []
    const raw = this.freqData
    const bars = 128
    const step = Math.floor(raw.length / bars)
    const out = new Float32Array(bars)
    for (let i = 0; i < bars; i++) {
      let s = 0
      for (let j = 0; j < step; j++) s += raw[i * step + j]
      out[i] = s / step
    }
    return out
  }

  // ─── Map F1/F2 → vowel space (x=0 front … 1 back, y=0 close … 1 open) ───
  _mapToVowel(f1, f2) {
    // Reference formant ranges from literature (Peterson & Barney 1952, Hillenbrand 1995)
    // F1: close≈300Hz, open≈800Hz
    // F2: front≈2300Hz, back≈850Hz
    //
    // Using log scale for more perceptually uniform spacing
    const f1Close = 250, f1Open = 850
    const f2Front = 2400, f2Back = 750

    const logF1 = Math.log2(Math.max(f1, 200))
    const logF2 = Math.log2(Math.max(f2, 200))

    // y: 0=close (low F1), 1=open (high F1)
    const y = clamp((logF1 - Math.log2(f1Close)) / (Math.log2(f1Open) - Math.log2(f1Close)), 0, 1)

    // x: 0=front (high F2), 1=back (low F2)
    const x = clamp(1 - (logF2 - Math.log2(f2Back)) / (Math.log2(f2Front) - Math.log2(f2Back)), 0, 1)

    // Rounded vowels have lower F2 for same F1
    // Rule of thumb: F2/F1 ratio < 2.0 → likely rounded
    const ratio = f2 / Math.max(f1, 1)
    const rounded = ratio < 2.2 && f1 > 250

    return { x, y, rounded }
  }
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)) }
