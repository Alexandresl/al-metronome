import React, { useState, useEffect } from 'react'
import './SpeedTrainerForm.css' // Podemos reutilizar o CSS do outro form
import { TimeTrainerConfig } from '../types/metronome.types'
import { useTranslation } from 'react-i18next'

interface TimeTrainerFormProps {
  onStart: (config: TimeTrainerConfig) => void
  isRunning: boolean
}

export const TimeTrainerForm: React.FC<TimeTrainerFormProps> = ({ onStart, isRunning }) => {
  const { t } = useTranslation()

  // Persistência
  const getSavedValue = (key: string, defaultValue: number): number => {
    const saved = localStorage.getItem(key)
    return saved ? Number(saved) : defaultValue
  }

  const [bpm, setBpm] = useState(() => getSavedValue('time_bpm', 100))
  const [minutes, setMinutes] = useState(() => getSavedValue('time_minutes', 5))

  useEffect(() => {
    localStorage.setItem('time_bpm', String(bpm))
    localStorage.setItem('time_minutes', String(minutes))
  }, [bpm, minutes])

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    onStart({ bpm, minutes })
  }

  return (
    <div className="trainer-container">
      <form onSubmit={handleSubmit}>
        <div className="trainer-grid">
          {/* BPM ÚNICO */}
          <div className="input-group">
            <label>{t('trainingBpm')}</label>
            <input
              type="number"
              min="20"
              max="300"
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
            />
          </div>

          {/* DURAÇÃO */}
          <div className="input-group">
            <label>{t('durationMinutes')}</label>
            <input
              type="number"
              min="1"
              max="120"
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
            />
          </div>
        </div>

        <button type="submit" className="action-btn" disabled={isRunning}>
          {isRunning ? t('trainingInProgress') : t('startTimeTraining')}
        </button>
      </form>
    </div>
  )
}
