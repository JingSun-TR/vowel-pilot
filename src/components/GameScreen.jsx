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

const CAPTURE_R = 0.15
const SMOOTH = 0.35
const INIT = { x: 0.5, y: 0.5, rounded: false }

export default function GameScreen({ onVictory }) {
  const [micReady, setMicReady] = useState(false)
  const [micErr, setMicErr] = useState(null)
  const [lvlIdx, setLvlIdx] = useState(0)
  const [smoothed, setSmoothed] = useState(INIT)
  const [score, setScore] = useState(0)
  const [timer, setTimer] = useState(0)
  const [showDone, setShowDone] = useState(false)
  const [lastCap, setLastCap] = useState(null)
  const [streak, setStreak] = useState(0)
  const [voicing, setVoicing] = useState(0)
  const [formants, setFormants] = useState([0,0,0])
  const [spectrum, setSpectrum] = useState([])
  const [debugLog, setDebugLog] = useState('')

  const eng = useRef(null)
  const tRef = useRef(null)
  const fRef = useRef(null)
  const smRef = useRef(INIT)
  const doneRef = useRef(false)

  const level = LEVELS[lvlIdx]
  const target = getVowelByIpa(level.target)

  useEffect(() => { doneRef.current = showDone }, [showDone])

  const initMic = useCallback(async () => {
    try {
      const e = new AudioEngine(); await e.start()
      eng.current = e; setMicReady(true); setMicErr(null)
    } catch (e) { setMicErr(e.message || 'マイクエラー') }
  }, [])

  useEffect(() => () => { eng.current?.stop(); cancelAnimationFrame(fRef.current); clearInterval(tRef.current) }, [])
  useEffect(() => { tRef.current = setInterval(() => setTimer(t=>t+1), 1000); return () => clearInterval(tRef.current) }, [lvlIdx])

  // Game loop
  useEffect(() => {
    let fc = 0
    const tick = () => {
      fc++
      const e = eng.current
      if (e && fc % 2 === 0) {
        const d = e.detect()
        if (d) {
          setVoicing(d.voicing)
          setFormants(d.formants)
          setDebugLog(d.log)
          if (fc % 4 === 0 && d.spectrum) setSpectrum(d.spectrum)

          const prev = smRef.current
          const sm = {
            x: prev.x + (d.x - prev.x) * SMOOTH,
            y: prev.y + (d.y - prev.y) * SMOOTH,
            rounded: d.rounded,
          }
          smRef.current = sm
          setSmoothed(sm)

          const dist = Math.hypot(sm.x - target.x, sm.y - target.y)
          if (dist < CAPTURE_R && sm.rounded === target.rounded && d.voicing > 0.15 && !doneRef.current) {
            doCapture()
          }
        }
      }
      fRef.current = requestAnimationFrame(tick)
    }
    fRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(fRef.current)
  }, [target, showDone, lvlIdx, micReady])

  const doCapture = useCallback(() => {
    const tb = Math.max(0, level.timeLimit - timer) * 10
    const sb = streak * 50
    const sc = 100 + tb + sb
    setScore(s=>s+sc); setStreak(s=>s+1)
    setLastCap({score:sc,timeBonus:tb,streakBonus:sb})
    setShowDone(true); clearInterval(tRef.current)
  }, [timer, streak, level])

  const handleNext = useCallback(() => {
    if (lvlIdx+1 >= LEVELS.length) { onVictory(score); return }
    setLvlIdx(i=>i+1); setSmoothed(INIT); smRef.current=INIT
    setTimer(0); setShowDone(false); setLastCap(null)
  }, [lvlIdx, score, onVictory])

  const dist = Math.hypot(smoothed.x - target.x, smoothed.y - target.y)
  const rMatch = smoothed.rounded === target.rounded

  if (!micReady) return (
    <motion.div className="w-full h-full flex flex-col items-center justify-center px-4" initial={{opacity:0}} animate={{opacity:1}}>
      <div className="text-center max-w-md">
        <motion.div animate={{scale:[1,1.1,1]}} transition={{duration:2,repeat:Infinity}}>
          <Mic className="w-16 h-16 text-indigo-400 mx-auto" />
        </motion.div>
        <h2 className="text-xl md:text-2xl font-bold text-white mt-6">音声で操作</h2>
        <p className="text-sm text-gray-400 mt-2">マイクを使って発音し、共振峰で球体をターゲットに近づけましょう</p>
        {micErr&&<p className="text-sm text-red-400 mt-4 bg-red-500/10 rounded-lg p-3">{micErr}</p>}
        <motion.button onClick={initMic}
          className="mt-8 px-10 py-4 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-lg flex items-center gap-3 mx-auto cursor-pointer"
          whileHover={{scale:1.05}} whileTap={{scale:0.95}}>
          <Mic className="w-5 h-5"/> マイクを許可する
        </motion.button>
        <p className="text-xs text-gray-600 mt-4">Level {lvlIdx+1}: {target.ipa} — {level.hint}</p>
      </div>
    </motion.div>
  )

  return (
    <motion.div className="w-full h-full flex flex-col" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
      <HUD level={lvlIdx+1} totalLevels={LEVELS.length} score={score} timer={timer} timeLimit={level.timeLimit} streak={streak} />

      <div className="flex-1 flex items-stretch gap-2 p-2 md:p-3 min-h-0">
        <div className="flex-1 flex items-center justify-center min-w-0">
          <VowelMap player={smoothed} target={target} distance={dist} captureRadius={CAPTURE_R} voicing={voicing} />
        </div>
        <div className="hidden md:flex flex-col gap-2 w-44 lg:w-52 shrink-0">
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-2">
            <div className="text-[10px] text-gray-500 mb-1 font-medium">共振峰マップ F1×F2</div>
            <FormantChart formants={formants} voicing={voicing} target={target} />
          </div>
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-2 flex-1 flex flex-col">
            <div className="text-[10px] text-gray-500 mb-1 font-medium">周波数スペクトラム</div>
            <div className="flex-1 flex items-end"><SpectrumBars spectrum={spectrum} voicing={voicing} /></div>
            <div className="flex justify-between text-[8px] text-gray-600 mt-1 font-mono"><span>200Hz</span><span>1kHz</span><span>2.5kHz</span><span>4kHz</span></div>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="px-4 pb-2 md:px-8 md:pb-3">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-1.5">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${voicing>0.15?'bg-emerald-500/20 border border-emerald-400':'bg-gray-800 border border-gray-700'}`}>
              {voicing>0.15?<Volume2 className="w-3.5 h-3.5 text-emerald-400"/>:<MicOff className="w-3.5 h-3.5 text-gray-500"/>}
            </div>
            <div className="flex-1 max-w-[140px] h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-75"
                style={{background:voicing>0.5?'#22c55e':voicing>0.15?'#eab308':'#6b7280',width:`${Math.min(100,voicing*200)}%`}} />
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono shrink-0">
              <span className="text-indigo-300">F1:{formants[0]?.toFixed(0)||'—'}</span>
              <span className="text-purple-300">F2:{formants[1]?.toFixed(0)||'—'}</span>
              <span className="text-pink-300">F3:{formants[2]?.toFixed(0)||'—'}</span>
            </div>
            <div className={`text-xs ${rMatch?'text-emerald-400':'text-gray-500'}`}>{smoothed.rounded?'○円唇':'—展唇'}</div>
            <div className={`text-xs ${dist<CAPTURE_R*2?'text-amber-400':'text-gray-500'}`}><Target className="w-3 h-3 inline mr-0.5"/>{(dist*100).toFixed(0)}%</div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-sm font-bold text-emerald-300">{target.ipa}</span>
              <span className="text-xs text-gray-400">{target.name}</span>
            </div>
            <p className="text-[11px] text-gray-500">{level.hint}</p>
          </div>
          {/* Debug log */}
          {debugLog && (
            <div className="mt-1 text-[10px] font-mono text-gray-600 bg-gray-900/30 rounded px-2 py-1 truncate">
              {debugLog}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showDone && <LevelComplete level={lvlIdx+1} capture={lastCap} isLast={lvlIdx+1>=LEVELS.length} onNext={handleNext} />}
      </AnimatePresence>
    </motion.div>
  )
}
