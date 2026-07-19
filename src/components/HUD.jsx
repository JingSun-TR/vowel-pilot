import React from 'react'
import { motion } from 'framer-motion'
import { Trophy, Zap, Timer } from 'lucide-react'

export default function HUD({ level, totalLevels, score, timer, timeLimit, streak }) {
  const timeLeft = Math.max(0, timeLimit - timer)
  const isLow = timeLeft <= 5
  return (
    <div className="px-4 pt-3 md:px-8 md:pt-4">
      <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">LEVEL</span>
          <span className="text-lg md:text-xl font-bold text-indigo-400">{level}</span>
          <span className="text-xs text-gray-600">/ {totalLevels}</span>
        </div>
        <div className="flex-1 max-w-[120px] md:max-w-[200px] h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <motion.div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
            animate={{ width: `${(level / totalLevels) * 100}%` }} transition={{ duration: 0.5 }} />
        </div>
        <div className="flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-sm md:text-base font-semibold text-amber-300">{score}</span>
        </div>
        {streak > 0 && (
          <motion.div className="flex items-center gap-1" initial={{ scale: 0 }} animate={{ scale: 1 }} key={streak}>
            <Zap className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-xs font-bold text-orange-300">x{streak}</span>
          </motion.div>
        )}
        <div className={`flex items-center gap-1.5 ${isLow ? 'text-red-400' : 'text-gray-400'}`}>
          <Timer className="w-3.5 h-3.5" />
          <span className="text-sm font-mono tabular-nums">{timeLeft}s</span>
        </div>
      </div>
    </div>
  )
}
