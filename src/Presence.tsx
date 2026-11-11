import { useEffect, useRef, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { home, type PlaceId } from './config';
import { route, walk, type Foot } from './walk';

// Being in the room: the camera sits at eye height, looks around where it stands, walks the floor
// and the stair, and settles into the seats. From outside it only eases the lens back to the orbit view.
export type WalkTarget = Foot & { key: number };
type Props = {
  active: boolean; place: PlaceId | null; /** Bumped whenever a place is chosen again, so the same seat can be returned to. */ placeKey: number; walkTarget: WalkTarget | null; reduced: boolean;
  veil: RefObject<HTMLDivElement | null>;
  /** The visitor looked or moved for the first time. */ onEngage: () => void;
  /** The visitor got up and walked off under their own steam. */ onWander: () => void;
};
const SPEED = 4.2, TURN = 1.7, STAND = home.room.eye;
const moves: Record<string, [forward: number, side: number, turn: number]> = {
  w: [1, 0, 0], s: [-1, 0, 0], a: [0, -1, 0], d: [0, 1, 0], arrowup: [1, 0, 0], arrowdown: [-1, 0, 0], arrowleft: [0, 0, 1], arrowright: [0, 0, -1],
};
const nearest = (angle: number, to: number) => angle + Math.round((to - angle) / (Math.PI * 2)) * Math.PI * 2;

export function Presence({ active, place, placeKey, walkTarget, reduced, veil, onEngage, onWander }: Props) {
  const { camera, gl, invalidate } = useThree();
  const entry = home.places.entry;
  const s = useRef({
    foot: { x: entry.stand[0], y: entry.stand[1], z: entry.stand[2] } as Foot,
    eye: new THREE.Vector3(...entry.eye), yaw: entry.yaw, pitch: entry.pitch, toYaw: entry.yaw, toPitch: entry.pitch,
    seat: null as PlaceId | null, gliding: false, arriving: false, path: [] as { x: number; z: number }[], stalled: 0, stride: 0,
    zoom: 1, keys: new Set<string>(), engaged: false, blink: 0, steer: false,
  }).current;
  const callbacks = useRef({ onEngage, onWander });
  callbacks.current = { onEngage, onWander };
  const engage = () => { if (!s.engaged) { s.engaged = true; callbacks.current.onEngage(); } };
  const rise = () => { if (s.seat) { s.seat = null; s.zoom = 1; s.gliding = true; callbacks.current.onWander(); } };

  // Stepping in from an outside view: start from wherever the orbit camera is and glide to the body.
  useEffect(() => {
    if (!active) { s.keys.clear(); return; }
    const facing = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
    s.eye.copy(camera.position); s.pitch = facing.x; s.yaw = nearest(facing.y, s.toYaw);
    s.gliding = s.arriving = true;
    invalidate();
  }, [active, camera, invalidate, s]);

  // Settling into a place, or standing up from one.
  useEffect(() => {
    if (!place) { if (s.seat) { s.seat = null; s.zoom = 1; s.gliding = true; invalidate(); } return; }
    const spot = home.places[place], target = new THREE.Vector3(...spot.eye);
    const settle = () => {
      s.seat = place; s.path = []; s.zoom = 1;
      s.foot = { x: spot.stand[0], y: spot.stand[1], z: spot.stand[2] };
      s.toYaw = nearest(spot.yaw, s.yaw); s.toPitch = spot.pitch; s.gliding = true;
    };
    // Close by on the same floor the camera simply eases over; otherwise a short blink spares a flight through furniture.
    const near = Math.abs(s.eye.y - target.y) < 1.4 && s.eye.distanceTo(target) < 8.5;
    if (s.arriving || near || reduced || !veil.current) { settle(); if (reduced) { s.eye.copy(target); s.yaw = s.toYaw; s.pitch = s.toPitch; } invalidate(); return; }
    const curtain = veil.current;
    curtain.style.opacity = '1';
    s.blink = window.setTimeout(() => { settle(); s.eye.copy(target); s.yaw = s.toYaw; s.pitch = s.toPitch; s.gliding = false; curtain.style.opacity = '0'; invalidate(); }, 260);
    return () => { clearTimeout(s.blink); curtain.style.opacity = '0'; };
  }, [place, placeKey, reduced, veil, invalidate, s]);

  useEffect(() => {
    if (!walkTarget) return;
    s.seat = null; s.zoom = 1; s.stalled = 0;
    s.steer = Math.abs(walkTarget.y - s.foot.y) > .5;   // on the stair, look where you are going
    s.path = route(s.foot, walkTarget);
    if (s.steer) s.toPitch = -.06;
    invalidate();
  }, [walkTarget, invalidate, s]);

  // Drag to look, scroll to step forward (or lean in when seated), keys to walk.
  useEffect(() => {
    if (!active) return;
    const canvas = gl.domElement;
    let last: { x: number; y: number; id: number } | null = null, travelled = 0;
    const down = (e: PointerEvent) => { if (e.button === 0) { last = { x: e.clientX, y: e.clientY, id: e.pointerId }; travelled = 0; } };
    const move = (e: PointerEvent) => {
      if (!last || e.pointerId !== last.id) return;
      const dx = e.clientX - last.x, dy = e.clientY - last.y, feel = .0038 * s.zoom;
      last.x = e.clientX; last.y = e.clientY; travelled += Math.abs(dx) + Math.abs(dy);
      s.toYaw += dx * feel; s.toPitch = THREE.MathUtils.clamp(s.toPitch + dy * feel, -1.15, 1.15);
      if (travelled > 6) { engage(); s.steer = false; }
      invalidate();
    };
    const up = (e: PointerEvent) => { if (last && e.pointerId === last.id) last = null; };
    const wheel = (e: WheelEvent) => {
      e.preventDefault(); engage();
      const amount = THREE.MathUtils.clamp(-e.deltaY, -160, 160);
      if (s.seat) s.zoom = THREE.MathUtils.clamp(s.zoom - amount * .0016, .5, 1);
      else { s.path = []; s.foot = walk(s.foot, -Math.sin(s.yaw) * amount * .006, -Math.cos(s.yaw) * amount * .006); }
      invalidate();
    };
    const typing = (target: EventTarget | null) => target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
    const keydown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (!moves[key] || e.metaKey || e.ctrlKey || e.altKey || typing(e.target)) return;
      if (key.startsWith('arrow')) e.preventDefault();
      s.keys.add(key); engage(); invalidate();
    };
    const keyup = (e: KeyboardEvent) => s.keys.delete(e.key.toLowerCase());
    const blur = () => s.keys.clear();
    canvas.addEventListener('pointerdown', down); window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
    canvas.addEventListener('wheel', wheel, { passive: false });
    window.addEventListener('keydown', keydown); window.addEventListener('keyup', keyup); window.addEventListener('blur', blur);
    return () => {
      canvas.removeEventListener('pointerdown', down); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
      canvas.removeEventListener('wheel', wheel);
      window.removeEventListener('keydown', keydown); window.removeEventListener('keyup', keyup); window.removeEventListener('blur', blur);
    };
  // `engage` only touches refs.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, gl, invalidate, s]);

  useFrame((state, rawDt) => {
    const lens = camera as THREE.PerspectiveCamera, dt = Math.min(rawDt, .05);
    const wide = state.size.width / state.size.height < 1 ? 80 : 62;
    const fov = active ? wide * s.zoom : 45;
    if (Math.abs(lens.fov - fov) > .02) { lens.fov = reduced ? fov : THREE.MathUtils.damp(lens.fov, fov, 4, dt); lens.updateProjectionMatrix(); invalidate(); }
    if (!active) return;

    let forward = 0, side = 0, turn = 0;
    s.keys.forEach(key => { forward += moves[key][0]; side += moves[key][1]; turn += moves[key][2]; });
    if (turn) s.toYaw += turn * TURN * dt;
    let walking = false;
    if (forward || side) {
      rise(); s.path = [];
      const length = Math.hypot(forward, side) || 1, sin = Math.sin(s.yaw), cos = Math.cos(s.yaw), pace = SPEED * dt / length;
      const next = walk(s.foot, (-sin * forward + cos * side) * pace, (-cos * forward - sin * side) * pace);
      walking = next !== s.foot; s.foot = next;
    } else if (s.path.length) {
      const point = s.path[0], dx = point.x - s.foot.x, dz = point.z - s.foot.z, distance = Math.hypot(dx, dz), pace = SPEED * dt;
      if (distance < Math.max(pace, .06)) s.path.shift();
      else {
        const next = walk(s.foot, dx / distance * pace, dz / distance * pace);
        const gained = distance - Math.hypot(point.x - next.x, point.z - next.z);
        s.stalled = gained < pace * .05 ? s.stalled + dt : 0;
        if (next === s.foot || s.stalled > .5) s.path = []; else { s.foot = next; walking = true; }
        if (s.steer && walking) s.toYaw = THREE.MathUtils.damp(s.toYaw, nearest(Math.atan2(-dx, -dz), s.toYaw), 5, dt);
      }
    }

    const seat = s.seat ? home.places[s.seat] : null;
    if (walking && !reduced) s.stride += dt * 9;
    const bob = walking && !reduced ? Math.sin(s.stride) * .03 : 0;
    const tx = seat ? seat.eye[0] : s.foot.x, ty = seat ? seat.eye[1] : s.foot.y + STAND + bob, tz = seat ? seat.eye[2] : s.foot.z;
    if (reduced) { s.eye.set(tx, ty, tz); s.yaw = s.toYaw; s.pitch = s.toPitch; s.gliding = s.arriving = false; }
    else {
      const ease = s.gliding ? (s.arriving ? 2.6 : 3.6) : 14;
      s.eye.x = THREE.MathUtils.damp(s.eye.x, tx, ease, dt); s.eye.z = THREE.MathUtils.damp(s.eye.z, tz, ease, dt);
      s.eye.y = THREE.MathUtils.damp(s.eye.y, ty, s.gliding ? ease : 7, dt);
      s.yaw = THREE.MathUtils.damp(s.yaw, s.toYaw, s.arriving ? 3 : 10, dt); s.pitch = THREE.MathUtils.damp(s.pitch, s.toPitch, s.arriving ? 3 : 10, dt);
    }
    const away = Math.abs(s.eye.x - tx) + Math.abs(s.eye.y - ty) + Math.abs(s.eye.z - tz), turning = Math.abs(s.yaw - s.toYaw) + Math.abs(s.pitch - s.toPitch);
    if (s.gliding && away < .02) s.gliding = s.arriving = false;
    camera.position.copy(s.eye);
    camera.rotation.set(s.pitch, s.yaw, 0, 'YXZ');
    if (walking || s.keys.size || away > .002 || turning > .0005) invalidate();
  });
  return null;
}
