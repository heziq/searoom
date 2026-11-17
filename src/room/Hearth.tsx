import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { home, type Position } from '../config';
import { glow, weave } from '../textures';
import { Box, Cylinder, Grounding, Soft } from './primitives';

// The warm corner: a cast-iron stove on the left wall between the desk window and the front wall,
// with the cat's basket beside it. The fire burns whatever the hour, and carries the room after dark.
const iron = '#3a3a3f', ironDark = '#2b2b30';

/** A small wood stove. Its fire is the one light in the room that is never switched off. */
function Stove({ fire }: { fire: number }) {
  const light = useRef<THREE.PointLight>(null), ember = useRef<THREE.MeshStandardMaterial>(null), halo = useRef<THREE.Sprite>(null);
  const flue = home.room.height - 1;
  useFrame(({ clock }) => {
    // Three slow waves and one fast one: a fire never settles on one brightness.
    const t = clock.elapsedTime;
    const flicker = .84 + Math.sin(t * 11.3) * .08 + Math.sin(t * 4.7 + 1.3) * .06 + Math.sin(t * 23.1) * .025;
    if (light.current) light.current.intensity = 6.5 * fire * flicker;
    if (ember.current) ember.current.emissiveIntensity = (1.1 + flicker * .7) * Math.min(1.2, fire);
    if (halo.current) halo.current.material.opacity = .22 * Math.min(1, fire) * flicker;
  });
  return <group position={home.furniture.stove}>
    {/* A stone pad under it, because a stove never stands straight on floorboards. */}
    <Box p={[.08, .025, 0]} s={[.94, .05, 1.04]} c="#9a9789" />
    {[-.21, .21].flatMap(x => [-.19, .19].map(z => <Cylinder key={`${x}-${z}`} p={[x, .13, z]} top={.038} height={.21} c={ironDark} />))}
    <Soft p={[0, .6, 0]} s={[.6, .72, .54]} c={iron} />
    <Box p={[0, .99, 0]} s={[.7, .07, .64]} c={ironDark} />
    <Box p={[0, .22, 0]} s={[.64, .07, .58]} c={ironDark} />
    {/* The firebox: embers at the back, two charred logs across them, smoked glass in an iron frame. */}
    <mesh position={[.29, .6, 0]} rotation={[0, Math.PI / 2, 0]}>
      <planeGeometry args={[.32, .36]} />
      <meshStandardMaterial ref={ember} color="#55200c" emissive="#ff6a22" emissiveIntensity={1.2} roughness={.75} />
    </mesh>
    {[[.5, -.04, .28], [.6, .05, -.24], [.68, -.02, .12]].map(([y, z, tilt], i) =>
      <Cylinder key={i} p={[.297, y, z]} top={.033} bottom={.03} height={.26} c={i === 2 ? '#2e211a' : '#241a15'} rotation={[Math.PI / 2, 0, tilt]} />)}
    <mesh position={[.306, .6, 0]} rotation={[0, Math.PI / 2, 0]}>
      <planeGeometry args={[.32, .36]} />
      <meshPhysicalMaterial color="#130e0b" transparent opacity={.34} roughness={.08} metalness={.1} />
    </mesh>
    {[.21, -.21].map(y => <Box key={y} p={[.308, .6 + y, 0]} s={[.045, .06, .44]} c={ironDark} />)}
    {[.22, -.22].map(z => <Box key={z} p={[.308, .6, z]} s={[.045, .48, .06]} c={ironDark} />)}
    <sprite ref={halo} position={[.44, .58, 0]} scale={[1.4, 1.1, 1]}>
      <spriteMaterial map={glow()} color="#ff8c3c" transparent opacity={.2} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </sprite>
    <Cylinder p={[.37, .6, .3]} top={.022} height={.17} c="#8b8574" rotation={[Math.PI / 2, 0, 0]} />
    {/* The flue, straight up to the ceiling. */}
    <Cylinder p={[-.08, 1.04, 0]} top={.13} bottom={.11} height={.1} c={ironDark} />
    <Cylinder p={[-.08, (1.09 + flue) / 2, 0]} top={.085} height={flue - 1.09} c={iron} />
    <Cylinder p={[-.08, flue - .5, 0]} top={.1} height={.07} c={ironDark} />
    {/* Split logs stacked in the gap between the stove and the front wall. */}
    <group position={[.02, 0, .62]}>
      {[[0, .09, -.12], [0, .09, .12], [.02, .25, 0], [-.02, .41, -.1]].map(([x, y, z], i) =>
        <Cylinder key={i} p={[x, y, z]} top={.08} bottom={.075} height={.46} c={i % 2 ? '#a07a56' : '#8f6b4b'} rotation={[0, i * .25, Math.PI / 2]} />)}
    </group>
    <pointLight ref={light} position={[.55, .66, 0]} color="#ff9348" intensity={5} distance={9} />
    <Grounding p={[.1, .045, 0]} s={[1.9, 2.0]} o={.45} />
  </group>;
}

