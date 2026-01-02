import React from 'react'
import './SettingsModal.css'
import { SoundType } from '../types/metronome.types'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  volume: number
  onVolumeChange: (vol: number) => void
  soundType: SoundType
  onSoundChange: (type: SoundType) => void
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  volume,
  onVolumeChange,
  soundType,
  onSoundChange
}) => {
  if (!isOpen) return null

  return (
    <div className="settings-overlay" onClick={onClose}>
      {/* stopPropagation evita que clicar no modal feche ele */}
      <div className="settings-content" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h3>Configurações</h3>
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        {/* Controle de Volume */}
        <div className="control-group">
          <label>Volume Geral: {volume}%</label>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
          />
        </div>

        {/* Seletor de Som */}
        <div className="control-group">
          <label>Timbre do Metrônomo</label>
          <select value={soundType} onChange={(e) => onSoundChange(e.target.value as SoundType)}>
            <option value="DIGITAL">Digital (Padrão)</option>
            <option value="MECHANICAL">Mecânico (Woodblock)</option>
            <option value="BEEP">Beep Digital</option>
          </select>
        </div>

        {/* Desenvolvido */}
        <div className="control-group">
          <label>Desenvolvido:</label>
          <a href="mailto:contato@alexandrelima.dev">Alexandre Silva Lima</a>
          <label>Versão:</label>
          <p>1.0v</p>
        </div>
      </div>
    </div>
  )
}
