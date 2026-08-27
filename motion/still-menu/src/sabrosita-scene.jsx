/* La Sabrosita — steady TV menu board. Spanish 0-30s, English 30-60s. Renders from authored time T only. */
const { useComposition, Shot, animate, Easing, clamp } = window;
const { useTweaks, TweaksPanel, TweakSection, TweakToggle } = window;

const W = 1920, H = 1080;
const HALF = 30;

const C = {
  pink: '#F20A88',
  pinkDeep: '#C00A6E',
  purple: '#3B0B45',
  purpleDeep: '#25062C',
  panel: 'rgba(60,12,72,.72)',
  blue: '#1296DB',
  yellow: '#F5C21E',
  cream: '#FFFFFF',
};
const F = '"Noto Sans", sans-serif';

const ES = {
  h1: '¡HECHO CON', h2: 'SABOR!', sub: 'Para ti',
  badge1: 'TODO', badge2: 'NATURAL', badge3: 'SIN SABORES ARTIFICIALES',
  shake1: 'CRAZY', shake2: 'SHAKE',
  p1: { t1: 'HELADOS', t2: '& PALETAS', items: ['Banana Split', 'Choco Banana', 'Crazy Shake', 'Helado en Cono', 'Helado Chino', 'La Sabrosita', 'Paletas', 'Paletas Locas', 'Sandwich de Helado'] },
  p2: { t1: 'BEBIDAS', items: ['Aguas Frescas', 'Aguas Explosivas', 'Chamoyada', 'Frappe', 'Licuado', 'Mangonada', 'Michelaguas', 'Raspado', 'Sodas Exoticas'] },
  p3: { t: 'ANTOJITOS & PREPARADOS', cols: [['Diablitos', 'Elote', 'Elote Hot Cheetos', 'Esquimal', 'Esquite'], ['Esquite Hot Cheetos', 'Chicharron en Rueda', 'Chicharron Preparado', 'Marucha Loca'], ['Nachos', 'Platano Frito', 'Tostilocos', 'Tosti Esquite']] },
  p4: { t: 'POSTRES & DULCES', cols: [['Bionico', 'Bionico con Nieve', 'Bomba', 'Canasta', 'Churros', 'Coctel de Fruta'], ['Crepa', 'Crepa Dubai', 'Croissant', 'Fresas con Crema', 'Fresas Dubai', 'Fresas en Cajita'], ['Gelatina', 'Mango en Flor', 'Mini Pancakes', 'Mini Pancakes Dubai', 'Pastel Tres Leche', 'Waffle']] },
  foot: [
    [{ t: 'Diferentes sabores de ' }, { t: 'Aguas Frescas', k: 'y' }, { t: ' todos los días.' }],
    [{ t: 'Diferentes sabores de ' }, { t: 'helado', k: 'b' }, { t: ' todos los días.' }],
    [{ t: 'Todos nuestros sabores son ' }, { t: 'naturales', k: 'y' }, { t: '. Sin sabores artificiales.' }],
    [{ t: 'Personaliza tu helado con tus ' }, { t: 'sabores y toppings', k: 'y' }, { t: ' favoritos.' }],
  ],
};

