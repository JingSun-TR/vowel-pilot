import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { VOWELS } from '../data/vowels'

// Map IPA coordinates to SVG viewBox coordinates
// The vowel quadrilateral is a trapezoid: front (left) is taller, back (right) is shorter
function ipaToSvg(x, y, w, h, pad) {
  // Trapezoid: top edge narrower than bottom
  const topInset = w * 0.12
  const leftX = pad + topInset * x
  const rightX = pad + w - topInset * (1 - x)
  const svgX = leftX + (rightX - leftX) * x
  const svgY = pad + y * h
  return { x: svgX, y: svgY }
}

export default function VowelMap({ player, target, distance, roundedMatch, captureRadius }) {
  const mapW = 500
  const mapH = 400
  const pad = 50

  // Compute positions for all vowels
  const vowelPositions = useMemo(() => {
    return VOWELS.map(v => ({
      ...v,
      svg: ipaToSvg(v.x, v.y, mapW - pad * 2, mapH - pad * 2, pad),
    }))
  }, [])

  const playerSvg = ipaToSvg(player.x, player.y, mapW - pad * 2, mapH - pad * 2, pad)
  const targetSvg = ipaToSvg(target.x, target.y, mapW - pad * 2, mapH - pad * 2, pad)

  // Quadrilateral corners (trapezoid)
  const corners = [
    ipaToSvg(0, 0, mapW - pad * 2, mapH - pad * 2, pad),   // front-close (top-left)
    ipaToSvg(1, 0, mapW - pad * 2, mapH - pad * 2, pad),   // back-close (top-right)
    ipaToSvg(1, 1, mapW - pad * 2, mapH - pad * 2, pad),   // back-open (bottom-right)
    ipaToSvg(0, 1, mapW - pad * 2, mapH - pad * 2, pad),   // front-open (bottom-left)
  ]

  const quadPath = corners.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ') + ' Z'

  // Grid lines (3 horizontal for close/mid/open, 3 vertical for front/central/back)
  const hLines = [0, 0.33, 0.67, 1].map(y => {
    const left = ipaToSvg(0, y, mapW - pad * 2, mapH - pad * 2, pad)
    const right = ipaToSvg(1, y, mapW - pad * 2, mapH - pad * 2, pad)
    return { left, right, label: y === 0 ? 'Close' : y === 0.33 ? 'Mid' : y === 0.67 ? 'Open-mid' : 'Open' }
  })

  const vLines = [0, 0.5, 1].map(x => {
    const top = ipaToSvg(x, 0, mapW - pad * 2, mapH - pad * 2, pad)
    const bottom = ipaToSvg(x, 1, mapW - pad * 2, mapH - pad * 2, pad)
    return { top, bottom, label: x === 0 ? 'Front' : x === 0.5 ? 'Central' : 'Back' }
  })

  return (
    <div className="w-full max-w-[500px] aspect-square relative">
      <svg
        viewBox={`0 0 ${mapW} ${mapH}`}
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Player glow */}
          <radialGradient id="playerGlow">
            <stop offset="0%" stopColor="#f472b6" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#f472b6" stopOpacity="0" />
          </radialGradient>
          {/* Target glow */}
          <radialGradient id="targetGlow">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
          </radialGradient>
          {/* Capture zone */}
          <radialGradient id="captureZone">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.15" />
            <stop offset="70%" stopColor="#fbbf24" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Quadrilateral outline */}
        <path
          d={quadPath}
          fill="none"
          stroke="#4f46e5"
          strokeWidth="1.5"
          opacity="0.4"
        />

        {/* Quadrilateral fill */}
        <path
          d={quadPath}
          fill="#4f46e5"
          opacity="0.05"
        />

        {/* Grid lines */}
        {hLines.map((line, i) => (
          <line
            key={`h-${i}`}
            x1={line.left.x} y1={line.left.y}
            x2={line.right.x} y2={line.right.y}
            stroke="#4f46e5"
            strokeWidth="0.5"
            opacity="0.2"
            strokeDasharray="4 4"
          />
        ))}
        {vLines.map((line, i) => (
          <line
            key={`v-${i}`}
            x1={line.top.x} y1={line.top.y}
            x2={line.bottom.x} y2={line.bottom.y}
            stroke="#4f46e5"
            strokeWidth="0.5"
            opacity="0.2"
            strokeDasharray="4 4"
          />
        ))}

        {/* Axis labels */}
        {hLines.map((line, i) => (
          <text
            key={`hl-${i}`}
            x={line.left.x - 8}
            y={line.left.y + 4}
            fill="#6b7280"
            fontSize="9"
            textAnchor="end"
            fontFamily="system-ui"
          >
            {line.label}
          </text>
        ))}
        {vLines.map((line, i) => (
          <text
            key={`vl-${i}`}
            x={line.top.x}
            y={line.top.y - 8}
            fill="#6b7280"
            fontSize="9"
            textAnchor="middle"
            fontFamily="system-ui"
          >
            {line.label}
          </text>
        ))}

        {/* Capture zone around target */}
        <circle
          cx={targetSvg.x}
          cy={targetSvg.y}
          r={captureRadius * (mapW - pad * 2)}
          fill="url(#captureZone)"
          stroke="#fbbf24"
          strokeWidth="1"
          opacity="0.5"
          strokeDasharray="4 4"
        />

        {/* Target glow */}
        <circle
          cx={targetSvg.x}
          cy={targetSvg.y}
          r={30}
          fill="url(#targetGlow)"
          filter="url(#softGlow)"
        />

        {/* Target vowel */}
        <circle
          cx={targetSvg.x}
          cy={targetSvg.y}
          r={14}
          fill="none"
          stroke="#34d399"
          strokeWidth="2"
          opacity="0.8"
        />
        <text
          x={targetSvg.x}
          y={targetSvg.y + 5}
          fill="#34d399"
          fontSize="16"
          fontWeight="bold"
          textAnchor="middle"
          fontFamily="system-ui"
        >
          {target.ipa}
        </text>

        {/* All vowel positions (dimmed) */}
        {vowelPositions.map((v, i) => {
          const isTarget = v.ipa === target.ipa
          if (isTarget) return null
          return (
            <g key={i}>
              <circle
                cx={v.svg.x}
                cy={v.svg.y}
                r={v.rounded ? 8 : 6}
                fill="none"
                stroke="#6366f1"
                strokeWidth="1"
                opacity="0.3"
                strokeDasharray={v.rounded ? 'none' : '2 2'}
              />
              <text
                x={v.svg.x}
                y={v.svg.y + 3.5}
                fill="#818cf8"
                fontSize="10"
                textAnchor="middle"
                fontFamily="system-ui"
                opacity="0.5"
              >
                {v.ipa}
              </text>
            </g>
          )
        })}

        {/* Player glow */}
        <circle
          cx={playerSvg.x}
          cy={playerSvg.y}
          r={35}
          fill="url(#playerGlow)"
          filter="url(#softGlow)"
        />

        {/* Player trail (last few positions would be nice but keeping it simple) */}
        <circle
          cx={playerSvg.x}
          cy={playerSvg.y}
          r={12}
          fill={player.rounded ? '#f472b6' : '#f472b6'}
          stroke={player.rounded ? '#ec4899' : '#f9a8d4'}
          strokeWidth={player.rounded ? 3 : 1.5}
          filter="url(#glow)"
          opacity="0.9"
        />

        {/* Player inner indicator for rounding */}
        {player.rounded ? (
          <circle
            cx={playerSvg.x}
            cy={playerSvg.y}
            r={5}
            fill="none"
            stroke="white"
            strokeWidth="1.5"
            opacity="0.7"
          />
        ) : (
          <line
            x1={playerSvg.x - 5}
            y1={playerSvg.y}
            x2={playerSvg.x + 5}
            y2={playerSvg.y}
            stroke="white"
            strokeWidth="1.5"
            opacity="0.7"
          />
        )}

        {/* Connection line from player to target */}
        <line
          x1={playerSvg.x}
          y1={playerSvg.y}
          x2={targetSvg.x}
          y2={targetSvg.y}
          stroke={distance < captureRadius ? '#fbbf24' : '#4f46e5'}
          strokeWidth="1"
          opacity="0.3"
          strokeDasharray="6 4"
        />
      </svg>
    </div>
  )
}
