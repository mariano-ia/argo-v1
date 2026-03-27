import React, { useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { getDashboardT } from '../../lib/dashboardTranslations';
import type { TenantData } from '../TenantDashboard';
import { Upload, CheckCircle2, User, Monitor, Mail, Users, Layers, Compass, MessageCircle, AlertCircle } from 'lucide-react';

// ─── Orientation slide content (3 langs) ─────────────────────────────────────

const SLIDE_TEXT = {
    es: {
        s0: {
            tag: 'La experiencia',
            title: '¿Qué vivirá el deportista?',
            body: 'El deportista juega una aventura interactiva de menos de 10 minutos. No sabe que es un test conductual. Al terminar, el adulto responsable recibe un informe de perfil personalizado por email y el perfil aparece automáticamente en tu dashboard.',
            flow: ['Deportista', 'La odisea\nmenos de 10 min', 'Informe\npor email', 'Adulto\nresponsable'],
        },
        s1: {
            tag: 'Tu link único',
            title: 'La puerta de entrada de tus deportistas',
            shareNote: 'Compártelo con el adulto responsable (padre, madre o tutor). Ellos completan el registro y le pasan el dispositivo al deportista.',
            creditNote: 'Cada experiencia consume 1 crédito al inicio, incluso si el deportista no la completa.',
        },
        s2: {
            tag: 'Tu plataforma',
            title: 'Qué encontrarás en tu dashboard',
            items: [
                { label: 'Jugadores', desc: 'Todos los perfiles generados. Accede al informe completo de cada deportista.' },
                { label: 'Grupos',    desc: 'Crea equipos y analiza su dinámica conductual. Cómo se complementan o tensionan los perfiles.' },
                { label: 'Guía',      desc: 'Situaciones habituales del entrenamiento, organizadas por categoría. Para cada una, orientaciones según el perfil del deportista.' },
                { label: 'Consultor IA', desc: 'Hazle preguntas por nombre: "¿Cómo motivo a Mateo?". Tiene acceso a todos los perfiles de tu plataforma.' },
            ],
        },
        s3: {
            tag: 'Listo para empezar',
            title: 'Tu primer paso: compartir el link',
            body: 'Comparte el link con el adulto responsable de un deportista. El sistema hace el resto.',
            hint: 'Compártelo por WhatsApp, email o el canal que uses con los padres.',
            orNote: 'o antes configura los datos de tu institución',
        },
        nav: { skip: 'Completar después', skipLast: 'Ir al dashboard', next: 'Siguiente', setup: 'Configurar mi institución', back: 'Atrás' },
    },
    en: {
        s0: {
            tag: 'The experience',
            title: 'What will the athlete experience?',
            body: 'The athlete plays an interactive adventure of less than 10 minutes. They do not know it is a behavioral test. When finished, the responsible adult receives a personalized profile report by email and the profile appears automatically in your dashboard.',
            flow: ['Athlete', 'The odyssey\nless than 10 min', 'Report\nby email', 'Responsible\nadult'],
        },
        s1: {
            tag: 'Your unique link',
            title: "Your athletes' entry point",
            shareNote: 'Share it with the responsible adult (parent or guardian). They complete the registration and hand the device to the athlete.',
            creditNote: 'Each experience consumes 1 credit at the start, even if the athlete does not complete it.',
        },
        s2: {
            tag: 'Your platform',
            title: "What you'll find in your dashboard",
            items: [
                { label: 'Players',      desc: 'All generated profiles. Access the full report of each athlete.' },
                { label: 'Groups',       desc: 'Create teams and analyze their behavioral dynamics. How profiles complement or tension each other.' },
                { label: 'Guide',        desc: 'Common training situations, organized by category. Guidance based on the athlete\'s profile.' },
                { label: 'AI Consultant', desc: 'Ask by name: "How do I motivate Mateo?". Has access to all profiles on your platform.' },
            ],
        },
        s3: {
            tag: 'Ready to start',
            title: 'Your first step: share the link',
            body: 'Share the link with the responsible adult of an athlete. The system does the rest.',
            hint: 'Share it via WhatsApp, email, or whatever channel you use with parents.',
            orNote: 'or first set up your institution details',
        },
        nav: { skip: 'Complete later', skipLast: 'Go to dashboard', next: 'Next', setup: 'Set up my institution', back: 'Back' },
    },
    pt: {
        s0: {
            tag: 'A experiência',
            title: 'O que o atleta viverá?',
            body: 'O atleta joga uma aventura interativa de menos de 10 minutos. Ele não sabe que é um teste comportamental. Ao terminar, o adulto responsável recebe um relatório de perfil personalizado por email e o perfil aparece automaticamente no seu dashboard.',
            flow: ['Atleta', 'A odisseia\nmenos de 10 min', 'Relatório\npor email', 'Adulto\nresponsável'],
        },
        s1: {
            tag: 'Seu link único',
            title: 'A porta de entrada dos seus atletas',
            shareNote: 'Compartilhe com o adulto responsável (pai, mãe ou responsável). Eles completam o registro e passam o dispositivo ao atleta.',
            creditNote: 'Cada experiência consome 1 crédito no início, mesmo que o atleta não a complete.',
        },
        s2: {
            tag: 'Sua plataforma',
            title: 'O que você encontrará no seu dashboard',
            items: [
                { label: 'Jogadores',    desc: 'Todos os perfis gerados. Acesse o relatório completo de cada atleta.' },
                { label: 'Grupos',       desc: 'Crie equipes e analise sua dinâmica comportamental. Como os perfis se complementam ou tensionam.' },
                { label: 'Guia',         desc: 'Situações comuns do treino, organizadas por categoria. Orientações com base no perfil do atleta.' },
                { label: 'Consultor IA', desc: 'Faça perguntas por nome: "Como motivo o Mateo?". Tem acesso a todos os perfis da sua plataforma.' },
            ],
        },
        s3: {
            tag: 'Pronto para começar',
            title: 'Seu primeiro passo: compartilhar o link',
            body: 'Compartilhe o link com o adulto responsável de um atleta. O sistema faz o resto.',
            hint: 'Compartilhe pelo WhatsApp, email ou o canal que você usa com os pais.',
            orNote: 'ou antes configure os dados da sua instituição',
        },
        nav: { skip: 'Completar depois', skipLast: 'Ir ao dashboard', next: 'Próximo', setup: 'Configurar minha instituição', back: 'Voltar' },
    },
} as const;

const TIPOS  = ['club', 'school', 'academy', 'federation', 'family', 'other'] as const;
const PAISES = ['argentina', 'mexico', 'spain', 'brazil', 'usa', 'other'] as const;
const ROLES  = ['coach', 'director', 'coordinator', 'parent', 'other'] as const;

/* ── Sub-components defined outside to avoid remount on every render ────── */

const StepDot: React.FC<{ n: number; label: string; step: number }> = ({ n, label, step }) => {
    const done    = step > n;
    const current = step === n;
    return (
        <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                done || current ? 'bg-argo-violet-500 text-white' : 'bg-argo-border text-argo-light'
            }`}>
                {done ? <CheckCircle2 size={14} /> : n}
            </div>
            <span className={`text-[13px] font-medium transition-colors ${
                current ? 'text-argo-navy' : done ? 'text-argo-grey' : 'text-argo-light'
            }`}>{label}</span>
        </div>
    );
};

const ChipButton: React.FC<{ selected: boolean; onClick: () => void; children: React.ReactNode }> = ({ selected, onClick, children }) => (
    <button
        type="button"
        onClick={onClick}
        className={`px-3.5 py-2 rounded-xl text-[13px] font-medium border transition-colors ${
            selected
                ? 'bg-argo-violet-500 text-white border-argo-violet-500'
                : 'bg-white text-argo-secondary border-argo-border hover:border-argo-violet-300 hover:text-argo-violet-500'
        }`}
    >
        {children}
    </button>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-argo-light uppercase tracking-[0.08em]">{label}</label>
        {children}
    </div>
);

const inputClass = "w-full px-3.5 py-2.5 rounded-xl border border-argo-border text-[14px] text-argo-navy placeholder:text-argo-light focus:outline-none focus:ring-2 focus:ring-argo-violet-300 focus:border-argo-violet-400 transition";
const selectClass = `${inputClass} bg-white`;

/* ── Main component ────────────────────────────────────────────────────── */

interface Props {
    tenant: TenantData;
    onComplete: () => Promise<void>;
    lang: string;
}

export const TenantOnboarding: React.FC<Props> = ({ tenant, onComplete, lang }) => {
    const dt = getDashboardT(lang);
    const o  = dt.onboarding;

    const [step, setStep]       = useState(0);
    const [slideIndex, setSlideIndex] = useState(0);
    const [saving, setSaving]   = useState(false);
    const [toast, setToast]     = useState<{ msg: string; ok: boolean } | null>(null);

    // Step 1 — institution
    const [displayName, setDisplayName] = useState(tenant.display_name ?? '');
    const [tipo,        setTipo]        = useState(tenant.institution_type ?? '');
    const [sport,       setSport]       = useState(tenant.sport ?? '');
    const [country,     setCountry]     = useState(tenant.country ?? '');
    const [city,        setCity]        = useState(tenant.city ?? '');
    const [logoFile,    setLogoFile]    = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(tenant.logo_url ?? null);

    // Step 2 — owner profile
    const [fullName, setFullName] = useState('');
    const [role,     setRole]     = useState('');

    const fileRef = useRef<HTMLInputElement>(null);

    const showToast = (msg: string, ok: boolean) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3000);
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setLogoFile(f);
        setLogoPreview(URL.createObjectURL(f));
    };

    const getToken = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token ?? null;
    };

    const handleSkip = async () => {
        setSaving(true);
        const token = await getToken();
        if (!token) { setSaving(false); return; }
        const res = await fetch('/api/tenant-setup', {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ onboarding_completed: true }),
        });
        if (!res.ok) showToast(o.errorGuardar, false);
        else await onComplete();
        setSaving(false);
    };

    const handleFinish = async () => {
        setSaving(true);
        const token = await getToken();
        if (!token) { setSaving(false); return; }

        if (logoFile) {
            const form = new FormData();
            form.append('logo', logoFile);
            const logoRes = await fetch('/api/upload-logo', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: form,
            });
            if (!logoRes.ok) {
                showToast(o.errorLogo, false);
                setSaving(false);
                return;
            }
        }

        const body: Record<string, unknown> = { onboarding_completed: true };
        if (displayName.trim())  body.display_name        = displayName.trim();
        if (tipo)                body.institution_type    = tipo;
        if (sport.trim())        body.sport               = sport.trim();
        if (country)             body.country             = country;
        if (city.trim())         body.city                = city.trim();
        if (fullName.trim())     body.full_name           = fullName.trim();
        if (role)                body.role_in_institution = role;

        const res = await fetch('/api/tenant-setup', {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            showToast(o.errorGuardar, false);
            setSaving(false);
            return;
        }

        await onComplete();
        setSaving(false);
    };

    const sl = SLIDE_TEXT[(lang as keyof typeof SLIDE_TEXT)] ?? SLIDE_TEXT.es;
    const FLOW_ICONS = [
        <User size={20} />,
        <Monitor size={20} />,
        <Mail size={20} />,
        <Users size={20} />,
    ];
    const DASH_ICONS = [
        <Users size={15} />,
        <Layers size={15} />,
        <Compass size={15} />,
        <MessageCircle size={15} />,
    ];

    return (
        <div className="max-w-[540px] mx-auto">

            {/* ── STEP 0: Orientation slides ─────────────────────────────── */}
            {step === 0 && (
                <>
                    {/* Progress dots */}
                    <div className="flex items-center gap-1.5 mb-8">
                        {[0, 1, 2, 3].map(i => (
                            <div
                                key={i}
                                className={`h-1.5 rounded-full transition-all duration-200 ${
                                    i === slideIndex ? 'w-4 bg-argo-violet-500' : 'w-1.5 bg-argo-border'
                                }`}
                            />
                        ))}
                    </div>

                    {/* Card */}
                    <div className="bg-white rounded-[18px] shadow-argo p-8">

                        {/* Slide 0 — La experiencia */}
                        {slideIndex === 0 && (
                            <>
                                <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-argo-violet-500 mb-2.5">{sl.s0.tag}</p>
                                <h2 className="text-[22px] font-bold text-argo-navy tracking-tight leading-snug mb-5">{sl.s0.title}</h2>
                                {/* Flow visual */}
                                <div className="flex items-start gap-1.5 mb-6 flex-wrap">
                                    {sl.s0.flow.map((label, i) => (
                                        <React.Fragment key={i}>
                                            <div className="flex flex-col items-center gap-2 flex-1 min-w-[56px] text-center">
                                                <div className="w-11 h-11 rounded-[13px] border border-argo-border bg-argo-bg flex items-center justify-center text-argo-violet-500">
                                                    {FLOW_ICONS[i]}
                                                </div>
                                                <span className="text-[10px] font-medium text-argo-grey leading-tight whitespace-pre-line">{label}</span>
                                            </div>
                                            {i < 3 && (
                                                <div className="flex items-center flex-shrink-0 text-argo-border" style={{ height: '44px', fontSize: '18px' }}>›</div>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </div>
                                <p className="text-sm text-argo-secondary leading-relaxed">
                                    {sl.s0.body.split('No sabe que es un test conductual.')[0]}
                                    <strong className="text-argo-navy">
                                        {lang === 'en' ? 'They do not know it is a behavioral test.' : lang === 'pt' ? 'Ele não sabe que é um teste comportamental.' : 'No sabe que es un test conductual.'}
                                    </strong>
                                    {sl.s0.body.split(/No sabe que es un test conductual\.|They do not know it is a behavioral test\.|Ele não sabe que é um teste comportamental\./)[1]}
                                </p>
                            </>
                        )}

                        {/* Slide 1 — Tu link único */}
                        {slideIndex === 1 && (
                            <>
                                <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-argo-violet-500 mb-2.5">{sl.s1.tag}</p>
                                <h2 className="text-[22px] font-bold text-argo-navy tracking-tight leading-snug mb-5">{sl.s1.title}</h2>
                                <div className="flex items-center justify-between gap-3 bg-argo-bg border border-argo-border rounded-xl px-4 py-3 mb-5">
                                    <span className="text-sm font-medium text-argo-violet-500 truncate">
                                        argomethod.com/play/<strong>{tenant.slug}</strong>
                                    </span>
                                </div>
                                <p className="text-sm text-argo-secondary leading-relaxed mb-5">{sl.s1.shareNote}</p>
                                <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-3">
                                    <AlertCircle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-amber-800 leading-relaxed">{sl.s1.creditNote}</p>
                                </div>
                            </>
                        )}

                        {/* Slide 2 — Tu plataforma */}
                        {slideIndex === 2 && (
                            <>
                                <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-argo-violet-500 mb-2.5">{sl.s2.tag}</p>
                                <h2 className="text-[22px] font-bold text-argo-navy tracking-tight leading-snug mb-5">{sl.s2.title}</h2>
                                <div className="space-y-2.5">
                                    {sl.s2.items.map((item, i) => (
                                        <div key={i} className="flex items-start gap-3 bg-argo-bg rounded-xl px-3.5 py-3">
                                            <div className="w-7 h-7 rounded-[8px] bg-white border border-argo-border flex items-center justify-center flex-shrink-0 text-argo-violet-500">
                                                {DASH_ICONS[i]}
                                            </div>
                                            <div>
                                                <p className="text-[13px] font-semibold text-argo-navy mb-0.5">{item.label}</p>
                                                <p className="text-xs text-argo-grey leading-relaxed">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Slide 3 — Listo */}
                        {slideIndex === 3 && (
                            <>
                                <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-argo-violet-500 mb-2.5">{sl.s3.tag}</p>
                                <h2 className="text-[22px] font-bold text-argo-navy tracking-tight leading-snug mb-3">{sl.s3.title}</h2>
                                <p className="text-sm text-argo-grey leading-relaxed mb-6">{sl.s3.body}</p>
                                <div className="bg-argo-violet-50 border border-argo-violet-100 rounded-xl p-4 mb-4">
                                    <div className="flex items-center justify-between gap-3 mb-2">
                                        <span className="text-xs font-medium text-argo-violet-500 truncate">
                                            argomethod.com/play/{tenant.slug}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-argo-grey">{sl.s3.hint}</p>
                                </div>
                                <p className="text-xs text-argo-light text-center">{sl.s3.orNote}</p>
                            </>
                        )}

                    </div>

                    {/* Slide navigation */}
                    <div className="flex items-center justify-between mt-5">
                        <button
                            type="button"
                            onClick={handleSkip}
                            disabled={saving}
                            className="text-[13px] text-argo-grey hover:text-argo-navy transition-colors disabled:opacity-50"
                        >
                            {slideIndex === 3 ? sl.nav.skipLast : sl.nav.skip}
                        </button>
                        <div className="flex items-center gap-2.5">
                            {slideIndex > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setSlideIndex(i => i - 1)}
                                    className="px-4 py-2.5 rounded-xl text-[13px] font-medium text-argo-grey hover:text-argo-navy border border-argo-border hover:bg-argo-bg transition-colors"
                                >
                                    {sl.nav.back}
                                </button>
                            )}
                            {slideIndex < 3 ? (
                                <button
                                    type="button"
                                    onClick={() => setSlideIndex(i => i + 1)}
                                    className="px-5 py-2.5 rounded-xl text-[13px] font-semibold bg-argo-violet-500 text-white hover:bg-argo-violet-600 transition-colors"
                                >
                                    {sl.nav.next}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="px-5 py-2.5 rounded-xl text-[13px] font-semibold bg-argo-violet-500 text-white hover:bg-argo-violet-600 transition-colors"
                                >
                                    {sl.nav.setup}
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* ── STEPS 1 & 2: Institution + profile wizard ──────────────── */}
            {step > 0 && (
            <>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-[26px] font-bold text-argo-navy tracking-tight">{o.titulo}</h1>
                <p className="text-[13px] text-argo-grey mt-1">{o.subtitulo}</p>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-3 mb-7">
                <StepDot n={1} label={o.paso1Label} step={step} />
                <div className="flex-1 h-px bg-argo-border" />
                <StepDot n={2} label={o.paso2Label} step={step} />
            </div>

            {/* Card */}
            <div className="bg-white rounded-[14px] shadow-argo p-7 space-y-5">

                {step === 1 && (
                    <>
                        <Field label={o.nombreInstitucion}>
                            <input
                                className={inputClass}
                                value={displayName}
                                onChange={e => setDisplayName(e.target.value)}
                                placeholder={o.nombrePlaceholder}
                            />
                        </Field>

                        <Field label={o.logo}>
                            <div className="flex items-center gap-4">
                                {logoPreview ? (
                                    <img
                                        src={logoPreview}
                                        alt="Logo"
                                        className="w-16 h-16 rounded-[10px] object-contain border border-argo-border bg-argo-neutral"
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-[10px] border-2 border-dashed border-argo-border bg-argo-neutral flex items-center justify-center text-argo-light">
                                        <Upload size={20} />
                                    </div>
                                )}
                                <div>
                                    <button
                                        type="button"
                                        onClick={() => fileRef.current?.click()}
                                        className="text-[13px] font-medium text-argo-violet-500 hover:text-argo-violet-600 transition-colors"
                                    >
                                        {logoPreview ? o.cambiarLogo : o.subirLogo}
                                    </button>
                                    <p className="text-[11px] text-argo-light mt-0.5">JPEG, PNG o WebP · máx. 2 MB</p>
                                    <input
                                        ref={fileRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        className="hidden"
                                        onChange={handleLogoChange}
                                    />
                                </div>
                            </div>
                        </Field>

                        <Field label={o.tipoInstitucion}>
                            <div className="flex flex-wrap gap-2">
                                {TIPOS.map(v => (
                                    <ChipButton
                                        key={v}
                                        selected={tipo === v}
                                        onClick={() => setTipo(tipo === v ? '' : v)}
                                    >
                                        {o.tipoLabels[v]}
                                    </ChipButton>
                                ))}
                            </div>
                        </Field>

                        <Field label={o.deporte}>
                            <input
                                className={inputClass}
                                value={sport}
                                onChange={e => setSport(e.target.value)}
                                placeholder={o.deportePlaceholder}
                            />
                        </Field>

                        <div className="grid grid-cols-2 gap-4">
                            <Field label={o.pais}>
                                <select
                                    className={selectClass}
                                    value={country}
                                    onChange={e => setCountry(e.target.value)}
                                >
                                    <option value="">{o.seleccionarPais}</option>
                                    {PAISES.map(v => (
                                        <option key={v} value={v}>{o.paisLabels[v]}</option>
                                    ))}
                                </select>
                            </Field>
                            <Field label={o.ciudad}>
                                <input
                                    className={inputClass}
                                    value={city}
                                    onChange={e => setCity(e.target.value)}
                                    placeholder={o.ciudadPlaceholder}
                                />
                            </Field>
                        </div>
                    </>
                )}

                {step === 2 && (
                    <>
                        <Field label={o.nombreCompleto}>
                            <input
                                className={inputClass}
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                                placeholder={o.nombreCompletoPlaceholder}
                            />
                        </Field>

                        <Field label={o.rolEnInstitucion}>
                            <select
                                className={selectClass}
                                value={role}
                                onChange={e => setRole(e.target.value)}
                            >
                                <option value="">{o.seleccionarRol}</option>
                                {ROLES.map(v => (
                                    <option key={v} value={v}>{o.rolLabels[v]}</option>
                                ))}
                            </select>
                        </Field>
                    </>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-6">
                <button
                    type="button"
                    onClick={handleSkip}
                    disabled={saving}
                    className="text-[13px] text-argo-grey hover:text-argo-navy transition-colors disabled:opacity-50"
                >
                    {o.completarDespues}
                </button>

                <div className="flex items-center gap-3">
                    {step === 2 && (
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="px-4 py-2.5 rounded-xl text-[13px] font-medium text-argo-grey hover:text-argo-navy border border-argo-border hover:bg-argo-bg transition-colors"
                        >
                            {dt.common.volver}
                        </button>
                    )}
                    {step === 1 ? (
                        <button
                            type="button"
                            onClick={() => setStep(2)}
                            className="px-5 py-2.5 rounded-xl text-[13px] font-semibold bg-argo-violet-500 text-white hover:bg-argo-violet-600 transition-colors"
                        >
                            {o.siguiente}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleFinish}
                            disabled={saving}
                            className="px-5 py-2.5 rounded-xl text-[13px] font-semibold bg-argo-violet-500 text-white hover:bg-argo-violet-600 transition-colors disabled:opacity-60"
                        >
                            {saving ? o.guardando : o.comenzar}
                        </button>
                    )}
                </div>
            </div>

            {toast && (
                <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white z-50 ${
                    toast.ok ? 'bg-green-500' : 'bg-red-500'
                }`}>
                    {toast.msg}
                </div>
            )}
            </>
            )}
        </div>
    );
};
