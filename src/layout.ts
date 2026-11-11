import { home, type Position } from './config.ts';

// The first flight enters from the central aisle, then turns onto a landing by the left wall.
export function getStairLayout() {
  const landingY = home.loft.position[1] + home.loft.size[1] / 2;
  const rise = landingY / home.stairs.steps;
  const lower = Array.from({ length: 6 }, (_, i) => ({
    position: [-3.55 - i * .55, (i + 1) * rise - .055, .27] as Position,
    size: [.57, .11, home.stairs.width] as Position,
  }));
  const landing = { position: [-7.36, 7 * rise - .055, .27] as Position, size: [1.1, .11, 1.32] as Position };
  const upper = Array.from({ length: 7 }, (_, i) => ({
    position: [-7.42, (i + 8) * rise - .055, -.18 - i * .47] as Position,
    size: [home.stairs.width, .11, .49] as Position,
  }));
  return { landingY, rise, lower, landing, upper, treads: [...lower, landing, ...upper] };
}

export function getLibraryBooks(spec: Pick<typeof home.library, 'width' | 'bays' | 'shelves'> = home.library) {
  const { width, bays, shelves } = spec;
  const bayWidth = width / bays;
  const palette = ['#315e71', '#6e8f9a', '#a8815f', '#e2d4b4', '#688477', '#8f6f5e'];
  return shelves.flatMap((shelf, row) => Array.from({ length: bays }, (_, bay) => {
    const horizontal = (row + bay * 2) % 5 === 0;
    const count = horizontal ? 3 : (row + bay) % 3 === 0 ? 4 : 6;
    return Array.from({ length: count }, (_, book) => {
      const height = .34 + ((row + bay + book) % 4) * .064;
      return {
        position: (horizontal
          ? [-width / 2 + bay * bayWidth + .34, shelf + .05 + book * .075, .04]
          : [-width / 2 + bay * bayWidth + .13 + book * .15, shelf + .045 + height / 2, .045]) as Position,
        size: (horizontal ? [.42, .07, .28] : [.1 + (book % 2) * .02, height, .27]) as Position,
        color: palette[(row + bay * 2 + book) % palette.length],
      };
    });
  }).flat());
}
