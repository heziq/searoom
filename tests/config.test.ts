import test from 'node:test';
import assert from 'node:assert/strict';
import { home, atmospheres } from '../src/config.ts';
import { getStairLayout, getLibraryBooks } from '../src/layout.ts';
import { floorAt, follow, loftFloor, stairHeight, walk, type Foot } from '../src/walk.ts';

test('the compact tea mezzanine follows the solid rear wall and leaves the right sea window open', () => {
  const {room, loft, window} = home;
  const rear = -room.depth / 2;
  assert.ok(room.width / room.depth > 1.4);
  assert.ok(Math.abs(loft.position[2] - loft.size[2]/2 - rear) < .05);
  assert.ok(loft.size[0] <= 8.1);
  assert.ok(loft.size[2] >= 3.8);
  assert.ok(loft.size[0] * loft.size[2] < room.width * room.depth * .2);
  assert.equal(window.x,room.width/2);
  assert.ok(window.end-window.start > 10);
  assert.ok(window.start > rear && window.end < room.front);
  assert.ok(loft.position[0]+loft.size[0]/2 < home.furniture.bed[0]-home.bedSize[0]/2);
  assert.ok(loft.position[2] + loft.size[2]/2 < -.5);
  assert.ok(window.top > loft.position[1] + 3);
});

test('the double bed head meets the real rear wall with space beside both sides', () => {
  const {bed, bedsideTable, television} = home.furniture;
  const {bedSize, loft, room} = home;
  const bedHead = bed[2] - bedSize[2]/2;
  const wallFace = -room.depth/2 + .1;
  assert.ok(Math.abs(bedHead - wallFace) < .06);
  assert.ok(bed[2]+bedSize[2]/2 > loft.position[2]+loft.size[2]/2 + .5);
  assert.ok(bed[0]-bedSize[0]/2 > loft.position[0]+loft.size[0]/2);
  assert.ok(bedsideTable[0] > bed[0]+bedSize[0]/2);
  assert.ok(television[0] > bed[0]+bedSize[0]/2);
  assert.ok(bed[0]+bedSize[0]/2 < room.width/2-1.5);
  assert.ok(bed[2]+bedSize[2]/2 < room.front-1);
});

test('stairs enter from the central aisle and turn on a level landing, clear of the gaming chair', () => {
  const {lower, landing, upper, treads, rise, landingY} = getStairLayout();
  const {desk, gamingChair} = home.furniture;
  assert.equal(treads.length, home.stairs.steps);
  assert.equal(lower.length,6);
  assert.equal(upper.length,7);
  assert.ok(lower[0].position[0] > desk[0]+home.worktable.size[0]/2);
  assert.ok(lower[0].position[0]-(desk[0]+home.worktable.size[0]/2) > .7);
  assert.ok(Math.abs(lower.at(-1)!.position[1]+rise-landing.position[1]) < .001);
  assert.ok(Math.abs(upper[0].position[1]-rise-landing.position[1]) < .001);
  assert.ok(upper.every(t=>t.position[2]+t.size[2]/2 < gamingChair[2]-.5));
  assert.ok(upper.at(-1)!.position[2] < home.loft.position[2]+home.loft.size[2]/2);
  assert.ok(Math.abs(upper.at(-1)!.position[1]+.055-landingY)<.001);
});

test('the chair backs toward the solid left wall and shelves hold varied books on both levels', () => {
  const {room, furniture, worktable} = home;
  assert.ok(furniture.gamingChair[0] < furniture.desk[0]);
  assert.ok(furniture.gamingChair[0] + room.width/2 >= 1.5);
  assert.ok(furniture.desk[0]-worktable.size[0]/2-furniture.gamingChair[0] > .7);
  assert.ok(worktable.size[0] >= 2.3 && worktable.size[1] >= .22);
  assert.ok(home.loftSupports.every(x=>x < furniture.bed[0]-home.bedSize[0]/2-1));
  assert.ok(home.loftSupports.every(x=>x < -4.9));
  assert.ok(furniture.desk[2]+worktable.size[2]/2 < room.front-.25);
  for (const spec of [home.library,home.lowerLibrary]) {
    const volumes=getLibraryBooks(spec);
    assert.ok(volumes.length > 60);
    assert.ok(volumes.some(({size})=>size[0]>size[1]));
    assert.ok(volumes.some(({size})=>size[1]>size[0]));
    for (const {position,size} of volumes) {
      assert.ok(Math.abs(position[0])+size[0]/2 < spec.width/2);
      assert.ok(position[1]-size[1]/2 > 0);
      assert.ok(position[1]+size[1]/2 < spec.height);
    }
  }
});

