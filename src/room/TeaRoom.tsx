import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { home, type Position } from '../config';
import { rug, weave } from '../textures';
import { Beam, BookStack, Box, Cloth, Cylinder, Plant, Sailboat, Soft, Steam, lampLight, seaBlue } from './primitives';
import { Interactive } from './interactions';

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

/** The mezzanine: a solid-wood tea table on a woven mat under a paper lantern, with the sea ahead. */
export function TeaRoom({ glowing, reduced, poured }: { glowing: number; reduced: boolean; poured: number }) {
  const floor = home.loft.position[1] + home.loft.size[1] / 2, [tx, , tz] = home.furniture.teaTable;
  const pot = useRef<THREE.Group>(null), invalidate = useThree(s => s.invalidate);
  // `progress` runs 0 → 1 over one pour. The steam reads it too, so a fresh cup gives off more.
  const pour = useRef({ progress: 1 }).current;
  useEffect(() => { if (poured) { pour.progress = 0; invalidate(); } }, [poured, pour, invalidate]);
  useFrame((_, dt) => {
    if (pour.progress >= 1) return;
    pour.progress = Math.min(1, pour.progress + dt / (reduced ? .01 : 1.9));
    if (pot.current) pot.current.rotation.z = -Math.sin(pour.progress * Math.PI) * .6;
    invalidate();
  });
  return <>
    {/* The teapot answers on its own, so it stays outside the group below: nested handlers both fire,
     *  and sitting down would win over pouring. */}
    <Interactive id="pour">
      <group ref={pot} position={[tx, home.furniture.teaTable[1] + .96, tz]}>
        <Cylinder p={[0, -.02, 0]} top={.12} bottom={.16} height={.13} c="#d4e2d8" />
        <Cylinder p={[0, .065, 0]} top={.068} height={.04} c="#d4e2d8" />
        <Cylinder p={[.19, -.01, 0]} top={.02} bottom={.03} height={.14} c="#d4e2d8" rotation={[0, 0, -.9]} />
      </group>
    </Interactive>
    <Interactive id="tea">
    <mesh position={[tx, floor + .03, tz + .12]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[4.5, 3.1]} /><meshStandardMaterial map={rug('tea', { ground: '#cfc3a2', line: 'rgba(120,110,80,.35)', border: '#6d6a56' })} roughness={1} bumpMap={weave(16)} bumpScale={1} /></mesh>
    <group position={home.furniture.teaTable}>
      <Soft p={[0, .75, 0]} s={[2.1, .15, 1.1]} c="#b88959" />
      {[-.78, .78].flatMap(x => [-.38, .38].map(z => <Soft key={`${x}-${z}`} p={[x, .39, z]} s={[.13, .76, .13]} c="#8e6847" />))}
      <Soft p={[0, .84, 0]} s={[.87, .046, .55]} c="#705c47" />
      {[-.27, .27].map(x => <Cylinder key={x} p={[x, .92, .17]} top={.055} bottom={.047} height={.07} c="#e0e5d8" />)}
      <Steam p={[.26, 1.02, 0]} reduced={reduced} pour={pour} />
      <Steam p={[-.27, 1.0, .17]} reduced={reduced} pour={pour} />
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
    </Interactive>
  </>;
}
