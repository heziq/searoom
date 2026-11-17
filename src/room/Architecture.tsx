import { useEffect, useRef } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { home, type Atmosphere } from '../config';
import { getStairLayout } from '../layout';
import { pines, planks, plaster, weave } from '../textures';
import { Beam, BookStack, Box, Cloth, Cylinder, Framed, Plant, ShadowOnly, Soft, Wall, clay, lampLight, oak, oakDeep, wallColor } from './primitives';
import type { RoomProps } from './types';

/** The ground floor, the stair and the loft floor: everything a visitor can stand on. Clicking it walks there. */
export function Floors({ onWalk }: Pick<RoomProps, 'onWalk'>) {
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
    {stairs.treads.map((t, i) => <Soft key={i} p={t.position} s={t.size} c={i === stairs.treads.length - 1 ? '#a77c55' : '#c9a075'} />)}
    <mesh ref={marker} visible={false} rotation={[-Math.PI / 2, 0, 0]} renderOrder={3}><ringGeometry args={[.2, .26, 40]} /><meshBasicMaterial color="#fffaf0" transparent opacity={.7} depthWrite={false} toneMapped={false} /></mesh>
  </group>;
}

/** The loft's edge and the stair that reaches it: supports, railings, stringers and the handrail. */
function Mezzanine() {
  const { position, size } = home.loft;
  const [x, y, z] = position, [width, thickness, depth] = size;
  const floor = y + thickness / 2, front = z + depth / 2, right = x + width / 2, left = x - width / 2;
  const stairs = getStairLayout(), { foot, railHeight, width: stairWidth } = home.stairs, rail = floor + railHeight;
  const edge = home.stairs.x + stairWidth / 2;   // the open side of the flight; the other side is the wall
  const corner = left + .03;
  return <group>
    <Box p={[x, y - .22, front]} s={[width, .3, .22]} c="#916c4c" />
    {home.loftSupports.map(px => <Box key={px} p={[px, (y - thickness / 2) / 2, front - .14]} s={[.16, y - thickness / 2, .16]} c="#8a6749" />)}
    {[-7.6, -4.2, -.8].filter(px => px < right).map(px => <Box key={px} p={[px, y - .22, z]} s={[.11, .21, depth]} c="#8d6b4a" />)}
    {/* The stair arrives at the side, so the rail runs unbroken along the loft front. */}
    <Beam from={[left, rail, front]} to={[right, rail, front]} width={.075} color="#9a7350" />
    {Array.from({ length: 18 }, (_, i) => { const px = left + i * width / 17; return <Beam key={i} from={[px, floor, front]} to={[px, rail, front]} width={.033} color="#6f6050" />; })}
    <Beam from={[right, rail, z - depth / 2]} to={[right, rail, front]} width={.075} color="#9a7350" />
    {Array.from({ length: 5 }, (_, i) => <Beam key={i} from={[right, floor, z - depth / 2 + i * depth / 4]} to={[right, rail, z - depth / 2 + i * depth / 4]} width={.033} color="#6f6050" />)}
    {/* Along the loft's short edge, beside the flight, as far as the landing. */}
    <Beam from={[corner, rail, front]} to={[corner, rail, stairs.top]} width={.075} color="#9a7350" />
    {Array.from({ length: 5 }, (_, i) => { const pz = front + (stairs.top - front) * i / 4; return <Beam key={i} from={[corner, floor, pz]} to={[corner, rail, pz]} width={.033} color="#6f6050" />; })}
    {/* Stringers under both sides of the flight. */}
    {[edge - .03, home.stairs.x - stairWidth / 2 + .03].map(sx => <Beam key={sx} from={[sx, .02, foot + .12]} to={[sx, stairs.heightAt(stairs.top) - .14, stairs.top]} width={.07} depth={.3} color="#8b6a4c" />)}
    {/* Handrail on the open side, from a newel at the foot to the post that also carries the loft's corner. */}
    <Beam from={[edge, stairs.heightAt(foot) + railHeight, foot]} to={[edge, stairs.heightAt(front) + railHeight, front]} width={.07} color="#8b6a4c" />
    {stairs.flight.filter(t => t.position[2] > front + .1).filter((_, i) => i % 2 === 1).map((t, i) => <Beam key={i} from={[edge, t.position[1] + .06, t.position[2]]} to={[edge, stairs.heightAt(t.position[2]) + railHeight, t.position[2]]} width={.037} color="#695e52" />)}
    <Box p={[edge, (stairs.heightAt(foot) + railHeight + .1) / 2, foot]} s={[.09, stairs.heightAt(foot) + railHeight + .1, .09]} c="#876849" />
    <Box p={[-8.02, rail / 2, front]} s={[.1, rail, .1]} c="#876849" />
  </group>;
}

export function Curtains({ open, reduced }: { open: boolean; reduced: boolean }) {
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

/** Walls, ceiling, the sea window's frame, and the front wall that exists only for someone standing inside. */
export function Architecture({ atmosphere, glowing }: { atmosphere: Atmosphere; glowing: number }) {
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
