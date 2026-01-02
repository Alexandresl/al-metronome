import { useState } from 'react'
import './assets/base.css'
import { BeatDisplay } from './components/beatDisplay'
import { BeatStep, BeatType } from './types/metronome.types'

function App() {
  // Estado simulado para teste visual
  const [currentBeat, setCurrentBeat] = useState<number>(-1)

  // Vamos simular um compasso 4/4 padrão
  const [steps, setSteps] = useState<BeatStep[]>([
    { index: 0, type: 'ACCENT' },
    { index: 1, type: 'NORMAL' },
    { index: 2, type: 'NORMAL' },
    { index: 3, type: 'NORMAL' }
  ])

  // Função para alternar o tipo de batida ao clicar (Lógica Cíclica)
  const handleBeatClick = (index: number) => {
    const newSteps = [...steps]
    const currentType = newSteps[index].type

    // Ciclo: ACCENT -> NORMAL -> MUTE -> ACCENT
    let nextType: BeatType = 'ACCENT'
    if (currentType === 'ACCENT') nextType = 'NORMAL'
    else if (currentType === 'NORMAL') nextType = 'MUTE'

    newSteps[index].type = nextType
    setSteps(newSteps)
  }

  return (
    <div className="app-container">
      <main className="main-content">
        <h1>AL Metronome</h1>

        {/* Mostrador de BPM Temporário */}
        <h2 style={{ fontSize: '3rem', margin: '10px 0' }}>120 BPM</h2>

        {/* Nosso Componente Novo */}
        <BeatDisplay steps={steps} currentStepIndex={currentBeat} onBeatClick={handleBeatClick} />

        {/* Controles de Teste (Só para ver a animação) */}
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <button onClick={() => setCurrentBeat((prev) => (prev + 1) % 4)}>
            Avançar Batida (Teste)
          </button>
          <button onClick={() => console.log('Configurações salvas')}>Opções</button>
        </div>
      </main>
    </div>
  )
}

export default App
