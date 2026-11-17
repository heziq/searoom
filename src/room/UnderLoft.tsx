import { home } from '../config';
import { Beam, BookStack, Box, Ceramic, Cloth, Cylinder, Framed, Grounding, LampShade, Plant, Soft, lampLight, oakDeep, seaBlue } from './primitives';

/** A low console against the rear wall with a lamp and three prints, where the loft keeps the ceiling low. */
function Console({ on, glowing }: { on: boolean; glowing: number }) {
  const rear = -home.room.depth / 2;
  return <group position={[home.furniture.console[0] + .2, 0, 0]}>
    <Soft p={[-.2, .54, -5.72]} s={[2.65, 1.03, .53]} c="#aa825b" />
    {[-.8, 0, .8].map(x => <group key={x}><Box p={[x - .2, .54, -5.445]} s={[.8, .82, .02]} c="#bb946b" /><Box p={[x, .56, -5.43]} s={[.03, .17, .016]} c="#7d6249" /></group>)}
    <Ceramic p={[-1.2, 1.06, -5.68]} />
    <Plant p={[.82, 1.07, -5.7]} scale={.31} kind="fern" />
    <BookStack p={[.2, 1.06, -5.68]} tones={['#3f6679', '#e5dcc6', '#5d7a62']} />
    {/* A lamp and three prints make the low space under the loft somewhere to pause. */}
    <Cylinder p={[-.55, 1.2, -5.72]} top={.06} bottom={.13} height={.3} c="#7f9a98" /><LampShade p={[-.55, 1.52, -5.72]} top={.16} bottom={.24} height={.3} on={on} />
    <pointLight position={[-.55, 1.6, -5.6]} color={lampLight} intensity={4 * glowing} distance={6} />
    <Framed p={[-1.25, 2.45, rear + .19]} s={[.82, 1.02]} kind="horizon" /><Framed p={[-.2, 2.45, rear + .19]} s={[.82, 1.02]} kind="sun" /><Framed p={[.85, 2.45, rear + .19]} s={[.82, 1.02]} kind="sprig" />
  </group>;
}

/** A six-drawer oak dresser under the right end of the loft, with a leaning mirror and the day's small things on top. */
function Dresser() {
  const [w, h, d] = home.dresser.size, front = d / 2, top = h + .03;
  return <group position={home.furniture.dresser}>
    {[-1, 1].flatMap(sx => [-1, 1].map(sz => <Box key={`${sx}${sz}`} p={[sx * (w / 2 - .08), .05, sz * (d / 2 - .07)]} s={[.08, .1, .08]} c={oakDeep} />))}
    <Soft p={[0, .1 + (h - .13) / 2, 0]} s={[w, h - .13, d]} c="#a77c55" />
    <Soft p={[0, h, .01]} s={[w + .06, .06, d + .04]} c="#b68c61" />
    {[-.48, .48].flatMap(cx => [.33, .76, 1.19].map(cy => <group key={`${cx}${cy}`}>
      <Soft p={[cx, cy, front + .005]} s={[.9, .38, .03]} c="#bb946b" />
      <Cylinder p={[cx, cy, front + .04]} top={.026} height={.04} c="#8a7350" rotation={[Math.PI / 2, 0, 0]} />
    </group>))}
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
export function UnderLoft({ on, glowing }: { on: boolean; glowing: number }) {
  return <>
    <Console on={on} glowing={glowing} />
    <Dresser />
    <Grounding p={[home.furniture.console[0], .02, -5.6]} s={[3.6, 1.7]} />
  </>;
}
