// src/components/report/ReportV4View.tsx
// Render del informe v4 (Capa 1 determinista). Consume un ReportV4 (hero + secciones) y lo pinta con el
// rediseño aprobado (owner 2026-07, preview/redesign-informes-2026-07): nombre serif (Fraunces) coloreado
// por eje, dos orbes de vidrio vivos en el hero, "Su mezcla" = 4 orbes por %, espectros (motor/patrón),
// línea de tiempo (guía), paneles glass (palabras) y aire generoso con hairlines. El CONTENIDO no cambia:
// (i) InfoTip por sección, palabras por proporción y "Qué lo motiva" salen del data igual que antes.
// Componente presentacional puro (sin fetch): ReportPage decide cuándo usarlo (flag ?engine=v4 o sellado).
// i18n: toda etiqueta fija sale de COPY[report.lang] (group_titles, footer, ui) + REPORT_CHROME (chrome del
// render, fuera del engine/snapshot); el contenido ya viene en el idioma del informe. Default 'es'.
import React from 'react';
import type { ReportV4, ReportSection } from '../../lib/reportV4';
import type { Lang } from '../../lib/archetypeContentV4';
import { getArchetypeLabel } from '../../lib/archetypeContentV4';
import { COPY, fill, type Ui } from '../../lib/reportV4Copy';
import { SECTION_TIPS, REPORT_CHROME } from '../../lib/reportSectionTips';
import { InfoTip } from '../ui/Tooltip';
import { AXIS_COLORS } from '../../lib/designTokens';
import { useCardFade } from './useCardFade';
import { REPORT_REDESIGN_CSS } from './reportRedesignStyles';

