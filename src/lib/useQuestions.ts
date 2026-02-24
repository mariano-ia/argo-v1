import { useState, useEffect } from 'react';
import { QUESTIONS, Question } from './onboardingData';

const STORAGE_KEY = 'argo_custom_questions';

export function useQuestions() {
    const [questions, setQuestions] = useState<Question[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) return JSON.parse(stored) as Question[];
        } catch {}
        return QUESTIONS;
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
    }, [questions]);

    const updateQuestion = (index: number, updated: Question) => {
        setQuestions(prev => prev.map((q, i) => i === index ? updated : q));
    };

    const addQuestion = () => {
        const newQ: Question = {
            number: questions.length + 1,
            title: 'Nueva Pregunta',
            intro: 'Escribí el enunciado aquí...',
            options: [
                { label: 'Opción A', axis: 'D' },
                { label: 'Opción B', axis: 'I' },
                { label: 'Opción C', axis: 'S' },
                { label: 'Opción D', axis: 'C' },
            ],
        };
        setQuestions(prev => [...prev, newQ]);
    };

    const deleteQuestion = (index: number) => {
        setQuestions(prev => prev.filter((_, i) => i !== index).map((q, i) => ({ ...q, number: i + 1 })));
    };

    const moveQuestion = (index: number, direction: 'up' | 'down') => {
        const next = [...questions];
        const target = direction === 'up' ? index - 1 : index + 1;
        if (target < 0 || target >= next.length) return;
        [next[index], next[target]] = [next[target], next[index]];
        setQuestions(next.map((q, i) => ({ ...q, number: i + 1 })));
    };

    const resetToDefaults = () => {
        localStorage.removeItem(STORAGE_KEY);
        setQuestions(QUESTIONS);
    };

    return { questions, updateQuestion, addQuestion, deleteQuestion, moveQuestion, resetToDefaults };
}
