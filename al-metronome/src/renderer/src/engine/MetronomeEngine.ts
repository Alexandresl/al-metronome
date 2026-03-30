import * as Tone from 'tone'
import { BeatStep, SoundType, TimeSignature } from '../types/metronome.types'

export class MetronomeEngine {
  private synth: Tone.Synth | Tone.MembraneSynth | Tone.MetalSynth | Tone.Sampler
  private currentStep = 0
  private steps: BeatStep[] = []
  private onBeat: (beatIndex: number) => void
  private repeatId: number | null = null
  private soundType: SoundType | null = null

  // Novo estado interno com valor default seguro (4/4)
  private timeSignature: TimeSignature = { numerator: 4, denominator: 4 }

  constructor(onBeat: (beatIndex: number) => void) {
    this.onBeat = onBeat
    this.synth = new Tone.Synth().toDestination()
  }

  // Novo Setter: Atualiza a fórmula de compasso no motor
  public setTimeSignature(signature: TimeSignature): void {
    this.timeSignature = signature
    // Mantém o próprio transport do Tone.js em compliance com a nossa UI
    Tone.getTransport().timeSignature = [signature.numerator, signature.denominator]
  }

  public setSteps(steps: BeatStep[]): void {
    this.steps = steps
  }

  public setBpm(bpm: number): void {
    Tone.getTransport().bpm.value = bpm
  }

  public setVolume(volume: number): void {
    const db = volume === 0 ? -Infinity : 20 * Math.log10(volume / 100)
    Tone.getDestination().volume.rampTo(db, 0.1)
  }

  public setSoundType(type: SoundType): void {
    if (this.soundType === type) return

    this.soundType = type
    this.synth.dispose()

    switch (type) {
      case 'WAV':
        this.synth = new Tone.Sampler({
          urls: {
            C5: 'hi.wav',
            C4: 'lo.wav'
          },
          baseUrl: '/sounds/metronome/'
        }).toDestination()
        break
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

  public async start(): Promise<void> {
    await Tone.start()

    this.stop()
    this.currentStep = 0

    // O pulo do gato: A string de intervalo agora é montada dinamicamente pelo denominador.
    // Ex: Se denominator for 8, o Tone.js agenda como '8n' (colcheia).
    const interval = `${this.timeSignature.denominator}n`

    this.repeatId = Tone.getTransport().scheduleRepeat((time) => {
      // O numerador define o tamanho do ciclo (fallback de segurança caso steps esteja vazio)
      const maxSteps = this.steps.length || this.timeSignature.numerator
      const stepIndex = this.currentStep % maxSteps
      const step = this.steps[stepIndex]

      if (step && step.type !== 'MUTE') {
        const note = step.type === 'ACCENT' ? 'C5' : 'C4'

        if (this.synth instanceof Tone.MembraneSynth) {
          this.synth.triggerAttackRelease(step.type === 'ACCENT' ? 'D4' : 'C3', '32n', time)
        } else {
          this.synth.triggerAttackRelease(note, '32n', time)
        }
      }

      Tone.Draw.schedule(() => {
        this.onBeat(stepIndex)
      }, time)

      this.currentStep++
    }, interval)

    Tone.getTransport().start()
  }

  public stop(): void {
    Tone.getTransport().stop()

    if (this.repeatId !== null) {
      Tone.getTransport().clear(this.repeatId)
      this.repeatId = null
    }

    Tone.getTransport().position = 0
    Tone.Draw.cancel(0)
    this.currentStep = 0
  }
}
