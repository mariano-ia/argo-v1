// src/components/report/ReportV4View.tsx
// Render del informe v4 (Capa 1 determinista). Consume un ReportV4 (hero + secciones) y lo pinta con
// el design system Argo, fiel a la maqueta aprobada (owner 2026-07-07): bloques desarrollados con
// **negritas** de lectura + un ejemplo que baja a tierra, por la positiva. Componente presentacional
// puro (sin fetch): ReportPage decide cuándo usarlo (flag ?engine=v4). Diseño: docs/METODO-FALLBACK-INFORME.md
// i18n: toda etiqueta fija sale de COPY[report.lang] (group_titles, footer, ui); el contenido ya viene
// en el idioma del informe. Default 'es' si el informe no trae lang (informes viejos).
import React from 'react';
import type { ReportV4, ReportSection } from '../../lib/reportV4';
import type { Lang } from '../../lib/archetypeContentV4';
import { COPY, fill, type Ui } from '../../lib/reportV4Copy';
import { AXIS_COLORS } from '../../lib/designTokens';

/** Convierte `**negrita**` en <strong>. El resto va como texto. */
function renderRich(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    const m = part.match(/^\*\*([^*]+)\*\*$/);
    if (m) return <strong key={i} className="font-semibold text-argo-navy">{m[1]}</strong>;
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

// Agrupación de secciones (misma que la maqueta). El título sale de COPY[lang].group_titles.
// Si un grupo queda vacío (secciones omitidas), no se muestra.
const GROUP_DEFS: { key: 'quien' | 'cancha' | 'acompanar' | 'masalla'; ids: string[] }[] = [
  { key: 'quien', ids: ['receta', 'contingencia', 'patron', 'motor'] },
  { key: 'cancha', ids: ['tormenta', 'grupo', 'logro'] },
  { key: 'acompanar', ids: ['combustible', 'palabras', 'guia', 'reset'] },
  { key: 'masalla', ids: ['ecos'] },
];
// Secciones con punto de color "veta" (hablan del segundo eje / la contingencia). El resto, acento primario.
const VETA_DOT = new Set(['contingencia', 'tormenta']);

const Ejemplo: React.FC<{ text: string; accent: string }> = ({ text, accent }) => (
  <div className="mt-3 rounded-r-[10px] bg-argo-bg px-4 py-2.5 text-sm leading-relaxed text-argo-secondary"
       style={{ borderLeft: `3px solid ${accent}` }}>
    {renderRich(text)}
  </div>
);

function SectionBlock({ section, accent, veta, ui }: { section: ReportSection; accent: string; veta: string; ui: Ui }) {
  const dotColor = VETA_DOT.has(section.id) ? veta : accent;
  const Header = (
    <h2 className="mb-2.5 flex items-center gap-2.5 text-sm font-bold tracking-tight text-argo-navy">
      <span className="h-2 w-2 flex-none rounded-full" style={{ background: dotColor }} />
      {section.titulo}
    </h2>
  );

  if (section.kind === 'texto' && section.bloque) {
    return (
      <section className="mt-3 rounded-[14px] border border-argo-border bg-white p-6 shadow-argo">
        {Header}
        <p className="text-[16.5px] leading-relaxed text-argo-secondary">{renderRich(section.bloque.cuerpo)}</p>
        {section.bloque.ejemplo && <Ejemplo text={section.bloque.ejemplo} accent={accent} />}
      </section>
    );
  }

  if (section.kind === 'palabras' && section.palabras) {
    return (
      <section className="mt-3 rounded-[14px] border border-argo-border bg-white p-6 shadow-argo">
        {Header}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wide text-green-700">{ui.conectan}</h3>
            {section.palabras.puente.map((c, i) => (
              <span key={i} className="mb-2 block rounded-[11px] bg-green-50 px-3 py-2 text-sm text-argo-navy">{c}</span>
            ))}
          </div>
          <div>
            <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wide text-argo-grey">{ui.ruido}</h3>
            {section.palabras.ruido.map((c, i) => (
              <span key={i} className="mb-2 block rounded-[11px] border border-argo-border bg-argo-bg px-3 py-2 text-sm text-argo-grey">{c}</span>
            ))}
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-argo-secondary">{renderRich(section.palabras.nota)}</p>
      </section>
    );
  }

  if (section.kind === 'guia' && section.guia) {
    const steps: [string, string][] = [[ui.antes, section.guia.antes], [ui.durante, section.guia.durante], [ui.despues, section.guia.despues]];
    return (
      <section className="mt-3 rounded-[14px] border border-argo-border bg-white p-6 shadow-argo">
        {Header}
        <p className="mb-1 text-[15px] text-argo-grey">{section.guia.lead}</p>
        <div className="flex flex-col">
          {steps.map(([label, txt], i) => (
            <div key={label} className={`grid grid-cols-[84px_1fr] gap-4 py-3.5 ${i > 0 ? 'border-t border-argo-border' : ''}`}>
              <div className="pt-0.5 text-[11px] font-extrabold uppercase tracking-wide" style={{ color: accent }}>{label}</div>
              <div className="text-[15.5px] leading-relaxed text-argo-secondary">{renderRich(txt)}</div>
            </div>
          ))}
        </div>
        <Ejemplo text={section.guia.ejemplo} accent={accent} />
      </section>
    );
  }
  return null;
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
  const accent = AXIS_COLORS[hero.ejePrimario] ?? '#955FB5';
  const veta = AXIS_COLORS[hero.ejeSecundario] ?? '#86868B';
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

  return (
    <div className="mx-auto max-w-[760px]">
      {/* Hero */}
      <div className="rounded-[20px] border border-argo-border bg-white p-8 shadow-argo-hover">
        <div className="mb-4">
          <div className="text-[13px] font-semibold tracking-wide text-argo-grey">{kidMeta}</div>
          {adulto && <div className="mt-0.5 text-[12px] text-argo-light">{ui.adulto}: {adulto}</div>}
        </div>
        <h1 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
          <span style={{ color: accent }}>{hero.primarioLabel}</span>
          {vetaDisplay && (
            <>
              {' '}<span className="font-normal text-argo-grey">{vetaDisplay.pre}</span>{' '}
              <span style={{ color: veta }}>{vetaDisplay.word}</span>
              {vetaDisplay.post && <>{' '}<span className="font-normal text-argo-grey">{vetaDisplay.post}</span></>}
            </>
          )}
        </h1>

        {/* Medidor de confianza */}
        <div className="my-5">
          <div className="mb-2 flex items-baseline justify-between text-xs font-semibold text-argo-grey">
            <span>{ui.meter_header}</span>
            <span className="text-[11px] uppercase tracking-wider" style={{ color: accent }}>{hero.meter.labels[hero.meter.level - 1]}</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {hero.meter.labels.map((_, i) => (
              <div key={i} className="h-[7px] rounded-full"
                   style={{ background: i < hero.meter.level ? accent : '#EFEFF2', opacity: i < hero.meter.level ? 0.5 + 0.5 * (i + 1) / hero.meter.level : 1 }} />
            ))}
          </div>
          <div className="mt-1.5 grid grid-cols-4 gap-1.5 text-[10.5px] text-argo-grey">
            {hero.meter.labels.map((l, i) => (
              <div key={l} className={i === hero.meter.level - 1 ? 'font-bold' : ''} style={i === hero.meter.level - 1 ? { color: accent } : undefined}>{l}</div>
            ))}
          </div>
        </div>

        <p className="text-lg leading-snug text-argo-secondary">{renderRich(hero.lead)}</p>
      </div>

      {/* Grupos de secciones */}
      {GROUP_DEFS.map((g) => {
        const secs = g.ids.map((id) => byId.get(id)).filter((s): s is ReportSection => !!s);
        if (secs.length === 0) return null;
        const title = fill(pack.group_titles[g.key], { n: hero.nombre });
        return (
          <div key={g.key}>
            <div className="mb-1 mt-9 px-1">
              <div className="text-[11px] font-bold uppercase tracking-widest text-argo-grey">{title}</div>
              <div className="mt-3 h-px bg-argo-border" />
            </div>
            {secs.map((s) => <SectionBlock key={s.id} section={s} accent={accent} veta={veta} ui={ui} />)}
          </div>
        );
      })}

      {/* Cómo leer (footer con los dos registros: potencial en la lectura, taxativo en la política) */}
      <div className="mt-7 rounded-[14px] border border-dashed border-argo-border px-6 py-5 text-sm leading-relaxed text-argo-secondary">
        <span className="font-semibold text-argo-navy">{footerHead}</span>{' '}
        {renderRich(footerRest)}
      </div>
    </div>
  );
};

export default ReportV4View;
