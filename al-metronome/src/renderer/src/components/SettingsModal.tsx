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
  countInEnabled: boolean
  onCountInChange: (enabled: boolean) => void
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  volume,
  onVolumeChange,
  soundType,
  onSoundChange,
  countInEnabled,
  onCountInChange
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

        {/* NOVO: Configuração do Compasso Inicial */}
        <div
          className="control-group"
          style={{
            marginTop: '10px',
            paddingTop: '10px',
            borderTop: '1px solid var(--border-color)'
          }}
        >
          <label style={{ marginBottom: '10px', display: 'block' }}>
            Compasso Inicial (Contagem)
          </label>

          <div style={{ display: 'flex', gap: '20px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              <input
                type="checkbox"
                checked={countInEnabled}
                onChange={(e) => onCountInChange(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent-color)' }}
              />
              Ativar Compasso de Contagem
            </label>
          </div>
          <small
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.8rem',
              marginTop: '5px',
              display: 'block'
            }}
          >
            Toca 1 compasso de preparação antes de iniciar o treino.
          </small>
        </div>

        {/* Desenvolvido */}
        <div className="control-group" style={{ borderTop: '1px solid var(--border-color)' }}>
          <label
            style={{
              marginTop: '10px'
            }}
          >
            Desenvolvimento:
          </label>
          <a href="mailto:contato@alexandrelima.dev">Alexandre Silva Lima</a>
          <label>Versão:</label>
          <p>v{__APP_VERSION__}</p>
        </div>
      </div>
    </div>
  )
}
