import { home } from '../config';
import { weave } from '../textures';
import { Beam, BookStack, Box, Ceramic, Cloth, Cylinder, Grounding, LampShade, Mug, Plant, Soft, Steam, clay, lampLight, linen, oak, oakDeep, seaBlue } from './primitives';
import { Interactive } from './interactions';

/** A bench built into the sea window's sill: cushions along the back, a throw over one end. */
export function WindowSeat() {
  const { center, size } = home.windowSeat;
  const [depth, height, length] = size;
  return <Interactive id="windowSeat">
    <group position={center}>
      <Soft p={[0, height - .05, 0]} s={[depth, .1, length]} c="#b9906a" />
      <Box p={[0, height / 2 - .06, 0]} s={[depth - .06, height - .12, length - .04]} c="#c3a480" />
      {[-1, 1].map(side => <Box key={side} p={[0, height / 2 - .06, side * (length / 2 - .05)]} s={[depth, height - .12, .09]} c="#a77e58" />)}
      {/* Two long cushions, a round bolster and a throw tipped over the end. */}
      {[-.62, .62].map(z => <Cloth key={z} p={[0, height + .06, z]} s={[depth - .04, .13, 1.16]} c={linen} thread={6} />)}
      {[-.78, .5].map((z, i) => <Cloth key={z} p={[-.06, height + .24, z]} s={[.16, .38, .52]} c={i ? seaBlue : '#dcd2c0'} rotation={[0, 0, .2 - i * .1]} thread={4} />)}
      <mesh position={[.02, height + .2, 1.0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[.11, .11, .42, 14]} /><meshStandardMaterial color={clay} roughness={1} bumpMap={weave(4)} bumpScale={1.3} />
      </mesh>
      <Cloth p={[.04, height + .1, -.42]} s={[depth, .1, .78]} c="#9fb3b8" rotation={[0, .04, 0]} thread={5} />
      <Cloth p={[.2, height - .2, -.5]} s={[.12, .5, .6]} c="#9fb3b8" thread={5} />
      {/* Somewhere to put the cup down. */}
      <Mug p={[.03, height + .13, 1.08]} c="#e9e3d6" />
    </group>
    <Grounding p={[center[0] - .1, .035, center[2]]} s={[1.3, length + .7]} o={.45} />
  </Interactive>;
}

/** The sea-window corner: a deep chair with its back guarded by a low shelf, a footstool, a reading lamp. */
export function Lounge({ on, glowing, reduced }: { on: boolean; glowing: number; reduced: boolean }) {
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
    {/* A floor pouf beside the chair, with magazines sliding off a pile next to it. */}
    <group position={home.furniture.pouf}>
      <mesh position={[0, .22, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[.38, .42, .44, 26]} />
        <meshStandardMaterial color="#c2a079" roughness={1} bumpMap={weave(3)} bumpScale={1.6} />
      </mesh>
      <mesh position={[0, .44, 0]} castShadow><cylinderGeometry args={[.3, .38, .06, 26]} /><meshStandardMaterial color="#b1906b" roughness={1} /></mesh>
      <Cylinder p={[0, .455, 0]} top={.05} height={.04} c="#9c7d5c" />
      {[0, 1, 2, 3].map(i => <Soft key={i} p={[-.5 - i * .012, .02 + i * .035, .34 + i * .03]} s={[.34, .032, .46]} c={['#3f6679', '#e5dcc6', clay, '#8fa39f'][i]} rotation={[0, .3 - i * .16, 0]} />)}
      <Grounding p={[-.2, .04, .14]} s={[1.6, 1.5]} o={.5} />
    </group>
  </>;
}
