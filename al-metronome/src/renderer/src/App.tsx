import { useState, useEffect, useRef, useCallback } from 'react'
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
  TimeTrainerConfig
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
  XCircle
} from 'lucide-react'

type AppMode = 'FREE' | 'SPEED_TRAINER' | 'TIME_TRAINER'

function App() {
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
    const saved = localStorage.getItem('app_soundType')
    // Validação simples para garantir que é um tipo válido
    return saved === 'MECHANICAL' || saved === 'BEEP' ? saved : 'DIGITAL'
  })
  const engineRef = useRef<MetronomeEngine | null>(null)

  const [steps, setSteps] = useState<BeatStep[]>([
    { index: 0, type: 'ACCENT' },
    { index: 1, type: 'NORMAL' },
    { index: 2, type: 'NORMAL' },
    { index: 3, type: 'NORMAL' }
  ])

  // --- FUNÇÕES AUXILIARES ---
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const calculateSpeedTrainerDuration = (config: SpeedTrainerConfig, stepsCount: number) => {
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

  // Tema
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-theme')
      localStorage.setItem('app_theme', 'dark')
    } else {
      document.body.classList.remove('dark-theme')
      localStorage.setItem('app_theme', 'light')
    }
  }, [isDarkMode])

  useEffect(() => {
    localStorage.setItem('app_volume', String(volume))
    localStorage.setItem('app_soundType', soundType)
  }, [volume, soundType])

  useEffect(() => localStorage.setItem('app_countIn', String(countInEnabled)), [countInEnabled])

  // Inicialização Engine
  useEffect(() => {
    engineRef.current = new MetronomeEngine((beatIndex) => setCurrentBeat(beatIndex))
    engineRef.current.setVolume(volume)
    return () => {
      engineRef.current?.stop()
    }
  }, [])

  // Sync Áudio
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setVolume(volume)
      engineRef.current.setSoundType(soundType)
      engineRef.current.setSteps(steps)
      engineRef.current.setBpm(bpm)
    }
  }, [volume, soundType, steps, bpm])

  // --- HANDLERS PRINCIPAIS ---

  // 1. Pause Audio (Não reseta nada)
  const pauseAudio = useCallback(() => {
    engineRef.current?.stop()
    setIsPlaying(false)
    setCurrentBeat(-1)
    // Nota: Não resetamos elapsedTime nem isCountInPhase aqui
  }, [])

  // 2. Stop Total (Reseta tudo - Botão "Abortar")
  const fullStop = useCallback(() => {
    pauseAudio()
    setElapsedTime(0)
    setIsCountInPhase(false)
    barsCountedRef.current = 0
    setBarsDisplay(0)
    // Se quiser que ao parar ele saia do modo "Visualização" para o "Formulário",
    // precisamos limpar a config ativa. Mas vamos manter visual por enquanto ou limpar:
    // setTimeConfig(null); setSpeedConfig(null);
    // Para UX melhor: só reseta os contadores.
  }, [pauseAudio])

  // 3. Toggle Play/Pause (Lógica Inteligente)
  const togglePlay = useCallback(async () => {
    if (!engineRef.current) return

    if (isPlaying) {
      // Se está tocando, PAUSA.
      pauseAudio()
    } else {
      // Se está parado/pausado, RETOMA ou INICIA.

      // Validação de Configuração
      if (mode === 'SPEED_TRAINER' && !speedConfig) return
      if (mode === 'TIME_TRAINER' && !timeConfig) return

      await engineRef.current.start()
      setIsPlaying(true)

      // Se for um inicio "do zero" (elapsedTime == 0), configura estado inicial
      // Se elapsedTime > 0, assume que é um "Resume" e não reseta nada.
      if (elapsedTime === 0 && mode !== 'FREE') {
        barsCountedRef.current = 0
        setBarsDisplay(0)
        setIsCountInPhase(countInEnabled)
      }
    }
  }, [isPlaying, mode, speedConfig, timeConfig, elapsedTime, countInEnabled, pauseAudio])

  // --- EFEITOS DE LÓGICA DE TREINO ---

  // Cronômetro Central e Parada Automática
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying) {
      interval = setInterval(() => {
        setElapsedTime((prev) => {
          const newTime = prev + 1

          // Lógica de Parada para TIME TRAINER
          if (mode === 'TIME_TRAINER' && !isCountInPhase && newTime >= totalDuration) {
            // 1. Para o motor de áudio imediatamente
            engineRef.current?.stop()
            setIsPlaying(false)
            setCurrentBeat(-1)

            // 2. Exibe alerta e, ao clicar OK, reseta para a tela inicial (Formulário)
            setTimeout(() => {
              alert('Treino por Tempo Finalizado!')

              // --- A MUDANÇA ESTÁ AQUI ---
              setTimeConfig(null) // Isso remove a tela de "Execução" e volta para o Form
              setElapsedTime(0) // Zera o cronômetro
              setIsCountInPhase(false)
            }, 100)

            return totalDuration
          }
          return newTime
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isPlaying, mode, totalDuration, isCountInPhase])

  // Lógica do Speed Trainer e Count-in
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

    // Gestão do Count-in no Time Trainer
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
  }, [currentBeat])

  // --- TECLA DE ESPAÇO (HOTKEY) ---
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault() // Evita scroll da página
        togglePlay()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [togglePlay]) // togglePlay é dependencia estável (useCallback)

  // --- HELPERS DE INTERFACE ---
  const handleStartSpeedTrainer = async (config: SpeedTrainerConfig) => {
    setSpeedConfig(config)
    setBpm(config.startBpm)
    startTrainerCommon(calculateSpeedTrainerDuration(config, steps.length))
  }

  const handleStartTimeTrainer = async (config: TimeTrainerConfig) => {
    setTimeConfig(config)
    setBpm(config.bpm)
    startTrainerCommon(config.minutes * 60)
  }

  const startTrainerCommon = (duration: number) => {
    fullStop() // Garante reset
    setIsCountInPhase(countInEnabled)
    setTotalDuration(duration)

    // Pequeno delay para iniciar
    if (engineRef.current) {
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

  const changeBpmOnPause = (delta: number) => {
    setBpm((prev) => {
      const val = prev + delta
      if (val < 20) return 20
      if (val > 300) return 300
      return val
    })
  }

  const TabButton = ({ active, onClick, icon: Icon, label }) => (
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

        <div style={{ display: 'flex', gap: '10px' }}>
          {/* Botão Dark Mode - Com estilo transparente restaurado */}
          <button
            className="icon-btn"
            onClick={() => setIsDarkMode(!isDarkMode)}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            title={isDarkMode ? 'Mudar para Claro' : 'Mudar para Escuro'}
          >
            {isDarkMode ? (
              <Sun size={24} color="var(--text-primary)" />
            ) : (
              <Moon size={24} color="var(--text-primary)" />
            )}
          </button>

          {/* Botão Settings - Com estilo transparente restaurado */}
          <button
            className="icon-btn"
            onClick={() => setSettingsOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            title="Configurações"
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
          label="Livre"
        />
        <TabButton
          active={mode === 'TIME_TRAINER'}
          onClick={() => {
            setMode('TIME_TRAINER')
            fullStop()
          }}
          icon={Clock}
          label="Por Tempo"
        />
        <TabButton
          active={mode === 'SPEED_TRAINER'}
          onClick={() => {
            setMode('SPEED_TRAINER')
            fullStop()
          }}
          icon={Gauge}
          label="Speed Trainer"
        />
      </div>

      <main className="main-content" style={{ justifyContent: 'flex-start', paddingTop: '5px' }}>
        {/* === MODO LIVRE === */}
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

        {/* === MODOS DE TREINO === */}
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
            {/* Renderiza Forms apenas se NÃO estiver tocando E não tiver uma config ativa (ou seja, está resetado) */}
            {/* Na lógica de Pause, 'speedConfig' ou 'timeConfig' continuam existindo. 
                 Portanto, só mostramos o form se configs forem nulas OU se elapsedTime for 0 E não estiver tocando (Resetado) */}
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
              /* DISPLAY DE EXECUÇÃO (PAUSA OU RODANDO) */
              <div
                style={{
                  textAlign: 'center',
                  background: 'var(--bg-panel)',
                  padding: '15px',
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
                    <AlertCircle size={14} /> PREPARAR...
                  </div>
                )}

                {/* Banner de PAUSA */}
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
                    PAUSADO
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
                      <span>META: {speedConfig?.endBpm} BPM</span>
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
                            <CheckCircle2 size={14} /> MÁXIMO
                          </span>
                        ) : (
                          `PRÓXIMO: ${bpm + (speedConfig?.bpmIncrement || 0)}`
                        )}
                      </span>
                    </>
                  ) : (
                    <>
                      <span>META: {timeConfig?.minutes} MIN</span>
                      <span>EDITÁVEL</span>
                    </>
                  )}
                </div>

                {/* DISPLAY BPM (COM BOTÕES DE EDIÇÃO NA PAUSA) */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '15px'
                  }}
                >
                  {/* Botão Menos (Só aparece no modo Time Trainer quando pausado) */}
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
                      fontSize: '4rem',
                      fontWeight: 'bold',
                      color: isCountInPhase ? 'var(--beat-normal)' : 'var(--accent-color)',
                      lineHeight: 1,
                      opacity: isCountInPhase ? 0.7 : 1
                    }}
                  >
                    {bpm}
                  </div>

                  {/* Botão Mais */}
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
                    marginBottom: '15px'
                  }}
                >
                  BPM ATUAL
                </div>

                <div
                  style={{
                    background: 'var(--bg-primary)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    marginBottom: '15px',
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
                    ? 'Contagem Inicial'
                    : mode === 'SPEED_TRAINER'
                      ? `Compasso ${barsDisplay} de ${speedConfig?.barsInterval}`
                      : 'Progresso do Tempo'}
                </div>
              </div>
            )}
          </div>
        )}

        <BeatDisplay steps={steps} currentStepIndex={currentBeat} onBeatClick={handleBeatClick} />

        {/* --- CONTROLES DE PLAYER (BOTÕES PRINCIPAIS) --- */}
        {/* Mostra sempre no Free. Nos outros modos, mostra se estiver tocando ou se estiver pausado (config existe) */}
        {(mode === 'FREE' || isPlaying || speedConfig || timeConfig) && (
          <div
            style={{
              marginTop: '15px',
              paddingBottom: '10px',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '20px'
            }}
          >
            {/* BOTÃO SECUNDÁRIO: STOP/RESET (Só aparece nos modos de treino quando pausado ou rodando para permitir abortar) */}
            {mode !== 'FREE' && (isPlaying || speedConfig || timeConfig) && (
              <button
                onClick={() => {
                  fullStop()
                  setSpeedConfig(null)
                  setTimeConfig(null)
                }}
                title="Abortar Treino e Voltar"
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

            {/* BOTÃO PRINCIPAL: PLAY/PAUSE */}
            <button
              onClick={togglePlay}
              title="Espaço para Play/Pause"
              style={{
                background: isPlaying ? 'var(--bg-panel)' : 'var(--accent-color)', // Inverti visualmente para destacar pause
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

            {/* Espaçador para centralizar o botão principal se o botão stop existir */}
            {mode !== 'FREE' && <div style={{ width: '50px' }}></div>}
          </div>
        )}
      </main>
    </div>
  )
}

export default App
