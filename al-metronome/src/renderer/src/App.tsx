import { useState, useEffect, useRef } from 'react'
import './assets/base.css'
import { BeatDisplay } from './components/beatDisplay'
import { SpeedTrainerForm } from './components/SpeedTrainerForm'
import { SettingsModal } from './components/SettingsModal'
import { BeatStep, BeatType, SpeedTrainerConfig, SoundType } from './types/metronome.types'
import { MetronomeEngine } from './engine/MetronomeEngine'
import { Play, Square, Settings2, Gauge, Music, CheckCircle2, Moon, Sun } from 'lucide-react'
import { AppIcon } from './components/AppIcon'

type AppMode = 'FREE' | 'TRAINER'

function App() {
  // --- ESTADOS GLOBAIS ---

  // 1. PERSISTÊNCIA DO TEMA
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('app_theme') === 'dark'
  })

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [mode, setMode] = useState<AppMode>('FREE')
  const [isPlaying, setIsPlaying] = useState(false)
  const [bpm, setBpm] = useState(120)
  const [currentBeat, setCurrentBeat] = useState<number>(-1)

  // --- CONFIGURAÇÃO DE ÁUDIO ---
  const [volume, setVolume] = useState(80)
  const [soundType, setSoundType] = useState<SoundType>('DIGITAL')

  const [steps, setSteps] = useState<BeatStep[]>([
    { index: 0, type: 'ACCENT' },
    { index: 1, type: 'NORMAL' },
    { index: 2, type: 'NORMAL' },
    { index: 3, type: 'NORMAL' }
  ])

  const [trainerConfig, setTrainerConfig] = useState<SpeedTrainerConfig | null>(null)
  const barsCountedRef = useRef(0)
  const [barsDisplay, setBarsDisplay] = useState(0)

  const engineRef = useRef<MetronomeEngine | null>(null)

  // --- EFEITOS ---

  // 2. APLICAÇÃO E SALVAMENTO DO TEMA
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-theme')
      localStorage.setItem('app_theme', 'dark')
    } else {
      document.body.classList.remove('dark-theme')
      localStorage.setItem('app_theme', 'light')
    }
  }, [isDarkMode])

  // Inicialização Engine
  useEffect(() => {
    engineRef.current = new MetronomeEngine((beatIndex) => {
      setCurrentBeat(beatIndex)
    })
    engineRef.current.setVolume(volume)

    return () => {
      engineRef.current?.stop()
    }
  }, [])

  // Sincronização Áudio
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setVolume(volume)
      engineRef.current.setSoundType(soundType)
    }
  }, [volume, soundType])

  // Sincronização Lógica
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setSteps(steps)
      engineRef.current.setBpm(bpm)
    }
  }, [steps, bpm])

  // Lógica Trainer
  useEffect(() => {
    if (isPlaying && mode === 'TRAINER' && trainerConfig) {
      if (currentBeat === 0) {
        barsCountedRef.current += 1
        setBarsDisplay(barsCountedRef.current)

        if (barsCountedRef.current > trainerConfig.barsInterval) {
          const nextBpm = bpm + trainerConfig.bpmIncrement

          if (nextBpm <= trainerConfig.endBpm) {
            setBpm(nextBpm)
            barsCountedRef.current = 1
            setBarsDisplay(1)
          } else {
            if (bpm < trainerConfig.endBpm) setBpm(trainerConfig.endBpm)
            setBarsDisplay(trainerConfig.barsInterval)
          }
        }
      }
    }
  }, [currentBeat])

  // --- HANDLERS ---
  const stopAudio = () => {
    if (engineRef.current) {
      engineRef.current.stop()
      setIsPlaying(false)
      setCurrentBeat(-1)
    }
  }

  const togglePlay = async () => {
    if (!engineRef.current) return
    if (isPlaying) {
      stopAudio()
    } else {
      if (mode === 'TRAINER' && !trainerConfig) return
      await engineRef.current.start()
      setIsPlaying(true)
      barsCountedRef.current = 0
      setBarsDisplay(0)
    }
  }

  const handleStartTrainer = async (config: SpeedTrainerConfig) => {
    setTrainerConfig(config)
    setBpm(config.startBpm)
    barsCountedRef.current = 0
    setBarsDisplay(0)

    if (engineRef.current) {
      engineRef.current.stop()
      setTimeout(async () => {
        await engineRef.current?.start()
        setIsPlaying(true)
      }, 50)
    }
  }

  const handleBeatClick = (index: number) => {
    const newSteps = [...steps]
    const currentType = newSteps[index].type
    let nextType: BeatType = 'ACCENT'
    if (currentType === 'ACCENT') nextType = 'NORMAL'
    else if (currentType === 'NORMAL') nextType = 'MUTE'
    newSteps[index].type = nextType
    setSteps(newSteps)
  }

  return (
    <div className="app-container" style={{ overflowY: 'auto' }}>
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        volume={volume}
        onVolumeChange={setVolume}
        soundType={soundType}
        onSoundChange={setSoundType}
      />

      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '10px 20px',
          alignItems: 'center',
          flexShrink: 0
        }}
      >
        {/* Título com Ícone e ID Visual - CORRIGIDO AQUI */}
        <div
          style={{
            fontWeight: 'bold',
            fontSize: '1.2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <AppIcon size={28} /> {/* O Ícone voltou! */}
          <span>AL Metronome</span>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="icon-btn"
            onClick={() => setIsDarkMode(!isDarkMode)}
            title={isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            {isDarkMode ? (
              <Sun size={24} color="var(--text-secondary)" />
            ) : (
              <Moon size={24} color="var(--text-secondary)" />
            )}
          </button>

          <button
            className="icon-btn"
            onClick={() => setSettingsOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            title="Configurações de Áudio"
          >
            <Settings2 size={24} color="var(--text-secondary)" />
          </button>
        </div>
      </header>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '20px',
          marginBottom: '5px',
          flexShrink: 0
        }}
      >
        <button
          onClick={() => {
            setMode('FREE')
            stopAudio()
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            borderBottom:
              mode === 'FREE' ? '3px solid var(--accent-color)' : '3px solid transparent',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: mode === 'FREE' ? 'var(--text-primary)' : 'var(--text-secondary)'
          }}
        >
          <Music size={18} /> Modo Livre
        </button>
        <button
          onClick={() => {
            setMode('TRAINER')
            stopAudio()
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            borderBottom:
              mode === 'TRAINER' ? '3px solid var(--accent-color)' : '3px solid transparent',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: mode === 'TRAINER' ? 'var(--text-primary)' : 'var(--text-secondary)'
          }}
        >
          <Gauge size={18} /> Speed Trainer
        </button>
      </div>

      <main className="main-content" style={{ justifyContent: 'flex-start', paddingTop: '5px' }}>
        {mode === 'FREE' ? (
          <div style={{ textAlign: 'center', marginBottom: '15px', animation: 'fadeIn 0.3s' }}>
            <h1 style={{ fontSize: '4rem', margin: 0, fontWeight: 700 }}>
              {bpm}{' '}
              <span style={{ fontSize: '1.5rem', fontWeight: 400, color: 'var(--text-secondary)' }}>
                BPM
              </span>
            </h1>
            <input
              type="range"
              min="20"
              max="240"
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              style={{ width: '300px', margin: '15px 0' }}
            />
          </div>
        ) : (
          <div
            style={{
              marginBottom: '5px',
              width: '100%',
              animation: 'fadeIn 0.3s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            {!isPlaying ? (
              <SpeedTrainerForm onStartTrainer={handleStartTrainer} isRunning={isPlaying} />
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  background: 'var(--bg-panel)',
                  padding: '15px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  width: '100%',
                  maxWidth: '400px'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '5px',
                    color: 'var(--text-secondary)',
                    fontSize: '0.8rem'
                  }}
                >
                  <span>META: {trainerConfig?.endBpm} BPM</span>
                  <span>
                    {bpm >= (trainerConfig?.endBpm || 0) ? (
                      <span style={{ color: 'var(--beat-accent)', display: 'flex', gap: '5px' }}>
                        <CheckCircle2 size={16} /> MÁXIMO
                      </span>
                    ) : (
                      <span>PRÓXIMO: {bpm + (trainerConfig?.bpmIncrement || 0)}</span>
                    )}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: '4rem',
                    fontWeight: 'bold',
                    color: 'var(--accent-color)',
                    lineHeight: 1
                  }}
                >
                  {bpm}
                </div>
                <div
                  style={{
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '8px'
                  }}
                >
                  BPM ATUAL
                </div>

                {bpm < (trainerConfig?.endBpm || 0) && (
                  <div
                    style={{
                      background: 'var(--bg-primary)',
                      height: '8px',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min((barsDisplay / (trainerConfig?.barsInterval || 1)) * 100, 100)}%`,
                        height: '100%',
                        background: 'var(--text-primary)',
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                )}
                {bpm < (trainerConfig?.endBpm || 0) && (
                  <div
                    style={{ marginTop: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}
                  >
                    Compasso {barsDisplay} de {trainerConfig?.barsInterval}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <BeatDisplay steps={steps} currentStepIndex={currentBeat} onBeatClick={handleBeatClick} />

        {(mode === 'FREE' || isPlaying) && (
          <div style={{ marginTop: '15px', paddingBottom: '10px', flexShrink: 0 }}>
            <button
              onClick={togglePlay}
              style={{
                background: isPlaying ? '#ef4444' : 'var(--accent-color)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '70px',
                height: '70px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                transition: 'all 0.2s'
              }}
            >
              {isPlaying ? (
                <Square size={28} fill="white" />
              ) : (
                <Play size={32} fill="white" style={{ marginLeft: '4px' }} />
              )}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
