import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { CameraControls } from '@react-three/drei';
import * as THREE from 'three';
import { home, type Atmosphere, type Position } from './config';
import { Outside } from './Outside';
import { Presence } from './Presence';
import { Architecture, Curtains, Floors } from './room/Architecture';
import { Bed, BedsideLamp, BlanketLadder, SleepingNook, Television } from './room/Bedroom';
import { Details } from './room/Details';
import { Hearth } from './room/Hearth';
import { InteractionProvider, Interactive } from './room/interactions';
import { Bookcase } from './room/Library';
import { Lighting, Motes, Rain } from './room/Lighting';
import { Lounge, WindowSeat } from './room/Lounge';
import { BookStack, Mug, clay, lampLevel } from './room/primitives';
import { TeaRoom } from './room/TeaRoom';
import { UnderLoft } from './room/UnderLoft';
import { Desk, GamingChair } from './room/Workspace';
import type { RoomProps, View } from './room/types';

// Everything the room is made of lives in `src/room/`; this file puts the pieces together and
// hands the camera between standing inside and the two views from outside.
export type { Action } from './room/interactions';
export type { RoomProps, View } from './room/types';

/** The stove burns whatever the hour; it just counts for more once the daylight goes. */
const fireLevel: Record<Atmosphere, number> = { day: .45, sunset: 1, night: 1.5 };

const orbits: Record<Exclude<View, 'inside'>, [Position, Position]> = {
  front: [[3.2, 3.35, 15.3], [.2, 2.5, -2.6]],
  overview: [[-18, 12, 18], [0, 2.8, -.5]],
};

export function Room(props: RoomProps) {
  const controls = useRef<CameraControls>(null), wasInside = useRef(true);
  const { camera, invalidate } = useThree(), wide = useThree(state => state.size.width > 1100);
  const inside = props.view === 'inside', glowing = props.lamp ? lampLevel[props.atmosphere] : 0;
  const ui = { curtains: props.curtains, lamp: props.lamp, drawers: props.drawers, sash: props.sash, music: props.music };
  const wiring = { state: ui, onAction: props.onAction, onHover: props.onHover, onBook: props.onBook };
  useEffect(() => {
    const c = controls.current;
    if (props.view === 'inside') { wasInside.current = true; return; }
    if (!c) return;
    if (wasInside.current) {
      // Hand the camera over from where the visitor was standing, so the move out is one continuous glide.
      const ahead = camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(8).add(camera.position);
      c.setLookAt(camera.position.x, camera.position.y, camera.position.z, ahead.x, ahead.y, ahead.z, false);
      wasInside.current = false;
    }
    c.setFocalOffset(wide ? -2.6 : 0, 0, 0, !props.reduced);
    c.setLookAt(...orbits[props.view][0], ...orbits[props.view][1], !props.reduced);
  }, [props.view, props.reset, props.reduced, camera, wide]);
  // The sea, the steam and the dust keep moving gently; thirty frames a second is plenty for that.
  useEffect(() => {
    if (props.reduced) return;
    const tick = setInterval(() => { if (!document.hidden) invalidate(); }, 33);
    return () => clearInterval(tick);
  }, [props.reduced, invalidate]);
  const sunny = props.rain || !props.curtains ? 0 : props.atmosphere === 'day' ? .5 : props.atmosphere === 'sunset' ? .65 : 0;
  return <InteractionProvider value={wiring}>
    <Lighting atmosphere={props.atmosphere} rain={props.rain} curtains={props.curtains} reduced={props.reduced} />
    <Outside atmosphere={props.atmosphere} rain={props.rain} reduced={props.reduced} meteor={props.meteor} />
    <Architecture atmosphere={props.atmosphere} glowing={glowing} sash={props.sash} reduced={props.reduced} />
    <Floors onWalk={props.onWalk} />
    <Interactive id="bed"><Bed /></Interactive>
    <SleepingNook glowing={glowing} /><BlanketLadder />
    <GamingChair /><Details /><UnderLoft on={props.lamp} glowing={glowing} drawers={props.drawers} music={props.music} reduced={props.reduced} />
    <Hearth fire={fireLevel[props.atmosphere]} reduced={props.reduced} />
    <WindowSeat />
    <Interactive id="computer"><Desk focus={props.focus} glowing={glowing} reduced={props.reduced} /></Interactive>
    <Interactive id="lounge"><Lounge on={props.lamp} glowing={glowing} reduced={props.reduced} /></Interactive>
    <Interactive id="lamp">
      <BedsideLamp on={props.lamp} glowing={glowing} p={home.furniture.bedsideTable}><Mug p={[-.18, .84, .12]} c="#c9d6d4" /></BedsideLamp>
      <BedsideLamp on={props.lamp} glowing={glowing} p={[home.furniture.bed[0] - home.bedSize[0] / 2 - .55, 0, home.furniture.bedsideTable[2]]}><BookStack p={[-.12, .84, .1]} tones={['#e5dcc6', clay]} /></BedsideLamp>
    </Interactive>
    {/* These two wire up their own clickable parts: a shelf and a spine, a tea table and its pot. */}
    <Bookcase /><Bookcase lower />
    <TeaRoom glowing={glowing} reduced={props.reduced} poured={props.poured} />
    <Interactive id="television"><Television besideBed={props.tvBesideBed} reduced={props.reduced} /></Interactive>
    <Interactive id="curtains"><Curtains open={props.curtains} breeze={props.sash} reduced={props.reduced} /></Interactive>
    <Motes strength={sunny} reduced={props.reduced} />
    {props.rain && <Rain reduced={props.reduced} />}
    <Presence active={inside} place={props.place} placeKey={props.placeKey} walkTarget={props.walkTarget} reduced={props.reduced} veil={props.veil} onEngage={props.onEngage} onWander={props.onWander} />
    {!inside && <CameraControls ref={controls} makeDefault minPolarAngle={.35} maxPolarAngle={1.5} minAzimuthAngle={-1.1} maxAzimuthAngle={1.2} minDistance={2.2} maxDistance={45} dollySpeed={.6} truckSpeed={0} smoothTime={props.reduced ? 0 : .55} />}
  </InteractionProvider>;
}
