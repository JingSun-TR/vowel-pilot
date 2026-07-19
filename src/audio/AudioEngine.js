// Real-time vowel detection via microphone + Web Audio API
// Extracts formants (F1/F2) and maps to IPA vowel space coordinates

export class AudioEngine {
  constructor() {
    this.audioCtx = null
    this.analyser = null
    this.source = null
    this.stream = null
    this.fftSize = 2048
    this.freqData = null
    this.timeData = null
    this.running = false
  }

  async start() {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
    })
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    this.analyser = this.audioCtx.createAnalyser()
    this.analyser.fftSize = this.fftSize
    this.analyser.smoothingTimeConstant = 0.75
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

  // Get current vowel-space position from voice
  detect() {
    if (!this.running || !this.analyser) return null

    this.analyser.getFloatFrequencyData(this.freqData)
    this.analyser.getFloatTimeDomainData(this.timeData)

    const rms = this._rms(this.timeData)
    if (rms < 0.01) return { x: 0.5, y: 0.5, rounded: false, voicing: 0, formants: [0, 0, 0] }

    const nyquist = this.audioCtx.sampleRate / 2
    const binHz = nyquist / this.freqData.length

    // Smooth the spectrum
    const smoothed = this._smooth(this.freqData, 5)

    // Find top spectral peaks (formant candidates)
    const peaks = this._findPeaks(smoothed, binHz, 5)

    // Use F1 and F2 to map to vowel space
    const f1 = peaks[0]?.freq || 500
    const f2 = peaks[1]?.freq || 1500
    const f3 = peaks[2]?.freq || 2500

    const { x, y, rounded } = this._formantsToVowel(f1, f2)

    return { x, y, rounded, voicing: Math.min(1, rms * 5), formants: [f1, f2, f3] }
  }

  // Get raw frequency magnitude data for visualization
  getFreqData() {
    if (!this.freqData) return null
    return Array.from(this.freqData)
  }

  _rms(buf) {
    let sum = 0
    for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i]
    return Math.sqrt(sum / buf.length)
  }

  _smooth(arr, window) {
    const out = new Float32Array(arr.length)
    const half = Math.floor(window / 2)
    for (let i = 0; i < arr.length; i++) {
      let sum = 0, count = 0
      for (let j = Math.max(0, i - half); j <= Math.min(arr.length - 1, i + half); j++) {
        sum += arr[j]; count++
      }
      out[i] = sum / count
    }
    return out
  }

  _findPeaks(smoothed, binHz, maxPeaks) {
    const peaks = []
    // Only look at 200-4000 Hz range (typical formant range)
    const minBin = Math.floor(200 / binHz)
    const maxBin = Math.min(smoothed.length - 1, Math.floor(4000 / binHz))

    for (let i = minBin + 2; i < maxBin - 2; i++) {
      if (
        smoothed[i] > smoothed[i - 1] &&
        smoothed[i] > smoothed[i + 1] &&
        smoothed[i] > smoothed[i - 2] &&
        smoothed[i] > smoothed[i + 2] &&
        smoothed[i] > -50
      ) {
        // Parabolic interpolation for sub-bin accuracy
        const alpha = smoothed[i - 1]
        const beta = smoothed[i]
        const gamma = smoothed[i + 1]
        const p = 0.5 * (alpha - gamma) / (alpha - 2 * beta + gamma)
        const freq = (i + p) * binHz
        peaks.push({ freq, mag: beta })
      }
    }

    peaks.sort((a, b) => b.mag - a.mag)
    return peaks.slice(0, maxPeaks)
  }

  // Map F1/F2 formant frequencies to vowel space (x=backness, y=height)
  _formantsToVowel(f1, f2) {
    // Standard vowel formant ranges (male/female average)
    // F1: 200-900 Hz (close→open)
    // F2: 800-2500 Hz (back→front)

    // x: 0=front (high F2), 1=back (low F2)
    const x = clamp(1 - (f2 - 800) / (2500 - 800), 0, 1)

    // y: 0=close (low F1), 1=open (high F1)
    const y = clamp((f1 - 200) / (900 - 200), 0, 1)

    // Rounded detection: F2/F1 ratio < 2.0 often indicates rounding
    const rounded = (f2 / f1) < 2.0 && f1 > 300

    return { x, y, rounded }
  }
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v))
}
