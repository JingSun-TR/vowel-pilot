import React from 'react'
import { motion } from 'framer-motion'
import { Play, Globe, Mic } from 'lucide-react'

export default function EntryScreen({ onStart }) {
  return (
    <motion.div
      className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5 }}
    >
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#6366f1" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Floating vowel particles */}
      {[...'iyɨʉɯu eøɤo ɛœɜɞɔ æɐʌɑɒa'].filter(c => c.trim()).map((char, i) => (
        <motion.div
          key={i}
          className="absolute text-2xl md:text-3xl font-light select-none pointer-events-none"
          style={{
            color: `hsl(${220 + i * 15}, 70%, 60%)`,
            left: `${10 + (i * 7.5) % 80}%`,
            top: `${15 + (i * 13) % 70}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.15, 0.35, 0.15],
          }}
          transition={{
            duration: 3 + (i % 3),
            repeat: Infinity,
            delay: i * 0.3,
          }}
        >
          {char}
        </motion.div>
      ))}

      {/* Main content */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-6 px-4"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        {/* Logo / Icon */}
        <motion.div
          className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-600/30 border border-indigo-400/30 flex items-center justify-center backdrop-blur-sm"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        >
          <Globe className="w-12 h-12 md:w-16 md:h-16 text-indigo-300" />
        </motion.div>

        {/* Title */}
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            VowelPilot
          </h1>
          <p className="text-lg md:text-2xl text-indigo-300/80 mt-2 tracking-widest">
            元音航行
          </p>
        </div>

        {/* Subtitle */}
        <p className="text-sm md:text-base text-gray-400 max-w-md text-center leading-relaxed">
          IPA 元音图をマップに、舌の位置と唇の形で音の宇宙を探索しよう
          <br />
          <span className="text-xs text-gray-500">
            Navigate the vowel universe with your tongue and lips
          </span>
        </p>

        {/* Play button */}
        <motion.button
          onClick={onStart}
          className="mt-4 group relative px-12 py-4 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-lg md:text-xl overflow-hidden cursor-pointer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="relative z-10 flex items-center gap-3">
            <Play className="w-5 h-5" />
            航行を始める
          </span>
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600"
            initial={{ x: '-100%' }}
            whileHover={{ x: 0 }}
            transition={{ duration: 0.3 }}
          />
        </motion.button>

        {/* Controls hint */}
        <motion.div
          className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <span className="flex items-center gap-1.5">
            <kbd className="px-2 py-0.5 bg-gray-800 rounded border border-gray-700 font-mono">←→</kbd>
            前後
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-2 py-0.5 bg-gray-800 rounded border border-gray-700 font-mono">↑↓</kbd>
            高低
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-2 py-0.5 bg-gray-800 rounded border border-gray-700 font-mono">Shift</kbd>
            円唇
          </span>
        </motion.div>
      </motion.div>

      {/* Bottom decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-indigo-900/20 to-transparent" />
    </motion.div>
  )
}
