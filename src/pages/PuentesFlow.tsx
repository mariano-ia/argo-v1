import { useEffect, useState } from 'react';
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
    motor: string;
    archetype_label: string;
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

export default function PuentesFlow() {
    const { token } = useParams<{ token: string }>();
    const [stage, setStage] = useState<Stage>('loading');
    const [children, setChildren] = useState<ChildEntry[]>([]);
    const [anchorIdx, setAnchorIdx] = useState(0);
    const [lang, setLang] = useState<Lang>('es');
    const [answers, setAnswers] = useState<PuentesAnswer[]>([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [adultProfile, setAdultProfile] = useState<AdultProfile | null>(null);
    const [recipientEmail, setRecipientEmail] = useState<string | null>(null);
    const [recipientName, setRecipientName] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (!token) {
            setStage('error');
            setErrorMsg('Missing token');
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

    const questions = getPuentesQuestions(lang);
    const anchorChild = children[anchorIdx] ?? null;
    const anchorName = anchorChild?.child_name || (lang === 'en' ? 'your child' : lang === 'pt' ? 'seu filho' : 'tu hijo');

    const handleSelect = (optId: string) => {
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
        <div className="min-h-screen bg-argo-neutral py-12 px-4">
            {stage === 'intro' && (
                <PuentesIntro
                    childName={anchorName}
                    lang={lang}
                    childOptions={children.length > 1 ? children.map(c => c.child_name || '').filter(Boolean) : []}
                    selectedAnchor={anchorIdx}
                    onAnchorChange={setAnchorIdx}
                    onStart={() => setStage('question')}
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
                            childName={anchorName}
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
        <div className="min-h-screen flex items-center justify-center bg-argo-neutral px-4 text-center">
            {children}
        </div>
    );
}
