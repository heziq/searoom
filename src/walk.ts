import { home } from './config.ts';

// Where a visitor can stand. Pure geometry, so the layout tests can walk the room too.
export type Foot = { x: number; z: number; y: number };
type Rect = [x0: number, x1: number, z0: number, z1: number];
type Disc = [x: number, z: number, radius: number];

const BODY = .36;   // clearance kept from walls and furniture
const STEP = .6;    // tallest change of level one stride may take
const { room, loft, furniture: f, bedSize, worktable, lowerLibrary, sleepingNook } = home;
const rear = -room.depth / 2;
export const loftFloor = loft.position[1] + loft.size[1] / 2;
const loftFront = loft.position[2] + loft.size[2] / 2, loftRight = loft.position[0] + loft.size[0] / 2;
const rise = loftFloor / home.stairs.steps, landingY = rise * 7;

const around = ([x, , z]: number[], w: number, d: number): Rect => [x - w / 2, x + w / 2, z - d / 2, z + d / 2];
const ground: { rects: Rect[]; discs: Disc[] } = {
  rects: [
    around(f.bed, bedSize[0] + .2, bedSize[2] + .15),
    [sleepingNook.left - .08, sleepingNook.right, rear, rear + 1.4],                       // bedside tables and the plant behind them
    [sleepingNook.left - .08, sleepingNook.left + .08, rear, rear + sleepingNook.depth - .4], // timber screen
    around(f.desk, worktable.size[0], worktable.size[2]),
    [f.lowerShelf[0] - .3, f.lowerShelf[0] + .2, f.lowerShelf[2] - lowerLibrary.width / 2, f.lowerShelf[2] + lowerLibrary.width / 2],
    [-3.55, -.85, rear, -5.42],                                                             // console under the loft
    around(f.loungeShelf, .5, 2.7),
    [.25, 2.35, 4.55, room.front],                                                          // entry bench
  ],
  discs: [[f.gamingChair[0], f.gamingChair[2], .55], [f.readingChair[0], f.readingChair[2], .8], [f.ottoman[0], f.ottoman[2], .5], [.48, -5.38, .35], [5.6, 3.85, .3]],
};
const upstairs: { rects: Rect[]; discs: Disc[] } = {
  rects: [around(f.teaTable, 2.1, 1.1)],
  discs: [[-3.6, -3.1, .36], [-2, -4.32, .36], [-7.65, -5.75, .3], [-.6, -5.55, .3], [-.62, -4.7, .45]],
};

/** Height of the stair under a point, or null away from the stair. The two flights are treated as ramps. */
export function stairHeight(x: number, z: number): number | null {
  if (x <= -3 && x > -6.81 && z > -.33 && z < .84) return Math.min(landingY, rise + (-3.55 - x) * rise / .55);
  if (x <= -6.81 && x >= -7.98 && z > -.42 && z < .93) return landingY;
  if (x <= -6.86 && x >= -7.98 && z <= -.42 && z >= -3.3) return Math.min(loftFloor, landingY + (-.42 - z) * (loftFloor - landingY) / 2.58);
  return null;
}
const blocked = ({ rects, discs }: typeof ground, x: number, z: number) =>
  rects.some(([x0, x1, z0, z1]) => x > x0 - BODY && x < x1 + BODY && z > z0 - BODY && z < z1 + BODY) ||
  discs.some(([dx, dz, r]) => Math.hypot(x - dx, z - dz) < r + BODY);

/** The floor a visitor at height `y` would be standing on at (x, z), or null when they cannot be there. */
export function floorAt(x: number, z: number, y: number): number | null {
  const stair = stairHeight(x, z), levels: number[] = [];
  if (stair !== null) levels.push(stair);
  const inRoom = Math.abs(x) < room.width / 2 - .1 - BODY && z > rear + .1 + BODY && z < room.front - .05 - BODY;
  if (inRoom && (stair === null || stair < .3) && !blocked(ground, x, z)) levels.push(0);
  const onLoft = x > loft.position[0] - loft.size[0] / 2 + BODY && x < loftRight - BODY && z > rear + home.library.depth + .25 + BODY && z < loftFront - BODY;
  if (onLoft && !blocked(upstairs, x, z)) levels.push(loftFloor);
  const reachable = levels.filter(level => Math.abs(level - y) <= STEP);
  return reachable.length ? Math.max(...reachable) : null;
}

