import React from 'react'
import { motion } from 'framer-motion'
import { Trophy, RotateCcw, Star, Sparkles } from 'lucide-react'

export default function VictoryScreen({ score, onRestart }) {
  const rating = score >= 4000 ? 3 : score >= 2000 ? 2 : 1
  return (
    <motion.div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden px-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {[...Array(20)].map((_, i) => (
        <motion.div key={i} className="absolute w-1 h-1 rounded-full bg-amber-400"
          style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
          animate={{ y: [0, -100], opacity: [0, 1, 0] }}
          transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }} />
      ))}
      <motion.div className="relative z-10 text-center" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, duration: 0.6 }}>
        <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.5, type: 'spring', damping: 10 }}>
          <Trophy className="w-20 h-20 md:w-24 md:h-24 text-amber-400 mx-auto" />
        </motion.div>
        <h1 className="text-3xl md:text-5xl font-bold text-white mt-6">航行完了！</h1>
        <p className="text-lg text-gray-400 mt-2">All 10 vowel destinations reached</p>
        <div className="flex justify-center gap-2 mt-6">
          {[1, 2, 3].map(i => (
            <motion.div key={i} initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.8 + i * 0.2, type: 'spring' }}>
              <Star className={`w-10 h-10 md:w-12 md:h-12 ${i <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-700'}`} />
            </motion.div>
          ))}
        </div>
        <motion.div className="mt-8 p-6 rounded-2xl bg-gray-900/60 border border-gray-700/50 max-w-xs mx-auto"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 }}>
          <div className="text-sm text-gray-400">最終スコア</div>
          <div className="text-4xl md:text-5xl font-bold text-amber-300 mt-1">{score}</div>
          <div className="flex items-center justify-center gap-1 mt-2 text-xs text-gray-500">
            <Sparkles className="w-3 h-3" />
            {rating === 3 ? 'パーフェクト！' : rating === 2 ? 'よくできました！' : 'もう一回挑戦！'}
          </div>
        </motion.div>
        <motion.button onClick={onRestart}
          className="mt-8 px-8 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold flex items-center gap-2 mx-auto cursor-pointer"
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}>
          <RotateCcw className="w-4 h-4" /> もう一度航行する
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
