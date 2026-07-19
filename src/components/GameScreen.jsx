import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, RotateCcw, Zap, Timer, Target, Volume2 } from 'lucide-react'
import { LEVELS, getVowelByIpa } from '../data/vowels'
import { AudioEngine } from '../audio/AudioEngine'
import VowelMap from './VowelMap'
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
  const [voiceLevel, setVoiceLevel] = useState(0)
  const [freqData, setFreqData] = useState(null)

  const engineRef = useRef(null)
  const timerRef = useRef(null)
  const frameRef = useRef(null)
  const smoothedRef = useRef(INITIAL_PLAYER)
  const playerRef = useRef(player)
  const showCompleteRef = useRef(showComplete)

  const level = LEVELS[levelIdx]
  const target = getVowelByIpa(level.target)

  useEffect(() => { playerRef.current = player }, [player])
  useEffect(() => { showCompleteRef.current = showComplete }, [showComplete])

  // Initialize microphone
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (engineRef.current) engineRef.current.stop()
      cancelAnimationFrame(frameRef.current)
      clearInterval(timerRef.current)
    }
  }, [])

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000)
    return () => clearInterval(timerRef.current)
  }, [levelIdx])

  // Main game loop — reads voice position at ~30fps
  useEffect(() => {
    let frameCount = 0
    const tick = () => {
      frameCount++
      const engine = engineRef.current

      if (engine && frameCount % 2 === 0) { // ~30fps detection
        const det = engine.detect()
        if (det) {
          setVoicing(det.voicing)
          setFormants(det.formants)

          // Smooth the detected position
          const prev = smoothedRef.current
          const raw = { x: det.x, y: det.y, rounded: det.rounded }
          const sm = {
            x: prev.x + (raw.x - prev.x) * SMOOTHING,
            y: prev.y + (raw.y - prev.y) * SMOOTHING,
            rounded: raw.rounded,
          }
          smoothedRef.current = sm
          setSmoothed(sm)
          setPlayer(sm)

          // Distance check
          const dx = sm.x - target.x
          const dy = sm.y - target.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          const roundedMatch = sm.rounded === target.rounded

          if (dist < CAPTURE_RADIUS && roundedMatch && det.voicing > 0.15 && !showCompleteRef.current) {
            handleCapture()
          }
        }

        // Frequency data for visualization (every 4th frame)
        if (frameCount % 4 === 0) {
          const fd = engine.getFreqData()
          if (fd) setFreqData(fd)
        }
      }

      // Voice level meter
      if (engine && frameCount % 3 === 0) {
        const det = engine.detect()
        if (det) setVoiceLevel(det.voicing)
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
    if (levelIdx + 1 >= LEVELS.length) {
      onVictory(score)
      return
    }
    setLevelIdx(i => i + 1)
    setPlayer(INITIAL_PLAYER)
    smoothedRef.current = INITIAL_PLAYER
    setSmoothed(INITIAL_PLAYER)
    setTimer(0)
    setShowComplete(false)
    setLastCapture(null)
  }, [levelIdx, score, onVictory])

  const dx = smoothed.x - target.x
  const dy = smoothed.y - target.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  const roundedMatch = smoothed.rounded === target.rounded

  // Voice not started yet
  if (!micReady) {
    return (
      <motion.div
        className="w-full h-full flex flex-col items-center justify-center px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-center max-w-md">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Mic className="w-16 h-16 text-indigo-400 mx-auto" />
          </motion.div>

          <h2 className="text-xl md:text-2xl font-bold text-white mt-6">音声で操作</h2>
          <p className="text-sm text-gray-400 mt-2">
            マイクを使って発音し、球体をターゲットに近づけましょう
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Speak into your microphone to move the orb toward the target
          </p>

          {micError && (
            <p className="text-sm text-red-400 mt-4 bg-red-500/10 rounded-lg p-3">
              {micError}
            </p>
          )}

          <motion.button
            onClick={initMic}
            className="mt-8 px-10 py-4 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-lg flex items-center gap-3 mx-auto cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Mic className="w-5 h-5" />
            マイクを許可する
          </motion.button>

          <p className="text-xs text-gray-600 mt-4">
            Level {levelIdx + 1}: {target.ipa} — {level.hint}
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="w-full h-full flex flex-col relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* HUD */}
      <HUD
        level={levelIdx + 1}
        totalLevels={LEVELS.length}
        score={score}
        timer={timer}
        timeLimit={level.timeLimit}
        streak={streak}
      />

      {/* Main game area */}
      <div className="flex-1 flex items-center justify-center p-2 md:p-4 relative">
        <VowelMap
          player={smoothed}
          target={target}
          distance={distance}
          roundedMatch={roundedMatch}
          captureRadius={CAPTURE_RADIUS}
          voicing={voicing}
        />
      </div>

      {/* Bottom panel — voice info + controls */}
      <div className="px-4 pb-3 md:px-8 md:pb-4">
        <div className="max-w-xl mx-auto">
          {/* Voice meter + formants row */}
          <div className="flex items-center justify-between gap-3 mb-2">
            {/* Mic indicator */}
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                voicing > 0.15
                  ? 'bg-emerald-500/20 border border-emerald-400'
                  : 'bg-gray-800 border border-gray-700'
              }`}>
                {voicing > 0.15
                  ? <Volume2 className="w-4 h-4 text-emerald-400" />
                  : <MicOff className="w-4 h-4 text-gray-500" />
                }
              </div>
              <div className="text-xs text-gray-500">
                {voicing > 0.15 ? '発話中' : '発話してください'}
              </div>
            </div>

            {/* Voice level bar */}
            <div className="flex-1 max-w-[120px] h-2 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: voicing > 0.5 ? '#22c55e' : voicing > 0.15 ? '#eab308' : '#6b7280',
                  width: `${Math.min(100, voicing * 200)}%`,
                }}
              />
            </div>

            {/* Formant display */}
            <div className="flex items-center gap-3 text-xs font-mono text-gray-500">
              <span>F1: <span className="text-indigo-300">{formants[0].toFixed(0)}</span></span>
              <span>F2: <span className="text-purple-300">{formants[1].toFixed(0)}</span></span>
            </div>
          </div>

          {/* Target info + status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center">
                <span className="text-lg md:text-xl font-bold text-emerald-300">{target.ipa}</span>
              </div>
              <div className="text-xs md:text-sm">
                <div className="text-gray-400">ターゲット</div>
                <div className="text-white font-medium">{target.name}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs md:text-sm">
              <div className={`flex items-center gap-1 ${roundedMatch ? 'text-emerald-400' : 'text-gray-500'}`}>
                <span className="text-lg">{smoothed.rounded ? '○' : '—'}</span>
                <span>{smoothed.rounded ? '円唇' : '展唇'}</span>
              </div>
              <div className={`flex items-center gap-1 ${distance < CAPTURE_RADIUS * 2 ? 'text-amber-400' : 'text-gray-500'}`}>
                <Target className="w-3.5 h-3.5" />
                <span>{(distance * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* Hint */}
          <div className="text-center mt-2">
            <p className="text-xs text-gray-500">{level.hint}</p>
          </div>
        </div>
      </div>

      {/* Level complete overlay */}
      <AnimatePresence>
        {showComplete && (
          <LevelComplete
            level={levelIdx + 1}
            capture={lastCapture}
            isLast={levelIdx + 1 >= LEVELS.length}
            onNext={handleNext}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
