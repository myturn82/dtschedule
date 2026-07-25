import { useEffect, useState } from 'react'

const BPM = 96
const BEAT = 60 / BPM
const BAR = BEAT * 4

// Am7 → Fmaj7 → C → G 4-bar loop (A minor key)
const CHORDS: number[][] = [
  [220.00, 261.63, 329.63, 392.00], // Am7: A3,C4,E4,G4
  [174.61, 220.00, 261.63, 329.63], // Fmaj7: F3,A3,C4,E4
  [130.81, 164.81, 220.00, 261.63], // C: C3,E3,A3,C4
  [196.00, 246.94, 293.66, 392.00], // G: G3,B3,D4,G4
]

function schedulePad(ctx: AudioContext, out: GainNode, freqs: number[], t: number, dur: number) {
  freqs.forEach(freq => {
    const osc = ctx.createOscillator()
    const filt = ctx.createBiquadFilter()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.value = freq
    filt.type = 'lowpass'; filt.frequency.value = 800; filt.Q.value = 1.2
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.033, t + 0.22)
    gain.gain.setValueAtTime(0.033, t + dur - 0.28)
    gain.gain.linearRampToValueAtTime(0, t + dur)
    osc.connect(filt); filt.connect(gain); gain.connect(out)
    osc.start(t); osc.stop(t + dur)
  })
}

function scheduleKick(ctx: AudioContext, out: GainNode, t: number) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(120, t)
  osc.frequency.exponentialRampToValueAtTime(32, t + 0.13)
  gain.gain.setValueAtTime(0.38, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22)
  osc.connect(gain); gain.connect(out)
  osc.start(t); osc.stop(t + 0.25)
}

function scheduleHihat(ctx: AudioContext, out: GainNode, t: number, accent: boolean) {
  const len = Math.floor(ctx.sampleRate * 0.04)
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let j = 0; j < len; j++) d[j] = Math.random() * 2 - 1
  const src = ctx.createBufferSource()
  const filt = ctx.createBiquadFilter()
  const gain = ctx.createGain()
  src.buffer = buf
  filt.type = 'highpass'; filt.frequency.value = 8000
  gain.gain.setValueAtTime(accent ? 0.055 : 0.025, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04)
  src.connect(filt); filt.connect(gain); gain.connect(out)
  src.start(t)
}

function scheduleBar(ctx: AudioContext, out: GainNode, t: number, barIdx: number) {
  schedulePad(ctx, out, CHORDS[barIdx % CHORDS.length], t, BAR)
  // kick: beat 1 & 3
  scheduleKick(ctx, out, t)
  scheduleKick(ctx, out, t + BEAT * 2)
  // hi-hat: 8th notes
  for (let i = 0; i < 8; i++) scheduleHihat(ctx, out, t + i * (BEAT * 0.5), i % 2 === 0)
}

export function usePromoMusic() {
  const [musicReady, setMusicReady] = useState(false)

  useEffect(() => {
    let stopped = false
    let barStart = 0
    let barIdx = 0
    let timerId: ReturnType<typeof setTimeout>
    let ctx: AudioContext | null = null

    const startLoop = (audioCtx: AudioContext, master: GainNode) => {
      barStart = audioCtx.currentTime + 0.05
      const tick = () => {
        if (stopped || audioCtx.state === 'closed') return
        const now = audioCtx.currentTime
        while (barStart < now + BAR * 2) {
          scheduleBar(audioCtx, master, barStart, barIdx++)
          barStart += BAR
        }
        timerId = setTimeout(tick, BAR * 700)
      }
      tick()
    }

    const setup = async () => {
      ctx = new AudioContext()
      const master = ctx.createGain()
      master.gain.value = 0.65
      master.connect(ctx.destination)

      if (ctx.state === 'running') {
        setMusicReady(true)
        startLoop(ctx, master)
      } else {
        const onGesture = async () => {
          if (!ctx || stopped) return
          await ctx.resume()
          if (!stopped) { setMusicReady(true); startLoop(ctx, master) }
        }
        document.addEventListener('pointerdown', onGesture, { once: true })
      }
    }

    setup()

    return () => {
      stopped = true
      clearTimeout(timerId)
      ctx?.close()
    }
  }, [])

  return { musicReady }
}
