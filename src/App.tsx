import { Component, Fragment, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { NeutralToneMapping } from 'three';
import { home, type Atmosphere, type PlaceId, type Position } from './config';
import { loftFloor } from './walk';
import { ambience } from './audio';
import { Room, type Action, type View } from './Room';
import { interaction, interactions, seatOf, words } from './room/interactions';
import type { WalkTarget } from './Presence';

// Geometry and light live in src/room/; this file is the page around the room.
const captions: Record<Atmosphere, string> = {
  day: 'An open horizon. A little room for thought.',
  sunset: 'One more golden moment before the day slips away.',
  night: 'The world is asleep. Keep a little light on.',
};
const groups = ['places', 'things'] as const;

// How the room was left last time. Storage can be unavailable or full, and a private window can
// refuse it outright, so every touch of it is guarded and the room simply opens at its defaults.
const STORE = 'dream-home';
type Remembered = { atmosphere?: Atmosphere; lamp?: boolean; curtains?: boolean };
const remembered: Remembered = (() => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || '{}') as Remembered;
    return {
      atmosphere: (['day', 'sunset', 'night'] as string[]).includes(saved.atmosphere ?? '') ? saved.atmosphere : undefined,
      lamp: typeof saved.lamp === 'boolean' ? saved.lamp : undefined,
      curtains: typeof saved.curtains === 'boolean' ? saved.curtains : undefined,
    };
  } catch { return {}; }
})();

function Icon({ name }: { name: string }) {
  if (name === 'bed') return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 19V8m18 11V8M3 12h18v5H3zM5 12V9h6v3m2 0V9h6v3M3 19v2m18-2v2" /></svg>;
  const paths: Record<string, ReactNode> = {
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></>,
    sunset: <><path d="M3 16h18M5 20h14M7 13a5 5 0 0 1 10 0M12 3v3M3 8l2 2m14 0 2-2" /></>,
    moon: <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z" />,
    rain: <><path d="M6 14a4 4 0 0 1-.5-8A6 6 0 0 1 17 6a4 4 0 0 1 1 8M7 17l-1 3m6-3-1 3m6-3-1 3" /></>,
    home: <><path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8" /></>,
    computer: <><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8m-4-4v4" /></>,
    chair: <><path d="M7 11V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v5M5 11a2 2 0 0 1 2 2v2h10v-2a2 2 0 1 1 4 0v5H3v-5a2 2 0 0 1 2-2Zm1 7v2m12-2v2" /></>,
    lamp: <><path d="m8 3-4 9h16l-4-9ZM12 12v9m-5 0h10" /></>,
    curtains: <><path d="M3 3h18M5 4v16l5-3V4m9 0v16l-5-3V4" /></>,
    books: <><path d="M4 4h4v16H4Zm6 0h4v16h-4Zm6 1 3-1 3 15-3 1Z" /></>,
    tea: <><path d="M3 10h15v5a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5v-5Zm15 1h2a2 2 0 0 1 0 4h-2M8 3v3m5-3v3" /></>,
    television: <><rect x="3" y="3" width="18" height="14" rx="1" /><path d="M8 21h8m-4-4v4" /></>,
    drawer: <><rect x="3" y="4" width="18" height="16" rx="1" /><path d="M3 12h18M10 8h4m-4 8h4" /></>,
    window: <><rect x="4" y="3" width="16" height="16" rx="1" /><path d="M12 3v16M4 11h16M3 21h18" /></>,
    music: <><circle cx="6" cy="18" r="2.6" /><circle cx="18" cy="16" r="2.6" /><path d="M8.6 18V6l11.4-2v12" /></>,
    mirror: <><ellipse cx="12" cy="10" rx="6.5" ry="7.5" /><path d="M8 21h8m-4-3.5V21" /></>,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1.5 1-1.5 1-1.5 3m0 3v.1" /></>,
  };
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.home}</svg>;
}

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed
      ? <div className="scene-error"><h2>The room couldn’t open</h2><p>This room needs WebGL. Try a browser with hardware acceleration enabled.</p><button onClick={() => location.reload()}>Try again</button></div>
      : this.props.children;
  }
}

