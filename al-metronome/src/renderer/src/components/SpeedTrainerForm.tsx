import React, { useState, useEffect } from 'react'
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
  // Funções auxiliares para persistência
  // Tenta ler do armazenamento, se não tiver, retorna o valor padrão
  const getSavedValue = (key: string, defaultValue: number) => {
    const saved = localStorage.getItem(key)
    return saved ? Number(saved) : defaultValue
  }

  // Inicializa o estado lendo do localStorage (Lazy Initialization)
  const [startBpm, setStartBpm] = useState(() => getSavedValue('trainer_startBpm', 60))
  const [endBpm, setEndBpm] = useState(() => getSavedValue('trainer_endBpm', 120))
  const [increment, setIncrement] = useState(() => getSavedValue('trainer_increment', 5))
  const [bars, setBars] = useState(() => getSavedValue('trainer_bars', 2))

  // Opcional: Salvar automaticamente assim que alterar (UX mais fluida)
  // Ou podemos salvar apenas no Submit. Vamos salvar no Submit para evitar escritas excessivas,
  // mas como é local, salvar no efeito abaixo garante que guarde mesmo se não iniciar.

  useEffect(() => {
    localStorage.setItem('trainer_startBpm', String(startBpm))
    localStorage.setItem('trainer_endBpm', String(endBpm))
    localStorage.setItem('trainer_increment', String(increment))
    localStorage.setItem('trainer_bars', String(bars))
  }, [startBpm, endBpm, increment, bars])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (startBpm >= endBpm) {
      alert('O BPM Final deve ser maior que o Inicial para o treino de velocidade.')
      return
    }

    // A persistência já está sendo feita pelo useEffect acima,
    // então aqui focamos apenas na lógica de negócio.

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
