// Real-time vowel detection — strict band-separated formant extraction
// F0 via autocorrelation → F1/F2/F3 via independent band-limited peak search

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
    this._log = [] // recent detections for debug
  }

  async start() {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: true }
    })
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    this.analyser = this.audioCtx.createAnalyser()
    this.analyser.fftSize = this.fftSize
    this.analyser.smoothingTimeConstant = 0.5
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
    if (rms < 0.01) {
      return { x: 0.5, y: 0.5, rounded: false, voicing: 0, f0: 0, formants: [0, 0, 0], spectrum: this._spectrum(), log: '' }
    }

    const sr = this.audioCtx.sampleRate
    const nyquist = sr / 2
    const nBins = this.freqData.length
    const binHz = nyquist / nBins

    // Step 1: F0 via autocorrelation
    const f0 = this._detectF0(this.timeData, sr)

    // Step 2: smooth magnitude spectrum (Gaussian, r=5)
    const smoothed = this._gaussianSmooth(this.freqData, 5)

    // Step 3: find peaks with strict minimum separation and minimum prominence
    const allPeaks = this._findAllPeaks(smoothed, binHz, 150, 4000, 30)

    // Step 4: assign F1/F2/F3 from peaks using expected frequency ranges
    // These ranges are independent of F0 — based on acoustic phonetics literature
    const f1 = this._assignFormant(allPeaks, 200, 900)    // F1: 200-900 Hz
    const f2 = this._assignFormant(allPeaks, 700, 2600)   // F2: 700-2600 Hz
    const f3 = this._assignFormant(allPeaks, 1800, 3500)  // F3: 1800-3500 Hz

    // Smooth tracks
    const sf = [
      this._smooth(f1, this._prevF[0], 0.35),
      this._smooth(f2, this._prevF[1], 0.35),
      this._smooth(f3, this._prevF[2], 0.35),
    ]
    this._prevF = [...sf]

    const { x, y, rounded } = this._mapToVowel(sf[0], sf[1])

    // Debug log (keep last 5)
    const logEntry = `F0=${f0.toFixed(0)} F1=${sf[0].toFixed(0)} F2=${sf[1].toFixed(0)} F3=${sf[2].toFixed(0)} x=${x.toFixed(2)} y=${y.toFixed(2)} r=${rounded}`
    this._log.push(logEntry)
    if (this._log.length > 5) this._log.shift()

    return {
      x, y, rounded,
      voicing: Math.min(1, rms * 6),
      f0,
      formants: sf,
      spectrum: this._spectrum(),
      log: this._log[this._log.length - 1],
    }
  }

  // ─── F0: autocorrelation with parabolic refinement ───
  _detectF0(buf, sr) {
    const minLag = Math.floor(sr / 500)
    const maxLag = Math.floor(sr / 60)
    let bestCorr = -1, bestLag = minLag
    for (let lag = minLag; lag <= Math.min(maxLag, buf.length >> 1); lag++) {
      let c = 0
      for (let i = 0; i < buf.length - lag; i++) c += buf[i] * buf[i + lag]
      c /= (buf.length - lag)
      if (c > bestCorr) { bestCorr = c; bestLag = lag }
    }
    return bestCorr > 0.1 ? sr / bestLag : 150
  }

  // ─── Find all spectral peaks with minimum prominence and separation ───
  _findAllPeaks(smoothed, binHz, fMin, fMax, minSepHz) {
    const minBin = Math.max(2, Math.floor(fMin / binHz))
    const maxBin = Math.min(smoothed.length - 3, Math.floor(fMax / binHz))
    const sepBins = Math.max(2, Math.floor(minSepHz / binHz))
    const peaks = []

    for (let i = minBin; i <= maxBin; i++) {
      // Local max check (wider neighbourhood)
      if (smoothed[i] <= smoothed[i - 1] || smoothed[i] <= smoothed[i + 1]) continue
      if (smoothed[i] <= smoothed[i - 2] || smoothed[i] <= smoothed[i + 2]) continue
      // Must be above noise floor
      if (smoothed[i] < -65) continue

      // Prominence: difference from lowest neighbour in local valley
      const leftMin = Math.min(smoothed[i - 1], smoothed[i - 2], smoothed[i - 3] || smoothed[i - 2])
      const rightMin = Math.min(smoothed[i + 1], smoothed[i + 2], smoothed[i + 3] || smoothed[i + 2])
      const prominence = smoothed[i] - Math.max(leftMin, rightMin)
      if (prominence < 3) continue // at least 3 dB prominence

      // Parabolic interpolation
      const a = smoothed[i - 1], b = smoothed[i], c = smoothed[i + 1]
      const denom = a - 2 * b + c
      const p = denom !== 0 ? 0.5 * (a - c) / denom : 0
      const freq = (i + p) * binHz

      peaks.push({ freq, mag: b, prominence, bin: i })
    }

    // Sort by prominence (strongest first)
    peaks.sort((a, b) => b.prominence - a.prominence)

    // Greedy non-overlapping selection
    const selected = []
    for (const pk of peaks) {
      if (selected.every(s => Math.abs(s.freq - pk.freq) >= minSepHz)) {
        selected.push(pk)
      }
    }

    // Sort by frequency for formant assignment
    selected.sort((a, b) => a.freq - b.freq)
    return selected
  }

  // ─── Assign formant: pick strongest peak in band ───
  _assignFormant(peaks, fLow, fHigh) {
    const candidates = peaks.filter(p => p.freq >= fLow && p.freq <= fHigh)
    if (candidates.length === 0) {
      // Fallback: center of band
      return (fLow + fHigh) / 2
    }
    return candidates[0].freq // strongest in band
  }

  // ─── Map F1/F2 → vowel space ───
  _mapToVowel(f1, f2) {
    // Empirical anchor points (Peterson & Barney 1952, Hillenbrand 1995)
    // /i/: F1≈270, F2≈2290
    // /u/: F1≈300, F2≈870
    // /a/: F1≈730, F2≈1090
    // /ɛ/: F1≈530, F2≈1840
    // /ɔ/: F1≈550, F2≈900

    const f1Lo = 220, f1Hi = 850   // close → open
    const f2Lo = 750, f2Hi = 2400  // back → front

    // Linear mapping (simpler, more predictable)
    const y = clamp((f1 - f1Lo) / (f1Hi - f1Lo), 0, 1)  // 0=close, 1=open
    const x = clamp(1 - (f2 - f2Lo) / (f2Hi - f2Lo), 0, 1)  // 0=front, 1=back

    // Rounded: empirical rule — rounded vowels have lower F2/F1 ratio
    const ratio = f2 / Math.max(f1, 1)
    const rounded = ratio < 2.5 && f1 > 250

    return { x, y, rounded }
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
    const kernel = []
    let ks = 0
    for (let i = -r; i <= r; i++) {
      const v = Math.exp(-(i * i) / (2 * sigma * sigma))
      kernel.push(v); ks += v
    }
    for (let i = 0; i < arr.length; i++) {
      let s = 0
      for (let d = -r; d <= r; d++) {
        const j = i + d
        if (j >= 0 && j < arr.length) s += arr[j] * kernel[d + r]
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
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)) }
