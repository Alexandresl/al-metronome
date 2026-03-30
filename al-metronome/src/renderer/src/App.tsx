import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import './assets/main.css'
import { BeatDisplay } from './components/beatDisplay'
import { SpeedTrainerForm } from './components/SpeedTrainerForm'
import { TimeTrainerForm } from './components/TimeTrainerForm'
import { SettingsModal } from './components/SettingsModal'
import { AppIcon } from './components/AppIcon'
import {
  BeatStep,
  BeatType,
  SpeedTrainerConfig,
  SoundType,
  TimeTrainerConfig,
  TimeSignature
} from './types/metronome.types'
import { MetronomeEngine } from './engine/MetronomeEngine'
import {
  Play,
  Pause,
  Settings2,
  Gauge,
  Music,
  CheckCircle2,
  Moon,
  Sun,
  Timer,
  AlertCircle,
  Clock,
  Plus,
  Minus,
  XCircle,
  Globe // <-- Adicionado ícone de globo para o idioma
} from 'lucide-react'

type AppMode = 'FREE' | 'SPEED_TRAINER' | 'TIME_TRAINER'

const TabButton = ({
  active,
  onClick,
  icon: Icon,
  label
}: {
  active: boolean
  onClick: () => void
  icon: React.ElementType
  label: string
}): React.JSX.Element => (
  <button
    onClick={onClick}
    style={{
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      borderBottom: active ? '3px solid var(--accent-color)' : '3px solid transparent',
      padding: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
      fontWeight: active ? 'bold' : 'normal',
      transition: 'all 0.2s'
    }}
  >
    <Icon size={18} /> {label}
  </button>
)

