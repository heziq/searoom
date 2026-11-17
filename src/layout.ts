import { home, type Position } from './config.ts';

// One straight flight climbs the left wall beside the loft's short edge, then lands on a platform in the
// rear-left corner that is level with the loft floor. Nothing stands in the middle of the room.
export function getStairLayout() {
  const { stairs, loft, room } = home, { x, foot, going, width, steps } = stairs;
  const landingY = loft.position[1] + loft.size[1] / 2;
  const rise = landingY / steps;
  const flight = Array.from({ length: steps - 1 }, (_, i) => ({
    position: [x, (i + 1) * rise - .055, foot - (i + .5) * going] as Position,
    size: [width, .11, going + .02] as Position,
  }));
  /** Where the flight ends and the platform begins. */
  const top = foot - (steps - 1) * going;
  const rearFace = -room.depth / 2 + .1;
  const landing = { position: [x, loft.position[1], (top + rearFace) / 2] as Position, size: [width, loft.size[1], top - rearFace] as Position };
  /** Height of the line through the tread tops at a given z, for rails and stringers. */
  const heightAt = (z: number) => ((foot - z) / going + .5) * rise;
  return { landingY, rise, flight, landing, top, heightAt, treads: [...flight, landing] };
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
