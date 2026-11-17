import { useEffect, useRef, type ReactNode } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { home, type Position } from '../config';
import { plaster, weave } from '../textures';
import { Beam, Box, Ceramic, Cloth, Cylinder, Framed, LampShade, Soft, clay, lampLight, linen, oak, oakDeep, seaBlue } from './primitives';

export function Bed() {
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
export function SleepingNook({ glowing }: { glowing: number }) {
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

export function BedsideLamp({ on, glowing, p, children }: { on: boolean; glowing: number; p: Position; children?: ReactNode }) {
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

/** A television on castors that rolls between the foot of the bed and the sea window. */
export function Television({ besideBed, reduced }: { besideBed: boolean; reduced: boolean }) {
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
