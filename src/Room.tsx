import { useEffect, useLayoutEffect, useMemo, useRef, type ReactNode, type RefObject } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { CameraControls, Html, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { atmospheres, home, type Atmosphere, type PlaceId, type Position } from './config';
import { getStairLayout, getLibraryBooks } from './layout';
import { Outside } from './Outside';
import { Presence, type WalkTarget } from './Presence';
import { contactShadow, glow, pines, planks, plaster, print, rug, weave } from './textures';

export type Action = 'computer' | 'bed' | 'lounge' | 'curtains' | 'lamp' | 'books' | 'tea' | 'television';
export type View = 'inside' | 'front' | 'overview';
export type RoomProps = {
  atmosphere: Atmosphere; curtains: boolean; lamp: boolean; focus: boolean; view: View; place: PlaceId | null; placeKey: number;
  walkTarget: WalkTarget | null; rain: boolean; reduced: boolean; tvBesideBed: boolean; reset: number; veil: RefObject<HTMLDivElement | null>;
  onAction: (action: Action) => void; onHover: (name: string) => void; onWalk: (point: Position) => void; onEngage: () => void; onWander: () => void;
};

const oak = '#b48a62', oakDeep = '#8e6b4c', wallColor = '#f1ece2', linen = '#ece5d6', seaBlue = '#6f9aab', clay = '#b97458', lampLight = '#ffd3a6';
const lampLevel: Record<Atmosphere, number> = { day: .5, sunset: .85, night: 1 };

function Box({ p = [0, 0, 0], s, c, r = 0, rotation }: { p?: Position; s: Position; c: string; r?: number; rotation?: Position }) {
  return <mesh position={p} rotation={rotation} castShadow receiveShadow><boxGeometry args={s} /><meshStandardMaterial color={c} roughness={.85} metalness={r} /></mesh>;
}
function Soft({ p, s, c, rotation }: { p: Position; s: Position; c: string; rotation?: Position }) {
  return <RoundedBox position={p} args={s} radius={Math.min(.08, ...s.map(dimension => dimension / 3))} smoothness={2} rotation={rotation} castShadow receiveShadow><meshStandardMaterial color={c} roughness={.95} /></RoundedBox>;
}
/** Anything woven: bedding, cushions, upholstery. A fine bump keeps it from reading as plastic. */
function Cloth({ p, s, c, rotation, thread = 5 }: { p: Position; s: Position; c: string; rotation?: Position; thread?: number }) {
  return <RoundedBox position={p} args={s} radius={Math.min(.11, ...s.map(dimension => dimension / 2.4))} smoothness={3} rotation={rotation} castShadow receiveShadow><meshStandardMaterial color={c} roughness={1} bumpMap={weave(thread)} bumpScale={1.4} /></RoundedBox>;
}
function Cylinder({ p, top, bottom = top, height, c, rotation }: { p: Position; top: number; bottom?: number; height: number; c: string; rotation?: Position }) {
  return <mesh position={p} rotation={rotation} castShadow receiveShadow><cylinderGeometry args={[top, bottom, height, 20]} /><meshStandardMaterial color={c} roughness={.8} /></mesh>;
}
function Beam({ from, to, width = .035, depth = width, color = '#8e886e' }: { from: Position; to: Position; width?: number; depth?: number; color?: string }) {
  const start = new THREE.Vector3(...from), end = new THREE.Vector3(...to), direction = end.clone().sub(start), length = direction.length();
  const rotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return <mesh position={start.add(end).multiplyScalar(.5)} quaternion={rotation} castShadow><boxGeometry args={[width, length, depth]} /><meshStandardMaterial color={color} roughness={.6} metalness={.15} /></mesh>;
}
/** A soft pool of shade where something meets the floor. */
function Grounding({ p, s, o = .6 }: { p: Position; s: [number, number]; o?: number }) {
  return <mesh position={p} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}><planeGeometry args={s} /><meshBasicMaterial map={contactShadow()} transparent opacity={o} depthWrite={false} toneMapped={false} /></mesh>;
}
function Plant({ p, scale = 1, kind = 'broad' }: { p: Position; scale?: number; kind?: 'broad' | 'fern' | 'tall' }) {
  const count = kind === 'fern' ? 12 : kind === 'tall' ? 5 : 7;
  return <group position={p} scale={scale}><Cylinder p={[0, .24, 0]} top={.27} bottom={.2} height={.48} c="#bb795e" /><Cylinder p={[0, .49, 0]} top={.24} height={.025} c="#554c37" />{Array.from({ length: count }, (_, i) => { const a = i * 2.4, h = kind === 'tall' ? 1.05 + (i % 3) * .22 : kind === 'fern' ? .45 + (i % 3) * .1 : .7; return <group key={i} position={[Math.sin(a) * .12, .68 + (i % 3) * .1, Math.cos(a) * .12]} rotation={[.4 * Math.cos(a), a, .4 * Math.sin(a)]}><Cylinder p={[0, -.12, 0]} top={.013} height={h} c="#526340" /><mesh position={[.08, h * .27, 0]} scale={[kind === 'fern' ? .12 : .18, kind === 'tall' ? .46 : kind === 'fern' ? .27 : .38, .07]} rotation={[.2, 0, -.55]} castShadow><sphereGeometry args={[1, 8, 6]} /><meshStandardMaterial color={i % 2 ? '#71875b' : '#465f46'} roughness={1} /></mesh></group>; })}</group>;
}
function Ceramic({ p }: { p: Position }) { return <group position={p}><Cylinder p={[0, .11, 0]} top={.11} bottom={.08} height={.23} c="#d8d3c0" /><Cylinder p={[0, .24, 0]} top={.07} height={.03} c="#b4c7be" /></group>; }
function Sailboat({ p, scale = 1 }: { p: Position; scale?: number }) { return <group position={p} scale={scale}><Soft p={[0, .04, 0]} s={[.5, .08, .17]} c="#8e6749" /><Box p={[0, .28, 0]} s={[.025, .48, .025]} c="#806b54" /><mesh position={[-.12, .33, .02]}><coneGeometry args={[.23, .42, 3]} /><meshStandardMaterial color="#f2e8d2" side={THREE.DoubleSide} /></mesh></group>; }
function Mug({ p, c = '#e9e3d6' }: { p: Position; c?: string }) { return <group position={p}><Cylinder p={[0, .07, 0]} top={.062} bottom={.052} height={.14} c={c} /><mesh position={[.075, .07, 0]} rotation={[0, 0, 0]}><torusGeometry args={[.04, .012, 6, 12]} /><meshStandardMaterial color={c} roughness={.8} /></mesh><Cylinder p={[0, .135, 0]} top={.052} height={.006} c="#6b4a35" /></group>; }
function BookStack({ p, tones = ['#3f6679', '#e5dcc6', clay], turn = .2 }: { p: Position; tones?: string[]; turn?: number }) {
  return <group position={p} rotation={[0, turn, 0]}>{tones.map((tone, i) => <Soft key={i} p={[i * .012, .03 + i * .058, 0]} s={[.44 - i * .04, .055, .31 - i * .02]} c={tone} rotation={[0, i * .14, 0]} />)}</group>;
}
function Framed({ p, s, kind, rotation }: { p: Position; s: [number, number]; kind: Parameters<typeof print>[0]; rotation?: Position }) {
  return <group position={p} rotation={rotation}><Box s={[s[0], s[1], .05]} c="#9c7754" /><mesh position={[0, 0, .028]}><planeGeometry args={[s[0] - .09, s[1] - .09]} /><meshStandardMaterial map={print(kind)} roughness={.95} /></mesh></group>;
}
/** A linen drum shade that glows when its lamp is lit. */
function LampShade({ p, top, bottom, height, on }: { p: Position; top: number; bottom: number; height: number; on: boolean }) {
  return <mesh position={p} castShadow><cylinderGeometry args={[top, bottom, height, 24, 1, true]} /><meshStandardMaterial color="#efe3cb" side={THREE.DoubleSide} roughness={1} emissive="#ffc98f" emissiveIntensity={on ? .75 : 0} /></mesh>;
}
/** A thread of steam above a warm cup. */
function Steam({ p, reduced }: { p: Position; reduced: boolean }) {
  const wisps = useRef<THREE.Group>(null);
  useFrame(({ clock }) => wisps.current?.children.forEach((child, i) => {
    const t = ((reduced ? .35 : clock.elapsedTime * .2) + i / 3) % 1, wisp = child as THREE.Sprite;
    wisp.position.set(Math.sin(t * 5 + i * 2) * .035, t * .5, Math.cos(t * 4 + i) * .02);
    wisp.material.opacity = Math.sin(t * Math.PI) * .13; wisp.scale.setScalar(.1 + t * .2);
  }));
  return <group ref={wisps} position={p}>{[0, 1, 2].map(i => <sprite key={i}><spriteMaterial map={glow()} transparent opacity={0} depthWrite={false} /></sprite>)}</group>;
}
function Interactive({ action, label, children, onAction, onHover }: { action: Action; label: string; children: ReactNode; onAction: RoomProps['onAction']; onHover: RoomProps['onHover'] }) {
  return <group onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); if (e.delta > 4) return; onAction(action); }} onPointerOver={e => { e.stopPropagation(); onHover(label); document.body.style.cursor = 'pointer'; }} onPointerOut={() => { onHover(''); document.body.style.cursor = ''; }}>{children}</group>;
}