/** Take a stride, sliding along whatever is in the way. */
export function walk(from: Foot, dx: number, dz: number): Foot {
  for (const [sx, sz] of [[dx, dz], [dx, 0], [0, dz]]) {
    if (!sx && !sz) continue;
    const y = floorAt(from.x + sx, from.z + sz, from.y);
    if (y !== null) return { x: from.x + sx, z: from.z + sz, y };
  }
  return from;
}

type Point = { x: number; z: number };
const CELL = .25, columns = Math.round(room.width / CELL), rows = Math.round((room.front - rear) / CELL);
const cell = (i: number): Point => ({ x: -room.width / 2 + (i % columns + .5) * CELL, z: rear + (Math.floor(i / columns) + .5) * CELL });
const standable = (x: number, z: number, level: number) => { const floor = floorAt(x, z, level); return floor !== null && Math.abs(floor - level) < .01; };
function clear(a: Point, b: Point, level: number) {
  const steps = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / .1);
  for (let i = 1; i <= steps; i++) if (!standable(a.x + (b.x - a.x) * i / steps, a.z + (b.z - a.z) * i / steps, level)) return false;
  return true;
}
/** The way across one floor: straight if nothing is in the way, otherwise around the furniture. A spot that cannot
 *  be stood on (under the bed, against a wall) leads to the nearest place that can. */
function across(from: Point, to: Point, level: number): Point[] {
  const reachable = standable(to.x, to.z, level);
  if (reachable && clear(from, to, level)) return [to];
  const open = Array.from({ length: columns * rows }, (_, i) => standable(cell(i).x, cell(i).z, level));
  const nearest = (point: Point) => open.reduce((best, ok, i) => ok && (best < 0 || Math.hypot(cell(i).x - point.x, cell(i).z - point.z) < Math.hypot(cell(best).x - point.x, cell(best).z - point.z)) ? i : best, -1);
  const start = nearest(from), goal = nearest(to);
  if (start < 0 || goal < 0) return [];
  const came = new Int32Array(columns * rows).fill(-1), queue = [start];
  came[start] = start;
  for (let q = 0; q < queue.length && came[goal] < 0; q++) {
    const i = queue[q], cx = i % columns, cz = Math.floor(i / columns);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const nx = cx + dx, nz = cz + dz, next = nz * columns + nx;
      if (nx < 0 || nz < 0 || nx >= columns || nz >= rows || !open[next] || came[next] >= 0) continue;
      if (dx && dz && !(open[cz * columns + nx] && open[nz * columns + cx])) continue;
      came[next] = i; queue.push(next);
    }
  }
  if (came[goal] < 0) return [];
  const cells: Point[] = [];
  for (let i = goal; i !== start; i = came[i]) cells.unshift(cell(i));
  if (!cells.length) cells.push(cell(goal));
  if (reachable) cells.push(to);
  // Pull the cell-by-cell path taut.
  const path: Point[] = [];
  for (let anchor = from, i = 0; i < cells.length;) {
    let j = cells.length - 1;
    while (j > i && !clear(anchor, cells[j], level)) j--;
    path.push(anchor = cells[j]); i = j + 1;
  }
  return path;
}

const stairFoot = { x: -2.7, z: .27 }, stairTurn = { x: -7.42, z: .27 }, stairTop = { x: -7.42, z: -3.45 };
/** Waypoints from here to there; changing level always goes by the stair. */
export function route(from: Foot, to: Foot): Point[] {
  const goingUp = to.y > loftFloor / 2, isUp = from.y > loftFloor - .3, onStair = from.y > .15 && !isUp, level = goingUp ? loftFloor : 0;
  if (!onStair && goingUp === isUp) return across(from, to, level);
  const stair = onStair
    ? from.y < landingY - .02 ? (goingUp ? [stairTurn, stairTop] : [stairFoot]) : (goingUp ? [stairTop] : [stairTurn, stairFoot])
    : goingUp ? [stairFoot, stairTurn, stairTop] : [stairTop, stairTurn, stairFoot];
  const approach = onStair ? [] : across(from, stair[0], isUp ? loftFloor : 0).slice(0, -1);
  return [...approach, ...stair, ...across(stair[stair.length - 1], to, level)];
}

/** Walk a whole route in small strides, as the camera does. Returns where the visitor ends up. */
export function follow(from: Foot, to: Foot, stride = .08): Foot {
  let foot = from;
  for (const point of route(from, to)) {
    for (let i = 0; i < 600; i++) {
      const dx = point.x - foot.x, dz = point.z - foot.z, distance = Math.hypot(dx, dz);
      if (distance < stride) break;
      const next = walk(foot, dx / distance * stride, dz / distance * stride);
      if (next === foot) return foot;
      foot = next;
    }
  }
  return foot;
}
