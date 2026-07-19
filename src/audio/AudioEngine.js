// Real-time vowel detection via microphone + Web Audio API
// Formant extraction → IPA vowel space mapping → live frequency spectrum

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
    this._prevPeaks = [0, 0, 0]
  }

  async start() {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
    })
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    this.analyser = this.audioCtx.createAnalyser()
    this.analyser.fftSize = this.fftSize
    this.analyser.smoothingTimeConstant = 0.7
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
      return { x: 0.5, y: 0.5, rounded: false, voicing: 0, formants: [0, 0, 0], spectrum: this._getSpectrum() }
    }

    const sr = this.audioCtx.sampleRate
    const nyquist = sr / 2
    const binHz = nyquist / this.freqData.length

    // Gaussian-smooth the magnitude spectrum
    const smoothed = this._gaussianSmooth(this.freqData, 7)

    // Find formant peaks with parabolic interpolation
    const peaks = this._findFormantPeaks(smoothed, binHz)

    // Smooth formant tracks to reduce jitter
    const f1 = this._smoothVal(peaks[0]?.freq || 0, this._prevPeaks[0], 0.45)
    const f2 = this._smoothVal(peaks[1]?.freq || 0, this._prevPeaks[1], 0.45)
    const f3 = this._smoothVal(peaks[2]?.freq || 0, this._prevPeaks[2], 0.45)
    this._prevPeaks = [f1, f2, f3]

    const { x, y, rounded } = this._formantsToVowel(f1, f2)

    return {
      x, y, rounded,
      voicing: Math.min(1, rms * 6),
      formants: [f1, f2, f3],
      spectrum: this._getSpectrum(),
    }
  }

  // Get spectrum data for live visualization (downsampled to ~128 bars)
  _getSpectrum() {
    if (!this.freqData) return []
    const raw = this.freqData
    const bars = 128
    const step = Math.floor(raw.length / bars)
    const out = new Float32Array(bars)
    for (let i = 0; i < bars; i++) {
      let sum = 0
      for (let j = 0; j < step; j++) sum += raw[i * step + j]
      out[i] = sum / step
    }
    return out
  }

  _rms(buf) {
    let sum = 0
    for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i]
    return Math.sqrt(sum / buf.length)
  }

  // Gaussian kernel smoothing
  _gaussianSmooth(arr, radius) {
    const out = new Float32Array(arr.length)
    const sigma = radius / 2.5
    const kernel = []
    for (let i = -radius; i <= radius; i++) {
      kernel.push(Math.exp(-(i * i) / (2 * sigma * sigma)))
    }
    const kSum = kernel.reduce((a, b) => a + b)
    for (let i = 0; i < arr.length; i++) {
      let sum = 0
      for (let k = -radius; k <= radius; k++) {
        const j = i + k
        if (j >= 0 && j < arr.length) sum += arr[j] * kernel[k + radius]
      }
      out[i] = sum / kSum
    }
    return out
  }

  _smoothVal(raw, prev, alpha) {
    return prev === 0 ? raw : prev + (raw - prev) * alpha
  }

  // Find formant peaks with parabolic interpolation
  _findFormantPeaks(smoothed, binHz) {
    const peaks = []
    const minBin = Math.floor(200 / binHz)
    const maxBin = Math.min(smoothed.length - 1, Math.floor(4500 / binHz))

    for (let i = minBin + 3; i < maxBin - 3; i++) {
      // Local maximum with neighbourhood check
      if (
        smoothed[i] > smoothed[i - 1] && smoothed[i] > smoothed[i + 1] &&
        smoothed[i] > smoothed[i - 2] && smoothed[i] > smoothed[i + 2] &&
        smoothed[i] > smoothed[i - 3] && smoothed[i] > smoothed[i + 3] &&
        smoothed[i] > -55
      ) {
        const alpha = smoothed[i - 1]
        const beta = smoothed[i]
        const gamma = smoothed[i + 1]
        const denom = alpha - 2 * beta + gamma
        const p = denom !== 0 ? 0.5 * (alpha - gamma) / denom : 0
        const freq = (i + p) * binHz
        peaks.push({ freq, mag: beta, bin: i })
      }
    }

    // Sort by magnitude
    peaks.sort((a, b) => b.mag - a.mag)

    // Filter: ensure minimum separation (F1-F2 ≥ 200 Hz, F2-F3 ≥ 200 Hz)
    const filtered = []
    for (const pk of peaks) {
      if (filtered.length === 0) { filtered.push(pk); continue }
      const lastFreq = filtered[filtered.length - 1].freq
      if (Math.abs(pk.freq - lastFreq) > 200) filtered.push(pk)
      if (filtered.length >= 3) break
    }

    // Sort by frequency (F1 < F2 < F3)
    filtered.sort((a, b) => a.freq - b.freq)

    return filtered
  }

  // Map F1/F2 to vowel space (0-1 normalized coordinates)
  _formantsToVowel(f1, f2) {
    // Empirical vowel formant anchors (averaged from Peterson & Barney, Hillenbrand etc.)
    // F1: 250Hz = close, 750Hz = open
    // F2: 800Hz = back, 2400Hz = front
    const f1Min = 250, f1Max = 800
    const f2Min = 800, f2Max = 2400

    // Non-linear mapping: use log scale for more natural spacing
    const logF1 = Math.log2(f1)
    const logF2 = Math.log2(f2)
    const logMin1 = Math.log2(f1Min), logMax1 = Math.log2(f1Max)
    const logMin2 = Math.log2(f2Min), logMax2 = Math.log2(f2Max)

    // y: 0 = close (low F1), 1 = open (high F1)
    const y = clamp((logF1 - logMin1) / (logMax1 - logMin1), 0, 1)

    // x: 0 = front (high F2), 1 = back (low F2)
    const x = clamp(1 - (logF2 - logMin2) / (logMax2 - logMin2), 0, 1)

    // Rounded detection: rounded vowels have lower F2/F1 ratio
    const ratio = f2 / (f1 || 1)
    const rounded = ratio < 2.5 && f1 > 280

    return { x, y, rounded }
  }
}

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)) }
