import type { ReactNode } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import type { PlaceId } from '../config';

// Everything in the room that answers a click, in one list. The scene reads it for its hover labels,
// the page reads it for the toolbar and the seated card, so a new interaction is added in one place.
export type Action = 'computer' | 'bed' | 'lounge' | 'curtains' | 'lamp' | 'books' | 'tea' | 'television';
/** The side panels the page can open. The computer's panel follows from sitting at the desk. */
export type Panel = 'books' | 'television';
/** What the labels need to know about the room to word themselves. */
export type UiState = { curtains: boolean; lamp: boolean };
type Words = string | ((state: UiState) => string);

export type Interaction = {
  id: Action;
  /** Named in `Icon` in App.tsx. */
  icon: string;
  /** The toolbar button's visible text. */
  label: Words;
  /** The toolbar button's accessible name. */
  aria: Words;
  /** Shown while the pointer rests on the object in the room. */
  hover: Words;
  /** Toolbar buttons are grouped, with a divider between the groups. */
  group: 'places' | 'things';
  /** Where this takes the visitor. */
  place?: PlaceId;
  /** A panel to open alongside. */
  panel?: Panel;
  /** A switch rather than somewhere to go. */
  toggle?: 'curtains' | 'lamp';
  /** Whether that switch currently reads as on. */
  pressed?: (state: UiState) => boolean;
  /** The quiet card shown while the visitor is settled here. */
  seat?: { title: string; line: string };
};

export const interactions: Interaction[] = [
  { id: 'computer', icon: 'computer', label: 'Computer', aria: 'Use computer', hover: 'Sit down at the computer', group: 'places', place: 'computer' },
  { id: 'bed', icon: 'bed', label: 'Bed', aria: 'Go to bed', hover: 'Rest on the bed', group: 'places', place: 'bed', seat: { title: 'In bed', line: 'Linen, lamplight, and the tide for company.' } },
  { id: 'lounge', icon: 'chair', label: 'Sea window', aria: 'Sit by the sea window', hover: 'Sink into the chair by the sea window', group: 'places', place: 'lounge', seat: { title: 'By the sea window', line: 'A deep chair, a warm cup, and nothing to finish.' } },
  { id: 'tea', icon: 'tea', label: 'Tea room', aria: 'Explore tea room', hover: 'Take a seat at the tea table', group: 'places', place: 'tea', seat: { title: 'Tea above the tide', line: 'A quiet table with your back to the books and the sea ahead.' } },
  { id: 'books', icon: 'books', label: 'Library', aria: 'Explore library', hover: 'Browse the library wall', group: 'places', place: 'books', panel: 'books' },
  { id: 'curtains', icon: 'curtains', label: s => s.curtains ? 'Close curtains' : 'Open curtains', aria: s => s.curtains ? 'Close curtains' : 'Open curtains', hover: s => s.curtains ? 'Close the curtains' : 'Open the curtains', group: 'things', toggle: 'curtains', pressed: s => !s.curtains },
  { id: 'lamp', icon: 'lamp', label: s => `Lamps ${s.lamp ? 'on' : 'off'}`, aria: s => s.lamp ? 'Turn off the lamps' : 'Turn on the lamps', hover: s => s.lamp ? 'Turn off the lamps' : 'Turn on the lamps', group: 'things', toggle: 'lamp', pressed: s => s.lamp },
  { id: 'television', icon: 'television', label: 'TV', aria: 'Explore rolling television', hover: 'Explore the rolling television', group: 'things', panel: 'television' },
];

const byId = new Map(interactions.map(entry => [entry.id, entry]));
export const interaction = (id: Action) => byId.get(id)!;
/** Resolve a label that may depend on whether the lamps are lit or the curtains drawn. */
export const words = (value: Words, state: UiState) => typeof value === 'function' ? value(state) : value;
/** The card shown while the visitor is seated somewhere, if that place has one. */
export const seatOf = (place: PlaceId | null) => interactions.find(entry => entry.place === place)?.seat;

/** Wraps whatever in the room answers to this interaction: a click runs it, hovering names it. */
export function Interactive({ id, state, children, onAction, onHover }: { id: Action; state: UiState; children: ReactNode; onAction: (action: Action) => void; onHover: (name: string) => void }) {
  const label = words(interaction(id).hover, state);
  return <group
    onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); if (e.delta > 4) return; onAction(id); }}
    onPointerOver={e => { e.stopPropagation(); onHover(label); document.body.style.cursor = 'pointer'; }}
    onPointerOut={() => { onHover(''); document.body.style.cursor = ''; }}>{children}</group>;
}
