import { Component, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { NeutralToneMapping } from 'three';
import { home, type Atmosphere, type PlaceId, type Position } from './config';
import { loftFloor } from './walk';
import { Room, type Action, type View } from './Room';
import type { WalkTarget } from './Presence';

// Geometry and light live in Room.tsx; this file is the page around the room.
const seats: Partial<Record<PlaceId, { title: string; line: string }>> = {
  bed: { title: 'In bed', line: 'Linen, lamplight, and the tide for company.' },
  lounge: { title: 'By the sea window', line: 'A deep chair, a warm cup, and nothing to finish.' },
  tea: { title: 'Tea above the tide', line: 'A quiet table with your back to the books and the sea ahead.' },
};
const captions: Record<Atmosphere, string> = {
  day: 'An open horizon. A little room for thought.',
  sunset: 'One more golden moment before the day slips away.',
  night: 'The world is asleep. Keep a little light on.',
};

function Icon({ name }: { name: string }) {
  if (name === 'bed') return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 19V8m18 11V8M3 12h18v5H3zM5 12V9h6v3m2 0V9h6v3M3 19v2m18-2v2" /></svg>;
  const paths: Record<string, ReactNode> = { sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></>, sunset: <><path d="M3 16h18M5 20h14M7 13a5 5 0 0 1 10 0M12 3v3M3 8l2 2m14 0 2-2" /></>, moon: <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z" />, rain: <><path d="M6 14a4 4 0 0 1-.5-8A6 6 0 0 1 17 6a4 4 0 0 1 1 8M7 17l-1 3m6-3-1 3m6-3-1 3" /></>, home: <><path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8" /></>, computer: <><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8m-4-4v4" /></>, chair: <><path d="M7 11V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v5M5 11a2 2 0 0 1 2 2v2h10v-2a2 2 0 1 1 4 0v5H3v-5a2 2 0 0 1 2-2Zm1 7v2m12-2v2" /></>, lamp: <><path d="m8 3-4 9h16l-4-9ZM12 12v9m-5 0h10" /></>, curtains: <><path d="M3 3h18M5 4v16l5-3V4m9 0v16l-5-3V4" /></>, books: <><path d="M4 4h4v16H4Zm6 0h4v16h-4Zm6 1 3-1 3 15-3 1Z" /></>, tea: <><path d="M3 10h15v5a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5v-5Zm15 1h2a2 2 0 0 1 0 4h-2M8 3v3m5-3v3" /></>, television: <><rect x="3" y="3" width="18" height="14" rx="1" /><path d="M8 21h8m-4-4v4" /></>, arrow: <path d="M5 12h14m-6-6 6 6-6 6" />, close: <path d="m6 6 12 12M6 18 18 6" />, help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1.5 1-1.5 1-1.5 3m0 3v.1" /></> };
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.home}</svg>;
}
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> { state = { failed: false }; static getDerivedStateFromError() { return { failed: true }; } render() { return this.state.failed ? <div className="scene-error"><h2>The room couldn’t open</h2><p>This room needs WebGL. Try a browser with hardware acceleration enabled.</p><button onClick={() => location.reload()}>Try again</button></div> : this.props.children; } }

