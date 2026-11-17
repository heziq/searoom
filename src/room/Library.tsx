import { useLayoutEffect, useMemo, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { home } from '../config';
import { getLibraryBooks } from '../layout';
import { Ceramic, Plant, Sailboat, Soft } from './primitives';

/** Every volume on one bookcase, drawn as two instanced meshes: the books and their title bands. */
function LibraryBooks({ spec }: { spec: typeof home.library | typeof home.lowerLibrary }) {
  const volumes = useMemo(() => getLibraryBooks(spec), [spec]);
  const books = useRef<THREE.InstancedMesh>(null), bands = useRef<THREE.InstancedMesh>(null);
  const invalidate = useThree(state => state.invalidate);
  useLayoutEffect(() => {
    if (!books.current || !bands.current) return;
    const transform = new THREE.Object3D();
    volumes.forEach((volume, index) => {
      transform.position.set(...volume.position);
      transform.scale.set(...volume.size);
      transform.rotation.z = volume.size[1] > .2 && index % 13 === 0 ? .085 : 0;
      transform.updateMatrix();
      books.current!.setMatrixAt(index, transform.matrix);
      books.current!.setColorAt(index, new THREE.Color(volume.color));
      transform.position.z += volume.size[2] / 2 + .003;
      transform.scale.set(volume.size[0] * .73, .014, .005);
      transform.updateMatrix();
      bands.current!.setMatrixAt(index, transform.matrix);
    });
    books.current.instanceMatrix.needsUpdate = true;
    if (books.current.instanceColor) books.current.instanceColor.needsUpdate = true;
    bands.current.instanceMatrix.needsUpdate = true;
    books.current.computeBoundingSphere(); bands.current.computeBoundingSphere(); invalidate();
  }, [volumes, invalidate]);
  return <>
    <instancedMesh ref={books} args={[undefined, undefined, volumes.length]} castShadow receiveShadow><boxGeometry /><meshStandardMaterial roughness={.88} /></instancedMesh>
    <instancedMesh ref={bands} args={[undefined, undefined, volumes.length]}><boxGeometry /><meshStandardMaterial color="#dfd5ba" roughness={.84} /></instancedMesh>
  </>;
}

/** The long bookcase on the loft's rear wall, and the lower one that backs onto the stair. */
export function Bookcase({ lower = false }: { lower?: boolean }) {
  const spec = lower ? home.lowerLibrary : home.library;
  const { width, height, depth, bays, shelves } = spec, bayWidth = width / bays;
  return <group position={lower ? home.furniture.lowerShelf : home.furniture.shelf} rotation={lower ? [0, Math.PI / 2, 0] : [0, 0, 0]}>
    <Soft p={[0, height / 2, -depth / 2]} s={[width, height, .11]} c="#b8b09c" />
    {Array.from({ length: bays + 1 }, (_, i) => <Soft key={i} p={[-width / 2 + i * bayWidth, height / 2, 0]} s={[.085, height, depth]} c={i % 3 ? '#9f7954' : '#ac8259'} />)}
    {[.06, ...shelves, height].map(y => <Soft key={y} p={[0, y, 0]} s={[width, .09, depth]} c="#b68c61" />)}
    <LibraryBooks spec={spec} />
    <Plant p={[width / 2 - .38, shelves[2] + .06, .06]} scale={.3} />
    <Ceramic p={[-width / 2 + .39, shelves[3] + .06, .04]} />
    {!lower && <Sailboat p={[.15, shelves[2] + .1, .06]} scale={.63} />}
  </group>;
}
