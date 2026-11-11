# Dream Home

A warm, open 3D seaside loft you can stand in, built with React, TypeScript, Vite, Three.js, React Three Fiber, and Drei. The room is modeled in code; there are no downloaded 3D models or backend services.

## Run

Requires Node.js 22.18+.

```sh
npm install
npm run dev
```

Open the local address shown by Vite. `npm run build` type-checks and builds the site; `npm test` checks the key room layout relationships and that the room can be walked.

## Being in the room

The page opens at standing height just inside the door. Drag to look around; click the floor or a stair tread to walk there (the route goes around furniture and up the stair); W A S D and the arrow keys walk and turn; scrolling takes a step forward.

Four places invite you to settle: the desk chair, the bed, the deep chair by the sea window, and the tea table upstairs. Click them, or use the buttons below the room. Each seats you at eye level with its own view; scroll to lean in, press Escape or **Stand up** to rise. The library button stands you in front of the upstairs shelves and opens the reading list.

**Open front** and **From above** bring back the cut-away diorama views with orbit and zoom. From either, clicking the floor steps back inside.

## The room

An 18.5 × 12.5 rectangular loft has a compact tea-room mezzanine attached to the rear wall. A tall timber-framed window fills the right side and looks over a weathered deck, a strip of shore and the sea, out to a headland with a small lighthouse. Daylight enters from that side only, so it falls across the oak floor in long window-shaped pools and leaves the rest of the room in soft shade.

- **Left front:** deep gaming desk with two monitors, keyboard, mouse mat, blue-lit PC tower, a mug, a notebook and a small lamp. The chair backs toward the solid left wall; from it you look over the screens to the sea.
- **Left rear:** a lower bookcase and an L-shaped stair. The first flight begins off the central passage, reaches a landing, then turns along the left wall.
- **Under the loft:** a low console with a lamp and three prints.
- **Right rear:** a generous double bed against the solid wall, in its own alcove: oak panelling, a soft grey-green wall above it, a lowered linen canopy on a timber frame, and an open timber screen on the room side. The head is sheltered; the foot stays in the sun and the sea side stays open.
- **Right front:** a deep chair facing the sea window with a footstool, side table and arc lamp on a round rug, its back guarded by a low bookshelf. The rolling television parks in the corner beside it.
- **Mezzanine:** a Chinese-inspired solid-wood tea table on a woven mat under a paper lantern, with simple chairs, teaware, floor cushions, a long back-wall bookcase, plants, chart and sailboat.
- **By the door:** a peg rail with a coat and a sun hat, a bench, and a shelf within reach of the desk. The front wall and ceiling appear only while you are inside; the outside views stay open.

Day, sunset, night, and rain are at the top right. Every lamp in the house answers the lamp button (or a click on a bedside lamp), and they matter most after dark. Curtains, the bookcases, and the rolling television are clickable too. The home button returns you to the doorway.

## Customize

Edit `src/config.ts` for room and furniture positions, dimensions, the places to sit (`places`), light colors and sun positions, personal website URL, and book links. The website URL currently points to `https://example.com`; replace it before publishing.

- `src/Room.tsx` — geometry, materials and lighting, in named components.
- `src/Outside.tsx` — sky, sea, shore and lighthouse beyond the window.
- `src/Presence.tsx` — the first-person camera: looking, walking, sitting.
- `src/walk.ts` — where a visitor can stand and how they get there (pure, covered by tests).
- `src/textures.ts` — small procedural textures for wood, cloth, plaster, rugs and prints.
- `src/layout.ts` — stair positions and varied book volumes.
- `src/App.tsx` — the page around the room.

The scene caps device pixel ratio at 1.5 and pauses when the page is hidden. It renders on demand, plus a gentle 30 fps tick that keeps the sea, steam and dust moving; with reduced motion enabled that tick is off and all camera moves are instant. All actions have keyboard-accessible buttons. WebGL and device performance vary.
