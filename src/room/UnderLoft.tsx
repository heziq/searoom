import { useEffect, useRef, type ReactNode } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { home } from '../config';
import { Beam, BookStack, Box, Ceramic, Cloth, Cylinder, Framed, Grounding, LampShade, Plant, Soft, clay, lampLight, oakDeep, seaBlue } from './primitives';
import { Interactive } from './interactions';

/** A drawer that slides out on its runners, carrying whatever is folded inside it. */
function Drawer({ x, y, open, reduced, children }: { x: number; y: number; open: boolean; reduced: boolean; children?: ReactNode }) {
  const ref = useRef<THREE.Group>(null), invalidate = useThree(s => s.invalidate);
  const [, , depth] = home.dresser.size, face = depth / 2;
  useEffect(() => invalidate(), [open, invalidate]);
  useFrame((_, dt) => {
    if (!ref.current) return;
    const target = open ? .36 : 0;
    ref.current.position.z = reduced ? target : THREE.MathUtils.damp(ref.current.position.z, target, 6, dt);
    if (Math.abs(ref.current.position.z - target) > .002) invalidate();
  });
  return <group ref={ref} position={[x, y, 0]}>
    <Soft p={[0, 0, face + .005]} s={[.9, .38, .03]} c="#bb946b" />
    <Cylinder p={[0, 0, face + .04]} top={.026} height={.04} c="#8a7350" rotation={[Math.PI / 2, 0, 0]} />
    {/* The tray only shows once the drawer is out. */}
    <Box p={[0, -.17, face - .3]} s={[.84, .02, .54]} c="#a98360" />
    {children}
  </group>;
}

/** A low console against the rear wall with a lamp, a record player and three prints. */
function Console({ on, glowing, music, reduced }: { on: boolean; glowing: number; music: boolean; reduced: boolean }) {
  const rear = -home.room.depth / 2;
  return <group position={[home.furniture.console[0] + .2, 0, 0]}>
    <Soft p={[-.2, .54, -5.72]} s={[2.65, 1.03, .53]} c="#aa825b" />
    {[-.8, 0, .8].map(x => <group key={x}><Box p={[x - .2, .54, -5.445]} s={[.8, .82, .02]} c="#bb946b" /><Box p={[x, .56, -5.43]} s={[.03, .17, .016]} c="#7d6249" /></group>)}
    <Ceramic p={[-1.22, 1.06, -5.85]} />
    <Plant p={[.86, 1.07, -5.7]} scale={.31} kind="fern" />
    <BookStack p={[-1.1, 1.06, -5.54]} tones={['#3f6679', '#e5dcc6', '#5d7a62']} />
    <Interactive id="music"><RecordPlayer p={[.2, 1.06, -5.72]} on={music} reduced={reduced} /></Interactive>
    {/* A lamp and three prints make the low space under the loft somewhere to pause. */}
    <Cylinder p={[-.55, 1.2, -5.72]} top={.06} bottom={.13} height={.3} c="#7f9a98" /><LampShade p={[-.55, 1.52, -5.72]} top={.16} bottom={.24} height={.3} on={on} />
    <pointLight position={[-.55, 1.6, -5.6]} color={lampLight} intensity={4 * glowing} distance={6} />
    <Framed p={[-1.25, 2.45, rear + .19]} s={[.82, 1.02]} kind="horizon" /><Framed p={[-.2, 2.45, rear + .19]} s={[.82, 1.02]} kind="sun" /><Framed p={[.85, 2.45, rear + .19]} s={[.82, 1.02]} kind="sprig" />
  </group>;
}

