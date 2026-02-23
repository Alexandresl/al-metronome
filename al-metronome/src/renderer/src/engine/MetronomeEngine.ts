import * as Tone from 'tone'
import { BeatStep, SoundType } from '../types/metronome.types'

export class MetronomeEngine {
  private synth: Tone.Synth | Tone.MembraneSynth | Tone.MetalSynth
  private currentStep = 0
  private steps: BeatStep[] = []
  private onBeat: (beatIndex: number) => void
  private repeatId: number | null = null
  private soundType: SoundType | null = null

  constructor(onBeat: (beatIndex: number) => void) {
    this.onBeat = onBeat
    this.synth = new Tone.Synth().toDestination()
  }

  public setSteps(steps: BeatStep[]) {
    this.steps = steps
  }

  public setBpm(bpm: number) {
    // CORREÇÃO: Usar getTransport() em vez de Transport direto
    Tone.getTransport().bpm.value = bpm
  }

  public setVolume(volume: number) {
    // Convertendo 0-100% para dB
    const db = volume === 0 ? -Infinity : 20 * Math.log10(volume / 100)
    // CORREÇÃO: Usar getDestination()
    Tone.getDestination().volume.rampTo(db, 0.1)
  }

  public setSoundType(type: SoundType) {
    if (this.soundType === type) return

    this.soundType = type
    this.synth.dispose()

    switch (type) {
      case 'MECHANICAL':
        this.synth = new Tone.MembraneSynth({
          pitchDecay: 0.008,
          octaves: 2,
          oscillator: { type: 'sine' },
          envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 }
        }).toDestination()
        break
      case 'BEEP':
        this.synth = new Tone.Synth({
          oscillator: { type: 'square' },
          envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.1 }
        }).toDestination()
        break
      case 'DIGITAL':
      default:
        this.synth = new Tone.Synth({
          oscillator: { type: 'sine' },
          envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.1 }
        }).toDestination()
        break
    }
  }

  public async start() {
    await Tone.start()

    // Limpeza agressiva antes de iniciar
    this.stop()

    this.currentStep = 0

    // CORREÇÃO: Usar getTransport() para agendar
    this.repeatId = Tone.getTransport().scheduleRepeat((time) => {
      const stepIndex = this.currentStep % (this.steps.length || 4)
      const step = this.steps[stepIndex]

      if (step && step.type !== 'MUTE') {
        const note = step.type === 'ACCENT' ? 'C5' : 'C4'

        if (this.synth instanceof Tone.MembraneSynth) {
          this.synth.triggerAttackRelease(step.type === 'ACCENT' ? 'D4' : 'C3', '32n', time)
        } else {
          this.synth.triggerAttackRelease(note, '32n', time)
        }
      }

      // Draw geralmente funciona bem globalmente, mas usar via getDraw()
      // ou direto no Tone.Draw é seguro. O Tone.Draw é um singleton utilitário.
      Tone.Draw.schedule(() => {
        this.onBeat(stepIndex)
      }, time)

      this.currentStep++
    }, '4n')

    // CORREÇÃO: Iniciar o transport via getter
    Tone.getTransport().start()
  }

  public stop() {
    // CORREÇÃO: Parar via getter
    Tone.getTransport().stop()

    if (this.repeatId !== null) {
      // CORREÇÃO: Limpar evento via getter
      Tone.getTransport().clear(this.repeatId)
      this.repeatId = null
    }

    // CORREÇÃO: Resetar posição via getter
    Tone.getTransport().position = 0

    Tone.Draw.cancel(0)

    this.currentStep = 0
  }
}
