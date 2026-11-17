import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { atmospheres, home } from '../config';
import { glow } from '../textures';
import type { RoomProps } from './types';

/** Dust turning in the shaft of light from the sea window. */
export function Motes({ strength, reduced }: { strength: number; reduced: boolean }) {
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

export function Rain({ reduced }: { reduced: boolean }) {
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
export function Lighting({ atmosphere, rain, curtains, reduced }: Pick<RoomProps, 'atmosphere' | 'rain' | 'curtains' | 'reduced'>) {
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
