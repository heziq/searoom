import * as THREE from 'three';

// Small procedural surfaces drawn once on a canvas: wood grain, woven cloth, plaster and a few prints.
// They keep the code-modelled room tactile without downloaded assets.
const cache = new Map<string, THREE.CanvasTexture>();
function random(seed: number) {
  return () => { seed = seed + 0x6d2b79f5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function texture(key: string, width: number, height: number, draw: (c: CanvasRenderingContext2D, r: () => number) => void, color = true) {
  let made = cache.get(key);
  if (!made) {
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    draw(canvas.getContext('2d')!, random(key.length * 7919 + width));
    made = new THREE.CanvasTexture(canvas);
    if (color) made.colorSpace = THREE.SRGBColorSpace;
    made.anisotropy = 8;
    cache.set(key, made);
  }
  return made;
}

/** Oak boards running front to back, with staggered end joints and quiet grain. */
export function planks(key: string, boards: number, tones: string[], width = 2048, height = 1024) {
  return texture(`planks-${key}`, width, height, (c, r) => {
    const board = width / boards;
    for (let i = 0; i < boards; i++) {
      let y = -r() * height * .5;
      while (y < height) {
        const length = height * (.28 + r() * .34);
        c.fillStyle = tones[Math.floor(r() * tones.length)];
        c.fillRect(i * board, y, board, length);
        c.fillStyle = `rgba(${r() > .5 ? '255,244,225' : '92,62,38'},${.03 + r() * .05})`;
        c.fillRect(i * board, y, board, length);
        for (let g = 0; g < 9; g++) {
          c.fillStyle = `rgba(104,72,44,${.03 + r() * .06})`;
          c.fillRect(i * board + r() * board, y + r() * length * .6, .6 + r() * 1.2, length * (.25 + r() * .5));
        }
        c.fillStyle = 'rgba(84,58,38,.34)';
        c.fillRect(i * board, y + length - 1, board, 1.4);
        y += length;
      }
      c.fillStyle = 'rgba(84,58,38,.3)';
      c.fillRect(i * board - .7, 0, 1.4, height);
    }
  });
}

/** A fine weave used as a bump map on linen, wool and upholstery. */
export function weave(repeat: number) {
  const made = texture(`weave-${repeat}`, 128, 128, (c, r) => {
    c.fillStyle = '#808080'; c.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 128; i += 2) {
      c.fillStyle = `rgba(255,255,255,${.1 + r() * .22})`; c.fillRect(0, i, 128, 1);
      c.fillStyle = `rgba(0,0,0,${.08 + r() * .2})`; c.fillRect(i, 0, 1, 128);
    }
    for (let i = 0; i < 500; i++) { c.fillStyle = `rgba(${r() > .5 ? 255 : 0},${r() > .5 ? 255 : 0},0,.07)`; c.fillRect(r() * 128, r() * 128, 2, 2); }
  }, false);
  made.wrapS = made.wrapT = THREE.RepeatWrapping;
  made.repeat.set(repeat, repeat);
  return made;
}

/** Hand-trowelled plaster: a white map with very soft, large clouds, so walls are never one flat value. */
export function plaster() {
  return texture('plaster', 256, 256, (c, r) => {
    // Painted small and enlarged, so the clouds stay smooth instead of picking up pixel grain.
    const small = document.createElement('canvas'); small.width = small.height = 32;
    const s = small.getContext('2d')!;
    s.fillStyle = '#fff'; s.fillRect(0, 0, 32, 32);
    for (let i = 0; i < 40; i++) {
      const x = r() * 32, y = r() * 32, radius = 6 + r() * 10;
      const cloud = s.createRadialGradient(x, y, 0, x, y, radius);
      cloud.addColorStop(0, `rgba(150,134,116,${.018 + r() * .024})`); cloud.addColorStop(1, 'rgba(150,134,116,0)');
      s.fillStyle = cloud; s.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
    c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    c.drawImage(small, 0, 0, 256, 256);
  });
}

/** A soft dark pool that grounds furniture where it meets the floor. */
export function contactShadow() {
  return texture('contact', 128, 128, c => {
    const pool = c.createRadialGradient(64, 64, 4, 64, 64, 64);
    pool.addColorStop(0, 'rgba(36,26,18,.5)'); pool.addColorStop(.55, 'rgba(36,26,18,.2)'); pool.addColorStop(1, 'rgba(36,26,18,0)');
    c.fillStyle = pool; c.fillRect(0, 0, 128, 128);
  });
}

/** A round glow for lamp shades and the distant lighthouse. */
export function glow() {
  return texture('glow', 128, 128, c => {
    const halo = c.createRadialGradient(64, 64, 0, 64, 64, 64);
    halo.addColorStop(0, 'rgba(255,255,255,1)'); halo.addColorStop(.3, 'rgba(255,255,255,.35)'); halo.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = halo; c.fillRect(0, 0, 128, 128);
  });
}

type RugStyle = { ground: string; line: string; border: string };
/** Flat-woven rugs: a ground colour, irregular hand-drawn stripes and a border. `round` weaves in rings instead. */
export function rug(key: string, { ground, line, border }: RugStyle, round = false) {
  return texture(`rug-${key}`, 512, 512, (c, r) => {
    c.fillStyle = ground; c.fillRect(0, 0, 512, 512);
    if (round) {
      for (let radius = 250; radius > 6; radius -= 9) {
        c.strokeStyle = `rgba(${radius % 4 < 2 ? '94,70,44' : '255,246,226'},${.1 + r() * .16})`;
        c.lineWidth = 3 + r() * 2; c.beginPath(); c.arc(256, 256, radius, 0, Math.PI * 2); c.stroke();
      }
      c.strokeStyle = border; c.lineWidth = 7; c.beginPath(); c.arc(256, 256, 226, 0, Math.PI * 2); c.stroke();
      return;
    }
    for (let y = 0; y < 512; y += 4) { c.fillStyle = `rgba(${r() > .5 ? '255,250,238' : '70,54,38'},${.03 + r() * .06})`; c.fillRect(0, y, 512, 2); }
    c.fillStyle = line;
    for (let y = 70; y < 450; y += 54) c.fillRect(34, y + r() * 4, 444, 2.5 + r() * 2);
    c.strokeStyle = border; c.lineWidth = 5; c.strokeRect(20, 20, 472, 472);
    c.lineWidth = 1.5; c.strokeRect(31, 31, 450, 450);
  });
}

/** Three quiet prints for the wall: a horizon, a sun over water, and a sprig. */
export function print(kind: 'horizon' | 'sun' | 'sprig') {
  return texture(`print-${kind}`, 256, 320, (c, r) => {
    c.fillStyle = '#f1eadc'; c.fillRect(0, 0, 256, 320);
    for (let i = 0; i < 900; i++) { c.fillStyle = `rgba(120,100,80,${r() * .05})`; c.fillRect(r() * 256, r() * 320, 2, 2); }
    if (kind === 'horizon') {
      c.fillStyle = '#c9d9dc'; c.fillRect(34, 46, 188, 120);
      c.fillStyle = '#5d8ca0'; c.fillRect(34, 166, 188, 62);
      c.fillStyle = '#3f6d83'; c.fillRect(34, 228, 188, 46);
      c.fillStyle = 'rgba(241,234,220,.75)'; for (let i = 0; i < 7; i++) c.fillRect(50 + r() * 130, 176 + i * 13, 22 + r() * 30, 1.6);
    } else if (kind === 'sun') {
      c.fillStyle = '#c56f4d'; c.beginPath(); c.arc(128, 132, 54, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#f1eadc'; c.fillRect(0, 150, 256, 4); c.fillRect(0, 164, 256, 3); c.fillRect(0, 176, 256, 2);
      c.fillStyle = '#47758b'; c.fillRect(46, 206, 164, 3); c.fillRect(66, 222, 124, 3); c.fillRect(88, 238, 80, 3);
    } else {
      c.strokeStyle = '#55705a'; c.lineWidth = 2.4; c.lineCap = 'round';
      c.beginPath(); c.moveTo(124, 278); c.bezierCurveTo(120, 200, 138, 130, 130, 54); c.stroke();
      c.fillStyle = '#6b8a69';
      for (let i = 0; i < 7; i++) {
        const y = 250 - i * 30, side = i % 2 ? 1 : -1;
        c.save(); c.translate(127 + side * 3, y); c.rotate(side * (.75 - i * .04)); c.beginPath(); c.ellipse(0, -22, 9 - i * .6, 24 - i * 1.4, 0, 0, Math.PI * 2); c.fill(); c.restore();
      }
    }
  });
}

/** The land side seen through the desk window: pale sky above a line of pines. */
export function pines() {
  return texture('pines', 256, 256, (c, r) => {
    const sky = c.createLinearGradient(0, 0, 0, 256);
    sky.addColorStop(0, '#dfe9ec'); sky.addColorStop(.62, '#f4f1e6'); sky.addColorStop(1, '#dfe2cf');
    c.fillStyle = sky; c.fillRect(0, 0, 256, 256);
    for (const [tone, base, tall] of [['#a9bba6', 150, 70], ['#7d967c', 178, 96], ['#5d7a62', 214, 120]] as const) {
      c.fillStyle = tone;
      for (let x = -10; x < 270; x += 16 + r() * 16) {
        const height = tall * (.55 + r() * .5), width = 13 + r() * 9;
        c.beginPath(); c.moveTo(x, base + 50); c.lineTo(x + width / 2, base - height); c.lineTo(x + width, base + 50); c.fill();
      }
      c.fillRect(0, base + 30, 256, 256);
    }
  });
}

/** Fades the ends of the shore so the outside world dissolves instead of stopping at an edge. */
export function shoreFade() {
  return texture('shore-fade', 8, 256, c => {
    const fade = c.createLinearGradient(0, 0, 0, 256);
    fade.addColorStop(0, '#000'); fade.addColorStop(.28, '#fff'); fade.addColorStop(.72, '#fff'); fade.addColorStop(1, '#000');
    c.fillStyle = fade; c.fillRect(0, 0, 8, 256);
  }, false);
}
