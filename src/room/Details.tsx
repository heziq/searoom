import { home } from '../config';
import { Grounding, Plant, Rug, Soft } from './primitives';

/** Rugs, plants and the small traces of someone living here, plus the soft shade under every piece. */
export function Details() {
  const { bed, desk, readingChair, gamingChair, loungeShelf, ottoman, lowerShelf } = home.furniture;
  return <>
    <Rug name="bed" p={[bed[0], .03, bed[2] + .45]} s={[5.2, 5.5]} style={{ ground: '#e6decd', line: 'rgba(111,154,171,.5)', border: '#a9bcc0' }} />
    <Rug name="desk" p={[desk[0] - .8, .03, desk[2]]} s={[3.65, 4.3]} style={{ ground: '#93adb8', line: 'rgba(236,229,214,.5)', border: '#dfe5e2' }} />
    <Rug name="entry" p={[-1.5, .03, 3.5]} s={[1.5, 2.8]} style={{ ground: '#ddd3c0', line: 'rgba(185,116,88,.5)', border: '#b9a58a' }} />
    <Rug name="lounge" round p={[readingChair[0] + .05, .03, readingChair[2]]} s={[2.1, 2.1]} style={{ ground: '#cdb994', line: '', border: 'rgba(120,92,60,.5)' }} />
    <Plant p={home.furniture.plant} scale={1.23} kind="tall" />
    <Plant p={[.48, 0, -5.38]} scale={.85} kind="fern" />
    {/* Slippers by the bed. */}
    {[0, 1].map(i => <Soft key={i} p={[7.42 + i * .22, .07, -2.75 + i * .05]} s={[.17, .09, .42]} c="#cdbfa8" rotation={[0, .12 - i * .2, 0]} />)}
    <Grounding p={[bed[0], .045, bed[2] + .1]} s={[5.3, 6.1]} /><Grounding p={[desk[0], .045, desk[2]]} s={[3.6, 5.2]} o={.5} /><Grounding p={[gamingChair[0], .046, gamingChair[2]]} s={[1.8, 1.8]} />
    <Grounding p={[readingChair[0], .046, readingChair[2]]} s={[2.5, 2.5]} /><Grounding p={[ottoman[0], .046, ottoman[2]]} s={[1.5, 1.5]} />
    <Grounding p={[loungeShelf[0], .02, loungeShelf[2]]} s={[1.3, 3.5]} /><Grounding p={[8.2, .046, -5.05]} s={[1.3, 1.3]} /><Grounding p={[.48, .02, -5.38]} s={[1.1, 1.1]} />
    <Grounding p={[lowerShelf[0], .02, lowerShelf[2]]} s={[1.1, 4.6]} o={.5} />
  </>;
}
