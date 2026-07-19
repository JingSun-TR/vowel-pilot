import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, ArrowRight, Star } from 'lucide-react'

export default function LevelComplete({ level, capture, isLast, onNext }) {
  return (
    <motion.div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-gray-900/90 border border-emerald-500/30 rounded-2xl p-6 md:p-8 max-w-sm w-full mx-4 text-center"
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 20 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
        >
          <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto" />
        </motion.div>

        <h2 className="text-2xl font-bold text-white mt-4">キャプチャ成功！</h2>
        <p className="text-gray-400 mt-1">Level {level} complete</p>

        {/* Score breakdown */}
        <div className="mt-6 space-y-2 text-sm">
          <div className="flex justify-between text-gray-300">
            <span>基本スコア</span>
            <span className="font-semibold">+100</span>
          </div>
          {capture?.timeBonus > 0 && (
            <div className="flex justify-between text-amber-300">
              <span>タイムボーナス</span>
              <span className="font-semibold">+{capture.timeBonus}</span>
            </div>
          )}
          {capture?.streakBonus > 0 && (
            <div className="flex justify-between text-orange-300">
              <span>ストリークボーナス</span>
              <span className="font-semibold">+{capture.streakBonus}</span>
            </div>
          )}
          <div className="border-t border-gray-700 pt-2 flex justify-between text-white font-bold">
            <span>合計</span>
            <span className="text-lg">{capture?.score}</span>
          </div>
        </div>

        {/* Next button */}
        <motion.button
          onClick={onNext}
          className="mt-6 px-8 py-3 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold flex items-center gap-2 mx-auto cursor-pointer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isLast ? (
            <>
              <Star className="w-4 h-4" />
              結果を見る
            </>
          ) : (
            <>
              次へ
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
