import { createContext, useContext, type ReactNode } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import type { PlaceId } from '../config';

// Everything in the room that answers a click, in one list. The scene reads it for its hover labels,
// the page reads it for the toolbar and the seated card, so a new interaction is added in one place.
export type Action = 'computer' | 'bed' | 'lounge' | 'curtains' | 'lamp' | 'books' | 'tea' | 'television' | 'dresser' | 'mirror' | 'music' | 'window' | 'pour';
/** The side panels the page can open. The computer's panel follows from sitting at the desk. */
export type Panel = 'books' | 'television';
/** What the room is doing, as far as the labels and the scene need to know. */
export type UiState = { curtains: boolean; lamp: boolean; drawers: boolean; sash: boolean; music: boolean };
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
  /** Toolbar buttons are grouped, with a divider between the groups. Left out, it is a scene-only find. */
  group?: 'places' | 'things';
  /** Where this takes the visitor. */
  place?: PlaceId;
  /** A panel to open alongside. */
  panel?: Panel;
  /** A switch rather than somewhere to go. */
  toggle?: 'curtains' | 'lamp' | 'drawers' | 'sash' | 'music';
  /** Whether that switch currently reads as on. */
  pressed?: (state: UiState) => boolean;
  /** A one-off that plays and settles, rather than a state that stays. */
  pulse?: 'pour';
  /** The quiet card shown while the visitor is settled here. */
  seat?: { title: string; line: string };
};

export const interactions: Interaction[] = [
  { id: 'computer', icon: 'computer', label: 'Computer', aria: 'Use computer', hover: 'Sit down at the computer', group: 'places', place: 'computer' },
  { id: 'bed', icon: 'bed', label: 'Bed', aria: 'Go to bed', hover: 'Rest on the bed', group: 'places', place: 'bed', seat: { title: 'In bed', line: 'Linen, lamplight, and the tide for company.' } },
  { id: 'lounge', icon: 'chair', label: 'Sea window', aria: 'Sit by the sea window', hover: 'Sink into the chair by the sea window', group: 'places', place: 'lounge', seat: { title: 'By the sea window', line: 'A deep chair, a warm cup, and nothing to finish.' } },
  { id: 'tea', icon: 'tea', label: 'Tea room', aria: 'Explore tea room', hover: 'Take a seat at the tea table', group: 'places', place: 'tea', seat: { title: 'Tea above the tide', line: 'A quiet table with your back to the books and the sea ahead.' } },
  { id: 'books', icon: 'books', label: 'Library', aria: 'Explore library', hover: 'Browse the library wall', group: 'places', place: 'books', panel: 'books' },
  // The switches keep one short word each; which way they are set shows as a tint on the button.
  { id: 'curtains', icon: 'curtains', label: 'Curtains', aria: s => s.curtains ? 'Close curtains' : 'Open curtains', hover: s => s.curtains ? 'Close the curtains' : 'Open the curtains', group: 'things', toggle: 'curtains', pressed: s => !s.curtains },
  { id: 'window', icon: 'window', label: 'Window', aria: s => s.sash ? 'Shut the sea window' : 'Open the sea window', hover: s => s.sash ? 'Shut the window on the sea' : 'Let the sea air in', group: 'things', toggle: 'sash', pressed: s => s.sash },
  { id: 'lamp', icon: 'lamp', label: 'Lamps', aria: s => s.lamp ? 'Turn off the lamps' : 'Turn on the lamps', hover: s => s.lamp ? 'Turn off the lamps' : 'Turn on the lamps', group: 'things', toggle: 'lamp', pressed: s => s.lamp },
  { id: 'music', icon: 'music', label: 'Sound', aria: s => s.music ? 'Stop the record player' : 'Play the record player', hover: s => s.music ? 'Lift the needle' : 'Put a record on', group: 'things', toggle: 'music', pressed: s => s.music },
  { id: 'dresser', icon: 'drawer', label: 'Drawers', aria: s => s.drawers ? 'Close the dresser drawers' : 'Open the dresser drawers', hover: s => s.drawers ? 'Close the drawers' : 'Look in the drawers', group: 'things', toggle: 'drawers', pressed: s => s.drawers },
  { id: 'television', icon: 'television', label: 'TV', aria: 'Explore rolling television', hover: 'Explore the rolling television', group: 'things', panel: 'television' },
  // Found by looking rather than by the toolbar.
  { id: 'mirror', icon: 'mirror', label: 'Mirror', aria: 'Stand at the mirror', hover: 'Try the coat and the sun hat on', place: 'mirror' },
  { id: 'pour', icon: 'tea', label: 'Pour', aria: 'Pour the tea', hover: 'Pour a cup', pulse: 'pour' },
];

const byId = new Map(interactions.map(entry => [entry.id, entry]));
export const interaction = (id: Action) => byId.get(id)!;
/** Resolve a label that may depend on whether the lamps are lit or the curtains drawn. */
export const words = (value: Words, state: UiState) => typeof value === 'function' ? value(state) : value;
/** The card shown while the visitor is seated somewhere, if that place has one. */
export const seatOf = (place: PlaceId | null) => interactions.find(entry => entry.place === place)?.seat;

type Wiring = {
  state: UiState;
  onAction: (action: Action) => void;
  onHover: (name: string) => void;
  /** Open the library panel at one particular title. */
  onBook: (index: number) => void;
};
const Wire = createContext<Wiring | null>(null);
/** Put around the scene once, so anything in the room can be made clickable without threading props to it. */
export const InteractionProvider = Wire.Provider;
export const useWiring = () => useContext(Wire)!;

/** Wraps whatever in the room answers to this interaction: a click runs it, hovering names it. */
export function Interactive({ id, children }: { id: Action; children: ReactNode }) {
  const { state, onAction, onHover } = useWiring();
  const label = words(interaction(id).hover, state);
  return <group
    onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); if (e.delta > 4) return; onAction(id); }}
    onPointerOver={e => { e.stopPropagation(); onHover(label); document.body.style.cursor = 'pointer'; }}
    onPointerOut={() => { onHover(''); document.body.style.cursor = ''; }}>{children}</group>;
}
