
import { getReportData } from './argosEngine';

describe('Argos Engine Logic', () => {

    test('Retorna texto exacto para combinación válida (D + Lento)', () => {
        const result = getReportData('D', 'Lento', 'Mantenga su interés', 'Mariano');

        // Arquetipo
        expect(result.arquetipo.id).toBe('tanque');
        expect(result.arquetipo.label).toBe('Impulsor Persistente');

        // Bienvenida (personalizada)
        expect(result.bienvenida).toContain('manera en que Mariano vive');

        // Brújula
        expect(result.brujula).toBe('Tendencia hacia la Dominancia. Motivación central: Impacto y Control. Aporte principal: determinación y coraje.');

        // Ritmo
        expect(result.ritmo).toBe('Tiempo de Procesamiento Deliberado. Prioriza la firmeza y la seguridad sobre la velocidad pura.');

        // Sintonía
        expect(result.sintonia?.hacer).toBe('Roles de lectura o distribución del juego');
    });

    test('Retorna [DATA_MISSING] para combinaciones desconocidas', () => {
        const result = getReportData('X', 'Hyper', 'SituacionDesconocida');

        expect(result.arquetipo.label).toBe('[DATA_MISSING]');
        expect(result.brujula).toBe('[DATA_MISSING]');
        expect(result.ritmo).toBe('[DATA_MISSING]');
        expect(result.sintonia?.hacer).toBe('[DATA_MISSING]');
    });

    test('Maneja Eje C+S correctamente', () => {
        const result = getReportData('C+S', 'Lento', '');
        expect(result.arquetipo.id).toBe('ajedrecista');
    });
});
