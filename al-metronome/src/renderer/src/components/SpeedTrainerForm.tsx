// src/renderer/src/components/SpeedTrainerForm.tsx
import React, { useState } from 'react'
import './SpeedTrainerForm.css'
import { SpeedTrainerConfig } from '../types/metronome.types'

interface SpeedTrainerFormProps {
  onStartTrainer: (config: SpeedTrainerConfig) => void
  isRunning: boolean
}

export const SpeedTrainerForm: React.FC<SpeedTrainerFormProps> = ({
  onStartTrainer,
  isRunning
}) => {
  // Estado local do formulário
  const [startBpm, setStartBpm] = useState(60)
  const [endBpm, setEndBpm] = useState(120)
  const [increment, setIncrement] = useState(5)
  const [bars, setBars] = useState(2)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validação básica (Analista adora validação)
    if (startBpm >= endBpm) {
      alert('O BPM Final deve ser maior que o Inicial para o treino de velocidade.')
      return
    }

    onStartTrainer({
      startBpm,
      endBpm,
      bpmIncrement: increment,
      barsInterval: bars,
      isEnabled: true
    })
  }

  return (
    <div className="trainer-container">
      <form onSubmit={handleSubmit}>
        <div className="trainer-grid">
          {/* BPM Inicial */}
          <div className="input-group">
            <label>BPM Inicial</label>
            <input
              type="number"
              value={startBpm}
              onChange={(e) => setStartBpm(Number(e.target.value))}
              min="20"
              max="300"
            />
          </div>

          {/* BPM Final */}
          <div className="input-group">
            <label>BPM Alvo</label>
            <input
              type="number"
              value={endBpm}
              onChange={(e) => setEndBpm(Number(e.target.value))}
              min="20"
              max="300"
            />
          </div>

          {/* Incremento */}
          <div className="input-group">
            <label>Incremento (BPM)</label>
            <input
              type="number"
              value={increment}
              onChange={(e) => setIncrement(Number(e.target.value))}
              min="1"
              max="50"
            />
          </div>

          {/* Intervalo de Compassos */}
          <div className="input-group">
            <label>A cada (Compassos)</label>
            <input
              type="number"
              value={bars}
              onChange={(e) => setBars(Number(e.target.value))}
              min="1"
              max="100"
            />
          </div>
        </div>

        <button type="submit" className="action-btn" disabled={isRunning}>
          {isRunning ? 'Treino em Andamento...' : 'Iniciar Treino'}
        </button>
      </form>
    </div>
  )
}
