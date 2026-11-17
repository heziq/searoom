import type { RefObject } from 'react';
import type { Atmosphere, PlaceId, Position } from '../config';
import type { WalkTarget } from '../Presence';
import type { Action } from './interactions';

export type View = 'inside' | 'front' | 'overview';
export type RoomProps = {
  atmosphere: Atmosphere; curtains: boolean; lamp: boolean; focus: boolean; view: View; place: PlaceId | null; placeKey: number;
  walkTarget: WalkTarget | null; rain: boolean; reduced: boolean; tvBesideBed: boolean; reset: number; veil: RefObject<HTMLDivElement | null>;
  /** The dresser drawers, the sea-window casement and the record player. */
  drawers: boolean; sash: boolean; music: boolean;
  /** Counters: each change plays a pour of tea, or sends one meteor over the sea. */
  poured: number; meteor: number;
  onAction: (action: Action) => void; onHover: (name: string) => void; onWalk: (point: Position) => void;
  onBook: (index: number) => void; onEngage: () => void; onWander: () => void;
};
