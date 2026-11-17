import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { Atmosphere, Position } from '../config';
import { contactShadow, glow, plaster, print, rug, weave } from '../textures';

// The small parts every corner of the room is built from, and the palette they share.
export const oak = '#b48a62', oakDeep = '#8e6b4c', wallColor = '#f1ece2', linen = '#ece5d6', seaBlue = '#6f9aab', clay = '#b97458', lampLight = '#ffd3a6';
/** How much the lamps matter at each time of day. */
export const lampLevel: Record<Atmosphere, number> = { day: .5, sunset: .85, night: 1 };

export function Box({ p = [0, 0, 0], s, c, r = 0, rotation }: { p?: Position; s: Position; c: string; r?: number; rotation?: Position }) {
  return <mesh position={p} rotation={rotation} castShadow receiveShadow><boxGeometry args={s} /><meshStandardMaterial color={c} roughness={.85} metalness={r} /></mesh>;
}
export function Soft({ p, s, c, rotation }: { p: Position; s: Position; c: string; rotation?: Position }) {
  return <RoundedBox position={p} args={s} radius={Math.min(.08, ...s.map(dimension => dimension / 3))} smoothness={2} rotation={rotation} castShadow receiveShadow><meshStandardMaterial color={c} roughness={.95} /></RoundedBox>;
}
/** Anything woven: bedding, cushions, upholstery. A fine bump keeps it from reading as plastic. */
export function Cloth({ p, s, c, rotation, thread = 5 }: { p: Position; s: Position; c: string; rotation?: Position; thread?: number }) {
  return <RoundedBox position={p} args={s} radius={Math.min(.11, ...s.map(dimension => dimension / 2.4))} smoothness={3} rotation={rotation} castShadow receiveShadow><meshStandardMaterial color={c} roughness={1} bumpMap={weave(thread)} bumpScale={1.4} /></RoundedBox>;
}
export function Cylinder({ p, top, bottom = top, height, c, rotation }: { p: Position; top: number; bottom?: number; height: number; c: string; rotation?: Position }) {
  return <mesh position={p} rotation={rotation} castShadow receiveShadow><cylinderGeometry args={[top, bottom, height, 20]} /><meshStandardMaterial color={c} roughness={.8} /></mesh>;
}
export function Beam({ from, to, width = .035, depth = width, color = '#8e886e' }: { from: Position; to: Position; width?: number; depth?: number; color?: string }) {
  const start = new THREE.Vector3(...from), end = new THREE.Vector3(...to), direction = end.clone().sub(start), length = direction.length();
  const rotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return <mesh position={start.add(end).multiplyScalar(.5)} quaternion={rotation} castShadow><boxGeometry args={[width, length, depth]} /><meshStandardMaterial color={color} roughness={.6} metalness={.15} /></mesh>;
}
/** A soft pool of shade where something meets the floor. */
export function Grounding({ p, s, o = .6 }: { p: Position; s: [number, number]; o?: number }) {
  return <mesh position={p} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}><planeGeometry args={s} /><meshBasicMaterial map={contactShadow()} transparent opacity={o} depthWrite={false} toneMapped={false} /></mesh>;
}
export function Plant({ p, scale = 1, kind = 'broad' }: { p: Position; scale?: number; kind?: 'broad' | 'fern' | 'tall' }) {
  const count = kind === 'fern' ? 12 : kind === 'tall' ? 5 : 7;
  return <group position={p} scale={scale}><Cylinder p={[0, .24, 0]} top={.27} bottom={.2} height={.48} c="#bb795e" /><Cylinder p={[0, .49, 0]} top={.24} height={.025} c="#554c37" />{Array.from({ length: count }, (_, i) => { const a = i * 2.4, h = kind === 'tall' ? 1.05 + (i % 3) * .22 : kind === 'fern' ? .45 + (i % 3) * .1 : .7; return <group key={i} position={[Math.sin(a) * .12, .68 + (i % 3) * .1, Math.cos(a) * .12]} rotation={[.4 * Math.cos(a), a, .4 * Math.sin(a)]}><Cylinder p={[0, -.12, 0]} top={.013} height={h} c="#526340" /><mesh position={[.08, h * .27, 0]} scale={[kind === 'fern' ? .12 : .18, kind === 'tall' ? .46 : kind === 'fern' ? .27 : .38, .07]} rotation={[.2, 0, -.55]} castShadow><sphereGeometry args={[1, 8, 6]} /><meshStandardMaterial color={i % 2 ? '#71875b' : '#465f46'} roughness={1} /></mesh></group>; })}</group>;
}
export function Ceramic({ p }: { p: Position }) { return <group position={p}><Cylinder p={[0, .11, 0]} top={.11} bottom={.08} height={.23} c="#d8d3c0" /><Cylinder p={[0, .24, 0]} top={.07} height={.03} c="#b4c7be" /></group>; }
export function Sailboat({ p, scale = 1 }: { p: Position; scale?: number }) { return <group position={p} scale={scale}><Soft p={[0, .04, 0]} s={[.5, .08, .17]} c="#8e6749" /><Box p={[0, .28, 0]} s={[.025, .48, .025]} c="#806b54" /><mesh position={[-.12, .33, .02]}><coneGeometry args={[.23, .42, 3]} /><meshStandardMaterial color="#f2e8d2" side={THREE.DoubleSide} /></mesh></group>; }
export function Mug({ p, c = '#e9e3d6' }: { p: Position; c?: string }) { return <group position={p}><Cylinder p={[0, .07, 0]} top={.062} bottom={.052} height={.14} c={c} /><mesh position={[.075, .07, 0]} rotation={[0, 0, 0]}><torusGeometry args={[.04, .012, 6, 12]} /><meshStandardMaterial color={c} roughness={.8} /></mesh><Cylinder p={[0, .135, 0]} top={.052} height={.006} c="#6b4a35" /></group>; }
export function BookStack({ p, tones = ['#3f6679', '#e5dcc6', clay], turn = .2 }: { p: Position; tones?: string[]; turn?: number }) {
  return <group position={p} rotation={[0, turn, 0]}>{tones.map((tone, i) => <Soft key={i} p={[i * .012, .03 + i * .058, 0]} s={[.44 - i * .04, .055, .31 - i * .02]} c={tone} rotation={[0, i * .14, 0]} />)}</group>;
}
export function Framed({ p, s, kind, rotation }: { p: Position; s: [number, number]; kind: Parameters<typeof print>[0]; rotation?: Position }) {
  return <group position={p} rotation={rotation}><Box s={[s[0], s[1], .05]} c="#9c7754" /><mesh position={[0, 0, .028]}><planeGeometry args={[s[0] - .09, s[1] - .09]} /><meshStandardMaterial map={print(kind)} roughness={.95} /></mesh></group>;
}
/** A linen drum shade that glows when its lamp is lit. */
export function LampShade({ p, top, bottom, height, on }: { p: Position; top: number; bottom: number; height: number; on: boolean }) {
  return <mesh position={p} castShadow><cylinderGeometry args={[top, bottom, height, 24, 1, true]} /><meshStandardMaterial color="#efe3cb" side={THREE.DoubleSide} roughness={1} emissive="#ffc98f" emissiveIntensity={on ? .75 : 0} /></mesh>;
}
/** A thread of steam above a warm cup. */
export function Steam({ p, reduced }: { p: Position; reduced: boolean }) {
  const wisps = useRef<THREE.Group>(null);
  useFrame(({ clock }) => wisps.current?.children.forEach((child, i) => {
    const t = ((reduced ? .35 : clock.elapsedTime * .2) + i / 3) % 1, wisp = child as THREE.Sprite;
    wisp.position.set(Math.sin(t * 5 + i * 2) * .035, t * .5, Math.cos(t * 4 + i) * .02);
    wisp.material.opacity = Math.sin(t * Math.PI) * .13; wisp.scale.setScalar(.1 + t * .2);
  }));
  return <group ref={wisps} position={p}>{[0, 1, 2].map(i => <sprite key={i}><spriteMaterial map={glow()} transparent opacity={0} depthWrite={false} /></sprite>)}</group>;
}
export function Rug({ p, s, style, name, round = false }: { p: Position; s: [number, number]; style: Parameters<typeof rug>[1]; name: string; round?: boolean }) {
  return <mesh position={p} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
    {round ? <circleGeometry args={[s[0], 48]} /> : <planeGeometry args={s} />}
    <meshStandardMaterial map={rug(name, style, round)} roughness={1} bumpMap={weave(round ? 10 : 14)} bumpScale={1.4} />
  </mesh>;
}
export function Wall({ p, s }: { p: Position; s: Position }) {
  return <mesh position={p} castShadow receiveShadow><boxGeometry args={s} /><meshStandardMaterial color={wallColor} roughness={1} map={plaster()} /></mesh>;
}
/** Casts a shadow without being drawn, so a cut-away ceiling or wall still keeps the daylight honest. */
export function ShadowOnly({ p, s }: { p: Position; s: Position }) {
  return <mesh position={p} castShadow><boxGeometry args={s} /><meshBasicMaterial colorWrite={false} depthWrite={false} /></mesh>;
}