const EN = {
  h1: 'MADE WITH', h2: 'FLAVOR!', sub: 'Just for you',
  badge1: 'ALL', badge2: 'NATURAL', badge3: 'NO ARTIFICIAL FLAVORS',
  shake1: 'CRAZY', shake2: 'SHAKE',
  p1: { t1: 'ICE CREAM', t2: '& PALETAS', items: ['Banana Split', 'Choco Banana', 'Crazy Shake', 'Ice Cream Cone', 'Chino Ice Cream', 'La Sabrosita', 'Paletas', 'Crazy Paletas', 'Ice Cream Sandwich'] },
  p2: { t1: 'DRINKS', items: ['Aguas Frescas', 'Aguas Explosivas', 'Chamoyada', 'Frappe', 'Licuado', 'Mangonada', 'Michelaguas', 'Raspado', 'Exotic Sodas'] },
  p3: { t: 'SNACKS & PREPARADOS', cols: [['Diablitos', 'Elote', 'Elote Hot Cheetos', 'Esquimal', 'Esquite'], ['Esquite Hot Cheetos', 'Chicharron en Rueda', 'Chicharron Preparado', 'Marucha Loca'], ['Nachos', 'Platano Frito', 'Tostilocos', 'Tosti Esquite']] },
  p4: { t: 'DESSERTS & SWEETS', cols: [['Bionico', 'Bionico with Ice Cream', 'Bomba', 'Canasta', 'Churros', 'Fruit Cocktail'], ['Crepa', 'Dubai Crepe', 'Croissant', 'Strawberries & Cream', 'Dubai Strawberries', 'Strawberries in a Cup'], ['Gelatina', 'Mango en Flor', 'Mini Pancakes', 'Dubai Mini Pancakes', 'Pastel Tres Leches', 'Waffle']] },
  foot: [
    [{ t: 'Different flavors of ' }, { t: 'Fresh Waters', k: 'y' }, { t: ' every day.' }],
    [{ t: 'Different ' }, { t: 'ice cream', k: 'b' }, { t: ' flavors every day.' }],
    [{ t: 'All of our flavors are ' }, { t: 'natural', k: 'y' }, { t: '. No artificial flavors.' }],
    [{ t: 'Customize your ice cream with your favorite ' }, { t: 'flavors', k: 'y' }, { t: ' and ' }, { t: 'toppings', k: 'y' }, { t: '.' }],
  ],
};

/* exactly three motion helpers */
const MOTION = {
  enter: (s, d) => animate({ from: 0, to: 1, start: s, end: s + (d || 0.7), ease: Easing.easeOutBack }),
  draw: (s, e) => animate({ from: 0, to: 1, start: s, end: e, ease: Easing.easeInOutCubic }),
  pop: (s, d) => animate({ from: 0, to: 1, start: s, end: s + (d || 0.4), ease: Easing.easeOutExpo }),
};
const mix = (t, a, b) => a + (b - a) * t;

function Backdrop({ T }) {
  const k = 1.03 + 0.022 * Math.sin(T * 0.11);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: C.purpleDeep }}>
      <div style={{
        position: 'absolute', left: '50%', top: '50%', width: W, height: H,
        transform: 'translate(-50%,-50%) scale(' + k.toFixed(4) + ')',
        background: 'radial-gradient(80% 90% at 12% 6%, ' + C.pink + 'CC 0%, transparent 58%),'
          + 'radial-gradient(70% 80% at 92% 8%, ' + C.pink + 'AA 0%, transparent 55%),'
          + 'radial-gradient(90% 70% at 50% 100%, #5A1268 0%, transparent 62%),'
          + 'linear-gradient(160deg, ' + C.purple + ' 0%, ' + C.purpleDeep + ' 55%, #2E0838 100%)',
      }} />
      <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 260px 70px rgba(0,0,0,.45)' }} />
    </div>
  );
}

function Sparkles({ T }) {
  const pts = [[588, 52, 26], [1104, 56, 22], [286, 268, 24], [244, 328, 14], [1288, 448, 18], [1614, 620, 20], [980, 566, 14], [1352, 176, 16], [700, 118, 18], [1176, 108, 16]];
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {pts.map((p, i) => {
        const a = 0.35 + 0.65 * Math.abs(Math.sin(T * 1.5 + i * 1.3));
        return (
          <div key={i} style={{
            position: 'absolute', left: p[0], top: p[1], width: p[2], height: p[2],
            marginLeft: -p[2] / 2, marginTop: -p[2] / 2, opacity: a,
            background: i % 3 === 0 ? C.yellow : C.cream,
            clipPath: 'polygon(50% 0,58% 42%,100% 50%,58% 58%,50% 100%,42% 58%,0 50%,42% 42%)',
            transform: 'rotate(' + (T * 18 + i * 30).toFixed(1) + 'deg)',
          }} />
        );
      })}
    </div>
  );
}

function Photo({ src, x, y, size, L, delay, i }) {
  const p = MOTION.enter(delay, 0.9)(L);
  const fl = Math.sin(L * 0.8 + i) * 8;
  return (
    <div style={{
      position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size,
      opacity: clamp(p, 0, 1),
      transform: 'translateY(' + (fl + (1 - p) * 60).toFixed(1) + 'px) scale(' + mix(clamp(p, 0, 1), 0.86, 1).toFixed(3) + ')',
    }}>
      <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 26px 34px rgba(12,2,16,.6))' }} />
    </div>
  );
}

