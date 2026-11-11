import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { atmospheres, home, type Atmosphere } from './config';
import { glow, shoreFade } from './textures';

// The world beyond the sea window: a real sky, a deck, a strip of shore and water running to the horizon.
// It has depth, so the view shifts as the visitor moves, and it dissolves into the page colour at its edges
// so the house still reads as a diorama from outside.
const noise = /* glsl */`
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p){ float v = 0., a = .5; for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= .5; } return v; }`;
const shared = /* glsl */`
uniform vec3 zenith; uniform vec3 horizon; uniform vec3 glowColor; uniform vec3 page; uniform vec3 water; uniform vec3 sunDir;
uniform float night; uniform float overcast; uniform float time; uniform float glitter;
varying vec3 vWorld;`;
const vertex = /* glsl */`varying vec3 vWorld; void main(){ vec4 world = modelMatrix * vec4(position, 1.); vWorld = world.xyz; gl_Position = projectionMatrix * viewMatrix * world; }`;
const skyFragment = /* glsl */`${shared}${noise}
void main(){
  vec3 d = normalize(vWorld - vec3(0., 2., 0.));
  float az = atan(d.z, d.x), e = d.y;
  vec3 col = mix(horizon, zenith, smoothstep(0., .62, e));
  float s = max(dot(d, normalize(sunDir)), 0.);
  col += glowColor * (pow(s, 5.) * .15 + pow(s, 40.) * .28) * (1. - overcast * .85);
  float cloud = smoothstep(.5, .8, fbm(vec2(az * 2.6 + time * .005, e * 9.))) * smoothstep(.03, .16, e) * (1. - smoothstep(.4, .75, e));
  vec3 cloudColor = mix(horizon, vec3(1.), .55 - night * .47) + glowColor * pow(s, 3.) * .22;
  col = mix(col, cloudColor, cloud * (.5 + overcast * .45));
  col = mix(col, glowColor, smoothstep(.9992, .9995, s) * (1. - overcast));
  col += night * step(.9972, hash(floor(vec2(az, e) * 190.))) * smoothstep(.04, .3, e) * (1. - cloud) * (1. - overcast) * .75;
  col = mix(col, vec3(.96, 1., 1.04) * dot(col, vec3(.3, .5, .2)) * (.9 - night * .2), overcast * .92);
  gl_FragColor = vec4(mix(page, col, smoothstep(1.52, 1.2, abs(az))), 1.);
  #include <colorspace_fragment>
}`;
const seaFragment = /* glsl */`${shared}${noise}
void main(){
  vec2 p = vWorld.xz;
  float az = atan(p.y, p.x - 5.), far = smoothstep(8., 86., length(p));   // measured from just inside the glass, so the near shore fades at its ends
  vec3 col = mix(water, mix(water, horizon, .85), pow(far, .5));
  float swell = noise(vec2(p.x * .5 - time * .16, p.y * .07 + time * .02));
  col += smoothstep(.6, .82, swell) * .055 * (1. - far) * mix(vec3(1.), glowColor, .5);
  float path = pow(max(dot(normalize(p), normalize(sunDir.xz)), 0.), 110.);
  float sparkle = smoothstep(.5, .9, noise(vec2(p.x * 1.5 - time * .45, p.y * .45 + time * .12)));
  col += glowColor * path * (sparkle * .8 + .2) * glitter * (1. - overcast);
  col = mix(col, vec3(.95, 1., 1.05) * dot(col, vec3(.3, .5, .2)), overcast * .85);
  gl_FragColor = vec4(mix(page, col, smoothstep(1.52, 1.2, abs(az))), 1.);
  #include <colorspace_fragment>
}`;
const glitter: Record<Atmosphere, number> = { day: .3, sunset: .85, night: .38 };

