import { home } from '../config';
import { weave } from '../textures';
import { Beam, BookStack, Box, Ceramic, Cloth, Cylinder, LampShade, Mug, Plant, Soft, Steam, clay, lampLight, oak, oakDeep, seaBlue } from './primitives';

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
  </>;
}