function Bed() {
  const [w, , d] = home.bedSize;
  return <group position={home.furniture.bed}>
    <Soft p={[0, .22, 0]} s={[w + .18, .38, d + .1]} c="#a98360" />
    {[-w / 2 + .18, w / 2 - .18].flatMap(x => [-d / 2 + .2, d / 2 - .2].map(z => <Soft key={`${x}-${z}`} p={[x, .14, z]} s={[.14, .25, .14]} c="#866449" />))}
    <Cloth p={[0, .57, 0]} s={[w, .36, d]} c="#f5f0e7" />
    {/* An oatmeal linen duvet, turned down at the pillows and falling over the sides. */}
    <Cloth p={[0, .83, .6]} s={[w + .16, .3, d - 1.42]} c={linen} thread={9} />
    <Cloth p={[0, .985, -.86]} s={[w + .1, .11, .56]} c="#f7f3ea" thread={9} rotation={[.05, 0, 0]} />
    <Cloth p={[-w / 2 - .04, .66, .62]} s={[.22, .56, d - 1.5]} c="#e7dfcf" rotation={[0, 0, -.07]} thread={9} />
    <Cloth p={[w / 2 + .04, .66, .62]} s={[.22, .56, d - 1.5]} c="#e9e1d1" rotation={[0, 0, .07]} thread={9} />
    <Cloth p={[0, .72, d / 2 + .03]} s={[w + .14, .5, .2]} c="#e6decd" rotation={[.06, 0, 0]} thread={9} />
    {/* A sea-blue quilt folded across the foot and a clay throw left where it fell. */}
    <Cloth p={[0, 1.0, 1.42]} s={[w + .24, .13, 1.2]} c={seaBlue} thread={7} />
    <Cloth p={[-w / 2 - .06, .78, 1.42]} s={[.16, .5, 1.16]} c="#668fa0" thread={7} />
    <Cloth p={[w / 2 + .06, .78, 1.42]} s={[.16, .5, 1.16]} c="#668fa0" thread={7} />
    <Cloth p={[-.95, 1.09, .52]} s={[1.35, .1, .92]} c={clay} rotation={[0, .32, 0]} thread={3} />
    <Cloth p={[-1.52, 1.04, .86]} s={[.5, .16, .7]} c="#b06c51" rotation={[0, .32, -.2]} thread={3} />
    <Cloth p={[0, 1.22, -d / 2 + .08]} s={[w + .12, 1.3, .2]} c="#cdbfa8" thread={6} />
    {[-.93, .93].map((x, i) => <group key={i}>
      <Cloth p={[x, 1.28, -1.9]} s={[1.52, .62, .3]} c="#f7f2e8" rotation={[-.3, i ? -.05 : .05, 0]} thread={8} />
      <Cloth p={[x * .98, 1.16, -1.58]} s={[1.14, .5, .26]} c={i ? '#a9c3cb' : '#9dbac4'} rotation={[-.46, i ? .06 : -.04, 0]} thread={6} />
    </group>)}
    <Cloth p={[-.12, 1.06, -1.33]} s={[.82, .3, .22]} c={clay} rotation={[-.55, .08, 0]} thread={3} />
    {/* A book left open, face down. */}
    <group position={[.72, 1.0, .12]} rotation={[0, -.5, 0]}><Box p={[-.11, .015, 0]} s={[.22, .03, .3]} c="#3f6679" rotation={[0, 0, .12]} /><Box p={[.11, .015, 0]} s={[.22, .03, .3]} c="#3f6679" rotation={[0, 0, -.12]} /></group>
  </group>;
}

/** The bed alcove: oak panelling, a soft colour above it, a lowered linen canopy and an open timber screen on the room side. */
function SleepingNook({ glowing }: { glowing: number }) {
  const { left, right, depth, canopyY } = home.sleepingNook, rear = -home.room.depth / 2 + .1;
  const width = right - left, middle = (left + right) / 2, front = rear + depth, boards = Math.round(width / .42);
  return <group>
    <Box p={[middle, 1.04, rear + .04]} s={[width, 2.08, .08]} c="#bb9770" />
    {Array.from({ length: boards - 1 }, (_, i) => <Box key={i} p={[left + (i + 1) * width / boards, 1.04, rear + .083]} s={[.014, 2.04, .006]} c="#9a7957" />)}
    <Box p={[middle, 2.11, rear + .12]} s={[width, .07, .24]} c="#c19c74" />
    <mesh position={[middle, (2.15 + canopyY) / 2, rear + .03]} receiveShadow><boxGeometry args={[width, canopyY - 2.15, .06]} /><meshStandardMaterial color="#8fa39f" roughness={1} map={plaster()} /></mesh>
    <Framed p={[4.35, 2.47, rear + .2]} s={[.5, .62]} kind="sprig" rotation={[-.1, 0, 0]} />
    <Ceramic p={[6.55, 2.145, rear + .14]} />
    {/* Canopy: a timber frame carrying a stretched linen panel, held by two slim rods from the ceiling. */}
    <mesh position={[middle, canopyY, (rear + front) / 2]} castShadow receiveShadow><boxGeometry args={[width - .12, .035, depth - .1]} /><meshStandardMaterial color="#f0e8d8" roughness={1} bumpMap={weave(14)} bumpScale={1.2} emissive="#ffd9ad" emissiveIntensity={glowing * .14} /></mesh>
    <Box p={[middle, canopyY + .03, front]} s={[width + .16, .22, .15]} c={oak} />
    {[left, right].map(x => <group key={x}><Box p={[x, canopyY + .03, (rear + front) / 2]} s={[.15, .22, depth]} c={oak} /><Beam from={[x, canopyY + .14, front]} to={[x, home.room.height, front]} width={.04} color="#6f6050" /></group>)}
    {[1, 2].map(i => <Box key={i} p={[left + i * width / 3, canopyY + .07, (rear + front) / 2]} s={[.09, .11, depth]} c="#a47d58" />)}
    {/* The screen keeps the bed out of sight of the desk and the door without closing the room. */}
    {Array.from({ length: 11 }, (_, i) => <Box key={i} p={[left, canopyY / 2, rear + .16 + i * .225]} s={[.11, canopyY, .075]} c="#ab8460" />)}
    <Box p={[left, .09, rear + 1.28]} s={[.15, .18, 2.5]} c={oakDeep} />
    {[left + .14].map(x => <group key={x} position={[x, 0, front - .06]}>
      {[[-.05, 0], [.05, .05], [0, -.07]].map(([dx, dz], i) => <mesh key={i} position={[dx, canopyY / 2 + .06, dz]} castShadow><cylinderGeometry args={[.085, .13 - i * .01, canopyY - .14, 10]} /><meshStandardMaterial color={i % 2 ? '#e4dccb' : '#ece5d5'} roughness={1} bumpMap={weave(3)} bumpScale={1} /></mesh>)}
    </group>)}
    <pointLight position={[middle, canopyY - .55, rear + 1.3]} color={lampLight} intensity={2.6 * glowing} distance={5.5} />
  </group>;
}

