// The record player, with no audio file to download: brown noise shaped by a slowly opening filter,
// which lands somewhere between surf and rain. Built on the first click, because browsers only let
// sound start from a gesture, and faded in and out so it never arrives or leaves abruptly.
let context: AudioContext | null = null;
let playing: { gain: GainNode; sources: AudioScheduledSourceNode[] } | null = null;

/** Deep, soft noise. White noise integrated into brown noise sounds like water rather than static. */
function surfBuffer(ctx: AudioContext, seconds: number) {
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    last = (last + .02 * (Math.random() * 2 - 1)) / 1.02;
    data[i] = last * 3.4;
  }
  // Ease the join so the loop does not click every time it comes round.
  const fade = Math.floor(ctx.sampleRate * .5);
  for (let i = 0; i < fade; i++) {
    const t = i / fade;
    data[i] = data[i] * t + data[data.length - fade + i] * (1 - t);
  }
  return buffer;
}

/** Start or stop the ambience. Safe to call repeatedly, and silent if the browser refuses audio. */
export async function ambience(on: boolean) {
  if (!on) {
    if (!playing || !context) return;
    const { gain, sources } = playing, now = context.currentTime;
    playing = null;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0, now + .7);
    sources.forEach(source => { try { source.stop(now + .8); } catch { /* already stopped */ } });
    return;
  }
  if (playing) return;
  try {
    context ||= new AudioContext();
    if (context.state === 'suspended') await context.resume();
    const ctx = context, now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(.17, now + 2.5);
    gain.connect(ctx.destination);

    const surf = ctx.createBufferSource();
    surf.buffer = surfBuffer(ctx, 8);
    surf.loop = true;
    const band = ctx.createBiquadFilter();
    band.type = 'lowpass'; band.frequency.value = 480; band.Q.value = .6;
    // One slow wave opens the filter while another lifts the level, so it breathes instead of droning.
    const brightness = ctx.createOscillator(), brightDepth = ctx.createGain();
    brightness.frequency.value = .064; brightDepth.gain.value = 250;
    brightness.connect(brightDepth).connect(band.frequency);
    const tide = ctx.createGain(), tideWave = ctx.createOscillator(), tideDepth = ctx.createGain();
    tide.gain.value = .78; tideWave.frequency.value = .041; tideDepth.gain.value = .34;
    tideWave.connect(tideDepth).connect(tide.gain);
    surf.connect(band).connect(tide).connect(gain);

    surf.start(now); brightness.start(now); tideWave.start(now);
    playing = { gain, sources: [surf, brightness, tideWave] };
  } catch {
    playing = null;   // no audio here; the room is just quiet
  }
}
