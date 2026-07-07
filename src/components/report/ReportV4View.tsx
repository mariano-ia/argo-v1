// src/components/report/ReportV4View.tsx
// Render del informe v4 (Capa 1 determinista). Consume un ReportV4 (hero + secciones) y lo pinta con
// el design system Argo, fiel a la maqueta aprobada (owner 2026-07-07): bloques desarrollados con
// **negritas** de lectura + un ejemplo que baja a tierra, por la positiva. Componente presentacional
// puro (sin fetch): ReportPage decide cuándo usarlo (flag ?engine=v4). Diseño: docs/METODO-FALLBACK-INFORME.md
import React from 'react';
import type { ReportV4, ReportSection } from '../../lib/reportV4';
import { AXIS_COLORS } from '../../lib/designTokens';

/** Convierte `**negrita**` en <strong>. El resto va como texto. */
function renderRich(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    const m = part.match(/^\*\*([^*]+)\*\*$/);
    if (m) return <strong key={i} className="font-semibold text-argo-navy">{m[1]}</strong>;
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

// Agrupación de secciones (misma que la maqueta). Si un grupo queda vacío (secciones omitidas), no se muestra.
const GROUPS: { title: (nombre: string) => string; ids: string[] }[] = [
  { title: (n) => `Quién es ${n} hoy`, ids: ['receta', 'contingencia', 'patron', 'motor'] },
  { title: () => 'Cómo se le ve en la actividad', ids: ['tormenta', 'grupo', 'logro'] },
  { title: (n) => `Cómo acompañar a ${n}`, ids: ['combustible', 'palabras', 'guia', 'reset'] },
  { title: () => 'Más allá del deporte', ids: ['ecos'] },
];
// Secciones con punto de color "veta" (hablan del segundo eje / la contingencia). El resto, acento primario.
const VETA_DOT = new Set(['contingencia', 'tormenta']);

const Ejemplo: React.FC<{ text: string; accent: string }> = ({ text, accent }) => (
  <div className="mt-3 rounded-r-[10px] bg-argo-bg px-4 py-2.5 text-sm leading-relaxed text-argo-secondary"
       style={{ borderLeft: `3px solid ${accent}` }}>
    {renderRich(text)}
  </div>
);

function SectionBlock({ section, accent, veta }: { section: ReportSection; accent: string; veta: string }) {
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
            <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wide text-green-700">Conectan</h3>
            {section.palabras.puente.map((c, i) => (
              <span key={i} className="mb-2 block rounded-[11px] bg-green-50 px-3 py-2 text-sm text-argo-navy">{c}</span>
            ))}
          </div>
          <div>
            <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wide text-argo-grey">Hacen ruido</h3>
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
    const steps: [string, string][] = [['Antes', section.guia.antes], ['Durante', section.guia.durante], ['Después', section.guia.despues]];
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
  const accent = AXIS_COLORS[hero.ejePrimario] ?? '#955FB5';
  const veta = AXIS_COLORS[hero.ejeSecundario] ?? '#86868B';
  const byId = new Map(report.secciones.map((s) => [s.id, s]));
  const kidMeta = [hero.nombre, edad ? `${edad} años` : null, deporte || null, fecha || null].filter(Boolean).join(' · ');

  return (
    <div className="mx-auto max-w-[760px]">
      {/* Hero */}
      <div className="rounded-[20px] border border-argo-border bg-white p-8 shadow-argo-hover">
        <div className="mb-4">
          <div className="text-[13px] font-semibold tracking-wide text-argo-grey">{kidMeta}</div>
          {adulto && <div className="mt-0.5 text-[12px] text-argo-light">Adulto responsable: {adulto}</div>}
        </div>
        <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          <span style={{ color: accent }}>{hero.primarioLabel}</span>
          {hero.vetaLabel && (
            <>
              {' '}<span className="font-normal text-argo-grey">con veta</span>{' '}
              <span style={{ color: veta }}>{hero.vetaLabel.replace(/^con veta\s+/i, '')}</span>
            </>
          )}
        </h1>

        {/* Medidor de confianza */}
        <div className="my-5">
          <div className="mb-2 flex items-baseline justify-between text-xs font-semibold text-argo-grey">
            <span>Qué tan marcado está su perfil hoy</span>
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
      {GROUPS.map((g) => {
        const secs = g.ids.map((id) => byId.get(id)).filter((s): s is ReportSection => !!s);
        if (secs.length === 0) return null;
        return (
          <div key={g.title(hero.nombre)}>
            <div className="mb-1 mt-9 px-1">
              <div className="text-[11px] font-bold uppercase tracking-widest text-argo-grey">{g.title(hero.nombre)}</div>
              <div className="mt-3 h-px bg-argo-border" />
            </div>
            {secs.map((s) => <SectionBlock key={s.id} section={s} accent={accent} veta={veta} />)}
          </div>
        );
      })}

      {/* Cómo leer (footer con los dos registros: potencial en la lectura, taxativo en la política) */}
      <div className="mt-7 rounded-[14px] border border-dashed border-argo-border px-6 py-5 text-sm leading-relaxed text-argo-secondary">
        <span className="font-semibold text-argo-navy">Cómo leer este informe.</span>{' '}
        Describe <span className="font-semibold text-argo-navy">cómo tiende a elegir {hero.nombre} hoy</span>, no lo que es
        ni lo que podrá llegar a hacer: es una foto de sus preferencias en este momento, no una etiqueta. Los perfiles
        cambian con la edad y la experiencia, <span className="font-semibold text-argo-navy">por eso recomendamos volver
        a perfilar a los niños cada 6 meses</span>. El deporte solo cambia el marco para reconocer el perfil; lo que se
        mide es lo mismo en cualquier actividad.
      </div>
    </div>
  );
};

export default ReportV4View;