function GamingChair() {
  return <group position={home.furniture.gamingChair} rotation={[0, -Math.PI / 2, 0]}>
    <Cylinder p={[0, .3, 0]} top={.075} height={.58} c="#465563" />
    {Array.from({ length: 5 }, (_, i) => { const a = i * Math.PI * 2 / 5; return <group key={i}><Beam from={[0, .14, 0]} to={[Math.cos(a) * .56, .09, Math.sin(a) * .56]} width={.085} color="#35414a" /><Cylinder p={[Math.cos(a) * .57, .04, Math.sin(a) * .57]} top={.085} height={.08} c="#35414a" /></group>; })}
    <Soft p={[0, .68, 0]} s={[.94, .25, .86]} c="#243b4c" />
    <Soft p={[0, .78, -.13]} s={[.73, .13, .53]} c="#33566c" />
    <Soft p={[0, 1.31, .37]} s={[.91, 1.29, .25]} c="#263e50" rotation={[-.12, 0, 0]} />
    <Soft p={[0, 1.28, .22]} s={[.63, .49, .11]} c="#355c72" />
    <Soft p={[0, 1.79, .43]} s={[.7, .29, .17]} c="#558da8" />
    {[-.53, .53].map(x => <group key={x}><Box p={[x, .79, .04]} s={[.07, .38, .07]} c="#323d46" /><Soft p={[x, .99, -.13]} s={[.15, .1, .61]} c="#344c5a" /></group>)}
  </group>;
}
function Desk({ focus, glowing, reduced }: { focus: boolean; glowing: number; reduced: boolean }) {
  const screenPortal = useThree(state => state.gl.domElement.parentElement);
  const [width, , depth] = home.worktable.size, screens = [-.72, .92];
  return <group position={home.furniture.desk}>
    <Soft p={[0, home.worktable.topY, 0]} s={home.worktable.size} c="#b7895c" />
    <Box p={[-width / 2 + .055, 1.055, 0]} s={[.04, .12, depth - .3]} c="#946c4a" />
    {[-depth / 2 + .3, depth / 2 - .3].flatMap(z => [-.91, .91].map(x => <Box key={`${x}-${z}`} p={[x, .51, z]} s={[.15, 1.02, .15]} c="#64513f" />))}
    <Box p={[.84, .42, 0]} s={[.08, .08, depth - .68]} c="#846548" />
    <Soft p={[-.52, 1.203, .1]} s={[1.18, .018, 3.05]} c="#243743" />
    {screens.map((z, i) => <group key={z}>
      <Soft p={[.38, 1.59, z]} s={[.15, .76, 1.62]} c="#25343b" />
      <mesh position={[.295, 1.59, z]}><boxGeometry args={[.012, .65, 1.5]} /><meshStandardMaterial color={i ? '#5b8e9d' : '#77a7b3'} emissive={i ? '#35657a' : '#4f8496'} emissiveIntensity={.3} roughness={.4} /></mesh>
      <Box p={[.81, 1.215, z]} s={[.36, .055, .52]} c="#454b48" />
      <Box p={[.78, 1.4, z]} s={[.075, .4, .075]} c="#4a514f" />
      <Beam from={[.75, 1.66, z]} to={[.49, 1.66, z]} width={.065} color="#4a514f" />
    </group>)}
    <Html portal={{ current: screenPortal! }} transform rotation={[0, -Math.PI / 2, 0]} position={[.289, 1.59, screens[0]]} distanceFactor={1.45} zIndexRange={[2, 1]} pointerEvents={focus ? 'auto' : 'none'}><div className={`monitor ${focus ? 'awake' : ''}`}><span className="monitor-sun" /><span>{focus ? 'Hello, dreamer.' : 'Take your time.'}</span><small>{focus ? 'A little space for big ideas.' : 'There is no hurry here.'}</small>{focus && <a href={home.website.url} target="_blank" rel="noreferrer">Visit my website ↗</a>}</div></Html>
    <Soft p={[-.69, 1.235, .02]} s={[.36, .045, 1.06]} c="#e6e4d8" />
    {Array.from({ length: 12 }, (_, i) => <Box key={i} p={[-.715, 1.26, -.45 + i * .083]} s={[.015, .006, .065]} c="#748f9e" />)}
    <Soft p={[-.69, 1.235, 1.02]} s={[.24, .055, .34]} c="#d6dad6" />
    <ComputerTower />
    {/* What a desk collects: a warm cup, a notebook, a small lamp for late hours. */}
    <Mug p={[-.42, 1.205, -1.2]} c="#c9d6d4" /><Steam p={[-.42, 1.38, -1.2]} reduced={reduced} />
    <group position={[-.72, 1.205, 1.52]} rotation={[0, .25, 0]}><Soft p={[0, .02, 0]} s={[.34, .035, .46]} c="#e9e1cf" /><Box p={[.05, .045, .02]} s={[.016, .012, .3]} c="#3f6679" /></group>
    <group position={[.72, 1.19, 1.72]}>
      <Cylinder p={[0, .02, 0]} top={.15} height={.04} c="#3c4a52" /><Beam from={[0, .03, 0]} to={[-.06, .62, -.04]} width={.03} color="#3c4a52" /><Beam from={[-.06, .62, -.04]} to={[-.38, .8, -.2]} width={.03} color="#3c4a52" />
      <mesh position={[-.42, .76, -.22]} rotation={[.25, 0, -.5]} castShadow><coneGeometry args={[.15, .2, 16, 1, true]} /><meshStandardMaterial color="#3c4a52" side={THREE.DoubleSide} emissive="#ffc98f" emissiveIntensity={glowing ? .5 : 0} /></mesh>
      <pointLight position={[-.46, .6, -.24]} color={lampLight} intensity={1.7 * glowing} distance={4} />
    </group>
  </group>;
}
function ComputerTower() {
  return <group position={[.79, 1.19, -1.52]}>
    <Soft p={[0, .36, 0]} s={[.76, .72, .7]} c="#26363e" />
    <Box p={[-.39, .36, 0]} s={[.014, .65, .61]} c="#8eabb6" />
    <Box p={[-.401, .36, 0]} s={[.008, .6, .57]} c="#182731" />
    {[-.16, .12].map(y => <group key={y}><mesh position={[-.408, .36 + y, -.12]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.12, .12, .015, 20]} /><meshStandardMaterial color="#5fa9d2" emissive="#4b9ccb" emissiveIntensity={.9} /></mesh><Cylinder p={[-.415, .36 + y, -.12]} top={.072} height={.018} c="#243743" rotation={[0, 0, Math.PI / 2]} /></group>)}
    <Box p={[-.41, .37, .17]} s={[.016, .11, .26]} c="#9eb6bd" />
    <Box p={[-.406, .15, .13]} s={[.012, .05, .43]} c="#496476" />
    <pointLight position={[-.5, .36, 0]} intensity={.5} distance={2} color="#67b5e4" />
  </group>;
}
function BedsideLamp({ on, glowing, p, children }: { on: boolean; glowing: number; p: Position; children?: ReactNode }) {
  return <group position={p}>
    <Soft p={[0, .43, 0]} s={[.7, .82, .64]} c="#aa805d" />
    <Box p={[0, .56, .325]} s={[.56, .22, .012]} c="#b98f69" /><Box p={[0, .56, .335]} s={[.12, .025, .012]} c="#7d6249" />
    <Cylinder p={[.1, .96, -.08]} top={.07} bottom={.12} height={.24} c="#d9d3c2" />
    <Cylinder p={[.1, 1.13, -.08]} top={.018} height={.12} c="#a8946c" />
    <LampShade p={[.1, 1.31, -.08]} top={.17} bottom={.25} height={.3} on={on} />
    <pointLight position={[.1, 1.32, -.08]} color={lampLight} intensity={4.6 * glowing} distance={6.5} />
    {children}
  </group>;
}
function LibraryBooks({ spec }: { spec: typeof home.library | typeof home.lowerLibrary }) {
  const volumes = useMemo(() => getLibraryBooks(spec), [spec]);
  const books = useRef<THREE.InstancedMesh>(null), bands = useRef<THREE.InstancedMesh>(null);
  const invalidate = useThree(state => state.invalidate);
  useLayoutEffect(() => {
    if (!books.current || !bands.current) return;
    const transform = new THREE.Object3D();
    volumes.forEach((volume, index) => {
      transform.position.set(...volume.position);
      transform.scale.set(...volume.size);
      transform.rotation.z = volume.size[1] > .2 && index % 13 === 0 ? .085 : 0;
      transform.updateMatrix();
      books.current!.setMatrixAt(index, transform.matrix);
      books.current!.setColorAt(index, new THREE.Color(volume.color));
      transform.position.z += volume.size[2] / 2 + .003;
      transform.scale.set(volume.size[0] * .73, .014, .005);
      transform.updateMatrix();
      bands.current!.setMatrixAt(index, transform.matrix);
    });
    books.current.instanceMatrix.needsUpdate = true;
    if (books.current.instanceColor) books.current.instanceColor.needsUpdate = true;
    bands.current.instanceMatrix.needsUpdate = true;
    books.current.computeBoundingSphere(); bands.current.computeBoundingSphere(); invalidate();
  }, [volumes, invalidate]);
  return <>
    <instancedMesh ref={books} args={[undefined, undefined, volumes.length]} castShadow receiveShadow><boxGeometry /><meshStandardMaterial roughness={.88} /></instancedMesh>
    <instancedMesh ref={bands} args={[undefined, undefined, volumes.length]}><boxGeometry /><meshStandardMaterial color="#dfd5ba" roughness={.84} /></instancedMesh>
  </>;
}
function Bookcase({ lower = false }: { lower?: boolean }) {
  const spec = lower ? home.lowerLibrary : home.library;
  const { width, height, depth, bays, shelves } = spec, bayWidth = width / bays;
  return <group position={lower ? home.furniture.lowerShelf : home.furniture.shelf} rotation={lower ? [0, Math.PI / 2, 0] : [0, 0, 0]}>
    <Soft p={[0, height / 2, -depth / 2]} s={[width, height, .11]} c="#b8b09c" />
    {Array.from({ length: bays + 1 }, (_, i) => <Soft key={i} p={[-width / 2 + i * bayWidth, height / 2, 0]} s={[.085, height, depth]} c={i % 3 ? '#9f7954' : '#ac8259'} />)}
    {[.06, ...shelves, height].map(y => <Soft key={y} p={[0, y, 0]} s={[width, .09, depth]} c="#b68c61" />)}
    <LibraryBooks spec={spec} />
    <Plant p={[width / 2 - .38, shelves[2] + .06, .06]} scale={.3} />
    <Ceramic p={[-width / 2 + .39, shelves[3] + .06, .04]} />
    {!lower && <Sailboat p={[.15, shelves[2] + .1, .06]} scale={.63} />}
  </group>;
}

