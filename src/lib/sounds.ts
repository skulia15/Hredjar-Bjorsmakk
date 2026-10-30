// Projector sound effects, synthesised with Web Audio so there are no audio files to ship.
// Browsers keep audio suspended until a user gesture, so the projector unlocks it on the first click.

let context: AudioContext | null = null
let enabled = false

function audio(): AudioContext | null {
  if (!enabled || typeof window === 'undefined') return null
  context ??= new AudioContext()
  if (context.state === 'suspended') void context.resume()
  return context
}

export function setSoundEnabled(on: boolean) {
  enabled = on
  audio()
}

interface ToneOptions {
  type?: OscillatorType
  gain?: number
  endFrequency?: number
}

function tone(ctx: AudioContext, frequency: number, start: number, duration: number, options: ToneOptions = {}) {
  const { type = 'sine', gain = 0.2, endFrequency } = options
  const osc = ctx.createOscillator()
  const amp = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(frequency, start)
  if (endFrequency) osc.frequency.exponentialRampToValueAtTime(endFrequency, start + duration)
  amp.gain.setValueAtTime(0, start)
  amp.gain.linearRampToValueAtTime(gain, start + 0.01)
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.connect(amp).connect(ctx.destination)
  osc.start(start)
  osc.stop(start + duration + 0.05)
}

function noise(ctx: AudioContext, start: number, duration: number, gain: number, cutoff: number) {
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const source = ctx.createBufferSource()
  const filter = ctx.createBiquadFilter()
  const amp = ctx.createGain()
  source.buffer = buffer
  filter.type = 'bandpass'
  filter.frequency.value = cutoff
  amp.gain.setValueAtTime(gain, start)
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  source.connect(filter).connect(amp).connect(ctx.destination)
  source.start(start)
}

/** Soft blip when someone joins the lobby */
export function playPop() {
  const ctx = audio()
  if (!ctx) return
  tone(ctx, 700, ctx.currentTime, 0.15, { endFrequency: 350, gain: 0.15 })
}

/** Snare roll that builds over the given duration */
export function playDrumroll(durationMs: number) {
  const ctx = audio()
  if (!ctx) return
  const start = ctx.currentTime
  const seconds = durationMs / 1000
  for (let t = 0; t < seconds; t += 0.045) {
    noise(ctx, start + t, 0.06, 0.05 + 0.25 * (t / seconds), 1800)
  }
}

/** Rising arpeggio with a cymbal splash for a reveal */
export function playFanfare() {
  const ctx = audio()
  if (!ctx) return
  const start = ctx.currentTime
  noise(ctx, start, 0.9, 0.25, 6000)
  ;[523.25, 659.25, 783.99, 1046.5].forEach((frequency, i) => {
    tone(ctx, frequency, start + i * 0.11, 0.7, { type: 'triangle', gain: 0.18 })
  })
}