test('lighting and external links retain usable configuration', () => {
  for (const preset of Object.values(atmospheres)) {
    assert.ok(preset.ambient > 0 && preset.intensity > 0);
    for (const color of [preset.background,preset.sky,preset.sun,preset.ocean]) assert.match(color,/^#[\da-f]{6}$/i);
  }
  for (const item of [home.website,...home.books]) assert.equal(new URL(item.url).protocol,'https:');
});

test('the desk and its chair stand clear of the stair', () => {
  const {desk} = home.furniture, {lower} = getStairLayout();
  const stairEdge = Math.max(...lower.map(t => t.position[2] + t.size[2]/2));
  assert.ok(desk[2] - home.worktable.size[2]/2 > stairEdge + .05);
});

test('the bed is sheltered by a canopy over its head while its foot stays in the open', () => {
  const {sleepingNook: nook, bedSize, loft, room, window} = home, {bed} = home.furniture;
  const canopyFront = -room.depth/2 + .1 + nook.depth;
  assert.ok(nook.left < bed[0] - bedSize[0]/2 - .8 && nook.right > bed[0] + bedSize[0]/2 + .8);
  assert.ok(canopyFront > bed[2] - bedSize[2]/2 + 2 && canopyFront < bed[2] + bedSize[2]/2 - 1);
  assert.ok(Math.abs(nook.canopyY - loft.position[1]) < .2);            // the canopy continues the line of the loft
  assert.ok(nook.canopyY > room.eye + .7 && nook.canopyY < room.height - 3);
  assert.ok(nook.right < window.x - 1);                                 // the sea side stays open
});

test('a visitor can walk the room and climb to the tea loft, but not through the furniture', () => {
  const entry = home.places.entry.stand, start: Foot = {x: entry[0], y: entry[1], z: entry[2]};
  assert.equal(floorAt(start.x, start.z, 0), 0);
  const upstairs = follow(start, {x: -5.4, y: loftFloor, z: -3.2});
  assert.ok(Math.abs(upstairs.y - loftFloor) < .001);
  assert.ok(Math.hypot(upstairs.x + 5.4, upstairs.z + 3.2) < .2);
  const backDown = follow(upstairs, {x: 6.3, y: 0, z: .75});
  assert.equal(backDown.y, 0);
  assert.ok(Math.hypot(backDown.x - 6.3, backDown.z - .75) < .2);
  const {bed, desk, teaTable} = home.furniture;
  assert.equal(floorAt(bed[0], bed[2], 0), null);
  assert.equal(floorAt(desk[0], desk[2], 0), null);
  assert.equal(floorAt(teaTable[0], teaTable[2], loftFloor), null);
  assert.equal(floorAt(-4, -4, 0), 0);                                  // under the loft is ordinary floor
  assert.equal(floorAt(-4, -1, loftFloor), null);                       // no stepping off the loft edge
  assert.equal(floorAt(-5, .3, 0), null);                               // nor through the side of the stair
  assert.ok(stairHeight(-5, .3)! > 0 && stairHeight(-7.4, -2)! < loftFloor);
  const blockedSpot = follow(start, {x: bed[0], y: 0, z: bed[2]});      // a click on the bed leads to its edge
  assert.ok(floorAt(blockedSpot.x, blockedSpot.z, 0) === 0 && Math.hypot(blockedSpot.x - bed[0], blockedSpot.z - bed[2]) < 3.2);
  let foot = start;                                                     // walking into the front wall just stops
  for (let i = 0; i < 100; i++) foot = walk(foot, 0, .1);
  assert.ok(foot.z < home.room.front);
});

test('every place to settle is inside the room, with somewhere to stand up', () => {
  const {room, places} = home;
  for (const [name, place] of Object.entries(places)) {
    const [x, y, z] = place.eye, [sx, sy, sz] = place.stand;
    assert.ok(Math.abs(x) < room.width/2 && z > -room.depth/2 && z < room.front && y > 0 && y < room.height, name);
    assert.ok(Math.abs(floorAt(sx, sz, sy)! - sy) < .001, `${name} needs a clear place to stand`);
    assert.ok(Math.abs(place.pitch) < .5);
    if (place.seated) assert.ok(y - sy < room.eye, `${name} should be lower than standing`);
  }
  assert.ok(places.tea.eye[1] > loftFloor && places.books.eye[1] > loftFloor);
});