function App(): React.JSX.Element {
  // --- INTERNACIONALIZAÇÃO ---
  const { t, i18n } = useTranslation()

  const toggleLanguage = (): void => {
    const langs = ['pt', 'en', 'es']
    const currentIdx = langs.indexOf(i18n.language)
    const nextIdx = currentIdx === -1 ? 0 : (currentIdx + 1) % langs.length
    const nextLang = langs[nextIdx]
    i18n.changeLanguage(nextLang)
    localStorage.setItem('app_language', nextLang)
  }

  // --- PERSISTÊNCIA ---
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('app_theme') === 'dark')
  const [countInEnabled, setCountInEnabled] = useState(() => {
    const saved = localStorage.getItem('app_countIn')
    return saved !== null ? saved === 'true' : true
  })

  // --- ESTADOS GERAIS ---
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [mode, setMode] = useState<AppMode>('FREE')
  const [isPlaying, setIsPlaying] = useState(false)
  const [bpm, setBpm] = useState(120)
  const [currentBeat, setCurrentBeat] = useState<number>(-1)

  // Estado do Compasso na raiz do componente
  const [timeSignature, setTimeSignature] = useState<TimeSignature>(() => {
    const saved = localStorage.getItem('app_timeSignature')
    if (saved) {
      try {
        return JSON.parse(saved) // Deserializa o JSON guardado
      } catch (e) {
        console.error('Falha ao recuperar o compasso do cache, retornando fallback.', e)
      }
    }
    return { numerator: 4, denominator: 4 } // Fallback corporativo seguro
  })

  // --- ESTADOS DOS TREINOS ---
  const [elapsedTime, setElapsedTime] = useState(0)
  const [totalDuration, setTotalDuration] = useState(0)

  const [speedConfig, setSpeedConfig] = useState<SpeedTrainerConfig | null>(null)
  const [timeConfig, setTimeConfig] = useState<TimeTrainerConfig | null>(null)

  const barsCountedRef = useRef(0)
  const [barsDisplay, setBarsDisplay] = useState(0)
  const [isCountInPhase, setIsCountInPhase] = useState(false)

  // --- ÁUDIO ---
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('app_volume')
    return saved ? Number(saved) : 80
  })

  const [soundType, setSoundType] = useState<SoundType>(() => {
    // Força a seleção do WAV para que todos os usuários (mesmo os antigos)
    // conheçam o novo timbre padrão após a atualização:
    if (!localStorage.getItem('app_wav_migrated')) {
      localStorage.setItem('app_wav_migrated', 'true')
      return 'WAV'
    }

    const saved = localStorage.getItem('app_soundType')
    if (saved && ['DIGITAL', 'MECHANICAL', 'BEEP', 'WAV'].includes(saved)) {
      return saved as SoundType
    }
    return 'WAV'
  })
  const engineRef = useRef<MetronomeEngine | null>(null)

  const [steps, setSteps] = useState<BeatStep[]>([
    { index: 0, type: 'ACCENT' },
    { index: 1, type: 'NORMAL' },
    { index: 2, type: 'NORMAL' },
    { index: 3, type: 'NORMAL' }
  ])

  // --- FUNÇÕES AUXILIARES ---
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const calculateSpeedTrainerDuration = (
    config: SpeedTrainerConfig,
    stepsCount: number
  ): number => {
    let totalSeconds = 0
    let currentB = config.startBpm
    if (countInEnabled) totalSeconds += (60 / currentB) * stepsCount

    while (currentB <= config.endBpm) {
      const secondsPerBeat = 60 / currentB
      const secondsPerBar = secondsPerBeat * stepsCount
      totalSeconds += secondsPerBar * config.barsInterval
      if (currentB === config.endBpm) break
      currentB += config.bpmIncrement
      if (currentB > config.endBpm && currentB - config.bpmIncrement < config.endBpm)
        currentB = config.endBpm
    }
    return totalSeconds
  }

  // --- EFEITOS DE SISTEMA ---
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-theme')
      localStorage.setItem('app_theme', 'dark')
    } else {
      document.body.classList.remove('dark-theme')
      localStorage.setItem('app_theme', 'light')
    }
  }, [isDarkMode])

  // Efeito para persistir a fórmula de compasso sempre que for alterada
  useEffect(() => {
    localStorage.setItem('app_timeSignature', JSON.stringify(timeSignature))
  }, [timeSignature])

  useEffect(() => {
    localStorage.setItem('app_volume', String(volume))
    localStorage.setItem('app_soundType', soundType)
  }, [volume, soundType])

  useEffect(() => localStorage.setItem('app_countIn', String(countInEnabled)), [countInEnabled])

  useEffect(() => {
    engineRef.current = new MetronomeEngine((beatIndex) => setCurrentBeat(beatIndex))
    engineRef.current.setVolume(volume)
    return () => {
      engineRef.current?.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setVolume(volume)
      engineRef.current.setSoundType(soundType)
      engineRef.current.setSteps(steps)
      engineRef.current.setBpm(bpm)
      engineRef.current.setBpm(bpm)
      engineRef.current.setTimeSignature(timeSignature)
    }
  }, [volume, soundType, steps, bpm, timeSignature])

  useEffect(() => {
    setSteps((prevSteps) => {
      return Array.from({ length: timeSignature.numerator }).map((_, i) => {
        // Preserva o tipo (ACCENT/NORMAL/MUTE) se a caixa já existia,
        // senão cria com o padrão corporativo: tempo 1 é Acento, resto é Normal
        const existingStep = prevSteps.find((s) => s.index === i)
        if (existingStep) return existingStep

        return { index: i, type: i === 0 ? 'ACCENT' : ('NORMAL' as BeatType) }
      })
    })

    // Zera o contador visual para evitar crash se o compasso diminuir (ex: de 4/4 para 3/4)
    setCurrentBeat(-1)
  }, [timeSignature.numerator])

  // --- HANDLERS PRINCIPAIS ---
  const pauseAudio = useCallback(() => {
    engineRef.current?.stop()
    setIsPlaying(false)
    setCurrentBeat(-1)
  }, [])

  const fullStop = useCallback(() => {
    pauseAudio()
    setElapsedTime(0)
    setIsCountInPhase(false)
    barsCountedRef.current = 0
    setBarsDisplay(0)
  }, [pauseAudio])

  const togglePlay = useCallback(async (): Promise<void> => {
    if (!engineRef.current) return

    if (isPlaying) {
      pauseAudio()
    } else {
      if (mode === 'SPEED_TRAINER' && !speedConfig) return
      if (mode === 'TIME_TRAINER' && !timeConfig) return

      await engineRef.current.start()
      setIsPlaying(true)

      if (elapsedTime === 0 && mode !== 'FREE') {
        barsCountedRef.current = 0
        setBarsDisplay(0)
        setIsCountInPhase(countInEnabled)
      }
    }
  }, [isPlaying, mode, speedConfig, timeConfig, elapsedTime, countInEnabled, pauseAudio])

  // --- EFEITOS DE LÓGICA DE TREINO ---
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying) {
      interval = setInterval(() => {
        setElapsedTime((prev) => {
          const newTime = prev + 1

          if (mode === 'TIME_TRAINER' && !isCountInPhase && newTime >= totalDuration) {
            engineRef.current?.stop()
            setIsPlaying(false)
            setCurrentBeat(-1)

            setTimeout(() => {
              alert(t('trainingFinished'))
              setTimeConfig(null)
              setElapsedTime(0)
              setIsCountInPhase(false)
            }, 100)

            return totalDuration
          }
          return newTime
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isPlaying, mode, totalDuration, isCountInPhase, t])

  useEffect(() => {
    if (isPlaying && mode === 'SPEED_TRAINER' && speedConfig) {
      if (currentBeat === 0) {
        barsCountedRef.current += 1

        if (isCountInPhase) {
          if (barsCountedRef.current > 1) {
            setIsCountInPhase(false)
            barsCountedRef.current = 1
            setBarsDisplay(1)
          } else {
            setBarsDisplay(0)
          }
          return
        }

        setBarsDisplay(barsCountedRef.current)

        if (barsCountedRef.current > speedConfig.barsInterval) {
          const nextBpm = bpm + speedConfig.bpmIncrement
          if (nextBpm <= speedConfig.endBpm) {
            setBpm(nextBpm)
            barsCountedRef.current = 1
            setBarsDisplay(1)
          } else {
            if (bpm < speedConfig.endBpm) setBpm(speedConfig.endBpm)
            setBarsDisplay(speedConfig.barsInterval)
          }
        }
      }
    }

    if (isPlaying && mode === 'TIME_TRAINER') {
      if (currentBeat === 0 && isCountInPhase) {
        barsCountedRef.current += 1
        if (barsCountedRef.current > 1) {
          setIsCountInPhase(false)
          barsCountedRef.current = 1
          setElapsedTime(0)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBeat])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.code === 'Space') {
        event.preventDefault()
        togglePlay()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [togglePlay])

  // --- HELPERS DE INTERFACE ---
  const handleStartSpeedTrainer = async (config: SpeedTrainerConfig): Promise<void> => {
    setSpeedConfig(config)
    setBpm(config.startBpm)
    startTrainerCommon(calculateSpeedTrainerDuration(config, steps.length))
  }

  const handleStartTimeTrainer = async (config: TimeTrainerConfig): Promise<void> => {
    setTimeConfig(config)
    setBpm(config.bpm)
    startTrainerCommon(config.minutes * 60)
  }

  const startTrainerCommon = (duration: number): void => {
    fullStop()
    setIsCountInPhase(countInEnabled)
    setTotalDuration(duration)

    if (engineRef.current) {
      setTimeout(async () => {
        await engineRef.current?.start()
        setIsPlaying(true)
      }, 50)
    }
  }

  const handleBeatClick = (index: number): void => {
    const newSteps = [...steps]
    const currentType = newSteps[index].type
    let nextType: BeatType = 'ACCENT'
    if (currentType === 'ACCENT') nextType = 'NORMAL'
    else if (currentType === 'NORMAL') nextType = 'MUTE'
    newSteps[index].type = nextType
    setSteps(newSteps)
  }

  const changeBpmOnPause = (delta: number): void => {
    setBpm((prev) => {
      const val = prev + delta
      if (val < 20) return 20
      if (val > 300) return 300
      return val
    })
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
        countInEnabled={countInEnabled}
        onCountInChange={setCountInEnabled}
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
        <div
          style={{
            fontWeight: 'bold',
            fontSize: '1.2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <AppIcon size={28} /> <span>AL Metronome</span>
        </div>

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          {/* Botão de Idioma */}
          <button
            className="icon-btn"
            onClick={toggleLanguage}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--text-primary)'
            }}
            title="Mudar Idioma / Change Language"
          >
            <Globe size={22} />
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>
              {i18n.language.toUpperCase()}
            </span>
          </button>

          <button
            className="icon-btn"
            onClick={() => setIsDarkMode(!isDarkMode)}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            title={isDarkMode ? t('themeLight') : t('themeDark')}
          >
            {isDarkMode ? (
              <Sun size={24} color="var(--text-primary)" />
            ) : (
              <Moon size={24} color="var(--text-primary)" />
            )}
          </button>

          <button
            className="icon-btn"
            onClick={() => setSettingsOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            title={t('settings')}
          >
            <Settings2 size={24} color="var(--text-primary)" />
          </button>
        </div>
      </header>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '10px',
          marginBottom: '5px',
          flexShrink: 0
        }}
      >
        <TabButton
          active={mode === 'FREE'}
          onClick={() => {
            setMode('FREE')
            fullStop()
          }}
          icon={Music}
          label={t('freeMode')}
        />
        <TabButton
          active={mode === 'TIME_TRAINER'}
          onClick={() => {
            setMode('TIME_TRAINER')
            fullStop()
          }}
          icon={Clock}
          label={t('timeTrainer')}
        />
        <TabButton
          active={mode === 'SPEED_TRAINER'}
          onClick={() => {
            setMode('SPEED_TRAINER')
            fullStop()
          }}
          icon={Gauge}
          label={t('speedTrainer')}
        />
      </div>

      <main className="main-content" style={{ justifyContent: 'flex-start', paddingTop: '5px' }}>
        {mode === 'FREE' && (
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
        )}

        {mode !== 'FREE' && (
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
            {(!speedConfig && mode === 'SPEED_TRAINER') ||
            (!timeConfig && mode === 'TIME_TRAINER') ? (
              <>
                {mode === 'SPEED_TRAINER' && (
                  <SpeedTrainerForm
                    onStartTrainer={handleStartSpeedTrainer}
                    isRunning={isPlaying}
                  />
                )}
                {mode === 'TIME_TRAINER' && (
                  <TimeTrainerForm onStart={handleStartTimeTrainer} isRunning={isPlaying} />
                )}
              </>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  background: 'var(--bg-panel)',
                  padding: '10px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  width: '100%',
                  maxWidth: '400px',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {isCountInPhase && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      background: 'var(--beat-normal)',
                      color: '#000',
                      fontWeight: 'bold',
                      fontSize: '0.8rem',
                      padding: '4px',
                      letterSpacing: '1px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      zIndex: 10
                    }}
                  >
                    <AlertCircle size={14} /> {t('getReady')}
                  </div>
                )}

                {!isPlaying && !isCountInPhase && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      background: 'var(--accent-color)',
                      color: '#fff',
                      fontWeight: 'bold',
                      fontSize: '0.8rem',
                      padding: '4px',
                      letterSpacing: '1px',
                      zIndex: 10
                    }}
                  >
                    {t('paused')}
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '10px',
                    color: 'var(--text-secondary)',
                    fontSize: '0.8rem',
                    marginTop: isCountInPhase || !isPlaying ? '20px' : '0'
                  }}
                >
                  {mode === 'SPEED_TRAINER' ? (
                    <>
                      <span>
                        {t('goal')} {speedConfig?.endBpm} BPM
                      </span>
                      <span>
                        {bpm >= (speedConfig?.endBpm || 0) ? (
                          <span
                            style={{
                              color: 'var(--beat-accent)',
                              display: 'flex',
                              gap: '5px',
                              alignItems: 'center'
                            }}
                          >
                            <CheckCircle2 size={14} /> {t('maximum')}
                          </span>
                        ) : (
                          `${t('next')} ${bpm + (speedConfig?.bpmIncrement || 0)}`
                        )}
                      </span>
                    </>
                  ) : (
                    <>
                      <span>
                        {t('goal')} {timeConfig?.minutes} {t('min')}
                      </span>
                      <span>{t('editable')}</span>
                    </>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '15px'
                  }}
                >
                  {!isPlaying && mode === 'TIME_TRAINER' && (
                    <button
                      onClick={() => changeBpmOnPause(-1)}
                      style={{
                        background: 'none',
                        border: '1px solid var(--border-color)',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        cursor: 'pointer',
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Minus size={20} />
                    </button>
                  )}

                  <div
                    style={{
                      fontSize: '3.5rem',
                      fontWeight: 'bold',
                      color: isCountInPhase ? 'var(--beat-normal)' : 'var(--accent-color)',
                      lineHeight: 1,
                      opacity: isCountInPhase ? 0.7 : 1
                    }}
                  >
                    {bpm}
                  </div>

                  {!isPlaying && mode === 'TIME_TRAINER' && (
                    <button
                      onClick={() => changeBpmOnPause(1)}
                      style={{
                        background: 'none',
                        border: '1px solid var(--border-color)',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        cursor: 'pointer',
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Plus size={20} />
                    </button>
                  )}
                </div>

                <div
                  style={{
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '5px'
                  }}
                >
                  {t('currentBpm')}
                </div>

                <div
                  style={{
                    background: 'var(--bg-primary)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)'
                  }}
                >
                  <Timer size={16} />
                  <span>
                    {formatTime(elapsedTime)} / {formatTime(totalDuration)}
                  </span>
                </div>

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
                      width: isCountInPhase
                        ? '100%'
                        : mode === 'SPEED_TRAINER'
                          ? `${Math.min((barsDisplay / (speedConfig?.barsInterval || 1)) * 100, 100)}%`
                          : `${Math.min((elapsedTime / totalDuration) * 100, 100)}%`,
                      backgroundColor: isCountInPhase
                        ? 'var(--beat-normal)'
                        : 'var(--text-primary)',
                      height: '100%',
                      transition: 'width 0.3s ease',
                      opacity: isCountInPhase ? 0.5 : 1
                    }}
                  />
                </div>

                <div
                  style={{ marginTop: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}
                >
                  {isCountInPhase
                    ? t('countInPhase')
                    : mode === 'SPEED_TRAINER'
                      ? t('measureProgress', {
                          current: barsDisplay,
                          total: speedConfig?.barsInterval
                        })
                      : t('timeProgress')}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SELETOR DE FÓRMULA DE COMPASSO */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
          <select
            value={`${timeSignature.numerator}/${timeSignature.denominator}`}
            onChange={(e) => {
              const [num, den] = e.target.value.split('/').map(Number)
              setTimeSignature({ numerator: num, denominator: den })
              fullStop() // Pausa o metrônomo preventivamente para evitar dessincronização no motor de áudio
            }}
            style={{
              background: 'var(--bg-panel)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {/* Grupo 1: Métrica baseada em Semínimas (Denominador 4) */}
            <option value="2/4">2/4</option>
            <option value="3/4">3/4</option>
            <option value="4/4">4/4</option>
            <option value="5/4">5/4</option>
            <option value="6/4">6/4</option>
            <option value="9/4">9/4</option>

            {/* Grupo 2: Métrica baseada em Colcheias (Denominador 8) */}
            <option value="6/8">6/8</option>
            <option value="7/8">7/8</option>
            <option value="9/8">9/8</option>
            <option value="11/8">11/8</option>
            <option value="12/8">12/8</option>
            <option value="15/8">15/8</option>
          </select>
        </div>

        <BeatDisplay steps={steps} currentStepIndex={currentBeat} onBeatClick={handleBeatClick} />

        {(mode === 'FREE' || isPlaying || speedConfig || timeConfig) && (
          <div
            style={{
              marginTop: '10px',
              paddingBottom: '10px',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '20px'
            }}
          >
            {mode !== 'FREE' && (isPlaying || speedConfig || timeConfig) && (
              <button
                onClick={() => {
                  fullStop()
                  setSpeedConfig(null)
                  setTimeConfig(null)
                }}
                title={t('abort')}
                style={{
                  background: 'var(--bg-panel)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '50%',
                  width: '50px',
                  height: '50px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)',
                  transition: 'all 0.2s'
                }}
              >
                <XCircle size={24} />
              </button>
            )}

            <button
              onClick={togglePlay}
              title={t('playPause')}
              style={{
                background: isPlaying ? 'var(--bg-panel)' : 'var(--accent-color)',
                border: isPlaying ? '2px solid var(--accent-color)' : 'none',
                color: isPlaying ? 'var(--accent-color)' : 'white',
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
                <Pause size={32} fill="currentColor" />
              ) : (
                <Play size={32} fill="white" style={{ marginLeft: '4px' }} />
              )}
            </button>

            {mode !== 'FREE' && <div style={{ width: '50px' }}></div>}
          </div>
        )}
      </main>
    </div>
  )
}

export default App