/** A small turntable. The platter turns while a record is playing. */
function RecordPlayer({ p, on, reduced }: { p: [number, number, number]; on: boolean; reduced: boolean }) {
  const platter = useRef<THREE.Group>(null), invalidate = useThree(s => s.invalidate);
  useEffect(() => invalidate(), [on, invalidate]);
  useFrame((_, dt) => {
    if (!platter.current || !on || reduced) return;
    platter.current.rotation.y += dt * 3.6;
    invalidate();
  });
  return <group position={p}>
    <Soft p={[0, .05, 0]} s={[.54, .1, .44]} c="#9d7850" />
    <Box p={[0, .105, -.17]} s={[.5, .02, .07]} c="#8a6a4b" />
    <group ref={platter} position={[-.03, .11, .02]}>
      <Cylinder p={[0, 0, 0]} top={.17} height={.018} c="#303940" />
      <Cylinder p={[0, .013, 0]} top={.163} height={.006} c="#1c2024" />
      <Cylinder p={[0, .018, 0]} top={.056} height={.004} c={clay} />
      <Cylinder p={[0, .03, 0]} top={.007} height={.03} c="#c8b48a" />
    </group>
    {/* The tonearm rests over the record while it plays, and sits parked when it does not. */}
    <Cylinder p={[.21, .11, -.15]} top={.032} bottom={.038} height={.035} c="#b9a88a" />
    <Beam from={[.21, .125, -.15]} to={on ? [.02, .125, .02] : [.19, .125, .06]} width={.014} color="#b9a88a" />
    <Cylinder p={[.01, .105, .13]} top={.022} height={.022} c="#8a7350" />
  </group>;
}

/** A six-drawer oak dresser under the right end of the loft, with a leaning mirror and the day's small things on top. */
function Dresser({ open, reduced }: { open: boolean; reduced: boolean }) {
  const [w, h, d] = home.dresser.size, front = d / 2, top = h + .03;
  return <group position={home.furniture.dresser}>
    {[-1, 1].flatMap(sx => [-1, 1].map(sz => <Box key={`${sx}${sz}`} p={[sx * (w / 2 - .08), .05, sz * (d / 2 - .07)]} s={[.08, .1, .08]} c={oakDeep} />))}
    <Soft p={[0, .1 + (h - .13) / 2, 0]} s={[w, h - .13, d]} c="#a77c55" />
    <Soft p={[0, h, .01]} s={[w + .06, .06, d + .04]} c="#b68c61" />
    {[-.48, .48].flatMap(cx => [.33, .76, 1.19].map(cy =>
      <Drawer key={`${cx}${cy}`} x={cx} y={cy} open={open} reduced={reduced}>
        {/* The top drawers hold folded linen and a few jumpers. */}
        {cy === 1.19 && [0, 1, 2].map(i => <Cloth key={i} p={[0, -.12 + i * .055, front - .18 - i * .03]} s={[.74, .055, .3]} c={['#e7dfcf', seaBlue, '#cdbfa8'][i]} thread={6} />)}
      </Drawer>))}
    {/* A round mirror leans against the wall. */}
    <group position={[-.38, top + .44, -d / 2 + .1]} rotation={[-.12, 0, 0]}>
      <mesh castShadow><torusGeometry args={[.42, .035, 10, 48]} /><meshStandardMaterial color="#9c7754" roughness={.6} /></mesh>
      <mesh position={[0, 0, -.005]}><circleGeometry args={[.41, 48]} /><meshStandardMaterial color="#dfe7e8" roughness={.12} metalness={.35} /></mesh>
    </group>
    {/* A folded sweater, a trinket box, a dish for rings and keys, dried grass in a jar. */}
    <Cloth p={[.32, top + .06, .06]} s={[.56, .12, .4]} c={seaBlue} thread={4} />
    <Soft p={[-.82, top + .05, .12]} s={[.24, .1, .17]} c={oakDeep} />
    <Cylinder p={[-.08, top + .012, .2]} top={.11} bottom={.08} height={.024} c="#d8d3c0" />
    <group position={[.78, top, -.12]}>
      <Cylinder p={[0, .1, 0]} top={.07} bottom={.06} height={.2} c="#c9d6d4" />
      {[-.4, -.15, .1, .35].map((lean, i) => <Beam key={i} from={[0, .15, 0]} to={[Math.sin(lean) * .3, .62 + (i % 2) * .1, Math.cos(lean * 2) * .05]} width={.008} color="#c8b48a" />)}
    </group>
    <Grounding p={[0, .045, .05]} s={[w + .7, d + .8]} o={.5} />
  </group>;
}

/** The low strip of room beneath the loft: the console on the left, the dresser on the bed side. */
export function UnderLoft({ on, glowing, drawers, music, reduced }: { on: boolean; glowing: number; drawers: boolean; music: boolean; reduced: boolean }) {
  return <>
    <Console on={on} glowing={glowing} music={music} reduced={reduced} />
    <Interactive id="dresser"><Dresser open={drawers} reduced={reduced} /></Interactive>
    <Grounding p={[home.furniture.console[0], .02, -5.6]} s={[3.6, 1.7]} />
  </>;
}
