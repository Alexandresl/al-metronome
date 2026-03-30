import React from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()

  if (!isOpen) return null

  return (
    <div className="settings-overlay" onClick={onClose}>
      {/* stopPropagation evita que clicar no modal feche ele */}
      <div className="settings-content" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h3>{t('settingsTitle')}</h3>
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        {/* Controle de Volume */}
        <div className="control-group">
          <label>
            {t('generalVolume')}: {volume}%
          </label>
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
          <label>{t('metronomeSound')}</label>
          <select value={soundType} onChange={(e) => onSoundChange(e.target.value as SoundType)}>
            <option value="WAV">{t('soundWav')}</option>
            <option value="DIGITAL">{t('soundDigital')}</option>
            <option value="MECHANICAL">{t('soundMechanical')}</option>
            <option value="BEEP">{t('soundBeep')}</option>
          </select>
        </div>

        {/* Configuração do Compasso Inicial */}
        <div
          className="control-group"
          style={{
            marginTop: '10px',
            paddingTop: '10px',
            borderTop: '1px solid var(--border-color)'
          }}
        >
          <label style={{ marginBottom: '10px', display: 'block' }}>{t('countInMeasure')}</label>

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
              {t('enableCountIn')}
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
            {t('countInDescription')}
          </small>
        </div>

        {/* Desenvolvido por */}
        <div className="control-group" style={{ borderTop: '1px solid var(--border-color)' }}>
          <label
            style={{
              marginTop: '10px'
            }}
          >
            {t('development')}
          </label>
          <a href="mailto:contato@alexandrelima.dev">Alexandre Silva Lima</a>
          <label>{t('version')}</label>
          <p>v{__APP_VERSION__}</p>
        </div>
      </div>
    </div>
  )
}