/** A basket with a cat asleep in it, turned toward the fire. The breathing stops with reduced motion. */
const CAT = 1.3;
function CatBasket({ p, reduced }: { p: Position; reduced: boolean }) {
  const cat = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!cat.current) return;
    // Scaling only the height keeps the breath in the ribs; it must carry the cat's own scale with it.
    cat.current.scale.y = CAT * (reduced ? 1 : 1 + Math.sin(clock.elapsedTime * 1.45) * .04);
  });
  const fur = '#a89079', dark = '#8e765f';
  return <group position={p} rotation={[0, 2.5, 0]}>
    <mesh position={[0, .11, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
      <torusGeometry args={[.45, .09, 10, 30]} />
      <meshStandardMaterial color="#b4916a" roughness={1} bumpMap={weave(3)} bumpScale={1.4} />
    </mesh>
    <mesh position={[0, .08, 0]} receiveShadow><cylinderGeometry args={[.45, .4, .14, 26]} /><meshStandardMaterial color="#d9cdb6" roughness={1} bumpMap={weave(4)} bumpScale={1.2} /></mesh>
    {/* Curled nose-to-tail, low in the basket, turned toward the fire. */}
    <group ref={cat} position={[-.03, .13, .02]} scale={CAT}>
      <mesh position={[-.02, .05, 0]} scale={[.27, .1, .19]} castShadow><sphereGeometry args={[1, 18, 12]} /><meshStandardMaterial color={fur} roughness={1} /></mesh>
      <mesh position={[-.19, .07, .05]} scale={[.095, .085, .085]} castShadow><sphereGeometry args={[1, 14, 10]} /><meshStandardMaterial color={fur} roughness={1} /></mesh>
      <mesh position={[-.26, .05, .05]} scale={[.035, .03, .03]}><sphereGeometry args={[1, 8, 6]} /><meshStandardMaterial color="#c9ad92" roughness={1} /></mesh>
      {[-.05, .05].map(z => <mesh key={z} position={[-.17, .14, .05 + z]} rotation={[0, 0, .25]}><coneGeometry args={[.032, .06, 5]} /><meshStandardMaterial color={dark} roughness={1} /></mesh>)}
      {/* The tail curls round the front and finishes under the chin. */}
      {[0, 1, 2, 3, 4, 5].map(i => {
        const a = .5 + i * .42;
        return <mesh key={i} position={[Math.cos(a) * .25, .035, Math.sin(a) * .2 - .04]} scale={.036 - i * .003} castShadow>
          <sphereGeometry args={[1, 8, 6]} /><meshStandardMaterial color={dark} roughness={1} />
        </mesh>;
      })}
    </group>
  </group>;
}

export function Hearth({ fire, reduced }: { fire: number; reduced: boolean }) {
  return <>
    <Stove fire={fire} />
    <CatBasket p={home.furniture.petBed} reduced={reduced} />
  </>;
}
