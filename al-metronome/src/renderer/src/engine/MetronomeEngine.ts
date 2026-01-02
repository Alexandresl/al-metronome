import * as Tone from 'tone'
import { BeatStep, SoundType } from '../types/metronome.types'

export class MetronomeEngine {
  private synth: Tone.Synth | Tone.MembraneSynth // Agora pode ser tipos diferentes
  private currentStepIndex: number = 0
  private steps: BeatStep[] = []
  private onBeatCallback: (beatIndex: number) => void
  private currentSoundType: SoundType = 'DIGITAL'

  constructor(onBeat: (beatIndex: number) => void) {
    this.onBeatCallback = onBeat
    // Inicializa com o som padrão
    this.synth = this.createSynth('DIGITAL')
    console.log('[Engine] Inicializada')
  }

  // Factory Method para criar o sintetizador correto
  private createSynth(type: SoundType): Tone.Synth | Tone.MembraneSynth {
    if (type === 'DIGITAL') {
      return new Tone.MembraneSynth({
        pitchDecay: 0.008,
        octaves: 2,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 }
      }).toDestination()
    } else if (type === 'MECHANICAL') {
      // Simula um Woodblock
      return new Tone.MembraneSynth({
        pitchDecay: 0.01,
        octaves: 4,
        oscillator: { type: 'square' }, // Onda quadrada dá o som "seco"
        envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.01 }
      }).toDestination()
    } else {
      // BEEP
      return new Tone.Synth({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.1 }
      }).toDestination()
    }
  }

  public setSteps(steps: BeatStep[]) {
    this.steps = steps
  }

  public setBpm(bpm: number) {
    Tone.Transport.bpm.value = bpm
  }

  // NOVO: Controle de Volume (Logarítmico para soar natural)
  public setVolume(volume0to100: number) {
    // Tone.js usa Decibéis. 0 é o máximo. -Infinity é mudo.
    // Fórmula aproximada: mapear 0-100 para -60dB a 0dB
    const dbValue = volume0to100 === 0 ? -Infinity : 20 * Math.log10(volume0to100 / 100)

    // Aplicamos ao Destination (Master) para garantir que pegue qualquer synth
    Tone.getDestination().volume.rampTo(dbValue, 0.1)
  }

  // NOVO: Troca de Timbre
  public setSoundType(type: SoundType) {
    if (this.currentSoundType === type) return

    // Descarta o synth antigo e cria o novo
    this.synth.dispose()
    this.synth = this.createSynth(type)
    this.currentSoundType = type
  }

  public async start() {
    try {
      await Tone.start()
      if (Tone.getContext().state !== 'running') {
        await Tone.getContext().resume()
      }
      if (Tone.Transport.state === 'started') return

      this.currentStepIndex = 0
      Tone.Transport.cancel()
      Tone.Transport.scheduleRepeat((time) => this.playTick(time), '4n')
      Tone.Transport.start()
    } catch (error) {
      console.error('[Engine] Erro ao iniciar:', error)
    }
  }

  public stop() {
    Tone.Transport.stop()
    Tone.Transport.cancel()
    this.currentStepIndex = 0
    this.onBeatCallback(-1)
  }

  private playTick(time: number) {
    if (!this.steps || this.steps.length === 0) return

    const activeIndex = this.currentStepIndex
    const currentStep = this.steps[activeIndex]

    Tone.Draw.schedule(() => {
      this.onBeatCallback(activeIndex)
    }, time)

    try {
      // Lógica de notas baseada no tipo de som
      if (currentStep.type !== 'MUTE') {
        let note = 'C4' // Padrão

        // Ajuste de Notas por Tipo
        if (this.currentSoundType === 'DIGITAL') {
          note = currentStep.type === 'ACCENT' ? 'C4' : 'G3'
        } else if (this.currentSoundType === 'MECHANICAL') {
          note = currentStep.type === 'ACCENT' ? 'E5' : 'A4' // Mais agudo (clique)
        } else if (this.currentSoundType === 'BEEP') {
          note = currentStep.type === 'ACCENT' ? 'C6' : 'C5' // Beep alto
        }

        // Toca a nota (com leve ganho extra se for acento)
        const velocity = currentStep.type === 'ACCENT' ? 1.0 : 0.7

        // TypeScript check para métodos diferentes (Synth vs MembraneSynth)
        if (this.synth instanceof Tone.MembraneSynth) {
          this.synth.triggerAttackRelease(note, '32n', time, velocity)
        } else {
          this.synth.triggerAttackRelease(note, '32n', time, velocity)
        }
      }
    } catch (e) {
      console.error('[Engine] Erro nota:', e)
    }

    this.currentStepIndex = (this.currentStepIndex + 1) % this.steps.length
  }
}
