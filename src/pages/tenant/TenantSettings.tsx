import React, { useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getDashboardT } from '../../lib/dashboardTranslations';
import { useLang } from '../../context/LangContext';
import type { Lang } from '../../context/LangContext';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui';
import type { TenantData, MemberProfile } from '../TenantDashboard';
import { Upload } from 'lucide-react';

/* ── Constants ─────────────────────────────────────────────────────────── */

const TIPOS  = ['club', 'school', 'academy', 'federation', 'family', 'other'] as const;
const PAISES = ['argentina', 'mexico', 'spain', 'brazil', 'usa', 'other'] as const;
const ROLES  = ['coach', 'director', 'coordinator', 'parent', 'other'] as const;

const LANG_OPTIONS: { value: Lang; label: string }[] = [
    { value: 'es', label: 'Español' },
    { value: 'en', label: 'English' },
    { value: 'pt', label: 'Português' },
];

/* ── Sub-components ─────────────────────────────────────────────────────── */

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className="text-[15px] font-semibold text-argo-navy mb-4">{children}</h2>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-argo-light uppercase tracking-[0.08em]">{label}</label>
        {children}
    </div>
);

const ChipButton: React.FC<{ selected: boolean; onClick: () => void; children: React.ReactNode }> = ({ selected, onClick, children }) => (
    <button
        type="button"
        onClick={onClick}
        className={`px-3 py-1.5 rounded-lg text-[13px] font-medium border transition-colors ${
            selected
                ? 'bg-argo-violet-500 text-white border-argo-violet-500'
                : 'bg-white text-argo-secondary border-argo-border hover:border-argo-violet-300 hover:text-argo-violet-500'
        }`}
    >
        {children}
    </button>
);

const inputClass = "w-full px-3.5 py-2.5 rounded-xl border border-argo-border text-[14px] text-argo-navy placeholder:text-argo-light focus:outline-none focus:ring-2 focus:ring-argo-violet-300 focus:border-argo-violet-400 transition bg-white";
const selectClass = inputClass;

/* ── Component ──────────────────────────────────────────────────────────── */