export default function App() {
  const [atmosphere, setAtmosphere] = useState<Atmosphere>(remembered.atmosphere ?? 'day'), [curtains, setCurtains] = useState(remembered.curtains ?? true), [lamp, setLamp] = useState(remembered.lamp ?? true), [rain, setRain] = useState(false);
  const [view, setView] = useState<View>('inside'), [place, setPlace] = useState<PlaceId | null>(null), [placeKey, setPlaceKey] = useState(0), [walkTarget, setWalkTarget] = useState<WalkTarget | null>(null), [settled, setSettled] = useState(false);
  const [books, setBooks] = useState(false), [television, setTelevision] = useState(false), [tvBesideBed, setTvBesideBed] = useState(true), [help, setHelp] = useState(false), [hover, setHover] = useState(''), [reset, setReset] = useState(0);
  const [drawers, setDrawers] = useState(false), [sash, setSash] = useState(false), [music, setMusic] = useState(false), [poured, setPoured] = useState(0), [meteor, setMeteor] = useState(0), [bookmark, setBookmark] = useState<number | null>(null);
  const [visible, setVisible] = useState(!document.hidden), [reduced, setReduced] = useState(matchMedia('(prefers-reduced-motion: reduce)').matches);
  const panel = useRef<HTMLElement>(null), trigger = useRef<HTMLElement | null>(null), veil = useRef<HTMLDivElement>(null);
  const inside = view === 'inside', focus = inside && place === 'computer', seat = inside && place ? seatOf(place) : undefined, panelOpen = focus || books || television || help;
  const ui = { curtains, lamp, drawers, sash, music };
  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const motion = () => setReduced(media.matches);
    document.addEventListener('visibilitychange', update);
    media.addEventListener('change', motion);
    return () => { document.removeEventListener('visibilitychange', update); media.removeEventListener('change', motion); document.body.style.cursor = ''; };
  }, []);
  // Leave the room as it was found next time.
  useEffect(() => {
    try { localStorage.setItem(STORE, JSON.stringify({ atmosphere, lamp, curtains })); } catch { /* nothing to remember with */ }
  }, [atmosphere, lamp, curtains]);
  useEffect(() => { ambience(music); }, [music]);
  useEffect(() => () => { ambience(false); }, []);

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

  /** One path for every clickable thing, in the room or on the toolbar. What each one does is in the registry. */
  const action = (id: Action) => {
    const entry = interaction(id);
    setHover('');
    if (entry.toggle === 'curtains') return setCurtains(value => !value);
    if (entry.toggle === 'lamp') return setLamp(value => !value);
    if (entry.toggle === 'drawers') return setDrawers(value => !value);
    if (entry.toggle === 'music') return setMusic(value => !value);
    if (entry.toggle === 'sash') {
      const opening = !sash;
      setSash(opening);
      if (opening && atmosphere === 'night') setMeteor(count => count + 1);   // worth looking up for
      return;
    }
    if (entry.pulse === 'pour') return setPoured(count => count + 1);
    closePanels();
    if (entry.panel === 'books') { setBookmark(null); setBooks(true); }
    if (entry.panel === 'television') setTelevision(true);
    if (entry.place) goTo(entry.place);
  };
  /** A spine taken off the shelf opens the library at that title, without moving the visitor. */
  const openBook = (index: number) => {
    setHover(''); closePanels();
    setBookmark(index % home.books.length);
    setBooks(true);
  };
  const walkTo = ([x, y, z]: Position) => {
    closePanels(); setView('inside'); setPlace(null); setSettled(true);
    setWalkTarget({ x, z, y: y > loftFloor - .4 ? loftFloor : y, key: Date.now() });
  };
  const changeView = (next: View) => { closePanels(); setView(next); setReset(value => value + 1); if (next === 'inside') setSettled(true); };

  return <main className={`app ${atmosphere} ${inside ? 'inside' : 'outside'} ${focus ? 'focused' : ''} ${inside && settled ? 'settled' : ''}`}>
    <div className="scene" aria-label="Interactive 3D seaside loft with gaming space, bed, reading chair and tea room. Use the controls below to move through and interact with the room.">
      <SceneBoundary>
        <Suspense fallback={<div className="loading">Making room for you…</div>}>
          <Canvas shadows dpr={[1, 1.5]} frameloop={!visible ? 'never' : rain && !reduced ? 'always' : 'demand'} camera={{ position: home.places.entry.eye, fov: 62, near: .1, far: 260 }} gl={{ antialias: true, powerPreference: 'low-power', toneMapping: NeutralToneMapping }}>
            <Room atmosphere={atmosphere} curtains={curtains} lamp={lamp} focus={focus} view={view} place={place} placeKey={placeKey} walkTarget={walkTarget} rain={rain} reduced={reduced} tvBesideBed={tvBesideBed} reset={reset} veil={veil} drawers={drawers} sash={sash} music={music} poured={poured} meteor={meteor} onAction={action} onHover={setHover} onWalk={walkTo} onBook={openBook} onEngage={() => setSettled(true)} onWander={() => setPlace(null)} />
          </Canvas>
        </Suspense>
      </SceneBoundary>
      <div className="veil" ref={veil} />
    </div>
    <div className="scrim" aria-hidden="true" />

    <header className="masthead">
      <a className="brand" href="#" onClick={e => { e.preventDefault(); goHome(); }}><span className="brand-mark"><Icon name="home" /></span>dream home<span className="brand-dot">.</span></a>
      <span className="edition">YOUR LITTLE PLACE IN THE WORLD</span>
      <button className="icon-button help-button" aria-label="How to explore" onClick={() => { closePanels(); setHelp(true); }}><Icon name="help" /></button>
    </header>

    <div className="intro">
      <h1>Room for<br />a slower tide.</h1>
      <p>Leave the busy world outside.<br />Make yourself at home.</p>
      <div className="room-label"><span />THE TIDELINE LOFT</div>
    </div>

    <div className="view-switch" role="group" aria-label="Room viewpoint">
      {([['inside', 'Inside'], ['front', 'Open front'], ['overview', 'From above']] as [View, string][]).map(([name, label]) =>
        <button key={name} aria-pressed={view === name} onClick={() => changeView(name)}>{label}</button>)}
    </div>

    <div className="atmosphere">
      <span className="control-label">THE LIGHT OUTSIDE</span>
      <div className="segmented" role="group" aria-label="Time of day">
        {(['day', 'sunset', 'night'] as Atmosphere[]).map(a =>
          <button key={a} className={a === atmosphere ? 'selected' : ''} aria-pressed={a === atmosphere} onClick={() => setAtmosphere(a)}>
            <Icon name={a === 'day' ? 'sun' : a === 'night' ? 'moon' : 'sunset'} /><span>{a[0].toUpperCase() + a.slice(1)}</span>
          </button>)}
      </div>
      <button className={`rain-button ${rain ? 'active' : ''}`} aria-pressed={rain} onClick={() => setRain(value => !value)}>
        <Icon name="rain" /><span>A little rain</span><span className="switch"><i /></span>
      </button>
    </div>

    <div key={seat ? place : atmosphere} className={`scene-caption ${seat ? 'seated' : ''}`} aria-live="polite">
      <span className="caption-line" />
      {seat ? <><strong>{seat.title}</strong><p>{seat.line}</p><button className="text-button" onClick={close}>Stand up</button></> : <p>{captions[atmosphere]}</p>}
    </div>

    <footer className="bottom-bar">
      <div className="orbit-hint">
        <span className="orbit-icon">↔</span>
        {inside ? <span>Drag to look<span className="hint-dot">·</span>Click the floor to walk</span> : <span>Drag to orbit<span className="hint-dot">·</span>Scroll to get closer</span>}
      </div>
      <nav className="object-controls" aria-label="Room interactions">
        {groups.map((group, i) => <Fragment key={group}>
          {i > 0 && <span className="toolbar-divider" />}
          {interactions.filter(entry => entry.group === group).map(entry =>
            <button key={entry.id} onClick={() => action(entry.id)} aria-label={words(entry.aria, ui)} aria-pressed={entry.pressed?.(ui)}>
              <Icon name={entry.icon} /><span>{words(entry.label, ui)}</span>
            </button>)}
        </Fragment>)}
        <span className="toolbar-divider" />
        <button className="reset" onClick={goHome} aria-label="Return to the doorway"><Icon name="home" /></button>
      </nav>
      <span className="made-for">A SPACE TO SIMPLY BE</span>
    </footer>

    {hover && !panelOpen && <div className="hover-label">{hover}</div>}

    {panelOpen && <aside ref={panel} tabIndex={-1} role="dialog" aria-modal="false" aria-labelledby="panel-title" className={`panel ${focus ? 'computer-panel' : ''}`}>
      <button className="panel-close icon-button" aria-label="Return to room" onClick={focus ? close : closePanels}><Icon name="close" /></button>
      {help ? <>
        <div className="panel-symbol"><Icon name="home" /></div>
        <h2 id="panel-title">Make yourself at home.</h2>
        <p>There’s nothing to finish here.</p>
        <ul className="help-list">
          <li><strong>Look around</strong>Drag to turn your head. From outside, drag to orbit and scroll or pinch to zoom.</li>
          <li><strong>Walk</strong>Click the floor or a stair to walk there, or use W A S D and the arrow keys. Scrolling takes a step forward.</li>
          <li><strong>Settle in</strong>Click the desk, the bed, the chair by the sea window or the tea table to sit. The curtains, the lamps, the dresser, the window and the television answer a click too, and every one has a button below.</li>
          <li><strong>Small things</strong>Tip the teapot to pour a cup. Take a book off a shelf to read about it. Curl up on the bench in the window. Try the coat and the sun hat on at the mirror. Put a record on for the sound of the water. The stove keeps burning either way.</li>
          <li><strong>Set the mood</strong>Choose your light, or let a little rain fall. Open the window after dark and keep an eye on the sky.</li>
          <li><strong>Come back</strong>Press Escape to stand up or close a panel. The home button returns you to the doorway.</li>
        </ul>
        <button className="primary-link" onClick={closePanels}>Let’s settle in<Icon name="arrow" /></button>
      </> : books ? <>
        <div className="panel-symbol"><Icon name="books" /></div>
        <h2 id="panel-title">A life in books.</h2>
        <p>{bookmark === null ? 'A few pages. A different world.' : 'You took one down off the shelf.'}</p>
        <div className="book-list">
          {home.books.map((b, i) => <a className={bookmark === i ? 'marked' : ''} href={b.url} target="_blank" rel="noreferrer" key={b.title}>
            <span className="book-spine" style={{ background: b.color }}>{String(i + 1).padStart(2, '0')}</span>
            <span><strong>{b.title}</strong><small>{b.author}</small><p>{b.description}</p></span>
            <Icon name="arrow" />
          </a>)}
        </div>
      </> : television ? <>
        <div className="panel-symbol"><Icon name="television" /></div>
        <h2 id="panel-title">Screen on wheels.</h2>
        <p>Roll it toward the bed for a slow evening, or park it beside the window.</p>
        <button className="primary-link" onClick={() => setTvBesideBed(value => !value)}>{tvBesideBed ? 'Park beside the window' : 'Roll toward the bed'}<Icon name="arrow" /></button>
        <button className="text-button" onClick={closePanels}>← Back to the room</button>
      </> : <>
        <div className="panel-symbol"><Icon name="computer" /></div>
        <h2 id="panel-title">Hello, dreamer.</h2>
        <p>{home.website.description}</p>
        <a className="primary-link" href={home.website.url} target="_blank" rel="noreferrer">{home.website.title}<Icon name="arrow" /></a>
        <p className="quiet-note">A desk for long games, late code, and a view of the sea.</p>
        <button className="text-button" onClick={close}>← Stand up</button>
      </>}
    </aside>}

    <span className="sr-only" role="status">{atmosphere} lighting. Curtains {curtains ? 'open' : 'closed'}. Lamps {lamp ? 'on' : 'off'}. Rain {rain ? 'on' : 'off'}. {inside ? seat ? seat.title : 'Standing in the room' : 'Viewing from outside'}.</span>
  </main>;
}