/** The ground floor, the stair and the loft floor: everything a visitor can stand on. Clicking it walks there. */
function Floors({ onWalk }: Pick<RoomProps, 'onWalk'>) {
  const { width, depth, front } = home.room, rear = -depth / 2, floorDepth = front - rear, floorCenter = (front + rear) / 2;
  const [x, y, z] = home.loft.position, [loftWidth, thickness, loftDepth] = home.loft.size, stairs = getStairLayout();
  const marker = useRef<THREE.Mesh>(null), invalidate = useThree(state => state.invalidate);
  const standable = (e: ThreeEvent<MouseEvent | PointerEvent>) => !!e.face && e.face.normal.y > .5;
  const tones = ['#c9a67e', '#cfae88', '#c5a078', '#d3b38e', '#cba982'];
  return <group
    onClick={e => { if (e.delta > 4 || !standable(e)) return; e.stopPropagation(); onWalk([e.point.x, e.point.y, e.point.z]); }}
    onPointerMove={e => { if (!marker.current) return; marker.current.visible = standable(e); marker.current.position.set(e.point.x, e.point.y + .025, e.point.z); invalidate(); }}
    onPointerOut={() => { if (marker.current) { marker.current.visible = false; invalidate(); } }}>
    <Soft p={[0, -.22, floorCenter]} s={[width + .18, .43, floorDepth + .18]} c="#9a7754" />
    <mesh position={[0, .012, floorCenter]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[width, floorDepth]} /><meshStandardMaterial map={planks('ground', 36, tones)} roughness={.66} /></mesh>
    <Soft p={home.loft.position} s={home.loft.size} c="#a77c55" />
    <mesh position={[x, y + thickness / 2 + .012, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[loftWidth - .04, loftDepth - .04]} /><meshStandardMaterial map={planks('loft', 18, tones, 1024, 512)} roughness={.7} /></mesh>
    {stairs.treads.map((t, i) => <Soft key={i} p={t.position} s={t.size} c={i === 6 ? '#b98d5f' : '#c9a075'} />)}
    <mesh ref={marker} visible={false} rotation={[-Math.PI / 2, 0, 0]} renderOrder={3}><ringGeometry args={[.2, .26, 40]} /><meshBasicMaterial color="#fffaf0" transparent opacity={.7} depthWrite={false} toneMapped={false} /></mesh>
  </group>;
}

function Mezzanine() {
  const { position, size } = home.loft;
  const [x, y, z] = position, [width, thickness, depth] = size;
  const floor = y + thickness / 2, front = z + depth / 2, right = x + width / 2, left = x - width / 2;
  const stairs = getStairLayout(), rail = floor + home.stairs.railHeight;
  return <group>
    <Box p={[x, y - .22, front]} s={[width, .3, .22]} c="#916c4c" />
    {home.loftSupports.map(px => <Box key={px} p={[px, (y - thickness / 2) / 2, front - .14]} s={[.16, y - thickness / 2, .16]} c="#8a6749" />)}
    {[-7.6, -4.2, -.8].filter(px => px < right).map(px => <Box key={px} p={[px, y - .22, z]} s={[.11, .21, depth]} c="#8d6b4a" />)}
    <Beam from={[left, rail, front]} to={[-7.76, rail, front]} width={.075} color="#9a7350" />
    <Beam from={[-6.45, rail, front]} to={[right, rail, front]} width={.075} color="#9a7350" />
    {Array.from({ length: 18 }, (_, i) => { const px = left + i * width / 17; return px > -7.76 && px < -6.45 ? null : <Beam key={i} from={[px, floor, front]} to={[px, rail, front]} width={.033} color="#6f6050" />; })}
    <Beam from={[right, rail, z - depth / 2]} to={[right, rail, front]} width={.075} color="#9a7350" />
    {Array.from({ length: 5 }, (_, i) => <Beam key={i} from={[right, floor, z - depth / 2 + i * depth / 4]} to={[right, rail, z - depth / 2 + i * depth / 4]} width={.033} color="#6f6050" />)}
    <Beam from={[-3.4, 1.07, .86]} to={[-7.42, 2.68, .86]} width={.07} color="#8b6a4c" />
    {stairs.lower.filter((_, i) => i % 2 === 0).map((t, i) => <Beam key={i} from={[t.position[0], t.position[1] + .06, .82]} to={[t.position[0], t.position[1] + .86, .82]} width={.037} color="#695e52" />)}
    <Beam from={[-6.84, 2.68, .86]} to={[-6.84, rail, -3.2]} width={.07} color="#8b6a4c" />
    {stairs.upper.filter((_, i) => i % 2 === 0).map((t, i) => <Beam key={i} from={[-6.84, t.position[1] + .06, t.position[2]]} to={[-6.84, t.position[1] + .86, t.position[2]]} width={.037} color="#695e52" />)}
    <Box p={[-7.92, stairs.landing.position[1] / 2, .91]} s={[.09, stairs.landing.position[1], .09]} c="#876849" />
  </group>;
}

function Curtains({ open, reduced }: { open: boolean; reduced: boolean }) {
  const left = useRef<THREE.Group>(null), right = useRef<THREE.Group>(null);
  const invalidate = useThree(s => s.invalidate);
  const window = home.window;
  const height = window.top - window.bottom;
  const span = window.end - window.start, center = (window.start + window.end) / 2;
  const closedScale = span / 4;
  useEffect(() => invalidate(), [open, invalidate]);
  useFrame(({ clock }, dt) => {
    [left, right].forEach((ref, i) => {
      if (!ref.current) return;
      const target = open ? .4 : closedScale;
      const z = center + (i === 0 ? -1 : 1) * (open ? span / 2 - .32 : span / 4);
      if (reduced) { ref.current.scale.x = target; ref.current.position.z = z; return; }
      ref.current.scale.x = THREE.MathUtils.damp(ref.current.scale.x, target, 5, dt);
      ref.current.position.z = THREE.MathUtils.damp(ref.current.position.z, z, 5, dt);
      ref.current.rotation.z = Math.sin(clock.elapsedTime * .45 + i * 1.7) * .006;   // the faintest breath of air
      if (Math.abs(ref.current.scale.x - target) > .001 || Math.abs(ref.current.position.z - z) > .001) invalidate();
    });
  });
  return <group>
    <Beam from={[window.x - .28, window.top + .14, window.start - .15]} to={[window.x - .28, window.top + .14, window.end + .15]} width={.035} color="#a6956f" />
    {[left, right].map((ref, i) => <group key={i} ref={ref} position={[window.x - .3, (window.top + window.bottom) / 2, center + (i === 0 ? -1 : 1) * (span / 2 - .32)]} rotation={[0, -Math.PI / 2, 0]} scale={[.4, 1, 1]}>
      {Array.from({ length: 10 }, (_, j) => <mesh key={j} position={[-.9 + j * .2, 0, 0]} castShadow>
        <cylinderGeometry args={[.14, .15, height, 8, 1, true, -Math.PI / 2, Math.PI]} />
        <meshStandardMaterial color={j % 2 ? '#dcd8c9' : '#e9e5d8'} side={THREE.DoubleSide} roughness={1} bumpMap={weave(4)} bumpScale={1} />
      </mesh>)}
    </group>)}
  </group>;
}

function Wall({ p, s }: { p: Position; s: Position }) {
  return <mesh position={p} castShadow receiveShadow><boxGeometry args={s} /><meshStandardMaterial color={wallColor} roughness={1} map={plaster()} /></mesh>;
}
/** Casts a shadow without being drawn, so a cut-away ceiling or wall still keeps the daylight honest. */
function ShadowOnly({ p, s }: { p: Position; s: Position }) {
  return <mesh position={p} castShadow><boxGeometry args={s} /><meshBasicMaterial colorWrite={false} depthWrite={false} /></mesh>;
}

function Architecture({ atmosphere, glowing }: { atmosphere: Atmosphere; glowing: number }) {
  const { width, depth, front, height } = home.room, window = home.window;
  const rear = -depth / 2, floorDepth = front - rear, floorCenter = (front + rear) / 2;
  const roof = useRef<THREE.Group>(null), leftWall = useRef<THREE.Group>(null), frontWall = useRef<THREE.Group>(null);
  const land = useRef<THREE.MeshBasicMaterial>(null), tint = useRef(new THREE.Color()).current;
  useFrame(({ camera }, dt) => {
    const { x, y, z } = camera.position;
    if (roof.current) roof.current.visible = y < 9.2;
    if (leftWall.current) leftWall.current.visible = x > -8.9;
    // The front wall and its door exist only for someone standing in the room; from outside the house stays open.
    if (frontWall.current) frontWall.current.visible = z < front - .2 && Math.abs(x) < width / 2 && y < height;
    land.current?.color.lerp(tint.set(atmosphere === 'night' ? '#3a4a5c' : atmosphere === 'sunset' ? '#f1c7a8' : '#ffffff'), 1 - Math.exp(-3 * Math.min(dt, .05)));
  });
  return <group>
    <Wall p={[0, height / 2, rear]} s={[width, height, .2]} />
    <Box p={[0, 1.25, rear + .13]} s={[width - .25, 2.5, .05]} c="#ebe3d4" />
    <Box p={[0, 2.52, rear + .14]} s={[width - .25, .06, .08]} c="#c3a07a" />
    <Box p={[0, .1, rear + .17]} s={[width - .25, .2, .05]} c="#c9ab86" />
    <group ref={leftWall}>
      <Wall p={[-width / 2, height / 2, (rear + 1.05) / 2]} s={[.2, height, 1.05 - rear]} />
      <Wall p={[-width / 2, height / 2, (4.05 + front) / 2]} s={[.2, height, front - 4.05]} />
      <Wall p={[-width / 2, .6, 2.55]} s={[.2, 1.2, 3]} />
      <Wall p={[-width / 2, 6.05, 2.55]} s={[.2, 3, 3]} />
      <mesh position={[-width / 2 - .7, 2.75, 2.55]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[5.4, 4.6]} /><meshBasicMaterial ref={land} map={pines()} toneMapped={false} /></mesh>
      {[1.05, 2.55, 4.05].map(z => <Box key={z} p={[-width / 2 + .02, 2.7, z]} s={[.25, 3, .12]} c="#a77950" />)}
      <Box p={[-width / 2 + .02, 2.7, 2.55]} s={[.25, .1, 3]} c="#a77950" />
      <Box p={[-width / 2 + .08, 1.16, 2.55]} s={[.35, .1, 3.14]} c="#bd9368" />
    </group>
    <Wall p={[width / 2, height / 2, (rear + window.start) / 2]} s={[.22, height, window.start - rear]} />
    <Wall p={[width / 2, height / 2, (window.end + front) / 2]} s={[.22, height, front - window.end]} />
    <Wall p={[window.x, window.bottom / 2, (window.start + window.end) / 2]} s={[.2, window.bottom, window.end - window.start]} />
    <Wall p={[window.x, (window.top + height) / 2, (window.start + window.end) / 2]} s={[.2, height - window.top, window.end - window.start]} />
    <ShadowOnly p={[0, height + .2, floorCenter]} s={[width + .4, .1, floorDepth + .4]} />
    <group ref={roof}>
      <mesh position={[0, height + .08, floorCenter]} rotation={[Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[width, floorDepth]} /><meshStandardMaterial color="#f3eee4" roughness={1} map={plaster()} /></mesh>
      <Box p={[0, height + .05, rear]} s={[width, .22, .25]} c="#ae8258" />
      <Box p={[-width / 2, height + .05, floorCenter]} s={[.25, .22, floorDepth]} c="#ae8258" />
      <Box p={[width / 2, height + .05, floorCenter]} s={[.25, .22, floorDepth]} c="#ae8258" />
      {[-5.7, -2.9, .2, 3.5].map(z => <Box key={z} p={[0, height - .08, z]} s={[width, .22, .18]} c="#bd9065" />)}
      {/* One large paper globe in the tall part of the room gives the height a centre after dark. */}
      <Beam from={[1.9, height - .1, .2]} to={[1.9, 5.75, .2]} width={.02} color="#5d5448" />
      <mesh position={[1.9, 5.25, .2]} scale={[.62, .52, .62]}><sphereGeometry args={[1, 24, 16]} /><meshStandardMaterial color="#f4ecdb" roughness={1} emissive="#ffd7a6" emissiveIntensity={glowing ? .2 + glowing * .5 : 0} /></mesh>
      <pointLight position={[1.9, 5.2, .2]} color={lampLight} intensity={5.5 * glowing} distance={9} />
    </group>
    <group ref={frontWall} visible={false}>
      <mesh position={[0, height / 2 + .1, front + .1]}><boxGeometry args={[width, height + .2, .2]} /><meshStandardMaterial color={wallColor} roughness={1} map={plaster()} /></mesh>
      <Box p={[0, .1, front - .03]} s={[width - .25, .2, .05]} c="#c9ab86" />
      <Box p={[0, height + .05, front]} s={[width, .22, .25]} c="#ae8258" />
      {/* The way in: an oak door, a peg rail with a coat and a sun hat, a bench for taking shoes off. */}
      <Box p={[-1.5, 2.05, front - .02]} s={[2.0, 4.1, .08]} c="#a98360" />
      <Soft p={[-1.5, 2.0, front - .08]} s={[1.72, 3.9, .09]} c="#b89068" />
      {[1.05, 2.9].map(y => <Box key={y} p={[-1.5, y, front - .13]} s={[1.24, y < 2 ? 1.3 : 1.5, .012]} c="#b0875f" />)}
      <Cylinder p={[-.84, 1.95, front - .2]} top={.045} height={.16} c="#8a7350" rotation={[Math.PI / 2, 0, 0]} />
      <Box p={[1.3, 3.2, front - .04]} s={[2.1, .14, .05]} c={oak} />
      {[.45, 1.0, 1.6, 2.15].map(x => <Cylinder key={x} p={[x, 3.2, front - .12]} top={.035} height={.16} c="#8a6a4b" rotation={[Math.PI / 2, 0, 0]} />)}
      <Cloth p={[.5, 2.3, front - .2]} s={[.72, 1.75, .2]} c="#8c9c96" thread={4} /><Cloth p={[.5, 3.02, front - .2]} s={[.5, .26, .24]} c="#7f908a" thread={4} />
      <group position={[1.62, 3.0, front - .16]} rotation={[1.25, 0, 0]}><Cylinder p={[0, 0, 0]} top={.4} height={.025} c="#d9c59a" /><Cylinder p={[0, .09, 0]} top={.17} bottom={.2} height={.17} c="#d9c59a" /><Cylinder p={[0, .03, 0]} top={.205} height={.04} c={clay} /></group>
      <Soft p={[1.3, .72, front - .32]} s={[2.0, .1, .5]} c={oak} />
      {[.42, 2.18].map(x => <Box key={x} p={[x, .34, front - .32]} s={[.08, .68, .42]} c={oakDeep} />)}
      {[.95, 1.2].map((x, i) => <Soft key={x} p={[x, .08, front - .34 + i * .04]} s={[.17, .13, .44]} c="#d8cdb8" rotation={[0, i ? -.08 : .1, 0]} />)}
      <Framed p={[5.3, 3.25, front - .04]} s={[1.5, 1.85]} kind="horizon" rotation={[0, Math.PI, 0]} />
      {/* A shelf within reach of the desk. */}
      <Soft p={[-6.4, 3.05, front - .2]} s={[2.5, .08, .36]} c={oak} />
      <BookStack p={[-7.2, 3.09, front - .2]} tones={['#5d7a62', '#e5dcc6']} turn={3.3} />
      {['#3f6679', '#d8cdb8', clay, '#6f9aab', '#e5dcc6'].map((tone, i) => <Box key={i} p={[-6.5 + i * .11, 3.3 + (i % 2) * .03, front - .2]} s={[.09, .42 + (i % 2) * .06, .28]} c={tone} />)}
      <Plant p={[-5.55, 3.09, front - .2]} scale={.32} kind="fern" />
    </group>
    {Array.from({ length: 7 }, (_, i) => <Box key={i} p={[window.x, (window.bottom + window.top) / 2, window.start + i * (window.end - window.start) / 6]} s={[.2, window.top - window.bottom, i === 0 || i === 6 ? .17 : .09]} c="#a77950" />)}
    {[window.bottom, 3.45, window.top].map(y => <Box key={y} p={[window.x, y, (window.start + window.end) / 2]} s={[.2, .15, window.end - window.start + .1]} c="#a77950" />)}
    <Box p={[window.x - .18, window.bottom - .02, (window.start + window.end) / 2]} s={[.5, .12, window.end - window.start + .12]} c="#c49c70" />
    <Mezzanine />
  </group>;
}

/** The sea-window corner: a deep chair with its back guarded by a low shelf, a footstool, a reading lamp. */
function Lounge({ on, glowing, reduced }: { on: boolean; glowing: number; reduced: boolean }) {
  const [sx, , sz] = home.furniture.loungeShelf;
  return <>
    <group position={home.furniture.readingChair} rotation={[0, 1.76, 0]}>
      {[-.6, .6].flatMap(x => [-.55, .55].map(z => <Box key={`${x}-${z}`} p={[x, .13, z]} s={[.09, .26, .09]} c={oakDeep} />))}
      <Cloth p={[0, .44, 0]} s={[1.5, .34, 1.4]} c="#dcd2c0" thread={3} />
      <Cloth p={[0, .7, .12]} s={[1.1, .26, 1.06]} c="#e7dece" thread={3} />
      <Cloth p={[0, 1.1, -.58]} s={[1.5, 1.12, .36]} c="#ddd3c1" rotation={[-.16, 0, 0]} thread={3} />
      {[-.63, .63].map(x => <Cloth key={x} p={[x, .8, .04]} s={[.3, .66, 1.26]} c="#d9cfbd" thread={3} />)}
      <Cloth p={[.14, 1.04, -.34]} s={[.62, .52, .2]} c={seaBlue} rotation={[-.32, .18, 0]} thread={5} />
      <Cloth p={[-.64, 1.15, .1]} s={[.38, .06, .86]} c={clay} thread={3} /><Cloth p={[-.82, .86, .1]} s={[.06, .56, .86]} c="#b06c51" thread={3} />
    </group>
    <group position={home.furniture.ottoman}><mesh position={[0, .26, 0]} castShadow receiveShadow><cylinderGeometry args={[.5, .47, .4, 28]} /><meshStandardMaterial color="#b78a63" roughness={.7} bumpMap={weave(2)} bumpScale={.6} /></mesh><Cylinder p={[0, .04, 0]} top={.4} height={.08} c={oakDeep} /></group>
    <group position={[6.55, 0, 3.6]}>
      <Cylinder p={[0, .93, 0]} top={.4} height={.05} c={oak} /><Cylinder p={[0, .47, 0]} top={.035} height={.9} c={oakDeep} /><Cylinder p={[0, .02, 0]} top={.24} height={.04} c={oakDeep} />
      <Mug p={[-.1, .955, .1]} /><Steam p={[-.1, 1.12, .1]} reduced={reduced} /><BookStack p={[.12, .955, -.1]} tones={['#e5dcc6', '#5d7a62']} />
    </group>
    {/* An arc lamp leaning over the chair. */}
    <group position={[5.6, 0, 3.85]}>
      <Cylinder p={[0, .03, 0]} top={.3} height={.06} c="#4c4a44" /><Beam from={[0, .05, 0]} to={[0, 3.25, 0]} width={.045} color="#6f6654" />
      <Beam from={[0, 3.25, 0]} to={[.55, 3.72, -.5]} width={.04} color="#6f6654" /><Beam from={[.55, 3.72, -.5]} to={[1.1, 3.62, -1.05]} width={.04} color="#6f6654" />
      <LampShade p={[1.1, 3.4, -1.05]} top={.2} bottom={.38} height={.34} on={on} />
      <pointLight position={[1.1, 3.25, -1.05]} color={lampLight} intensity={6 * glowing} distance={7.5} />
    </group>
    <group position={[sx, 0, sz]}>
      <Soft p={[0, .55, 0]} s={[.5, 1.06, 2.7]} c="#b08862" />
      {[-.84, 0, .84].map(z => <Box key={z} p={[-.03, .56, z]} s={[.5, .86, .74]} c="#c4a27c" />)}
      {[-.84, 0, .84].map((z, bay) => ['#3f6679', '#d8cdb8', clay, '#5d7a62', '#e5dcc6'].slice(0, 4 + bay % 2).map((tone, i) => <Box key={`${z}-${i}`} p={[-.16, .36 + ((i + bay) % 3) * .03, z - .26 + i * .13]} s={[.3, .48 + ((i + bay) % 3) * .06, .1]} c={['#3f6679', '#d8cdb8', clay, '#5d7a62', '#e5dcc6'][(i + bay * 2) % 5]} />))}
      <Plant p={[0, 1.08, -.95]} scale={.42} /><BookStack p={[0, 1.08, .15]} tones={['#6f9aab', '#e5dcc6']} turn={1.2} />
      <Ceramic p={[0, 1.08, .95]} />
    </group>
  </>;
}
function TeaChair({ p, turn = 0 }: { p: Position; turn?: number }) {
  return <group position={p} rotation={[0, turn, 0]}>
    <Soft p={[0, .54, 0]} s={[.72, .08, .63]} c="#a77b52" />
    <Cloth p={[0, .6, .02]} s={[.6, .07, .52]} c="#d9d0bb" thread={3} />
    <mesh position={[0, .92, -.27]} rotation={[Math.PI / 2, 0, 0]} castShadow><torusGeometry args={[.34, .045, 8, 28, Math.PI]} /><meshStandardMaterial color="#946d4e" /></mesh>
    {[-.28, .28].flatMap(x => [-.23, .23].map(z => <Box key={`${x}-${z}`} p={[x, .29, z]} s={[.055, .55, .055]} c="#7e5b40" />))}
  </group>;
}
function HangingVine({ p, length = 1 }: { p: Position; length?: number }) {
  return <group position={p}>
    <Cylinder p={[0, .03, 0]} top={.18} height={.19} c="#a77d59" />
    {Array.from({ length: 8 }, (_, i) => {
      const y = -i * length / 8, x = Math.sin(i * 1.4) * .12;
      return <group key={i}><Beam from={[x, y, 0]} to={[Math.sin((i + 1) * 1.4) * .12, y - length / 8, 0]} width={.014} color="#496c51" /><mesh position={[x + .08, y - .03, .03]} scale={[.1, .04, .055]} rotation={[0, 0, i * .7]}><sphereGeometry args={[1, 8, 6]} /><meshStandardMaterial color={i % 2 ? '#6e9168' : '#52785a'} /></mesh></group>;
    })}
  </group>;
}
function TeaRoom({ glowing, reduced }: { glowing: number; reduced: boolean }) {
  const floor = home.loft.position[1] + home.loft.size[1] / 2, [tx, , tz] = home.furniture.teaTable;
  return <>
    <mesh position={[tx, floor + .03, tz + .12]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[4.5, 3.1]} /><meshStandardMaterial map={rug('tea', { ground: '#cfc3a2', line: 'rgba(120,110,80,.35)', border: '#6d6a56' })} roughness={1} bumpMap={weave(16)} bumpScale={1} /></mesh>
    <group position={home.furniture.teaTable}>
      <Soft p={[0, .75, 0]} s={[2.1, .15, 1.1]} c="#b88959" />
      {[-.78, .78].flatMap(x => [-.38, .38].map(z => <Soft key={`${x}-${z}`} p={[x, .39, z]} s={[.13, .76, .13]} c="#8e6847" />))}
      <Soft p={[0, .84, 0]} s={[.87, .046, .55]} c="#705c47" />
      <Cylinder p={[0, .94, 0]} top={.12} bottom={.16} height={.13} c="#d4e2d8" />
      <Cylinder p={[0, 1.025, 0]} top={.068} height={.04} c="#d4e2d8" />
      <Cylinder p={[.19, .95, 0]} top={.02} bottom={.03} height={.14} c="#d4e2d8" rotation={[0, 0, -.9]} />
      {[-.27, .27].map(x => <Cylinder key={x} p={[x, .92, .17]} top={.055} bottom={.047} height={.07} c="#e0e5d8" />)}
      <Steam p={[.26, 1.02, 0]} reduced={reduced} />
      <BookStack p={[-.72, .825, -.2]} tones={['#5d7a62', '#e5dcc6']} turn={-.3} />
    </group>
    <TeaChair p={[-3.6, floor, -3.1]} turn={Math.PI} />
    <TeaChair p={[-3.6, floor, -5.54]} />
    <TeaChair p={[-2.0, floor, -4.32]} turn={-Math.PI / 2} />
    {/* Two floor cushions for sitting low with a book. */}
    {[0, 1].map(i => <mesh key={i} position={[-6.75 + i * .06, floor + .1 + i * .17, -5.15]} castShadow receiveShadow><cylinderGeometry args={[.44 - i * .03, .44 - i * .03, .16, 24]} /><meshStandardMaterial color={i ? seaBlue : '#d6ccb7'} roughness={1} bumpMap={weave(4)} bumpScale={1.2} /></mesh>)}
    <Plant p={[-7.65, floor, -5.75]} scale={.7} />
    <Plant p={[-.6, floor, -5.55]} scale={.55} />
    <HangingVine p={[-6.92, floor + 2.77, -5.52]} length={1.18} />
    <HangingVine p={[-.65, floor + 2.58, -5.47]} length={1.43} />
    <group position={[-1.4, floor + 1.78, -6.08]}><Box s={[1.03, .69, .06]} c="#8d6b4c" /><Box p={[0, 0, .04]} s={[.88, .55, .01]} c="#ede3cc" /><Beam from={[-.36, -.17, .05]} to={[.27, .18, .05]} width={.018} color="#5f8896" /></group>
    <Soft p={[-.62, floor + .36, -4.7]} s={[.62, .7, .9]} c="#a47c57" /><Box p={[-.94, floor + .5, -4.7]} s={[.012, .1, .2]} c="#7d6249" /><Sailboat p={[-.62, floor + .73, -4.7]} scale={.8} />
    {/* A paper lantern low over the table. */}
    <Beam from={[tx, home.room.height - .1, tz]} to={[tx, floor + 3.05, tz]} width={.018} color="#5d5448" />
    <mesh position={[tx, floor + 2.72, tz]} scale={[.44, .37, .44]}><sphereGeometry args={[1, 24, 16]} /><meshStandardMaterial color="#f4ead8" roughness={1} emissive="#ffd3a0" emissiveIntensity={glowing ? .25 + glowing * .6 : 0} /></mesh>
    {[-.12, .12].map(y => <mesh key={y} position={[tx, floor + 2.72 + y, tz]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.41, .008, 6, 32]} /><meshStandardMaterial color="#b9a88a" /></mesh>)}
    <pointLight position={[tx, floor + 2.5, tz]} color={lampLight} intensity={6.5 * glowing} distance={7.5} />
    <pointLight position={[-4.5, 5.6, -5.3]} color={lampLight} intensity={.9 * glowing} distance={4} />
  </>;
}
function Television({ besideBed, reduced }: { besideBed: boolean; reduced: boolean }) {
  const ref = useRef<THREE.Group>(null), invalidate = useThree(s => s.invalidate);
  const { television, televisionParked } = home.furniture;
  useEffect(() => invalidate(), [besideBed, invalidate]);
  useFrame((_, dt) => {
    if (!ref.current) return;
    const [x, , z] = besideBed ? television : televisionParked;
    const angle = besideBed ? -.27 : .6;
    const step = reduced ? 1 : 1 - Math.exp(-4 * dt);
    ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, x, step);
    ref.current.position.z = THREE.MathUtils.lerp(ref.current.position.z, z, step);
    ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, angle, step);
    if (Math.abs(ref.current.position.x - x) + Math.abs(ref.current.position.z - z) + Math.abs(ref.current.rotation.y - angle) > .002) invalidate();
  });
  return <group ref={ref} position={television} rotation={[0, -.27, 0]}>
    <Box p={[0, 1.47, 0]} s={[1.36, .82, .09]} c="#263740" />
    <Box p={[0, 1.47, -.052]} s={[1.23, .68, .012]} c="#3e5f70" />
    <Box p={[0, .72, .02]} s={[.08, 1.05, .08]} c="#566268" />
    <Box p={[0, .22, .08]} s={[.78, .1, .48]} c="#626d70" />
    {[-.3, .3].flatMap(x => [-.1, .3].map(z => <Cylinder key={`${x}-${z}`} p={[x, .11, z]} top={.075} height={.11} c="#313c43" />))}
  </group>;
}
function Rug({ p, s, style, name, round = false }: { p: Position; s: [number, number]; style: Parameters<typeof rug>[1]; name: string; round?: boolean }) {
  return <mesh position={p} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
    {round ? <circleGeometry args={[s[0], 48]} /> : <planeGeometry args={s} />}
    <meshStandardMaterial map={rug(name, style, round)} roughness={1} bumpMap={weave(round ? 10 : 14)} bumpScale={1.4} />
  </mesh>;
}
function Details({ on, glowing }: { on: boolean; glowing: number }) {
  const { bed, desk, readingChair, gamingChair, loungeShelf, ottoman } = home.furniture, rear = -home.room.depth / 2;
  return <>
    <Rug name="bed" p={[bed[0], .03, bed[2] + .45]} s={[5.2, 5.5]} style={{ ground: '#e6decd', line: 'rgba(111,154,171,.5)', border: '#a9bcc0' }} />
    <Rug name="desk" p={[desk[0] - .8, .03, desk[2]]} s={[3.65, 4.3]} style={{ ground: '#93adb8', line: 'rgba(236,229,214,.5)', border: '#dfe5e2' }} />
    <Rug name="entry" p={[-1.5, .03, 3.5]} s={[1.5, 2.8]} style={{ ground: '#ddd3c0', line: 'rgba(185,116,88,.5)', border: '#b9a58a' }} />
    <Rug name="lounge" round p={[readingChair[0] + .05, .03, readingChair[2]]} s={[2.1, 2.1]} style={{ ground: '#cdb994', line: '', border: 'rgba(120,92,60,.5)' }} />
    <group position={[-2, 0, 0]}>
      <Soft p={[-.2, .54, -5.72]} s={[2.65, 1.03, .53]} c="#aa825b" />
      {[-.8, 0, .8].map(x => <group key={x}><Box p={[x - .2, .54, -5.445]} s={[.8, .82, .02]} c="#bb946b" /><Box p={[x, .56, -5.43]} s={[.03, .17, .016]} c="#7d6249" /></group>)}
      <Ceramic p={[-1.2, 1.06, -5.68]} />
      <Plant p={[.82, 1.07, -5.7]} scale={.31} kind="fern" />
      <BookStack p={[.2, 1.06, -5.68]} tones={['#3f6679', '#e5dcc6', '#5d7a62']} />
      {/* A lamp and three prints make the low space under the loft somewhere to pause. */}
      <Cylinder p={[-.55, 1.2, -5.72]} top={.06} bottom={.13} height={.3} c="#7f9a98" /><LampShade p={[-.55, 1.52, -5.72]} top={.16} bottom={.24} height={.3} on={on} />
      <pointLight position={[-.55, 1.6, -5.6]} color={lampLight} intensity={4 * glowing} distance={6} />
      <Framed p={[-1.25, 2.45, rear + .19]} s={[.82, 1.02]} kind="horizon" /><Framed p={[-.2, 2.45, rear + .19]} s={[.82, 1.02]} kind="sun" /><Framed p={[.85, 2.45, rear + .19]} s={[.82, 1.02]} kind="sprig" />
    </group>
    <Plant p={home.furniture.plant} scale={1.23} kind="tall" />
    <Plant p={[.48, 0, -5.38]} scale={.85} kind="fern" />
    {/* Slippers by the bed. */}
    {[0, 1].map(i => <Soft key={i} p={[7.42 + i * .22, .07, -2.75 + i * .05]} s={[.17, .09, .42]} c="#cdbfa8" rotation={[0, .12 - i * .2, 0]} />)}
    <Grounding p={[bed[0], .045, bed[2] + .1]} s={[5.3, 6.1]} /><Grounding p={[desk[0], .045, desk[2]]} s={[3.6, 5.2]} o={.5} /><Grounding p={[gamingChair[0], .046, gamingChair[2]]} s={[1.8, 1.8]} />
    <Grounding p={[-2.2, .02, -5.6]} s={[3.6, 1.7]} /><Grounding p={[readingChair[0], .046, readingChair[2]]} s={[2.5, 2.5]} /><Grounding p={[ottoman[0], .046, ottoman[2]]} s={[1.5, 1.5]} />
    <Grounding p={[loungeShelf[0], .02, loungeShelf[2]]} s={[1.3, 3.5]} /><Grounding p={[8.2, .046, -5.05]} s={[1.3, 1.3]} /><Grounding p={[.48, .02, -5.38]} s={[1.1, 1.1]} />
    <Grounding p={[-8.75, .02, -3.74]} s={[1.3, 4.6]} o={.5} />
  </>;
}
/** Dust turning in the shaft of light from the sea window. */
function Motes({ strength, reduced }: { strength: number; reduced: boolean }) {
  const points = useRef<THREE.Points>(null);
  const seeds = useMemo(() => Array.from({ length: 70 }, (_, i) => [3.2 + (i * 37 % 53) / 53 * 5.4, .6 + (i * 17 % 41) / 41 * 4.4, -4.2 + (i * 29 % 47) / 47 * 7.4, i * 1.7]), []);
  const positions = useMemo(() => new Float32Array(seeds.flatMap(([x, y, z]) => [x, y, z])), [seeds]);
  useFrame(({ clock }, dt) => {
    if (!points.current) return;
    const material = points.current.material as THREE.PointsMaterial, time = reduced ? 0 : clock.elapsedTime;
    material.opacity = THREE.MathUtils.damp(material.opacity, strength, 2, dt);
    points.current.visible = material.opacity > .01;
    if (!points.current.visible || reduced) return;
    const attribute = points.current.geometry.attributes.position;
    seeds.forEach(([x, y, z, phase], i) => attribute.setXYZ(i, x + Math.sin(time * .11 + phase) * .35, y + Math.sin(time * .07 + phase * 1.3) * .3, z + Math.cos(time * .09 + phase) * .35));
    attribute.needsUpdate = true;
  });
  return <points ref={points}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry><pointsMaterial map={glow()} color="#fff3d9" size={.05} transparent opacity={0} depthWrite={false} sizeAttenuation /></points>;
}
function Rain({ reduced }: { reduced: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null); const dummy = useMemo(() => new THREE.Object3D(), []);
  const count = 150, { window } = home, span = window.end - window.start, tall = window.top - window.bottom;
  useFrame(({ clock }) => {
    if (!ref.current) return;
    for (let i = 0; i < count; i++) {
      dummy.position.set(window.x + .16 + (i % 5) * .22, window.bottom + ((i * .417 - (reduced ? 0 : clock.elapsedTime) * (2.4 + (i % 4) * .5)) % tall + tall) % tall, window.start + (i * 1.713 % span));
      dummy.rotation.x = .1; dummy.updateMatrix(); ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[undefined, undefined, count]} frustumCulled={false}><boxGeometry args={[.011, .2, .011]} /><meshBasicMaterial color="#e3ecee" transparent opacity={.62} /></instancedMesh>;
}

/** Daylight comes from one side, as it does in a real room: a warm sun through the sea window, a cool
 *  shadowless wash from the same sky, and a low bounce from the floor. Lamps do the rest. */
function Lighting({ atmosphere, rain, curtains, reduced }: Pick<RoomProps, 'atmosphere' | 'rain' | 'curtains' | 'reduced'>) {
  const ambient = useRef<THREE.AmbientLight>(null), bounce = useRef<THREE.HemisphereLight>(null), sun = useRef<THREE.DirectionalLight>(null), fill = useRef<THREE.DirectionalLight>(null);
  const { scene, invalidate } = useThree(), color = useRef(new THREE.Color()).current, from = useRef(new THREE.Vector3()).current;
  const start = useRef(atmospheres[atmosphere]).current;
  useEffect(() => { scene.background = new THREE.Color(start.background); invalidate(); }, [scene, invalidate, start]);
  useEffect(() => invalidate(), [atmosphere, rain, curtains, invalidate]);
  useFrame((_, dt) => {
    const a = atmospheres[atmosphere], t = reduced ? 1 : 1 - Math.exp(-3 * Math.min(dt, .05)), dull = rain ? .22 : 1;
    const drawn = curtains ? 1 : .55;   // closed curtains hold back the sky's wash as well as the sun
    let moving = false;
    const ease = (light: THREE.Light | null, target: number) => { if (!light) return; moving ||= Math.abs(light.intensity - target) > .003; light.intensity = THREE.MathUtils.lerp(light.intensity, target, t); };
    ease(ambient.current, a.ambient * (rain ? .9 : 1) * (curtains ? 1 : .85)); ease(bounce.current, a.bounce * (rain ? .8 : 1) * (curtains ? 1 : .8)); ease(sun.current, a.intensity * dull); ease(fill.current, a.fill * (rain ? .85 : 1) * drawn);
    if (sun.current) {
      sun.current.color.lerp(color.set(a.sun), t);
      from.set(...a.sunFrom).normalize().multiplyScalar(34);
      moving ||= sun.current.position.distanceTo(from) > .02;
      sun.current.position.lerp(from, t);
    }
    fill.current?.color.lerp(color.set(a.skyFill), t);
    if (scene.background instanceof THREE.Color) scene.background.lerp(color.set(a.background), t);
    if (moving) invalidate();
  });
  return <>
    <ambientLight ref={ambient} intensity={start.ambient} color="#fff6ea" />
    <hemisphereLight ref={bounce} args={['#f6f1e8', '#b89674', start.bounce]} />
    <directionalLight ref={sun} position={new THREE.Vector3(...start.sunFrom).normalize().multiplyScalar(34)} intensity={start.intensity} color={start.sun} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={12} shadow-camera-bottom={-12} shadow-camera-near={4} shadow-camera-far={70} shadow-normalBias={.05} shadow-bias={-.0004} />
    <directionalLight ref={fill} position={[10, 5, 1]} intensity={start.fill} color={start.skyFill} />
  </>;
}

const orbits: Record<Exclude<View, 'inside'>, [Position, Position]> = {
  front: [[3.2, 3.35, 15.3], [.2, 2.5, -2.6]],
  overview: [[-18, 12, 18], [0, 2.8, -.5]],
};
export function Room(props: RoomProps) {
  const controls = useRef<CameraControls>(null), wasInside = useRef(true);
  const { camera, invalidate } = useThree(), wide = useThree(state => state.size.width > 1100);
  const inside = props.view === 'inside', glowing = props.lamp ? lampLevel[props.atmosphere] : 0;
  useEffect(() => {
    const c = controls.current;
    if (props.view === 'inside') { wasInside.current = true; return; }
    if (!c) return;
    if (wasInside.current) {
      // Hand the camera over from where the visitor was standing, so the move out is one continuous glide.
      const ahead = camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(8).add(camera.position);
      c.setLookAt(camera.position.x, camera.position.y, camera.position.z, ahead.x, ahead.y, ahead.z, false);
      wasInside.current = false;
    }
    c.setFocalOffset(wide ? -2.6 : 0, 0, 0, !props.reduced);
    c.setLookAt(...orbits[props.view][0], ...orbits[props.view][1], !props.reduced);
  }, [props.view, props.reset, props.reduced, camera, wide]);
  // The sea, the steam and the dust keep moving gently; thirty frames a second is plenty for that.
  useEffect(() => {
    if (props.reduced) return;
    const tick = setInterval(() => { if (!document.hidden) invalidate(); }, 33);
    return () => clearInterval(tick);
  }, [props.reduced, invalidate]);
  const sunny = props.rain || !props.curtains ? 0 : props.atmosphere === 'day' ? .5 : props.atmosphere === 'sunset' ? .65 : 0;
  return <>
    <Lighting atmosphere={props.atmosphere} rain={props.rain} curtains={props.curtains} reduced={props.reduced} />
    <Outside atmosphere={props.atmosphere} rain={props.rain} reduced={props.reduced} />
    <Architecture atmosphere={props.atmosphere} glowing={glowing} />
    <Floors onWalk={props.onWalk} />
    <Interactive action="bed" label="Rest on the bed" {...props}><Bed /></Interactive>
    <SleepingNook glowing={glowing} />
    <GamingChair /><Details on={props.lamp} glowing={glowing} />
    <Interactive action="computer" label="Sit down at the computer" {...props}><Desk focus={props.focus} glowing={glowing} reduced={props.reduced} /></Interactive>
    <Interactive action="lounge" label="Sink into the chair by the sea window" {...props}><Lounge on={props.lamp} glowing={glowing} reduced={props.reduced} /></Interactive>
    <Interactive action="lamp" label={props.lamp ? 'Turn off the lamps' : 'Turn on the lamps'} {...props}>
      <BedsideLamp on={props.lamp} glowing={glowing} p={home.furniture.bedsideTable}><Mug p={[-.18, .84, .12]} c="#c9d6d4" /></BedsideLamp>
      <BedsideLamp on={props.lamp} glowing={glowing} p={[home.furniture.bed[0] - home.bedSize[0] / 2 - .55, 0, home.furniture.bedsideTable[2]]}><BookStack p={[-.12, .84, .1]} tones={['#e5dcc6', clay]} /></BedsideLamp>
    </Interactive>
    <Interactive action="books" label="Browse the library wall" {...props}><Bookcase /><Bookcase lower /></Interactive>
    <Interactive action="tea" label="Take a seat at the tea table" {...props}><TeaRoom glowing={glowing} reduced={props.reduced} /></Interactive>
    <Interactive action="television" label="Explore the rolling television" {...props}><Television besideBed={props.tvBesideBed} reduced={props.reduced} /></Interactive>
    <Interactive action="curtains" label={props.curtains ? 'Close the curtains' : 'Open the curtains'} {...props}><Curtains open={props.curtains} reduced={props.reduced} /></Interactive>
    <Motes strength={sunny} reduced={props.reduced} />
    {props.rain && <Rain reduced={props.reduced} />}
    <Presence active={inside} place={props.place} placeKey={props.placeKey} walkTarget={props.walkTarget} reduced={props.reduced} veil={props.veil} onEngage={props.onEngage} onWander={props.onWander} />
    {!inside && <CameraControls ref={controls} makeDefault minPolarAngle={.35} maxPolarAngle={1.5} minAzimuthAngle={-1.1} maxAzimuthAngle={1.2} minDistance={2.2} maxDistance={45} dollySpeed={.6} truckSpeed={0} smoothTime={props.reduced ? 0 : .55} />}
  </>;
}
