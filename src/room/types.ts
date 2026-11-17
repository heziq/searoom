import type { RefObject } from 'react';
import type { Atmosphere, PlaceId, Position } from '../config';
import type { WalkTarget } from '../Presence';
import type { Action } from './interactions';

export type View = 'inside' | 'front' | 'overview';
export type RoomProps = {
  atmosphere: Atmosphere; curtains: boolean; lamp: boolean; focus: boolean; view: View; place: PlaceId | null; placeKey: number;
  walkTarget: WalkTarget | null; rain: boolean; reduced: boolean; tvBesideBed: boolean; reset: number; veil: RefObject<HTMLDivElement | null>;
  onAction: (action: Action) => void; onHover: (name: string) => void; onWalk: (point: Position) => void; onEngage: () => void; onWander: () => void;
};