export const TenantSettings: React.FC = () => {
    const { tenant, refreshTenant, memberProfile: initialProfile } =
        useOutletContext<{ tenant: TenantData | null; refreshTenant: () => Promise<void>; memberProfile: MemberProfile | null }>();
    const { lang, setLang } = useLang();
    const dt = getDashboardT(lang);
    const o  = dt.onboarding;
    const { toast } = useToast();

    /* ── Institution state ──────────────────────────────────────────────── */
    const [displayName, setDisplayName] = useState('');
    const [tipo,        setTipo]        = useState('');
    const [sport,       setSport]       = useState('');
    const [country,     setCountry]     = useState('');
    const [city,        setCity]        = useState('');
    const [logoFile,    setLogoFile]    = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [savingInst,  setSavingInst]  = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    /* ── Profile state ──────────────────────────────────────────────────── */
    const [fullName,    setFullName]    = useState('');
    const [role,        setRole]        = useState('');
    const [savingProf,  setSavingProf]  = useState(false);

    /* ── Sync with context ──────────────────────────────────────────────── */
    useEffect(() => {
        if (tenant) {
            setDisplayName(tenant.display_name ?? '');
            setTipo(tenant.institution_type ?? '');
            setSport(tenant.sport ?? '');
            setCountry(tenant.country ?? '');
            setCity(tenant.city ?? '');
            setLogoPreview(tenant.logo_url ?? null);
            setLogoFile(null);
        }
    }, [tenant]);

    useEffect(() => {
        if (initialProfile) {
            setFullName(initialProfile.full_name ?? '');
            setRole(initialProfile.role_in_institution ?? '');
        }
    }, [initialProfile]);

    /* ── Helpers ────────────────────────────────────────────────────────── */
    const getToken = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token ?? null;
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setLogoFile(f);
        setLogoPreview(URL.createObjectURL(f));
    };

    /* ── Save institution ───────────────────────────────────────────────── */
    const handleSaveInstitution = async () => {
        setSavingInst(true);
        const token = await getToken();
        if (!token) { setSavingInst(false); return; }

        if (logoFile) {
            const form = new FormData();
            form.append('logo', logoFile);
            const logoRes = await fetch('/api/upload-logo', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: form,
            });
            if (!logoRes.ok) {
                toast('error', o.errorLogo);
                setSavingInst(false);
                return;
            }
            setLogoFile(null);
        }

        const body: Record<string, unknown> = {};
        if (displayName.trim()) body.display_name     = displayName.trim();
        body.institution_type = tipo || null;
        body.sport            = (sport.trim() && sport !== '_other') ? sport.trim() : null;
        body.country          = country || null;
        body.city             = city.trim() || null;

        const res = await fetch('/api/tenant-setup', {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            toast('error', o.errorGuardar);
        } else {
            toast('success', o.guardado);
            await refreshTenant();
        }
        setSavingInst(false);
    };

    /* ── Save profile ───────────────────────────────────────────────────── */
    const handleSaveProfile = async () => {
        setSavingProf(true);
        const token = await getToken();
        if (!token) { setSavingProf(false); return; }

        const res = await fetch('/api/tenant-setup', {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                full_name:           fullName.trim() || null,
                role_in_institution: role || null,
            }),
        });

        if (!res.ok) {
            toast('error', o.errorGuardar);
        } else {
            toast('success', o.guardado);
            await refreshTenant();
        }
        setSavingProf(false);
    };

    if (!tenant) {
        return (
            <div className="flex items-center justify-center h-40">
                <div className="w-6 h-6 rounded-full border-2 border-argo-violet-500 border-t-transparent animate-spin" />
            </div>
        );
    }

    const saveBtn = (saving: boolean, onClick: () => void) => (
        <button
            type="button"
            onClick={onClick}
            disabled={saving}
            className="px-5 py-2 rounded-xl text-[13px] font-semibold bg-argo-violet-500 text-white hover:bg-argo-violet-600 transition-colors disabled:opacity-60"
        >
            {saving ? o.guardando : dt.common.guardar}
        </button>
    );

    return (
        <div className="max-w-[600px]">
            <div className="mb-8">
                <h1 className="text-[26px] font-bold text-argo-navy tracking-tight">{dt.settings.titulo}</h1>
                <p className="text-[13px] text-argo-grey mt-1">{dt.settings.descripcion}</p>
            </div>

            <div className="space-y-6">

                {/* ── Institución ──────────────────────────────────────── */}
                <div className="bg-white rounded-[14px] p-6 shadow-argo space-y-5">
                    <SectionTitle>{o.paso1Label}</SectionTitle>

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
                                    className="w-14 h-14 rounded-[10px] object-contain border border-argo-border bg-argo-neutral"
                                />
                            ) : (
                                <div className="w-14 h-14 rounded-[10px] border-2 border-dashed border-argo-border bg-argo-neutral flex items-center justify-center text-argo-light">
                                    <Upload size={18} />
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
                        <div className="flex flex-wrap gap-2">
                            {o.deportes.map(d => (
                                <ChipButton
                                    key={d}
                                    selected={sport === d}
                                    onClick={() => setSport(sport === d ? '' : d)}
                                >
                                    {d}
                                </ChipButton>
                            ))}
                            <ChipButton
                                selected={!!sport && !o.deportes.includes(sport)}
                                onClick={() => setSport(sport && !o.deportes.includes(sport) ? '' : '_other')}
                            >
                                {o.deporteOtro}
                            </ChipButton>
                        </div>
                        {sport && !o.deportes.includes(sport) && (
                            <input
                                className={`${inputClass} mt-2`}
                                value={sport === '_other' ? '' : sport}
                                onChange={e => setSport(e.target.value || '_other')}
                                placeholder={o.deporteOtroPlaceholder}
                                autoFocus
                            />
                        )}
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                        <Field label={o.pais}>
                            <select className={selectClass} value={country} onChange={e => setCountry(e.target.value)}>
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

                    <div className="flex justify-end pt-1">
                        {saveBtn(savingInst, handleSaveInstitution)}
                    </div>
                </div>

                {/* ── Mi perfil ────────────────────────────────────────── */}
                <div className="bg-white rounded-[14px] p-6 shadow-argo space-y-5">
                    <SectionTitle>{o.paso2Label}</SectionTitle>

                    <Field label={o.nombreCompleto}>
                        <input
                            className={inputClass}
                            value={fullName}
                            onChange={e => setFullName(e.target.value)}
                            placeholder={o.nombreCompletoPlaceholder}
                        />
                    </Field>

                    <Field label={o.rolEnInstitucion}>
                        <select className={selectClass} value={role} onChange={e => setRole(e.target.value)}>
                            <option value="">{o.seleccionarRol}</option>
                            {ROLES.map(v => (
                                <option key={v} value={v}>{o.rolLabels[v]}</option>
                            ))}
                        </select>
                    </Field>

                    <div className="flex justify-end pt-1">
                        {saveBtn(savingProf, handleSaveProfile)}
                    </div>
                </div>

                {/* ── Idioma ───────────────────────────────────────────── */}
                <div className="bg-white rounded-[14px] p-6 shadow-argo">
                    <SectionTitle>{dt.settings.idioma}</SectionTitle>
                    <p className="text-[13px] text-argo-grey mb-4">{dt.settings.idiomaDesc}</p>
                    <div className="inline-flex rounded-xl border border-argo-border overflow-hidden">
                        {LANG_OPTIONS.map(({ value, label }) => (
                            <button
                                key={value}
                                onClick={() => setLang(value)}
                                className={`px-5 py-2 text-sm font-medium transition-colors border-r border-argo-border last:border-r-0 ${
                                    lang === value
                                        ? 'bg-argo-navy text-white'
                                        : 'bg-white text-argo-grey hover:text-argo-navy hover:bg-argo-bg'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Plan ─────────────────────────────────────────────── */}
                <div className="bg-white rounded-[14px] p-6 shadow-argo">
                    <SectionTitle>{dt.settings.cuenta}</SectionTitle>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[11px] font-semibold text-argo-light uppercase tracking-[0.08em] mb-0.5">{dt.settings.plan}</p>
                            <p className="text-sm text-argo-navy font-medium capitalize">{tenant.plan}</p>
                        </div>
                        <div>
                            <p className="text-[11px] font-semibold text-argo-light uppercase tracking-[0.08em] mb-0.5">{dt.home.creditosDisponibles}</p>
                            <p className="text-sm text-argo-navy font-medium">{tenant.credits_remaining}</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
