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
import type { AdultProfile, Lang, PuentesAnswer, PuentesAiSections } from '../types/puentes';

interface ChildProfileSnapshot {
    eje: string;
    motor: string;
    archetype_label: string;
    sport: string;
}

type Stage = 'loading' | 'intro' | 'question' | 'generating' | 'report' | 'error' | 'pending_payment';

export default function PuentesFlow() {
    const { token } = useParams<{ token: string }>();
    const [stage, setStage] = useState<Stage>('loading');
    const [puentesSessionId, setPuentesSessionId] = useState<string | null>(null);
    const [childName, setChildName] = useState('');
    const [lang, setLang] = useState<Lang>('es');
    const [answers, setAnswers] = useState<PuentesAnswer[]>([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [aiSections, setAiSections] = useState<PuentesAiSections | null>(null);
    const [adultProfile, setAdultProfile] = useState<AdultProfile | null>(null);
    const [childProfile, setChildProfile] = useState<ChildProfileSnapshot | null>(null);
    const [recipientEmail, setRecipientEmail] = useState<string | null>(null);
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
                setPuentesSessionId(data.puentes_session_id);
                setChildName(data.child_name || '');
                setLang(data.lang || 'es');
                if (data.adult_profile) setAdultProfile(data.adult_profile);
                if (data.child_profile) setChildProfile(data.child_profile);
                if (data.recipient_email) setRecipientEmail(data.recipient_email);
                if (data.already_generated && data.ai_sections) {
                    setAiSections(data.ai_sections);
                    setStage('report');
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

    const questions = getPuentesQuestions(lang);

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
        if (!puentesSessionId) return;
        setStage('generating');
        try {
            const res = await fetch('/api/puentes-complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ puentes_session_id: puentesSessionId, answers: finalAnswers }),
            });
            if (!res.ok) throw new Error('complete failed');

            // Re-fetch start to grab generated sections
            const refresh = await fetch('/api/puentes-start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ magic_token: token }),
            });
            const data = await refresh.json();
            if (data.adult_profile) setAdultProfile(data.adult_profile);
            if (data.child_profile) setChildProfile(data.child_profile);
            if (data.recipient_email) setRecipientEmail(data.recipient_email);
            if (data.ai_sections) {
                setAiSections(data.ai_sections);
                setStage('report');
            } else {
                setStage('error');
                setErrorMsg(getPuentesCopy(lang).errors.generic);
            }
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

    return (
        <div className="min-h-screen bg-argo-neutral py-12 px-4">
            {stage === 'intro' && (
                <PuentesIntro childName={childName} lang={lang} onStart={() => setStage('question')} />
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
                            childName={childName}
                            onSelect={(opt) => handleSelect(opt.id)}
                        />
                    </AnimatePresence>
                </div>
            )}
            {stage === 'generating' && <PuentesGenerating lang={lang} />}
            {stage === 'report' && aiSections && (
                <PuentesReport
                    aiSections={aiSections}
                    lang={lang}
                    adultProfile={adultProfile}
                    childProfile={childProfile}
                    recipientEmail={recipientEmail}
                />
            )}
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
