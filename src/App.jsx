import React, { useState, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import EntryScreen from './components/EntryScreen'
import GameScreen from './components/GameScreen'
import VictoryScreen from './components/VictoryScreen'

export default function App() {
  const [screen, setScreen] = useState('entry')
  const [finalScore, setFinalScore] = useState(0)
  const handleStart = useCallback(() => setScreen('game'), [])
  const handleVictory = useCallback((s) => { setFinalScore(s); setScreen('victory') }, [])
  const handleRestart = useCallback(() => { setFinalScore(0); setScreen('game') }, [])
  return (
    <div className="w-full h-full bg-[#0a0a1a] text-white overflow-hidden">
      <AnimatePresence mode="wait">
        {screen === 'entry' && <EntryScreen key="e" onStart={handleStart} />}
        {screen === 'game' && <GameScreen key="g" onVictory={handleVictory} />}
        {screen === 'victory' && <VictoryScreen key="v" score={finalScore} onRestart={handleRestart} />}
      </AnimatePresence>
    </div>
  )
}
