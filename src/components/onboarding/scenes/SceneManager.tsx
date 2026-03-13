import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PortScene } from './PortScene';
import { OpenSeaScene } from './OpenSeaScene';
import { StormScene } from './StormScene';
import { CalmScene } from './CalmScene';
import { IslandScene } from './IslandScene';

/** Maps question index (0-11) to scene phase. */
function getSceneKey(questionIndex: number): string {
    if (questionIndex <= 1) return 'port';
    if (questionIndex <= 3) return 'open-sea';
    if (questionIndex <= 6) return 'storm';
    if (questionIndex <= 9) return 'calm';
    return 'island';
}

const SCENES: Record<string, React.FC> = {
    'port': PortScene,
    'open-sea': OpenSeaScene,
    'storm': StormScene,
    'calm': CalmScene,
    'island': IslandScene,
};

interface SceneManagerProps {
    /** Current question index (0-11). Use -1 for story/non-question screens to show port. */
    questionIndex: number;
}

/** Renders the appropriate background scene with a crossfade transition. */
export const SceneManager: React.FC<SceneManagerProps> = ({ questionIndex }) => {
    const key = getSceneKey(Math.max(0, questionIndex));
    const SceneComponent = SCENES[key];

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={key}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0"
            >
                <SceneComponent />
            </motion.div>
        </AnimatePresence>
    );
};