/** Convierte `**negrita**` en <strong>. El resto va como texto. */
function renderRich(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    const m = part.match(/^\*\*([^*]+)\*\*$/);
    if (m) return <strong key={i}>{m[1]}</strong>;
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

// ── Vidrio de los orbes (mismas fórmulas que la maqueta: gen_preview.py orb_bg/orb_shadow) ──
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function orbBg(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  return `radial-gradient(circle at 36% 30%, rgba(255,255,255,.62), rgba(255,255,255,0) 48%),` +
    `radial-gradient(circle at 52% 55%, rgba(${r},${g},${b},.30), rgba(${r},${g},${b},.15) 62%, rgba(${r},${g},${b},.05) 100%)`;
}
function orbShadow(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  return `inset 0 0 0 1px rgba(${r},${g},${b},.16), inset 0 1px 12px rgba(255,255,255,.45), ` +
    `0 14px 38px -18px rgba(${r},${g},${b},.30)`;
}

// Agrupación de secciones. El título sale de COPY[lang].group_titles. Si un grupo queda vacío, no se muestra.
// (Se mantiene el orden con 'mal' y 'reset', propios del informe real, no de la galería de la maqueta.)
const GROUP_DEFS: { key: 'quien' | 'cancha' | 'acompanar' | 'masalla'; ids: string[] }[] = [
  { key: 'quien', ids: ['receta', 'contingencia', 'patron', 'motor'] },
  { key: 'cancha', ids: ['tormenta', 'grupo', 'logro', 'mal'] },
  { key: 'acompanar', ids: ['combustible', 'palabras', 'guia', 'reset'] },
  { key: 'masalla', ids: ['ecos'] },
];
// Secciones con punto de color "veta" (hablan del segundo eje / la contingencia). El resto, acento primario.
const VETA_DOT = new Set(['contingencia', 'tormenta']);
// Animación de cada orbe de "Su mezcla" (variedad orgánica, misma que la maqueta).
const MZ_MORPH: Record<string, string> = { D: 'argoOrbMorphA', I: 'argoOrbMorphB', S: 'argoOrbMorphA', C: 'argoOrbMorphB' };
const MZ_DUR: Record<string, string> = { D: '9s', I: '8s', S: '10.5s', C: '7.5s' };
// Tamaño (%) del orbe secundario del hero según la fuerza de la veta: destellos < tonos < veta.
const VETA_ORB_SIZE: Record<string, number> = { sin: 40, tentativa: 48, afirmada: 56 };

const SPARK = (
  <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true">
    <path d="M12 2l1.5 6.2L20 10l-6.5 1.8L12 18l-1.5-6.2L4 10l6.5-1.8z" />
  </svg>
);
const ORB_RING = (
  <svg className="orb-ring" viewBox="0 0 400 360" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <circle cx="232" cy="172" r="152" fill="none" stroke="#D4BCE8" strokeWidth="1" strokeDasharray="2 8" opacity="0.6" />
  </svg>
);

const Ejemplo: React.FC<{ text: string }> = ({ text }) => (
  <div className="ejemplo">{renderRich(text)}</div>
);

/** Header de sección: punto de eje + título + (i) InfoTip + hairline. */
function SectionHeader({ titulo, dotColor, tip }: { titulo: string; dotColor: string; tip?: string }) {
  return (
    <>
      <h2 className="sec-h">
        <span className="dot" style={{ background: dotColor }} />
        <span>{titulo}</span>
        {tip && <InfoTip text={tip} />}
      </h2>
      <div className="title-rule" />
    </>
  );
}

/** Espectro (hairline + mini-orbe que respira). Posición REAL de la señal; nunca contradice el texto. */
function Spectrum({ pos, left, right, accent }: { pos: number; left: string; right: string; accent: string }) {
  const p = Math.round(pos * 100);
  return (
    <div className="viz spectrum">
      <div className="sp-track">
        <span className="sp-fill" style={{ width: `${p}%`, background: `linear-gradient(90deg,transparent,${accent}44)` }} />
        <span className="sp-mark" style={{ left: `${p}%`, background: orbBg(accent), boxShadow: orbShadow(accent) }} />
      </div>
      <div className="sp-ends"><span>{left}</span><span>{right}</span></div>
    </div>
  );
}

function SectionCard({ section, accent, veta, ui, tip, spectrum }:
  { section: ReportSection; accent: string; veta: string; ui: Ui; tip?: string; spectrum?: { pos: number; left: string; right: string } }) {
  const dotColor = VETA_DOT.has(section.id) ? veta : accent;
  const header = <SectionHeader titulo={section.titulo} dotColor={dotColor} tip={tip} />;

  if (section.kind === 'texto' && section.bloque) {
    return (
      <section className="card">
        {header}
        {spectrum && <Spectrum pos={spectrum.pos} left={spectrum.left} right={spectrum.right} accent={accent} />}
        <p className="body">{renderRich(section.bloque.cuerpo)}</p>
        {section.bloque.ejemplo && <Ejemplo text={section.bloque.ejemplo} />}
      </section>
    );
  }

  if (section.kind === 'palabras' && section.palabras) {
    const conOrb = { background: orbBg(accent), boxShadow: orbShadow(accent) };
    const ruiOrb = { background: orbBg('#AEAEB2'), boxShadow: orbShadow('#AEAEB2') };
    return (
      <section className="card">
        {header}
        <div className="pw-grid">
          <div className="pw-panel" style={{ background: `${accent}0d`, borderColor: `${accent}2e` }}>
            <div className="pw-head">
              <span className="pw-orb" style={conOrb} />
              <span className="pw-label" style={{ color: accent }}>{ui.conectan}</span>
            </div>
            {section.palabras.puente.map((c, i) => (
              <div key={i} className="pw-line"><span className="pw-dot" style={{ background: accent }} /><span>{c}</span></div>
            ))}
          </div>
          <div className="pw-panel pw-rui">
            <div className="pw-head">
              <span className="pw-orb" style={ruiOrb} />
              <span className="pw-label pw-label-rui">{ui.ruido}</span>
            </div>
            {section.palabras.ruido.map((c, i) => (
              <div key={i} className="pw-line"><span className="pw-dot" style={{ background: '#C4C4CC' }} /><span>{c}</span></div>
            ))}
          </div>
        </div>
        <p className="pal-nota">{renderRich(section.palabras.nota)}</p>
      </section>
    );
  }

  if (section.kind === 'guia' && section.guia) {
    const steps: [string, string][] = [[ui.antes, section.guia.antes], [ui.durante, section.guia.durante], [ui.despues, section.guia.despues]];
    const node = { background: orbBg(accent), boxShadow: orbShadow(accent) };
    return (
      <section className="card">
        {header}
        <p className="guia-lead">{section.guia.lead}</p>
        <div className="tl">
          {steps.map(([when, txt]) => (
            <div key={when} className="tl-step">
              <span className="tl-node" style={node} />
              <div>
                <div className="tl-when" style={{ color: accent }}>{when}</div>
                <div className="tl-text">{renderRich(txt)}</div>
              </div>
            </div>
          ))}
        </div>
        <Ejemplo text={section.guia.ejemplo} />
      </section>
    );
  }
  return null;
}

/** "Su mezcla": 4 orbes por eje dimensionados por su %, con dot + nombre + % debajo; luego la prosa de receta. */
function MezclaCard({ section, mezcla, accent, lang, tip }:
  { section: ReportSection; mezcla: { axis: string; pct: number }[]; accent: string; lang: Lang; tip?: string }) {
  const MIN = 22, MAX = 96;
  return (
    <section className="card mz-card">
      <SectionHeader titulo={section.titulo} dotColor={accent} tip={tip} />
      <div className="mezcla">
        {mezcla.map(({ axis, pct }) => {
          const d = Math.round(MIN + (pct / 100) * (MAX - MIN));
          const col = AXIS_COLORS[axis] ?? '#86868B';
          return (
            <div key={axis} className="mz-col">
              <div className="mz-orb" style={{
                width: d, height: d, background: orbBg(col), boxShadow: orbShadow(col),
                animation: `${MZ_MORPH[axis] ?? 'argoOrbMorphA'} ${MZ_DUR[axis] ?? '9s'} ease-in-out infinite`,
              }} />
              <div className="mz-axis"><span className="mz-dot" style={{ background: col }} />{getArchetypeLabel(axis as never, lang)}</div>
              <div className="mz-pct" style={{ color: col }}>{pct}%</div>
            </div>
          );
        })}
      </div>
      {section.bloque && (
        <>
          <div className="mz-divider" />
          <p className="body mz-body">{renderRich(section.bloque.cuerpo)}</p>
          {section.bloque.ejemplo && <Ejemplo text={section.bloque.ejemplo} />}
        </>
      )}
    </section>
  );
}

export interface ReportV4ViewProps {
  report: ReportV4;
  edad?: number | null;
  deporte?: string | null;
  adulto?: string | null;   // "Adulto responsable" (como el informe legacy)
  fecha?: string | null;    // fecha ya formateada (ej. "07 de julio de 2026")
}

export const ReportV4View: React.FC<ReportV4ViewProps> = ({ report, edad, deporte, adulto, fecha }) => {
  const { hero } = report;
  const lang: Lang = report.lang ?? 'es';
  const pack = COPY[lang];
  const ui = pack.ui;
  const chrome = REPORT_CHROME[lang] ?? REPORT_CHROME.es;
  const accent = AXIS_COLORS[hero.ejePrimario] ?? '#955FB5';
  const veta = AXIS_COLORS[hero.ejeSecundario] ?? '#86868B';
  const tips = SECTION_TIPS[lang] ?? SECTION_TIPS.es;
  const byId = new Map(report.secciones.map((s) => [s.id, s]));
  const kidMeta = [hero.nombre, edad ? `${edad} ${ui.edad}` : null, deporte || null, fecha || null].filter(Boolean).join(' · ');

  // Footer: el título va en negrita; el resto (con **negritas** internas + ${n}) por renderRich.
  const footerFull = fill(pack.footer, { n: hero.nombre });
  const fdot = footerFull.indexOf('. ');
  const footerHead = fdot >= 0 ? footerFull.slice(0, fdot + 1) : footerFull;
  const footerRest = fdot >= 0 ? footerFull.slice(fdot + 2) : '';

  // Veta del H1: usa las piezas (hero.veta) para colorear. Si faltan (informes v4 viejos, generados
  // antes de que existieran las piezas: guardaron vetaLabel pero no hero.veta), la deriva de vetaLabel
  // para NO perder la veta en el render de blobs persistidos. Retrocompatible es/en/pt.
  const vetaDisplay = hero.veta
    ? hero.veta
    : (hero.vetaLabel
        ? { pre: /^\s*with a/i.test(hero.vetaLabel) ? 'with a' : /^\s*com veta/i.test(hero.vetaLabel) ? 'com veta' : 'con veta',
            word: hero.vetaLabel.replace(/^\s*(con veta|with a|com veta)\s+/i, '').replace(/\s+(lean|streak)\s*$/i, ''),
            post: /\s+lean\s*$/i.test(hero.vetaLabel) ? 'lean' : '' }
        : null);

  const levelWord = (hero.meter.labels[hero.meter.level - 1] ?? '').toLowerCase();
  const orbSize = VETA_ORB_SIZE[hero.vetaBanda] ?? 48;
  const fadeRef = useCardFade<HTMLDivElement>();

  return (
    <div ref={fadeRef} className="argo-report-v4 mx-auto max-w-[740px]">
      <style dangerouslySetInnerHTML={{ __html: REPORT_REDESIGN_CSS }} />

      {/* Hero premium: nombre serif + dos orbes de vidrio + pills flotantes + pastilla de confianza */}
      <div className="card hero-lux">
        <div className="hx-grid">
          <div className="hx-left">
            <div className="hx-meta">
              <div className="kidmeta">{kidMeta}</div>
              {adulto && <div className="adulto">{ui.adulto}: {adulto}</div>}
            </div>
            <p className="hx-eyebrow">{chrome.eyebrow}</p>
            <h1 className="hx-name">
              <span className="np" style={{ color: accent }}>{hero.primarioLabel}</span>
              {vetaDisplay && (
                <>
                  {' '}<span className="nc">{vetaDisplay.pre}</span>{' '}
                  <span className="nv" style={{ color: veta }}>{vetaDisplay.word}</span>
                  {vetaDisplay.post && <>{' '}<span className="nc">{vetaDisplay.post}</span></>}
                </>
              )}
            </h1>
            <p className="hx-lead">{renderRich(hero.lead)}</p>
            <div className="hx-conf">
              <span className="opill-spark">{SPARK}</span>
              {chrome.meterPrefix} {levelWord}
              <InfoTip text={chrome.meterTip} position="top" />
            </div>
          </div>
          <div className="hx-right">
            {ORB_RING}
            {vetaDisplay ? (
              <>
                <div className="orb orb-1" style={{ background: orbBg(accent), boxShadow: orbShadow(accent) }} />
                <div className="orb orb-2" style={{ width: `${orbSize}%`, background: orbBg(veta), boxShadow: orbShadow(veta) }} />
                <div className="opill opill-1"><span className="opill-dot" style={{ background: accent }} />{hero.primarioLabel}</div>
                <div className="opill opill-2"><span className="opill-dot" style={{ background: veta }} />{vetaDisplay.word}</div>
              </>
            ) : (
              <>
                <div className="orb orb-1 orb-solo" style={{ background: orbBg(accent), boxShadow: orbShadow(accent) }} />
                <div className="opill-solo"><span className="opill-dot" style={{ background: accent }} />{hero.primarioLabel}</div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Grupos de secciones (cards separadas por hairline delicado) */}
      {GROUP_DEFS.map((g) => {
        const secs = g.ids.map((id) => byId.get(id)).filter((s): s is ReportSection => !!s);
        if (secs.length === 0) return null;
        const title = fill(pack.group_titles[g.key], { n: hero.nombre });
        return (
          <div key={g.key} className="group">
            <div className="group-head"><div className="eyebrow">{title}</div></div>
            {secs.map((s, i) => {
              const spectrumLabels = (s.id === 'patron' || s.id === 'motor') ? chrome.spectrum[s.id] : null;
              const spectrum = s.spectrum && spectrumLabels ? { pos: s.spectrum.pos, left: spectrumLabels[0], right: spectrumLabels[1] } : undefined;
              const card = (s.id === 'receta' && hero.mezcla)
                ? <MezclaCard section={s} mezcla={hero.mezcla} accent={accent} lang={lang} tip={tips[s.id]} />
                : <SectionCard section={s} accent={accent} veta={veta} ui={ui} tip={tips[s.id]} spectrum={spectrum} />;
              return (
                <React.Fragment key={s.id}>
                  {i > 0 && <div className="sec-divider" />}
                  {card}
                </React.Fragment>
              );
            })}
          </div>
        );
      })}

      {/* Cómo leer (footer con los dos registros: potencial en la lectura, taxativo en la política) */}
      <div className="footer">
        <span className="footer-h">{footerHead}</span>{' '}
        {renderRich(footerRest)}
      </div>
    </div>
  );
};

export default ReportV4View;
