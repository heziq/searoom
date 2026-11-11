export type Position = [number, number, number];
export type Atmosphere = 'day' | 'sunset' | 'night';
export type PlaceId = 'entry' | 'computer' | 'bed' | 'lounge' | 'tea' | 'books';
/** A spot to be in: where the eyes rest, which way they face (yaw 0 looks at the rear wall, negative turns toward the sea), and where the feet land on standing up. */
export type Place = { eye: Position; yaw: number; pitch: number; stand: Position; seated: boolean };

export const home = {
  website: { title: 'My little corner of the internet', url: 'https://example.com', description: 'Ideas, projects, and things I love.' },
  room: { width: 18.5, depth: 12.5, front: 5.15, height: 7.55, eye: 2.5 },
  window: { x: 9.25, start: -5.95, end: 4.85, bottom: .27, top: 7.16 },
  loft: { position: [-4.025, 3.55, -4.28] as Position, size: [8.05, .26, 3.9] as Position },
  loftSupports: [-7.9, -5.2],
  stairs: { width: 1.08, steps: 14, railHeight: .86, landing: [-7.43, 1.84, .25] as Position },
  worktable: { size: [2.35, .24, 3.9] as Position, topY: 1.07 },
  library: { width: 7.85, height: 3.08, depth: .42, bays: 7, shelves: [.48, 1.1, 1.74, 2.38] },
  lowerLibrary: { width: 3.95, height: 2.85, depth: .38, bays: 4, shelves: [.45, 1.05, 1.66, 2.25] },
  bedSize: [3.65, .35, 4.5] as Position,
  // A lowered linen canopy and an open timber screen shelter the bed head; the foot stays in the sun.
  sleepingNook: { left: 2.2, right: 8.05, depth: 2.95, canopyY: 3.5 },
  furniture: {
    desk: [-5.62, 0, 2.85] as Position,
    gamingChair: [-7.75, 0, 3] as Position,
    bed: [5.1, 0, -3.91] as Position,
    bedsideTable: [7.55, 0, -5.25] as Position,
    television: [7.75, 0, -.55] as Position,
    televisionParked: [8.3, 0, 4.4] as Position,
    readingChair: [6.9, 0, 2.3] as Position,
    ottoman: [8.05, 0, 1.75] as Position,
    loungeShelf: [5.15, 0, 2.3] as Position,
    shelf: [-4.1, 3.68, -5.75] as Position,
    lowerShelf: [-8.87, 0, -3.74] as Position,
    teaTable: [-3.6, 3.68, -4.5] as Position,
    plant: [8.5, 0, -5.6] as Position,
  },
  places: {
    entry: { eye: [-1.5, 2.5, 4.35], yaw: -.5, pitch: -.03, stand: [-1.5, 0, 4.35], seated: false },
    computer: { eye: [-7.5, 2.02, 3], yaw: -1.42, pitch: -.13, stand: [-8.05, 0, 1.75], seated: true },
    bed: { eye: [6.02, 1.86, -5.15], yaw: -2.74, pitch: -.08, stand: [8.05, 0, -2.9], seated: true },
    lounge: { eye: [6.98, 1.8, 2.3], yaw: -1.4, pitch: -.07, stand: [6.3, 0, .75], seated: true },
    tea: { eye: [-3.6, 5.3, -5.5], yaw: -2.5, pitch: -.12, stand: [-5.4, 3.68, -3.2], seated: true },
    books: { eye: [-5.7, 6.18, -2.8], yaw: -.02, pitch: -.07, stand: [-5.7, 3.68, -2.8], seated: false },
  } satisfies Record<PlaceId, Place>,
  books: [
    { title: 'A room of one’s own', author: 'Virginia Woolf', description: 'A quiet space for imagination, independence, and making something your own.', url: 'https://www.gutenberg.org/ebooks/search/?query=A+Room+of+Ones+Own', color: '#ad654b' },
    { title: 'The secret garden', author: 'Frances Hodgson Burnett', description: 'An old garden, a small beginning, and the gentle magic of watching things grow.', url: 'https://www.gutenberg.org/ebooks/113', color: '#6c7c58' },
    { title: 'Walden', author: 'Henry David Thoreau', description: 'Notes on slowing down and noticing the world just outside your window.', url: 'https://www.gutenberg.org/ebooks/205', color: '#c9a967' },
  ],
};

// `sunFrom` is where the sun (or moon) stands relative to the room; it comes in through the sea window.
// `skyFill` is the cool, shadowless light a large window spreads; `ambient`/`bounce` are what the room returns.
export const atmospheres = {
  day: { background: '#e8ede9', sky: '#cfe3ea', zenith: '#7eb0d2', glow: '#fff4dc', ambient: .95, bounce: 1.25, sun: '#fff0d6', intensity: 3.5, sunFrom: [12, 7.4, -3.2] as Position, skyFill: '#dfeaf0', fill: .7, ocean: '#4f8ba6' },
  sunset: { background: '#eadccc', sky: '#f3c7a2', zenith: '#7a86ab', glow: '#ffb27a', ambient: .6, bounce: .8, sun: '#ffa66c', intensity: 4.2, sunFrom: [12, 2.3, -1.6] as Position, skyFill: '#cdb9c9', fill: .5, ocean: '#5a7f97' },
  night: { background: '#252f3b', sky: '#2c4058', zenith: '#101a2b', glow: '#cdd8ee', ambient: .2, bounce: .18, sun: '#b4c8ee', intensity: .55, sunFrom: [12, 8.5, -5.5] as Position, skyFill: '#5f7da6', fill: .2, ocean: '#213f55' },
} satisfies Record<Atmosphere, object>;
