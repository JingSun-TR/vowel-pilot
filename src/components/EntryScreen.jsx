import React from 'react'
import { motion } from 'framer-motion'
import { Play, Globe, Mic } from 'lucide-react'

export default function EntryScreen({ onStart }) {
  return (
    <motion.div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.5 }}>
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs><pattern id="g" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M60 0L0 0 0 60" fill="none" stroke="#6366f1" strokeWidth="0.5" /></pattern></defs>
          <rect width="100%" height="100%" fill="url(#g)" />
        </svg>
      </div>
      {[...'iyɨʉɯu eøɤo ɛœɜɞɔ æɐʌɑɒa'].filter(c => c.trim()).map((ch, i) => (
        <motion.div key={i} className="absolute text-2xl md:text-3xl font-light select-none pointer-events-none"
          style={{ color: `hsl(${220+i*15},70%,60%)`, left: `${10+(i*7.5)%80}%`, top: `${15+(i*13)%70}%` }}
          animate={{ y: [0,-20,0], opacity: [0.15,0.35,0.15] }}
          transition={{ duration: 3+(i%3), repeat: Infinity, delay: i*0.3 }}>{ch}</motion.div>
      ))}
      <motion.div className="relative z-10 flex flex-col items-center gap-6 px-4"
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, duration: 0.6 }}>
        <motion.div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-600/30 border border-indigo-400/30 flex items-center justify-center"
          animate={{ rotate: [0,360] }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}>
          <Globe className="w-12 h-12 md:w-16 md:h-16 text-indigo-300" />
        </motion.div>
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">VowelPilot</h1>
          <p className="text-lg md:text-2xl text-indigo-300/80 mt-2 tracking-widest">元音航行</p>
        </div>
        <p className="text-sm md:text-base text-gray-400 max-w-md text-center leading-relaxed">
          IPA 元音图をマップに、発音した共振峰で音の宇宙を探索しよう<br/>
          <span className="text-xs text-gray-500">Navigate the vowel universe with your voice</span>
        </p>
        <motion.button onClick={onStart}
          className="mt-4 px-12 py-4 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-lg md:text-xl cursor-pointer"
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <span className="flex items-center gap-3"><Play className="w-5 h-5" /> 航行を始める</span>
        </motion.button>
        <motion.div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-gray-500"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
          <span className="flex items-center gap-1.5"><Mic className="w-3.5 h-3.5 text-indigo-400" /> マイクで発音</span>
          <span className="flex items-center gap-1.5"><span className="text-indigo-400">F1</span> 舌の高さ</span>
          <span className="flex items-center gap-1.5"><span className="text-purple-400">F2</span> 前後</span>
          <span className="flex items-center gap-1.5"><span className="text-pink-400">円唇</span> 唇の形</span>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
