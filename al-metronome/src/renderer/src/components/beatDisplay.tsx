// src/renderer/src/components/BeatDisplay.tsx
import React from 'react'
import { BeatStep } from '../types/metronome.types'
import './BeatDisplay.css'

interface BeatDisplayProps {
  steps: BeatStep[] // O array de batidas (ex: 4 batidas)
  currentStepIndex: number // Qual batida está tocando agora? (-1 se parado)
  onBeatClick: (index: number) => void // O que acontece ao clicar na caixa
}

export const BeatDisplay: React.FC<BeatDisplayProps> = ({
  steps,
  currentStepIndex,
  onBeatClick
}) => {
  return (
    <div className="beat-display-container">
      {steps.map((beat, index) => {
        // Define as classes CSS dinamicamente
        const isActive = index === currentStepIndex
        const typeClass = `type-${beat.type.toLowerCase()}` // ex: type-accent
        const activeClass = isActive ? 'active' : ''

        return (
          <div
            key={index}
            className={`beat-box ${typeClass} ${activeClass}`}
            onClick={() => onBeatClick(index)}
            title={`Tempo ${index + 1}: ${beat.type}`}
          >
            {/* Visual indicador interno (opcional) */}
            {beat.type === 'MUTE' && <span style={{ fontSize: '20px', color: 'gray' }}>✕</span>}
          </div>
        )
      })}
    </div>
  )
}
