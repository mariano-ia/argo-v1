import React from 'react';
import { QuestionManager } from '../../components/admin/QuestionManager';

export const QuestionsAdmin: React.FC = () => (
    <div>
        <h1 className="font-display text-2xl font-bold text-argo-navy mb-6">Preguntas</h1>
        <QuestionManager />
    </div>
);
