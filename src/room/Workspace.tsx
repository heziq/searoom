import { useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { home } from '../config';
import { Beam, Box, Cylinder, Mug, Soft, Steam, lampLight } from './primitives';

export function GamingChair() {
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

export function Desk({ focus, glowing, reduced }: { focus: boolean; glowing: number; reduced: boolean }) {
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
