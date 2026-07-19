import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw, Zap, Timer, Target } from 'lucide-react'
import { LEVELS, getVowelByIpa, VOWELS } from '../data/vowels'
import VowelMap from './VowelMap'
import HUD from './HUD'
import LevelComplete from './LevelComplete'

const CAPTURE_RADIUS = 0.12
const MOVE_SPEED = 0.025
const INITIAL_PLAYER = { x: 0.5, y: 0.5, rounded: false }

export default function GameScreen({ onVictory }) {
  const [levelIdx, setLevelIdx] = useState(0)
  const [player, setPlayer] = useState(INITIAL_PLAYER)
  const [score, setScore] = useState(0)
  const [timer, setTimer] = useState(0)
  const [showComplete, setShowComplete] = useState(false)
  const [lastCapture, setLastCapture] = useState(null)
  const [streak, setStreak] = useState(0)
  const keysRef = useRef(new Set())
  const timerRef = useRef(null)
  const playerRef = useRef(player)
  const frameRef = useRef(null)

  const level = LEVELS[levelIdx]
  const target = getVowelByIpa(level.target)

  // Sync ref
  useEffect(() => { playerRef.current = player }, [player])

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimer(t => t + 1)
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [levelIdx])

  // Keyboard handling
  useEffect(() => {
    const handleDown = (e) => {
      keysRef.current.add(e.key)
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault()
      }
    }
    const handleUp = (e) => keysRef.current.delete(e.key)
    window.addEventListener('keydown', handleDown)
    window.addEventListener('keyup', handleUp)
    return () => {
      window.removeEventListener('keydown', handleDown)
      window.removeEventListener('keyup', handleUp)
    }
  }, [])

  // Game loop
  useEffect(() => {
    const tick = () => {
      const p = { ...playerRef.current }
      const keys = keysRef.current

      if (keys.has('ArrowLeft') || keys.has('a')) p.x = Math.max(0, p.x - MOVE_SPEED)
      if (keys.has('ArrowRight') || keys.has('d')) p.x = Math.min(1, p.x + MOVE_SPEED)
      if (keys.has('ArrowUp') || keys.has('w')) p.y = Math.max(0, p.y - MOVE_SPEED)
      if (keys.has('ArrowDown') || keys.has('s')) p.y = Math.min(1, p.y + MOVE_SPEED)
      if (keys.has('Shift')) p.rounded = !p.rounded

      // Calculate distance to target
      const dx = p.x - target.x
      const dy = p.y - target.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const roundedMatch = p.rounded === target.rounded

      setPlayer(p)

      // Check capture
      if (dist < CAPTURE_RADIUS && roundedMatch && !showComplete) {
        handleCapture()
      }

      frameRef.current = requestAnimationFrame(tick)
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [target, showComplete, levelIdx])

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
    setTimer(0)
    setShowComplete(false)
    setLastCapture(null)
  }, [levelIdx, score, onVictory])

  const handleReset = useCallback(() => {
    setPlayer(INITIAL_PLAYER)
  }, [])

  const dx = player.x - target.x
  const dy = player.y - target.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  const roundedMatch = player.rounded === target.rounded

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
          player={player}
          target={target}
          distance={distance}
          roundedMatch={roundedMatch}
          captureRadius={CAPTURE_RADIUS}
        />
      </div>

      {/* Bottom info panel */}
      <div className="px-4 pb-3 md:px-8 md:pb-4">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
          {/* Target info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center">
              <span className="text-lg md:text-xl font-bold text-emerald-300">{target.ipa}</span>
            </div>
            <div className="text-xs md:text-sm">
              <div className="text-gray-400">ターゲット</div>
              <div className="text-white font-medium">{target.name}</div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors"
              title="リセット"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Status */}
          <div className="flex items-center gap-3 text-xs md:text-sm">
            <div className={`flex items-center gap-1 ${roundedMatch ? 'text-emerald-400' : 'text-gray-500'}`}>
              <span className="text-lg">{player.rounded ? '○' : '—'}</span>
              <span>{player.rounded ? '円唇' : '展唇'}</span>
            </div>
            <div className={`flex items-center gap-1 ${distance < CAPTURE_RADIUS * 2 ? 'text-amber-400' : 'text-gray-500'}`}>
              <Target className="w-3.5 h-3.5" />
              <span>{(distance * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>

        {/* Hint */}
        <div className="max-w-xl mx-auto mt-2 text-center">
          <p className="text-xs text-gray-500">{level.hint}</p>
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
