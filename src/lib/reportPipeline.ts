// src/lib/reportPipeline.ts
// El orquestador del informe v4 (opción 1, owner 2026-07-07): Capa 1 (determinista, aprobada) es el PISO
// que sale por defecto; la Capa 2 (IA, variación grounded) es un pulido OPCIONAL detrás del MISMO gate.
// Regla: si la Capa 2 no está / falla / no pasa el gate => sale la Capa 1. HOLD se reserva para defectos
// REALES de dato (ficha rota), no para "la IA no corrió". Este módulo es PURO y determinista: los
// endpoints (generación, choke-point de envío) lo llaman y sellan `report_status` con su veredicto.
// Diseño: docs/METODO-FALLBACK-INFORME.md · Gate: reportQuality.ts

import type { EvidenceFicha } from './evidenceFicha';
import type { ReportContext, ReportV4 } from './reportV4';
import { buildReportV4 } from './reportV4';
import { qualityGate } from './reportQuality';
import type { QualityResult, HoldReason } from './reportQuality';
import type { Lang } from './archetypeContentV4';

const SUPPORTED_LANGS: Lang[] = ['es', 'en', 'pt'];

export type ReportOrigen = 'capa1' | 'capa2';

export interface PipelineResult {
  report: ReportV4;                 // el informe que va a persistirse/renderizarse
  qc: QualityResult;                // veredicto del gate (para report_qc jsonb)
  status: 'ready' | 'held';         // sella report_status
  heldReason: HoldReason | null;    // held_reason (el primero, el resto en qc.reasons)
  origen: ReportOrigen;             // qué capa produjo el informe que sale
  fallbackSectionIds: string[];     // secciones que cayeron a fallback (para procedencia/telemetría)
}

export interface PipelineOpts {
  lang: 'es' | 'en' | 'pt';
  /**
   * Capa 2 opcional: reescribe (variación grounded) el informe de Capa 1 SIN agregar hechos.
   * Debe devolver un ReportV4 con la misma estructura + los ids de secciones que dejó en fallback.
   * Si tira / devuelve null, se ignora y sale la Capa 1 (nunca rompe el envío).
   */
  capa2?: (base: ReportV4, ficha: EvidenceFicha, ctx: ReportContext) =>
    { report: ReportV4; fallbackSectionIds: string[] } | null;
}

/**
 * Corre el pipeline completo y devuelve el veredicto sellable. Nunca lanza: ante cualquier problema de
 * Capa 2 cae a Capa 1; ante un defecto de dato/forma, el gate marca held. El caller persiste el resultado.
 */
export function runReportPipeline(ficha: EvidenceFicha, ctx: ReportContext, opts: PipelineOpts): PipelineResult {
  // El informe se ARMA en el idioma pedido para que el contenido coincida con el idioma que gatea.
  // Un idioma no soportado se arma en 'es' (fallback seguro, no crashea) y el gate lo retiene por 'idioma'.
  const buildLang: Lang = SUPPORTED_LANGS.includes(opts.lang) ? opts.lang : 'es';
  const buildCtx: ReportContext = { ...ctx, lang: buildLang };

  // ── Capa 1: el piso determinista aprobado ──
  const base = buildReportV4(ficha, buildCtx);

  // ── Capa 2 (opcional): variación grounded detrás del MISMO gate ──
  let report = base;
  let origen: ReportOrigen = 'capa1';
  let fallbackSectionIds: string[] = [];
  if (opts.capa2) {
    try {
      const enhanced = opts.capa2(base, ficha, buildCtx);
      if (enhanced && enhanced.report) {
        const qc2 = qualityGate(enhanced.report, ficha, { nombre: ctx.nombre, lang: opts.lang, fallbackSectionIds: enhanced.fallbackSectionIds });
        if (qc2.pass) {
          // La Capa 2 pasó el gate: sale la versión enriquecida.
          report = enhanced.report;
          origen = 'capa2';
          fallbackSectionIds = enhanced.fallbackSectionIds;
        }
        // Si la Capa 2 NO pasa el gate, se descarta en silencio: queda la Capa 1 (piso).
      }
    } catch {
      // Capa 2 explotó: se ignora, sale la Capa 1. Nunca rompe el envío.
    }
  }

  // ── Gate final sobre el informe que efectivamente sale ──
  const qc = qualityGate(report, ficha, { nombre: ctx.nombre, lang: opts.lang, fallbackSectionIds });

  return {
    report,
    qc,
    status: qc.pass ? 'ready' : 'held',
    heldReason: qc.pass ? null : (qc.reasons[0]?.code ?? null),
    origen,
    fallbackSectionIds,
  };
}
