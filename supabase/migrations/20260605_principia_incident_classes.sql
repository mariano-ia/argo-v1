-- Principia / Vigia v1 — incident_classes: the LEAN catalog of known issue
-- types. Exactly id/area/loop_id/key/label/autonomy_mode — no counters, no
-- thresholds (those are Fase 2+). incidents.class_id points here logically.
CREATE TABLE IF NOT EXISTS incident_classes (
    id            BIGSERIAL PRIMARY KEY,
    area          TEXT NOT NULL,                     -- producto|marketing|ventas|personas|finanzas|sistema
    loop_id       TEXT NOT NULL,                     -- which control loop owns this class
    key           TEXT NOT NULL UNIQUE,              -- stable machine key (also used as action_key seed)
    label         TEXT NOT NULL,                     -- human label (es)
    autonomy_mode TEXT NOT NULL DEFAULT 'propose'    -- observe|propose|act_with_approval
);

-- Seed the 4 Producto classes the Producto fast clock watches in v1.
INSERT INTO incident_classes (area, loop_id, key, label, autonomy_mode) VALUES
    ('producto', 'report_delivery', 'report_email_unsent',  'Reporte sin enviar',           'act_with_approval'),
    ('producto', 'report_delivery', 'report_ai_missing',    'Reporte sin generar (IA)',     'act_with_approval'),
    ('producto', 'report_delivery', 'report_email_failed',  'Fallo al enviar el reporte',   'act_with_approval'),
    ('producto', 'session_health',  'session_save_failed',  'Sesion no guardada',           'propose')
ON CONFLICT (key) DO NOTHING;

-- Service role only.
ALTER TABLE incident_classes ENABLE ROW LEVEL SECURITY;
-- No policies = denied for anon/authenticated, bypassed by the service role.