export default function App() {
  const [atmosphere, setAtmosphere] = useState<Atmosphere>('day'), [curtains, setCurtains] = useState(true), [lamp, setLamp] = useState(true), [rain, setRain] = useState(false);
  const [view, setView] = useState<View>('inside'), [place, setPlace] = useState<PlaceId | null>(null), [placeKey, setPlaceKey] = useState(0), [walkTarget, setWalkTarget] = useState<WalkTarget | null>(null), [settled, setSettled] = useState(false);
  const [books, setBooks] = useState(false), [television, setTelevision] = useState(false), [tvBesideBed, setTvBesideBed] = useState(true), [help, setHelp] = useState(false), [hover, setHover] = useState(''), [reset, setReset] = useState(0);
  const [visible, setVisible] = useState(!document.hidden), [reduced, setReduced] = useState(matchMedia('(prefers-reduced-motion: reduce)').matches);
  const panel = useRef<HTMLElement>(null), trigger = useRef<HTMLElement | null>(null), veil = useRef<HTMLDivElement>(null);
  const inside = view === 'inside', focus = inside && place === 'computer', seat = inside && place ? seats[place] : undefined, panelOpen = focus || books || television || help;
  useEffect(() => { const update = () => setVisible(!document.hidden); const media = matchMedia('(prefers-reduced-motion: reduce)'); const motion = () => setReduced(media.matches); document.addEventListener('visibilitychange', update); media.addEventListener('change', motion); return () => { document.removeEventListener('visibilitychange', update); media.removeEventListener('change', motion); document.body.style.cursor = ''; }; }, []);

  const closePanels = () => { setBooks(false); setTelevision(false); setHelp(false); setHover(''); };
  /** Close whatever is open and get up from wherever the visitor is sitting. */
  const close = () => { closePanels(); setPlace(null); };
  const goTo = (next: PlaceId) => { setView('inside'); setPlace(next); setPlaceKey(key => key + 1); setSettled(true); };
  const goHome = () => { closePanels(); if (inside) goTo('entry'); else setReset(value => value + 1); };
  useEffect(() => {
    if (!panelOpen && !seat) return;
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });
  useEffect(() => { if (!panelOpen) return; trigger.current = document.activeElement as HTMLElement; panel.current?.focus(); return () => trigger.current?.focus(); }, [panelOpen]);

  const action = (a: Action) => {
    setHover('');
    if (a === 'curtains') return setCurtains(value => !value);
    if (a === 'lamp') return setLamp(value => !value);
    closePanels();
    if (a === 'television') return setTelevision(true);
    if (a === 'books') setBooks(true);
    goTo(a === 'books' ? 'books' : a);
  };
  const walkTo = ([x, y, z]: Position) => {
    closePanels(); setView('inside'); setPlace(null); setSettled(true);
    setWalkTarget({ x, z, y: y > loftFloor - .4 ? loftFloor : y, key: Date.now() });
  };
  const changeView = (next: View) => { closePanels(); setView(next); setReset(value => value + 1); if (next === 'inside') setSettled(true); };

  return <main className={`app ${atmosphere} ${inside ? 'inside' : 'outside'} ${focus ? 'focused' : ''} ${inside && settled ? 'settled' : ''}`}>
    <div className="scene" aria-label="Interactive 3D seaside loft with gaming space, bed, reading chair and tea room. Use the controls below to move through and interact with the room."><SceneBoundary><Suspense fallback={<div className="loading">Making room for you…</div>}><Canvas shadows dpr={[1, 1.5]} frameloop={!visible ? 'never' : rain && !reduced ? 'always' : 'demand'} camera={{ position: home.places.entry.eye, fov: 62, near: .1, far: 260 }} gl={{ antialias: true, powerPreference: 'low-power', toneMapping: NeutralToneMapping }}>
      <Room atmosphere={atmosphere} curtains={curtains} lamp={lamp} focus={focus} view={view} place={place} placeKey={placeKey} walkTarget={walkTarget} rain={rain} reduced={reduced} tvBesideBed={tvBesideBed} reset={reset} veil={veil} onAction={action} onHover={setHover} onWalk={walkTo} onEngage={() => setSettled(true)} onWander={() => setPlace(null)} />
    </Canvas></Suspense></SceneBoundary><div className="veil" ref={veil} /></div>
    <div className="scrim" aria-hidden="true" />
    <header className="masthead"><a className="brand" href="#" onClick={e => { e.preventDefault(); goHome(); }}><span className="brand-mark"><Icon name="home" /></span>dream home<span className="brand-dot">.</span></a><span className="edition">YOUR LITTLE PLACE IN THE WORLD</span><button className="icon-button help-button" aria-label="How to explore" onClick={() => { closePanels(); setHelp(true); }}><Icon name="help" /></button></header>
    <div className="intro"><h1>Room for<br />a slower tide.</h1><p>Leave the busy world outside.<br />Make yourself at home.</p><div className="room-label"><span />THE TIDELINE LOFT</div></div>
    <div className="view-switch" role="group" aria-label="Room viewpoint">{([['inside', 'Inside'], ['front', 'Open front'], ['overview', 'From above']] as [View, string][]).map(([name, label]) => <button key={name} aria-pressed={view === name} onClick={() => changeView(name)}>{label}</button>)}</div>
    <div className="atmosphere"><span className="control-label">THE LIGHT OUTSIDE</span><div className="segmented" role="group" aria-label="Time of day">{(['day', 'sunset', 'night'] as Atmosphere[]).map(a => <button key={a} className={a === atmosphere ? 'selected' : ''} aria-pressed={a === atmosphere} onClick={() => setAtmosphere(a)}><Icon name={a === 'day' ? 'sun' : a === 'night' ? 'moon' : 'sunset'} /><span>{a[0].toUpperCase() + a.slice(1)}</span></button>)}</div><button className={`rain-button ${rain ? 'active' : ''}`} aria-pressed={rain} onClick={() => setRain(value => !value)}><Icon name="rain" /><span>A little rain</span><span className="switch"><i /></span></button></div>
    <div key={seat ? place : atmosphere} className={`scene-caption ${seat ? 'seated' : ''}`} aria-live="polite"><span className="caption-line" />{seat ? <><strong>{seat.title}</strong><p>{seat.line}</p><button className="text-button" onClick={close}>Stand up</button></> : <p>{captions[atmosphere]}</p>}</div>
    <footer className="bottom-bar"><div className="orbit-hint"><span className="orbit-icon">↔</span>{inside ? <span>Drag to look<span className="hint-dot">·</span>Click the floor to walk</span> : <span>Drag to orbit<span className="hint-dot">·</span>Scroll to get closer</span>}</div><nav className="object-controls" aria-label="Room interactions"><button onClick={() => action('computer')} aria-label="Use computer"><Icon name="computer" /><span>Computer</span></button><button onClick={() => action('bed')} aria-label="Go to bed"><Icon name="bed" /><span>Bed</span></button><button onClick={() => action('lounge')} aria-label="Sit by the sea window"><Icon name="chair" /><span>Sea window</span></button><button onClick={() => action('tea')} aria-label="Explore tea room"><Icon name="tea" /><span>Tea room</span></button><button onClick={() => action('books')} aria-label="Explore library"><Icon name="books" /><span>Library</span></button><span className="toolbar-divider" /><button onClick={() => action('curtains')} aria-label={curtains ? 'Close curtains' : 'Open curtains'} aria-pressed={!curtains}><Icon name="curtains" /><span>{curtains ? 'Close curtains' : 'Open curtains'}</span></button><button onClick={() => action('lamp')} aria-label={lamp ? 'Turn off the lamps' : 'Turn on the lamps'} aria-pressed={lamp}><Icon name="lamp" /><span>Lamps {lamp ? 'on' : 'off'}</span></button><button onClick={() => action('television')} aria-label="Explore rolling television"><Icon name="television" /><span>TV</span></button><span className="toolbar-divider" /><button className="reset" onClick={goHome} aria-label="Return to the doorway"><Icon name="home" /></button></nav><span className="made-for">A SPACE TO SIMPLY BE</span></footer>
    {hover && !panelOpen && <div className="hover-label">{hover}</div>}
    {panelOpen && <aside ref={panel} tabIndex={-1} role="dialog" aria-modal="false" aria-labelledby="panel-title" className={`panel ${focus ? 'computer-panel' : ''}`}><button className="panel-close icon-button" aria-label="Return to room" onClick={focus ? close : closePanels}><Icon name="close" /></button>
      {help ? <><div className="panel-symbol"><Icon name="home" /></div><h2 id="panel-title">Make yourself at home.</h2><p>There’s nothing to finish here.</p><ul className="help-list"><li><strong>Look around</strong>Drag to turn your head. From outside, drag to orbit and scroll or pinch to zoom.</li><li><strong>Walk</strong>Click the floor or a stair to walk there, or use W A S D and the arrow keys. Scrolling takes a step forward.</li><li><strong>Settle in</strong>Click the desk, the bed, the chair by the sea window or the tea table to sit. Curtains, lamps, books and the television answer a click too, and every one has a button below.</li><li><strong>Set the mood</strong>Choose your light, or let a little rain fall.</li><li><strong>Come back</strong>Press Escape to stand up or close a panel. The home button returns you to the doorway.</li></ul><button className="primary-link" onClick={closePanels}>Let’s settle in<Icon name="arrow" /></button></>
        : books ? <><div className="panel-symbol"><Icon name="books" /></div><h2 id="panel-title">A life in books.</h2><p>A few pages. A different world.</p><div className="book-list">{home.books.map((b, i) => <a href={b.url} target="_blank" rel="noreferrer" key={b.title}><span className="book-spine" style={{ background: b.color }}>{String(i + 1).padStart(2, '0')}</span><span><strong>{b.title}</strong><small>{b.author}</small><p>{b.description}</p></span><Icon name="arrow" /></a>)}</div></>
          : television ? <><div className="panel-symbol"><Icon name="television" /></div><h2 id="panel-title">Screen on wheels.</h2><p>Roll it toward the bed for a slow evening, or park it beside the window.</p><button className="primary-link" onClick={() => setTvBesideBed(value => !value)}>{tvBesideBed ? 'Park beside the window' : 'Roll toward the bed'}<Icon name="arrow" /></button><button className="text-button" onClick={closePanels}>← Back to the room</button></>
            : <><div className="panel-symbol"><Icon name="computer" /></div><h2 id="panel-title">Hello, dreamer.</h2><p>{home.website.description}</p><a className="primary-link" href={home.website.url} target="_blank" rel="noreferrer">{home.website.title}<Icon name="arrow" /></a><p className="quiet-note">A desk for long games, late code, and a view of the sea.</p><button className="text-button" onClick={close}>← Stand up</button></>}
    </aside>}
    <span className="sr-only" role="status">{atmosphere} lighting. Curtains {curtains ? 'open' : 'closed'}. Lamps {lamp ? 'on' : 'off'}. Rain {rain ? 'on' : 'off'}. {inside ? seat ? seat.title : 'Standing in the room' : 'Viewing from outside'}.</span>
  </main>;
}
