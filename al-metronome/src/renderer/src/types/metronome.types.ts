// Define os tipos de batida possíveis (Req. 3)
export type BeatType = 'ACCENT' | 'NORMAL' | 'MUTE'

// Define a estrutura de um único tempo no compasso
export interface BeatStep {
  index: number // Posição no compasso (1, 2, 3...)
  type: BeatType // O tipo da batida
}

// Define o estado global do Metrônomo para a UI
export interface MetronomeState {
  bpm: number
  isPlaying: boolean
  beatsPerBar: number // Quantidade de tempos (ex: 4 em 4/4)
  currentBeatIndex: number // Qual tempo está tocando agora (para visualização)
  steps: BeatStep[] // O array de configuração dos passos
}

// Para o Modo Trainer (Req. 4)
export interface SpeedTrainerConfig {
  startBpm: number
  endBpm: number
  bpmIncrement: number
  barsInterval: number // A cada quantos compassos aumenta?
  isEnabled: boolean
}
