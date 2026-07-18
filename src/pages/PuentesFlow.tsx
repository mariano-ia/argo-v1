import { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { PuentesIntro } from '../components/puentes/PuentesIntro';
import { PuentesQuestion } from '../components/puentes/PuentesQuestion';
import { PuentesProgress } from '../components/puentes/PuentesProgress';
import { PuentesGenerating } from '../components/puentes/PuentesGenerating';
import { PuentesReport } from '../components/puentes/PuentesReport';
import { getPuentesQuestions } from '../lib/puentesQuestions';
import { getPuentesCopy } from '../lib/puentesTranslations';
import type {
    AdultProfile,
    Lang,
    PuentesAnswer,
    PuentesAiSections,
} from '../types/puentes';

interface ChildProfileSnapshot {
    eje: string;
    // Entitlement cut (frozen model 2026-07-10): puentes-start always sends null
    // for the child's headline profile data — the $4.99 viewer gets ONLY the bridge.
    motor: string | null;
    archetype_label: string | null;
    sport: string;
}

interface ChildEntry {
    puentes_session_id: string;
    source_session_id: string;
    child_name: string | null;
    child_profile: ChildProfileSnapshot | null;
    status: string;
    ai_sections: PuentesAiSections | null;
}

type Stage = 'loading' | 'intro' | 'question' | 'generating' | 'report' | 'error' | 'pending_payment';

// DEV mock payload shared by /puentes/demo (report) and /puentes/demo-cuestionario
// (full questionnaire flow) — the /api/* functions do not run under `vite dev`.
const DEMO_ADULT_PROFILE: AdultProfile = {
    eje_primary: 'C',
    eje_secondary: 'S',
    motor: 'profundo',
    pressure_style: 'regulado',
    history: 'ex_competitive',
    dominant_emotion: 'orgullo',
    axis_counts: { D: 1, I: 1, S: 3, C: 3 },
};

const DEMO_CHILDREN: ChildEntry[] = [
    {
        puentes_session_id: 'demo-1',
        source_session_id: 'demo-src-1',
        child_name: 'Lucas',
        // Mirrors the real post-cut payload: headline profile data is
        // never shipped to the bridge viewer (and the old [Eje][Motor]
        // label scheme is forbidden anyway).
        child_profile: {
            eje: 'D',
            motor: null,
            archetype_label: null,
            sport: 'Fútbol',
        },
        status: 'generated',
        ai_sections: {
            saludo: 'Hola Marcelo. Preparamos algo pensado para ti y para Lucas. No es un manual ni una lista de correcciones: son ideas para acompañarlo mejor en la actividad, tal como es.',
            perfil_adulto_breve: 'Tiendes a observar antes de actuar y a cuidar los detalles. Buscas que las cosas tengan orden y sentido, y sueles sostener la calma cuando otros se aceleran. Esa mirada tranquila es un ancla valiosa para un niño que va a mil por hora.',
            puentes: [
                {
                    titulo: 'Cuando él arranca sin frenar',
                    como_esta_el: 'Lucas suele lanzarse a la acción con mucha energía, a veces antes de tener todo el panorama claro. Le cuesta esperar.',
                    lo_que_traes: 'Tú prefieres mirar el conjunto antes de moverte y anticipar lo que puede salir distinto.',
                    el_puente: 'En vez de frenarlo, puedes darle una meta corta y clara hacia dónde apuntar esa energía. Él necesita dirección, no un freno.',
                    pregunta_reflexion: '¿En qué momento de la semana podrías darle un pequeño desafío que canalice esa velocidad?',
                },
                {
                    titulo: 'Cuando algo no sale',
                    como_esta_el: 'Ante un traspié, Lucas puede reaccionar rápido y con intensidad, y le cuesta volver a la calma solo.',
                    lo_que_traes: 'Tu tendencia a regularte bajo presión es justo lo que a él le falta en ese instante.',
                    el_puente: 'Tu tono tranquilo baja el suyo. Un par de palabras firmes y serenas valen más que una explicación larga cuando está encendido.',
                    pregunta_reflexion: '¿Cómo suena tu voz cuando algo no sale y quién de los dos la ajusta primero?',
                },
                {
                    titulo: 'Cuando busca tu mirada',
                    como_esta_el: 'Aunque parezca muy independiente, Lucas te busca después de cada jugada para ver qué te pareció.',
                    lo_que_traes: 'Tu atención al detalle puede volverse una devolución muy precisa, para bien o para mal.',
                    el_puente: 'Elige una cosa concreta que hizo bien y nómbrala antes que cualquier corrección. Lo que ve en tu cara pesa más que el resultado.',
                    pregunta_reflexion: '¿Qué fue lo último que le dijiste al salir de la cancha?',
                },
                {
                    titulo: 'Cuando el ritmo no coincide',
                    como_esta_el: 'Él vive el deporte a una velocidad alta y quiere que todo pase ya.',
                    lo_que_traes: 'Tú disfrutas el proceso, los tiempos largos, la construcción paciente.',
                    el_puente: 'No tienes que igualar su ritmo ni él el tuyo. Alterna: momentos de acción para él, momentos de charla tranquila para los dos.',
                    pregunta_reflexion: '¿Dónde podrían encontrarse a mitad de camino esta semana?',
                },
            ],
            cierre: 'Nada de esto es una fórmula fija. Lucas va a cambiar y tú también. Quédate con una sola idea de todas estas y pruébala sin apuro. Ya es un montón.',
        },
    },
];

export default function PuentesFlow() {
    const { token } = useParams<{ token: string }>();
    const [stage, setStage] = useState<Stage>('loading');
    const [children, setChildren] = useState<ChildEntry[]>([]);
    const [lang, setLang] = useState<Lang>('es');
    const [answers, setAnswers] = useState<PuentesAnswer[]>([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [adultProfile, setAdultProfile] = useState<AdultProfile | null>(null);
    const [profileFresh, setProfileFresh] = useState(false);
    const [recipientEmail, setRecipientEmail] = useState<string | null>(null);
    const [recipientName, setRecipientName] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (!token) {
            setStage('error');
            setErrorMsg('Missing token');
            return;
        }
        // DEV mocks — the /api/* functions do not run under `vite dev`:
        // /puentes/demo renders the sample report directly (mirrors ReportPage's
        // dev mock); /puentes/demo-cuestionario runs the full intro → questions →
        // generating → report flow with the same fake data (mobile QA of the
        // questionnaire). Any other token still hits the API.
        if (import.meta.env.DEV && token === 'demo') {
            setLang('es');
            setRecipientName('Marcelo García');
            setRecipientEmail('marcelo@example.com');
            setAdultProfile(DEMO_ADULT_PROFILE);
            setChildren(DEMO_CHILDREN);
            setStage('report');
            return;
        }
        if (import.meta.env.DEV && token === 'demo-cuestionario') {
            setLang('es');
            setRecipientName('Marcelo García');
            setRecipientEmail('marcelo@example.com');
            setChildren(DEMO_CHILDREN.map(c => ({ ...c, ai_sections: null, status: 'pending' })));
            setStage('intro');
            return;
        }
        (async () => {
            try {
                const res = await fetch('/api/puentes-start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ magic_token: token }),
                });
                if (res.status === 402) {
                    setStage('pending_payment');
                    return;
                }
                if (!res.ok) {
                    setStage('error');
                    setErrorMsg(getPuentesCopy(lang).errors.invalidToken);
                    return;
                }
                const data = await res.json();
                setLang(data.lang || 'es');
                if (data.recipient_email) setRecipientEmail(data.recipient_email);
                if (data.recipient_name) setRecipientName(data.recipient_name);
                if (data.adult_profile) setAdultProfile(data.adult_profile);
                // Fast-path (R6): a fresh saved profile skips the questionnaire.
                if (data.profile_fresh) setProfileFresh(true);

                const list: ChildEntry[] = data.children ?? [];
                setChildren(list);

                // If all children already have ai_sections, skip the questionnaire
                if (data.all_generated && list.every((c: ChildEntry) => c.ai_sections)) {
                    setStage('report');
                } else if (data.already_answered && data.adult_profile) {
                    // Cuestionario already done but at least one child is still
                    // generating. Show the loader; when ai_sections lands the
                    // poller below will move us to the report.
                    setStage('generating');
                    pollUntilReady();
                } else {
                    setStage('intro');
                }
            } catch {
                setStage('error');
                setErrorMsg(getPuentesCopy(lang).errors.generic);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const pollUntilReady = async () => {
        // Light poller — checks every 3s up to 20 attempts (60s total).
        for (let i = 0; i < 20; i++) {
            await new Promise(r => setTimeout(r, 3000));
            try {
                const res = await fetch('/api/puentes-start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ magic_token: token }),
                });
                if (!res.ok) continue;
                const data = await res.json();
                if (data.all_generated) {
                    setChildren(data.children ?? []);
                    setStage('report');
                    return;
                }
            } catch { /* keep polling */ }
        }
        // Soft-fail: show whatever we have
        setStage('report');
    };

    // Each question mounts taller than a phone viewport can show; without a
    // reset the next card inherits whatever scroll offset the previous answer
    // left, hiding the prompt (and on the last, longest question, the options).
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [stage, currentIdx]);

    const questions = getPuentesQuestions(lang);
    // The questionnaire is generic (measures the adult, child-independent), so
    // there is no child anchor: submit against the first session and
    // puentes-complete propagates the profile to every sibling of the purchase.
    const anchorChild = children[0] ?? null;

    // Tap-through guard: the 0.2s question transition mounts the next card's
    // buttons in the same spots, so an impatient double tap would silently
    // answer the following question too.
    const lastSelectAt = useRef(0);

    const handleSelect = (optId: string) => {
        const now = performance.now();
        if (now - lastSelectAt.current < 350) return;
        lastSelectAt.current = now;
        const q = questions[currentIdx];
        const next: PuentesAnswer[] = [...answers, { questionId: q.id, optionId: optId }];
        setAnswers(next);
        if (currentIdx + 1 >= questions.length) {
            submitAnswers(next);
        } else {
            setCurrentIdx(currentIdx + 1);
        }
    };

    const submitAnswers = async (finalAnswers: PuentesAnswer[]) => {
        if (!anchorChild) return;
        setStage('generating');
        // DEV questionnaire mock: no API — simulate generation, show the report.
        if (import.meta.env.DEV && token === 'demo-cuestionario') {
            setTimeout(() => {
                setAdultProfile(DEMO_ADULT_PROFILE);
                setChildren(DEMO_CHILDREN);
                setStage('report');
            }, 1500);
            return;
        }
        try {
            const res = await fetch('/api/puentes-complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    puentes_session_id: anchorChild.puentes_session_id,
                    answers: finalAnswers,
                }),
            });
            if (!res.ok) throw new Error('complete failed');
            // Refresh: all generations happen in parallel; this fetch returns
            // when at least the anchor has ai_sections. Poller ensures the
            // others are picked up too.
            await pollUntilReady();
        } catch {
            setStage('error');
            setErrorMsg(getPuentesCopy(lang).errors.generic);
        }
    };

    // Fast-path (R6): generate from the saved fresh profile, skipping the
    // questionnaire. A 409 means the profile is no longer usable (expired in the
    // meantime / incomplete) — fall back to the normal questionnaire.
    const submitFastPath = async () => {
        if (!anchorChild) return;
        setStage('generating');
        try {
            const res = await fetch('/api/puentes-complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    puentes_session_id: anchorChild.puentes_session_id,
                    use_saved_profile: true,
                }),
            });
            if (res.status === 409) { setProfileFresh(false); setStage('question'); return; }
            if (!res.ok) throw new Error('complete failed');
            await pollUntilReady();
        } catch {
            setStage('error');
            setErrorMsg(getPuentesCopy(lang).errors.generic);
        }
    };

    if (stage === 'loading') {
        return <CenterScreen><PuentesGenerating lang={lang} /></CenterScreen>;
    }
    if (stage === 'error') {
        return <CenterScreen><p className="text-argo-secondary">{errorMsg}</p></CenterScreen>;
    }
    if (stage === 'pending_payment') {
        return <CenterScreen><p className="text-argo-secondary">{lang === 'en' ? 'Your purchase is still being processed. Please try again in a few minutes.' : lang === 'pt' ? 'Sua compra ainda está sendo processada. Tente novamente em alguns minutos.' : 'Tu compra todavía se está procesando. Intenta de nuevo en unos minutos.'}</p></CenterScreen>;
    }
    // The report owns its full page (topbar + content), like the child report.
    if (stage === 'report' && children.length > 0) {
        return (
            <PuentesReport
                lang={lang}
                adultProfile={adultProfile}
                recipientEmail={recipientEmail}
                recipientName={recipientName}
                children={children}
            />
        );
    }

    return (
        <div className="min-h-dvh bg-argo-neutral py-6 sm:py-12 px-4">
            {stage === 'intro' && (
                <PuentesIntro
                    lang={lang}
                    fastPath={profileFresh}
                    onStart={() => (profileFresh ? submitFastPath() : setStage('question'))}
                />
            )}
            {stage === 'question' && (
                <div className="space-y-6">
                    <div className="max-w-2xl mx-auto">
                        <PuentesProgress current={currentIdx + 1} total={questions.length} lang={lang} />
                    </div>
                    <AnimatePresence mode="wait">
                        <PuentesQuestion
                            key={questions[currentIdx].id}
                            question={questions[currentIdx]}
                            onSelect={(opt) => handleSelect(opt.id)}
                        />
                    </AnimatePresence>
                </div>
            )}
            {stage === 'generating' && <PuentesGenerating lang={lang} />}
        </div>
    );
}

function CenterScreen({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-dvh flex items-center justify-center bg-argo-neutral px-4 text-center">
            {children}
        </div>
    );
}