export function Outside({ atmosphere, rain, reduced }: { atmosphere: Atmosphere; rain: boolean; reduced: boolean }) {
  const invalidate = useThree(state => state.invalidate);
  const uniforms = useMemo(() => {
    const a = atmospheres[atmosphere];
    return {
      zenith: { value: new THREE.Color(a.zenith) }, horizon: { value: new THREE.Color(a.sky) }, glowColor: { value: new THREE.Color(a.glow) },
      page: { value: new THREE.Color(a.background) }, water: { value: new THREE.Color(a.ocean) }, sunDir: { value: new THREE.Vector3(...a.sunFrom).normalize() },
      night: { value: atmosphere === 'night' ? 1 : 0 }, overcast: { value: rain ? 1 : 0 }, time: { value: 0 }, glitter: { value: glitter[atmosphere] },
    };
  // The uniforms are created once and eased toward the chosen light below.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const headland = useRef<THREE.MeshBasicMaterial>(null), sand = useRef<THREE.MeshStandardMaterial>(null), beacon = useRef<THREE.Sprite>(null);
  const scratch = useRef({ color: new THREE.Color(), vector: new THREE.Vector3() }).current;
  useEffect(() => invalidate(), [atmosphere, rain, invalidate]);
  useFrame(({ clock }, dt) => {
    const a = atmospheres[atmosphere], t = reduced ? 1 : 1 - Math.exp(-3 * Math.min(dt, .05)), u = uniforms;
    u.zenith.value.lerp(scratch.color.set(a.zenith), t); u.horizon.value.lerp(scratch.color.set(a.sky), t);
    u.glowColor.value.lerp(scratch.color.set(a.glow), t); u.page.value.lerp(scratch.color.set(a.background), t); u.water.value.lerp(scratch.color.set(a.ocean), t);
    u.sunDir.value.lerp(scratch.vector.set(...a.sunFrom).normalize(), t).normalize();
    const dark = atmosphere === 'night' ? 1 : 0, cloud = rain ? 1 : 0;
    const settling = Math.abs(u.night.value - dark) + Math.abs(u.overcast.value - cloud) + Math.abs(u.glitter.value - glitter[atmosphere]) > .004;
    u.night.value += (dark - u.night.value) * t; u.overcast.value += (cloud - u.overcast.value) * t; u.glitter.value += (glitter[atmosphere] - u.glitter.value) * t;
    u.time.value = reduced ? 0 : clock.elapsedTime;
    headland.current?.color.copy(u.horizon.value).lerp(scratch.color.set('#3f5560'), .42 + u.night.value * .2);
    if (beacon.current) {
      const turn = reduced ? .6 : Math.pow(Math.max(Math.sin(clock.elapsedTime * 1.1), 0), 10);
      beacon.current.material.opacity = (atmosphere === 'day' ? 0 : .35 + turn * .65) * (1 - u.overcast.value * .4);
      beacon.current.scale.setScalar(3.2 + turn * 5);
    }
    if (settling) invalidate();
  });
  const { window } = home, middle = (window.start + window.end) / 2;
  return <group>
    <mesh position={[0, 2, 0]} frustumCulled={false}>
      <sphereGeometry args={[92, 48, 20, Math.PI - 1.56, 3.12, 0, Math.PI / 2 + .32]} />
      <shaderMaterial vertexShader={vertex} fragmentShader={skyFragment} uniforms={uniforms} side={THREE.BackSide} depthWrite={false} toneMapped={false} />
    </mesh>
    <mesh position={[window.x + 49, -1.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[98, 230]} />
      <shaderMaterial vertexShader={vertex} fragmentShader={seaFragment} uniforms={uniforms} toneMapped={false} />
    </mesh>
    <mesh position={[window.x + 5.4, -.72, 0]} rotation={[-Math.PI / 2, .13, 0]} receiveShadow>
      <planeGeometry args={[10.6, 96]} />
      <meshStandardMaterial ref={sand} color="#dcd2bd" roughness={1} alphaMap={shoreFade()} transparent />
    </mesh>
    <mesh position={[window.x + 10.7, -1.44, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[1.1, 96]} />
      <meshStandardMaterial color="#f4f1e8" roughness={1} alphaMap={shoreFade()} transparent opacity={.75} />
    </mesh>
    {/* A weathered deck just outside the glass gives the view a foreground. */}
    {Array.from({ length: 5 }, (_, i) => <mesh key={i} position={[window.x + .42 + i * .56, .02, middle]} receiveShadow castShadow>
      <boxGeometry args={[.53, .1, window.end - window.start + 1.1]} /><meshStandardMaterial color={i % 2 ? '#b9a78c' : '#ae9b80'} roughness={.95} />
    </mesh>)}
    <mesh position={[window.x + 1.55, -.42, middle]}><boxGeometry args={[2.9, .8, window.end - window.start + .9]} /><meshStandardMaterial color="#8f7c64" roughness={1} /></mesh>
    {[[12.9, -4.6], [13.5, -1.2], [12.7, 2.1], [14.1, 4.6], [15.3, -3]].map(([x, z], tuft) => <group key={tuft} position={[x, -.36 - (x - 12.5) * .13, z]}>
      {Array.from({ length: 6 }, (_, i) => <mesh key={i} position={[Math.sin(i * 2.1) * .13, .34, Math.cos(i * 2.1) * .13]} rotation={[Math.cos(i * 2.1) * .32, 0, -Math.sin(i * 2.1) * .32]}>
        <coneGeometry args={[.03, .6 + (i % 3) * .14, 4]} /><meshStandardMaterial color={i % 2 ? '#b9b88e' : '#a8ab82'} roughness={1} emissive="#6d7050" emissiveIntensity={.35} />
      </mesh>)}
    </group>)}
    {/* A far headland with a small lighthouse: something on the horizon to rest the eyes on. */}
    <group position={[62, -1.5, -40]}>
      <mesh scale={[21, 1.9, 6]}><sphereGeometry args={[1, 20, 10]} /><meshBasicMaterial ref={headland} color="#8fa3a8" /></mesh>
      <mesh position={[7, 4, 0]}><cylinderGeometry args={[.3, .48, 4.4, 10]} /><meshBasicMaterial color="#eeeae0" /></mesh>
      <mesh position={[7, 6.45, 0]}><coneGeometry args={[.42, .5, 10]} /><meshBasicMaterial color="#7e5a48" /></mesh>
      <sprite ref={beacon} position={[7, 6, 0]} scale={4}><spriteMaterial map={glow()} color="#ffe2b0" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} /></sprite>
    </group>
  </group>;
}