function ListPanel({ copy, L, x, y, w, h, delay, accent }) {
  const p = MOTION.enter(delay, 0.75)(L);
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: w, minHeight: h,
      background: C.panel, border: '3px solid ' + accent, borderRadius: 28,
      padding: '22px 30px 24px', boxSizing: 'border-box',
      boxShadow: '0 24px 60px rgba(12,2,16,.45)',
      opacity: clamp(p, 0, 1),
      transform: 'translateY(' + ((1 - p) * 40).toFixed(1) + 'px) scale(' + mix(clamp(p, 0, 1), 0.97, 1).toFixed(3) + ')',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: F, fontWeight: 900, fontSize: 46, color: C.cream, letterSpacing: '-0.01em', lineHeight: 1 }}>{copy.t1}</span>
        {copy.t2 ? <span style={{ fontFamily: F, fontWeight: 900, fontSize: 46, color: C.blue, letterSpacing: '-0.01em', lineHeight: 1 }}>{copy.t2}</span> : null}
      </div>
      <div style={{ height: 5, background: C.blue, borderRadius: 4, marginTop: 14, width: mix(clamp(MOTION.draw(delay + 0.25, delay + 1.1)(L), 0, 1), 0, 100) + '%' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 14 }}>
        {copy.items.map((it, i) => {
          const a = clamp(MOTION.pop(delay + 0.35 + i * 0.05, 0.45)(L), 0, 1);
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, opacity: a, transform: 'translateX(' + ((1 - a) * -22).toFixed(1) + 'px)' }}>
              <span style={{ width: 11, height: 11, borderRadius: 999, background: C.blue, flexShrink: 0 }} />
              <span style={{ fontFamily: F, fontWeight: 700, fontSize: 28, color: C.cream, lineHeight: 1.1, whiteSpace: 'nowrap' }}>{it}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GridPanel({ copy, L, x, y, w, delay, accent, dot }) {
  const p = MOTION.enter(delay, 0.75)(L);
  let n = 0;
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: w,
      background: C.panel, border: '3px solid ' + accent, borderRadius: 24, overflow: 'hidden',
      boxShadow: '0 24px 60px rgba(12,2,16,.45)',
      opacity: clamp(p, 0, 1),
      transform: 'translateY(' + ((1 - p) * 46).toFixed(1) + 'px)',
    }}>
      <div style={{ background: accent, padding: '10px 24px 12px' }}>
        <span style={{ fontFamily: F, fontWeight: 900, fontSize: 34, color: C.cream, letterSpacing: '0.01em' }}>{copy.t}</span>
      </div>
      <div style={{ display: 'flex', gap: 22, padding: '16px 24px 18px' }}>
        {copy.cols.map((col, ci) => (
          <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
            {col.map((it, i) => {
              n += 1;
              const a = clamp(MOTION.pop(delay + 0.3 + n * 0.018, 0.4)(L), 0, 1);
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 13, opacity: a, transform: 'translateY(' + ((1 - a) * 12).toFixed(1) + 'px)' }}>
                  <span style={{ width: 9, height: 9, borderRadius: 999, background: dot, flexShrink: 0 }} />
                  <span style={{ fontFamily: F, fontWeight: 500, fontSize: 25, color: C.cream, lineHeight: 1.15, whiteSpace: 'nowrap' }}>{it}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function Footer({ copy, L, delay }) {
  const icons = [
    { bg: C.pink, d: 'M12 2c3 5 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 3-6 6-11z' },
    { bg: C.blue, d: 'M12 2a6 6 0 0 1 6 6c0 4-6 14-6 14S6 12 6 8a6 6 0 0 1 6-6z' },
    { bg: C.yellow, d: 'M4 20C10 20 20 12 20 4 12 4 4 12 4 20z' },
    { bg: C.pink, d: 'M12 21s-8-5.2-8-10.4A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8 3.6C20 15.8 12 21 12 21z' },
  ];
  const p = MOTION.enter(delay, 0.8)(L);
  const kc = { y: C.yellow, b: '#4FB6EC' };
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0, height: 108,
      background: 'linear-gradient(90deg, #4A1157 0%, #5C1569 50%, #4A1157 100%)',
      borderTop: '4px solid ' + C.pink,
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', alignItems: 'center',
      opacity: clamp(p, 0, 1), transform: 'translateY(' + ((1 - p) * 60).toFixed(1) + 'px)',
    }}>
      {copy.map((segs, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '0 26px', borderLeft: i ? '2px solid rgba(255,255,255,.18)' : 'none' }}>
          <span style={{
            width: 54, height: 54, borderRadius: 999, background: icons[i].bg, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: 'scale(' + (1 + 0.05 * Math.sin(L * 1.6 + i)).toFixed(3) + ')',
          }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill={i === 2 ? '#3B0B45' : C.cream}><path d={icons[i].d} /></svg>
          </span>
          <span style={{ fontFamily: F, fontWeight: 500, fontSize: 25, color: C.cream, lineHeight: 1.25 }}>
            {segs.map((s, j) => (
              <span key={j} style={{ color: s.k ? kc[s.k] : C.cream, fontWeight: s.k ? 800 : 500 }}>{s.t}</span>
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}

function Board({ copy, L, alpha }) {
  const a = clamp(alpha === undefined ? 1 : alpha, 0, 1);
  const hp = MOTION.enter(0.25, 0.9)(L);
  const bp = MOTION.enter(0.5, 0.9)(L);
  const lp = MOTION.enter(0.05, 0.8)(L);
  const cp = MOTION.enter(1.0, 0.7)(L);

  return (
    <div style={{ position: 'absolute', inset: 0, opacity: a, transform: 'scale(' + (1 - (1 - a) * 0.015).toFixed(4) + ')' }}>
      {/* logo blob */}
      <div style={{
        position: 'absolute', left: -70, top: -84, width: 560, height: 336,
        borderRadius: '0 0 260px 260px / 0 0 190px 190px', background: C.pink,
        opacity: clamp(lp, 0, 1), transform: 'scale(' + mix(clamp(lp, 0, 1), 0.9, 1).toFixed(3) + ')', transformOrigin: '30% 0%',
      }} />
      <div style={{
        position: 'absolute', left: 44, top: 20, width: 262,
        opacity: clamp(lp, 0, 1),
        transform: 'translateY(' + ((1 - lp) * -30).toFixed(1) + 'px) scale(' + (1 + 0.012 * Math.sin(L * 0.9)).toFixed(4) + ')',
      }}>
        <img src="assets/logo-official.png" alt="La Sabrosita" style={{ display: 'block', width: '100%' }} />
      </div>

      {/* headline */}
      <div style={{
        position: 'absolute', left: 660, top: 4, width: 600, textAlign: 'center',
        opacity: clamp(hp, 0, 1), transform: 'translateY(' + ((1 - hp) * -34).toFixed(1) + 'px)',
      }}>
        <div style={{ fontFamily: F, fontWeight: 900, fontSize: 46, color: C.cream, letterSpacing: '0.01em', lineHeight: 1.05 }}>{copy.h1}</div>
        <div style={{
          fontFamily: F, fontWeight: 900, fontSize: 92, color: C.pink, lineHeight: 1,
          letterSpacing: '-0.015em', marginTop: 2,
          WebkitTextStroke: '4px ' + C.cream,
          transform: 'scale(' + (1 + 0.014 * Math.sin(L * 1.1)).toFixed(4) + ')',
        }}>{copy.h2}</div>
        <div style={{ fontFamily: F, fontWeight: 700, fontStyle: 'italic', fontSize: 34, color: C.cream, marginTop: 4 }}>{copy.sub}</div>
      </div>

      {/* all natural badge */}
      <div style={{
        position: 'absolute', right: -34, top: 0, width: 400, height: 186,
        borderRadius: 999, background: C.pink, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', paddingRight: 40, boxSizing: 'border-box',
        opacity: clamp(bp, 0, 1), transform: 'scale(' + mix(clamp(bp, 0, 1), 0.85, 1).toFixed(3) + ') rotate(' + (Math.sin(L * 0.7) * 0.8).toFixed(2) + 'deg)',
      }}>
        <div style={{ fontFamily: F, fontWeight: 900, fontSize: 40, color: C.cream, lineHeight: 1.05 }}>{copy.badge1}</div>
        <div style={{ fontFamily: F, fontWeight: 900, fontSize: 46, color: C.yellow, lineHeight: 1.05 }}>{copy.badge2}</div>
        <div style={{ fontFamily: F, fontWeight: 800, fontSize: 22, color: C.cream, letterSpacing: '0.04em', marginTop: 6, textAlign: 'center', maxWidth: 300 }}>{copy.badge3}</div>
      </div>

      {/* hero photos */}
      <Photo src="assets/crazy-shakes.png" x={880} y={420} size={470} L={L} delay={0.6} i={0} />
      <Photo src="assets/chamoyada.png" x={1810} y={420} size={420} L={L} delay={0.9} i={1} />
      <Photo src="assets/coctel-fruta.png" x={112} y={430} size={400} L={L} delay={1.0} i={2} />
      <Photo src="assets/diablitos.png" x={1075} y={545} size={230} L={L} delay={1.2} i={3} />

      <ListPanel copy={copy.p1} L={L} x={336} y={146} w={430} h={460} delay={0.5} accent={C.pink} />
      <ListPanel copy={copy.p2} L={L} x={1190} y={146} w={420} h={460} delay={0.65} accent={C.pink} />

      {/* crazy shake circle */}
      <div style={{
        position: 'absolute', left: 1000, top: 250, width: 180, height: 180, borderRadius: 999,
        background: C.pink, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        opacity: clamp(cp, 0, 1),
        transform: 'scale(' + (mix(clamp(cp, 0, 1), 0.7, 1) * (1 + 0.02 * Math.sin(L * 1.9))).toFixed(3) + ')',
        boxShadow: '0 18px 40px rgba(12,2,16,.4)',
      }}>
        <div style={{ fontFamily: F, fontWeight: 900, fontSize: 30, color: C.cream, lineHeight: 1.05 }}>{copy.shake1}</div>
        <div style={{ fontFamily: F, fontWeight: 900, fontSize: 30, color: C.yellow, lineHeight: 1.05 }}>{copy.shake2}</div>
      </div>

      <GridPanel copy={copy.p3} L={L} x={40} y={628} w={780} delay={0.85} accent={C.pink} dot={C.pink} />
      <GridPanel copy={copy.p4} L={L} x={846} y={628} w={1010} delay={1.0} accent={C.blue} dot={C.blue} />

      <Footer copy={copy.foot} L={L} delay={1.2} />
    </div>
  );
}

function Piece() {
  const { T } = useComposition();
  const swap = clamp(MOTION.draw(HALF - 0.45, HALF + 0.45)(T), 0, 1);
  const [t, setTweak] = useTweaks(window.TWEAK_DEFAULTS || {});
  const showSparkles = t.showSparkles !== false;

  return (
    <div data-screen-label={T < HALF ? 'Español' : 'English'} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: C.purpleDeep }}>
      <Backdrop T={T} />
      {showSparkles ? <Sparkles T={T} /> : null}
      <Shot from={0} to={HALF + 0.4}><Board copy={ES} L={T} alpha={1 - swap} /></Shot>
      <Shot from={HALF - 1} to={HALF * 2 + 0.2}><Board copy={EN} L={T - HALF + 3} alpha={swap} /></Shot>
      <Shot from={0} to={1.7}><Board copy={EN} L={T + 33} alpha={1 - clamp(MOTION.draw(0.35, 1.25)(T), 0, 1)} /></Shot>
      <TweaksPanel>
        <TweakSection label="Board" />
        <TweakToggle label="Sparkles" value={showSparkles} onChange={(v) => setTweak('showSparkles', v)} />
        <TweakSection label="Editing" />
        <TweakToggle label="Motion editor" value={t.motionEditor !== false} onChange={(v) => setTweak('motionEditor', v)} />
      </TweaksPanel>
    </div>
  );
}

function SabrositaReel() {
  return (
    <window.CompositionStage width={W} height={H} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK} bg={C.purpleDeep}>
      <Piece />
    </window.CompositionStage>
  );
}

window.SabrositaReel = SabrositaReel;
