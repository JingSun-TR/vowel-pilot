import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Volume2, Target } from 'lucide-react'
import { LEVELS, getVowelByIpa } from '../data/vowels'
import { AudioEngine } from '../audio/AudioEngine'
import VowelMap from './VowelMap'
import FormantChart from './FormantChart'
import SpectrumBars from './SpectrumBars'
import HUD from './HUD'
import LevelComplete from './LevelComplete'

const CAPTURE_RADIUS = 0.15
const SMOOTHING = 0.3
const INITIAL_PLAYER = { x: 0.5, y: 0.5, rounded: false }

export default function GameScreen({ onVictory }) {
  const [micReady, setMicReady] = useState(false)
  const [micError, setMicError] = useState(null)
  const [levelIdx, setLevelIdx] = useState(0)
  const [player, setPlayer] = useState(INITIAL_PLAYER)
  const [smoothed, setSmoothed] = useState(INITIAL_PLAYER)
  const [score, setScore] = useState(0)
  const [timer, setTimer] = useState(0)
  const [showComplete, setShowComplete] = useState(false)
  const [lastCapture, setLastCapture] = useState(null)
  const [streak, setStreak] = useState(0)
  const [voicing, setVoicing] = useState(0)
  const [formants, setFormants] = useState([0, 0, 0])
  const [spectrum, setSpectrum] = useState([])

  const engineRef = useRef(null)
  const timerRef = useRef(null)
  const frameRef = useRef(null)
  const smoothedRef = useRef(INITIAL_PLAYER)
  const showCompleteRef = useRef(showComplete)

  const level = LEVELS[levelIdx]
  const target = getVowelByIpa(level.target)

  useEffect(() => { showCompleteRef.current = showComplete }, [showComplete])

  const initMic = useCallback(async () => {
    try {
      const engine = new AudioEngine()
      await engine.start()
      engineRef.current = engine
      setMicReady(true)
      setMicError(null)
    } catch (e) {
      setMicError(e.message || 'マイクへのアクセスが拒否されました')
    }
  }, [])

  useEffect(() => {
    return () => {
      if (engineRef.current) engineRef.current.stop()
      cancelAnimationFrame(frameRef.current)
      clearInterval(timerRef.current)
    }
  }, [])

  useEffect(() => {
    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000)
    return () => clearInterval(timerRef.current)
  }, [levelIdx])

  // Game loop
  useEffect(() => {
    let fc = 0
    const tick = () => {
      fc++
      const engine = engineRef.current

      if (engine && fc % 2 === 0) {
        const det = engine.detect()
        if (det) {
          setVoicing(det.voicing)
          setFormants(det.formants)
          if (fc % 4 === 0 && det.spectrum) setSpectrum(det.spectrum)

          const prev = smoothedRef.current
          const sm = {
            x: prev.x + (det.x - prev.x) * SMOOTHING,
            y: prev.y + (det.y - prev.y) * SMOOTHING,
            rounded: det.rounded,
          }
          smoothedRef.current = sm
          setSmoothed(sm)

          const dist = Math.hypot(sm.x - target.x, sm.y - target.y)
          if (dist < CAPTURE_RADIUS && sm.rounded === target.rounded && det.voicing > 0.15 && !showCompleteRef.current) {
            handleCapture()
          }
        }
      }
      frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [target, showComplete, levelIdx, micReady])

  const handleCapture = useCallback(() => {
    const timeBonus = Math.max(0, level.timeLimit - timer) * 10
    const streakBonus = streak * 50
    const levelScore = 100 + timeBonus + streakBonus
    setScore(s => s + levelScore)
    setStreak(s => s + 1)
    setLastCapture({ score: levelScore, timeBonus, streakBonus })
    setShowComplete(true)
    clearInterval(timerRef.current)
  }, [timer, streak, level])

  const handleNext = useCallback(() => {
    if (levelIdx + 1 >= LEVELS.length) { onVictory(score); return }
    setLevelIdx(i => i + 1)
    setPlayer(INITIAL_PLAYER)
    smoothedRef.current = INITIAL_PLAYER
    setSmoothed(INITIAL_PLAYER)
    setTimer(0)
    setShowComplete(false)
    setLastCapture(null)
  }, [levelIdx, score, onVictory])

  const distance = Math.hypot(smoothed.x - target.x, smoothed.y - target.y)
  const roundedMatch = smoothed.rounded === target.rounded

  // Mic permission screen
  if (!micReady) {
    return (
      <motion.div className="w-full h-full flex flex-col items-center justify-center px-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="text-center max-w-md">
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
            <Mic className="w-16 h-16 text-indigo-400 mx-auto" />
          </motion.div>
          <h2 className="text-xl md:text-2xl font-bold text-white mt-6">音声で操作</h2>
          <p className="text-sm text-gray-400 mt-2">
            マイクを使って発音し、共振峰(F1/F2)で球体をターゲットに近づけましょう
          </p>
          {micError && (
            <p className="text-sm text-red-400 mt-4 bg-red-500/10 rounded-lg p-3">{micError}</p>
          )}
          <motion.button onClick={initMic}
            className="mt-8 px-10 py-4 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-lg flex items-center gap-3 mx-auto cursor-pointer"
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Mic className="w-5 h-5" /> マイクを許可する
          </motion.button>
          <p className="text-xs text-gray-600 mt-4">
            Level {levelIdx + 1}: {target.ipa} — {level.hint}
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div className="w-full h-full flex flex-col relative"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

      <HUD level={levelIdx + 1} totalLevels={LEVELS.length} score={score}
        timer={timer} timeLimit={level.timeLimit} streak={streak} />

      {/* Main layout: map + side panels */}
      <div className="flex-1 flex items-stretch gap-2 p-2 md:p-3 min-h-0">

        {/* Left: Vowel Map */}
        <div className="flex-1 flex items-center justify-center min-w-0">
          <VowelMap player={smoothed} target={target} distance={distance}
            roundedMatch={roundedMatch} captureRadius={CAPTURE_RADIUS} voicing={voicing} />
        </div>

        {/* Right: Formant Chart + Spectrum */}
        <div className="hidden md:flex flex-col gap-2 w-44 lg:w-52 shrink-0">
          {/* F1/F2 scatter plot */}
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-2">
            <div className="text-[10px] text-gray-500 mb-1 font-medium">共振峰マップ F1×F2</div>
            <FormantChart formants={formants} player={smoothed} target={target} voicing={voicing} />
          </div>
          {/* Frequency spectrum */}
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-2 flex-1 flex flex-col">
            <div className="text-[10px] text-gray-500 mb-1 font-medium">周波数スペクトラム</div>
            <div className="flex-1 flex items-end">
              <SpectrumBars spectrum={spectrum} formants={formants} voicing={voicing} />
            </div>
            <div className="flex justify-between text-[8px] text-gray-600 mt-1 font-mono">
              <span>200Hz</span><span>1kHz</span><span>2.5kHz</span><span>4kHz</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="px-4 pb-2 md:px-8 md:pb-3">
        <div className="max-w-2xl mx-auto">
          {/* Mic + voice meter + formants */}
          <div className="flex items-center gap-3 mb-1.5">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
              voicing > 0.15 ? 'bg-emerald-500/20 border border-emerald-400' : 'bg-gray-800 border border-gray-700'
            }`}>
              {voicing > 0.15 ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <MicOff className="w-3.5 h-3.5 text-gray-500" />}
            </div>
            {/* Level meter */}
            <div className="flex-1 max-w-[140px] h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-75"
                style={{ background: voicing > 0.5 ? '#22c55e' : voicing > 0.15 ? '#eab308' : '#6b7280', width: `${Math.min(100, voicing * 200)}%` }} />
            </div>
            {/* Formant values */}
            <div className="flex items-center gap-2 text-[11px] font-mono shrink-0">
              <span className="text-indigo-300">F1:{formants[0]?.toFixed(0) || '—'}</span>
              <span className="text-purple-300">F2:{formants[1]?.toFixed(0) || '—'}</span>
              <span className="text-pink-300">F3:{formants[2]?.toFixed(0) || '—'}</span>
            </div>
            {/* Rounded */}
            <div className={`text-xs ${roundedMatch ? 'text-emerald-400' : 'text-gray-500'}`}>
              {smoothed.rounded ? '○円唇' : '—展唇'}
            </div>
            {/* Distance */}
            <div className={`text-xs ${distance < CAPTURE_RADIUS * 2 ? 'text-amber-400' : 'text-gray-500'}`}>
              <Target className="w-3 h-3 inline mr-0.5" />{(distance * 100).toFixed(0)}%
            </div>
          </div>

          {/* Target + hint */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-sm font-bold text-emerald-300">{target.ipa}</span>
              <span className="text-xs text-gray-400">{target.name}</span>
            </div>
            <p className="text-[11px] text-gray-500">{level.hint}</p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showComplete && (
          <LevelComplete level={levelIdx + 1} capture={lastCapture}
            isLast={levelIdx + 1 >= LEVELS.length} onNext={handleNext} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
