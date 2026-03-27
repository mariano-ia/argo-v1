import React, { useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { getDashboardT } from '../../lib/dashboardTranslations';
import type { TenantData } from '../TenantDashboard';
import { Upload, CheckCircle2 } from 'lucide-react';

const TIPOS  = ['club', 'school', 'academy', 'federation', 'family', 'other'] as const;
const PAISES = ['argentina', 'mexico', 'spain', 'brazil', 'usa', 'other'] as const;
const ROLES  = ['coach', 'director', 'coordinator', 'parent', 'other'] as const;

interface Props {
    tenant: TenantData;
    onComplete: () => Promise<void>;
    lang: string;
}

export const TenantOnboarding: React.FC<Props> = ({ tenant, onComplete, lang }) => {
    const dt = getDashboardT(lang);
    const o  = dt.onboarding;

    const [step, setStep]       = useState(1);
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

    const handleNext = () => setStep(2);

    const handleFinish = async () => {
        setSaving(true);
        const token = await getToken();
        if (!token) { setSaving(false); return; }

        // Upload logo if selected
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

        // Save all fields + mark onboarding complete
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

    /* ── Stepper indicator ────────────────────────────────────────────────── */
    const StepDot = ({ n, label }: { n: number; label: string }) => {
        const done    = step > n;
        const current = step === n;
        return (
            <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    done    ? 'bg-argo-violet-500 text-white'
                    : current ? 'bg-argo-violet-500 text-white'
                    : 'bg-argo-border text-argo-light'
                }`}>
                    {done ? <CheckCircle2 size={14} /> : n}
                </div>
                <span className={`text-[13px] font-medium transition-colors ${
                    current ? 'text-argo-navy' : done ? 'text-argo-grey' : 'text-argo-light'
                }`}>{label}</span>
            </div>
        );
    };

    /* ── Chip button (for tipo selector) ──────────────────────────────────── */
    const ChipButton = ({ selected, onClick, children }: {
        selected: boolean; onClick: () => void; children: React.ReactNode;
    }) => (
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

    /* ── Field wrapper ───────────────────────────────────────────────────── */
    const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
        <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-argo-light uppercase tracking-[0.08em]">{label}</label>
            {children}
        </div>
    );

    const inputClass = "w-full px-3.5 py-2.5 rounded-xl border border-argo-border text-[14px] text-argo-navy placeholder:text-argo-light focus:outline-none focus:ring-2 focus:ring-argo-violet-300 focus:border-argo-violet-400 transition";
    const selectClass = `${inputClass} bg-white`;

    return (
        <div className="max-w-[540px] mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-[26px] font-bold text-argo-navy tracking-tight">{o.titulo}</h1>
                <p className="text-[13px] text-argo-grey mt-1">{o.subtitulo}</p>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-3 mb-7">
                <StepDot n={1} label={o.paso1Label} />
                <div className="flex-1 h-px bg-argo-border" />
                <StepDot n={2} label={o.paso2Label} />
            </div>

            {/* Card */}
            <div className="bg-white rounded-[14px] shadow-argo p-7 space-y-5">

                {step === 1 && (
                    <>
                        {/* Institution name */}
                        <Field label={o.nombreInstitucion}>
                            <input
                                className={inputClass}
                                value={displayName}
                                onChange={e => setDisplayName(e.target.value)}
                                placeholder={o.nombrePlaceholder}
                            />
                        </Field>

                        {/* Logo */}
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

                        {/* Institution type */}
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

                        {/* Sport */}
                        <Field label={o.deporte}>
                            <input
                                className={inputClass}
                                value={sport}
                                onChange={e => setSport(e.target.value)}
                                placeholder={o.deportePlaceholder}
                            />
                        </Field>

                        {/* Country + City */}
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
                        {/* Full name */}
                        <Field label={o.nombreCompleto}>
                            <input
                                className={inputClass}
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                                placeholder={o.nombreCompletoPlaceholder}
                            />
                        </Field>

                        {/* Role */}
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
                            onClick={handleNext}
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

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all z-50 ${
                    toast.ok ? 'bg-green-500' : 'bg-red-500'
                }`}>
                    {toast.msg}
                </div>
            )}
        </div>
    );
};
