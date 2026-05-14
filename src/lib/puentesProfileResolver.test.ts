import { describe, expect, it } from 'vitest';
import { resolveAdultProfile } from './puentesProfileResolver';
import { PUENTES_QUESTIONS } from './puentesQuestions';
import type { PuentesAnswer } from '../types/puentes';

describe('resolveAdultProfile', () => {
    it('resolves a pure-D adult with agile motor and regulated pressure', () => {
        const answers: PuentesAnswer[] = [
            { questionId: 'q1', optionId: 'q1a' }, // D
            { questionId: 'q2', optionId: 'q2b' }, // D
            { questionId: 'q3', optionId: 'q3c' }, // D
            { questionId: 'q4', optionId: 'q4c' }, // D
            { questionId: 'q5', optionId: 'q5a' }, // D
            { questionId: 'q6', optionId: 'q6c' }, // D
            { questionId: 'q7', optionId: 'q7b' }, // D
            { questionId: 'q8', optionId: 'q8c' }, // D
            { questionId: 'q9', optionId: 'q9a' }, // agil
            { questionId: 'q10', optionId: 'q10b' }, // agil
            { questionId: 'q11', optionId: 'q11a' }, // regulado
            { questionId: 'q12', optionId: 'q12a' }, // regulado
            { questionId: 'q13', optionId: 'q13b' }, // regulado
            { questionId: 'q14', optionId: 'q14a' }, // ex_competitive
            { questionId: 'q15', optionId: 'q15a' }, // orgullo
        ];
        const r = resolveAdultProfile(answers, 'es');
        expect(r.eje_primary).toBe('D');
        expect(r.eje_secondary).toBeNull();
        expect(r.motor).toBe('agil');
        expect(r.pressure_style).toBe('regulado');
        expect(r.history).toBe('ex_competitive');
        expect(r.dominant_emotion).toBe('orgullo');
    });

    it('returns a secondary axis when it scores >= 3', () => {
        // 5x D, 3x I → primary D, secondary I
        const answers: PuentesAnswer[] = [
            { questionId: 'q1', optionId: 'q1a' }, // D
            { questionId: 'q2', optionId: 'q2b' }, // D
            { questionId: 'q3', optionId: 'q3c' }, // D
            { questionId: 'q4', optionId: 'q4c' }, // D
            { questionId: 'q5', optionId: 'q5a' }, // D
            { questionId: 'q6', optionId: 'q6b' }, // I
            { questionId: 'q7', optionId: 'q7d' }, // I
            { questionId: 'q8', optionId: 'q8a' }, // I
            { questionId: 'q9', optionId: 'q9b' }, // equilibrado
            { questionId: 'q10', optionId: 'q10c' }, // equilibrado
            { questionId: 'q11', optionId: 'q11a' }, // regulado
            { questionId: 'q12', optionId: 'q12b' }, // evitativo
            { questionId: 'q13', optionId: 'q13c' }, // evitativo
            { questionId: 'q14', optionId: 'q14c' }, // recreational
            { questionId: 'q15', optionId: 'q15c' }, // disfrute
        ];
        const r = resolveAdultProfile(answers, 'es');
        expect(r.eje_primary).toBe('D');
        expect(r.eje_secondary).toBe('I');
        expect(r.motor).toBe('equilibrado');
        expect(r.pressure_style).toBe('evitativo');
    });

    it('returns null secondary when second axis < 3', () => {
        // 6x D, 2x S → S(2) < 3
        const answers: PuentesAnswer[] = [
            { questionId: 'q1', optionId: 'q1a' }, // D
            { questionId: 'q2', optionId: 'q2b' }, // D
            { questionId: 'q3', optionId: 'q3c' }, // D
            { questionId: 'q4', optionId: 'q4c' }, // D
            { questionId: 'q5', optionId: 'q5a' }, // D
            { questionId: 'q6', optionId: 'q6c' }, // D
            { questionId: 'q7', optionId: 'q7c' }, // S
            { questionId: 'q8', optionId: 'q8b' }, // S
            { questionId: 'q9', optionId: 'q9a' },
            { questionId: 'q10', optionId: 'q10b' },
            { questionId: 'q11', optionId: 'q11a' },
            { questionId: 'q12', optionId: 'q12a' },
            { questionId: 'q13', optionId: 'q13b' },
            { questionId: 'q14', optionId: 'q14d' },
            { questionId: 'q15', optionId: 'q15f' },
        ];
        const r = resolveAdultProfile(answers, 'es');
        expect(r.eje_primary).toBe('D');
        expect(r.eje_secondary).toBeNull();
    });

    it('defaults motor to equilibrado on a tie', () => {
        const answers: PuentesAnswer[] = [
            { questionId: 'q1', optionId: 'q1a' },
            { questionId: 'q2', optionId: 'q2b' },
            { questionId: 'q3', optionId: 'q3c' },
            { questionId: 'q4', optionId: 'q4c' },
            { questionId: 'q5', optionId: 'q5a' },
            { questionId: 'q6', optionId: 'q6c' },
            { questionId: 'q7', optionId: 'q7b' },
            { questionId: 'q8', optionId: 'q8c' },
            { questionId: 'q9', optionId: 'q9a' },   // agil
            { questionId: 'q10', optionId: 'q10a' }, // profundo → tie 1-1, equilibrado wins by default
            { questionId: 'q11', optionId: 'q11a' },
            { questionId: 'q12', optionId: 'q12a' },
            { questionId: 'q13', optionId: 'q13b' },
            { questionId: 'q14', optionId: 'q14a' },
            { questionId: 'q15', optionId: 'q15a' },
        ];
        const r = resolveAdultProfile(answers, 'es');
        expect(r.motor).toBe('equilibrado');
    });

    it('throws when any required question is missing', () => {
        const partial: PuentesAnswer[] = [
            { questionId: 'q1', optionId: 'q1a' },
        ];
        expect(() => resolveAdultProfile(partial, 'es')).toThrow(/missing/i);
    });

    it('every language has 15 questions with identical structure', () => {
        const es = PUENTES_QUESTIONS.es;
        const en = PUENTES_QUESTIONS.en;
        const pt = PUENTES_QUESTIONS.pt;
        expect(es.length).toBe(15);
        expect(en.length).toBe(15);
        expect(pt.length).toBe(15);
        es.forEach((q, i) => {
            expect(en[i].id).toBe(q.id);
            expect(pt[i].id).toBe(q.id);
            expect(en[i].block).toBe(q.block);
            expect(pt[i].block).toBe(q.block);
            expect(en[i].options.length).toBe(q.options.length);
            expect(pt[i].options.length).toBe(q.options.length);
            // Mapping fields must match exactly across languages
            en[i].options.forEach((opt, j) => {
                expect(opt.id).toBe(q.options[j].id);
                expect(opt.axis).toBe(q.options[j].axis);
                expect(opt.motor).toBe(q.options[j].motor);
                expect(opt.pressure).toBe(q.options[j].pressure);
                expect(opt.contextKey).toBe(q.options[j].contextKey);
                expect(opt.contextValue).toBe(q.options[j].contextValue);
            });
            pt[i].options.forEach((opt, j) => {
                expect(opt.id).toBe(q.options[j].id);
                expect(opt.axis).toBe(q.options[j].axis);
                expect(opt.motor).toBe(q.options[j].motor);
                expect(opt.pressure).toBe(q.options[j].pressure);
                expect(opt.contextKey).toBe(q.options[j].contextKey);
                expect(opt.contextValue).toBe(q.options[j].contextValue);
            });
        });
    });
});
