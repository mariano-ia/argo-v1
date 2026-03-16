import React, { useState } from 'react';
import { ChildResultReveal } from '../components/onboarding/screens/ChildResultReveal';
import { CHILD_REVEAL_TEXTS } from '../lib/childRevealTexts';

const ARCHETYPES = Object.keys(CHILD_REVEAL_TEXTS);

export const ResultRevealPreview: React.FC = () => {
    const [idx, setIdx] = useState(1); // Start with impulsor_decidido

    const id = ARCHETYPES[idx];
    const text = CHILD_REVEAL_TEXTS[id];
    const label = id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    return (
        <>
            <ChildResultReveal
                nombreNino="Marian"
                arquetipoLabel={label}
                adultEmail="padre@email.com"
                resultText={text}
            />
            {/* Dev control — cycle archetypes */}
            <div className="fixed top-4 right-4 flex items-center gap-2" style={{ zIndex: 100 }}>
                <button
                    onClick={() => setIdx((idx + 1) % ARCHETYPES.length)}
                    className="font-quest text-white/60 text-xs bg-black/50 px-2 py-1 rounded cursor-pointer"
                >
                    {idx + 1}/{ARCHETYPES.length}: {label} →
                </button>
            </div>
        </>
    );
};
