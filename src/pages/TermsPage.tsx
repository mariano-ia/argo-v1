import React from 'react';
import { Link } from 'react-router-dom';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-8">
        <h2 className="text-lg font-bold text-argo-navy tracking-tight mb-3">{title}</h2>
        <div className="text-sm text-argo-secondary leading-relaxed space-y-3">{children}</div>
    </div>
);

export const TermsPage: React.FC = () => (
    <div className="min-h-screen bg-argo-neutral">
        <div className="max-w-[720px] mx-auto px-6 py-16">
            {/* Header */}
            <div className="mb-12">
                <Link to="/" className="inline-flex items-center gap-1.5 mb-8">
                    <span style={{ fontSize: '17px', letterSpacing: '-0.02em', color: '#1D1D1F' }}>
                        <span style={{ fontWeight: 800 }}>Argo</span><span style={{ fontWeight: 200, color: '#86868B' }}> Method</span>
                    </span>
                </Link>
                <h1 className="text-2xl font-bold text-argo-navy tracking-tight">Términos de Servicio</h1>
                <p className="text-sm text-argo-grey mt-2">Última actualización: 30 de marzo de 2026</p>
            </div>

            <Section title="1. Aceptación de los términos">
                <p>Al acceder y utilizar Argo Method ("la Plataforma"), aceptas estos Términos de Servicio. Si no estás de acuerdo, no utilices la Plataforma.</p>
            </Section>

            <Section title="2. Descripción del servicio">
                <p>Argo Method es una herramienta de perfilamiento conductual basada en el modelo DISC, diseñada para deportistas de 8 a 16 años. La Plataforma genera informes personalizados a partir de una experiencia interactiva completada por el deportista.</p>
                <p>Argo Method no es un diagnóstico clínico, psicológico ni médico. Los informes son orientativos y reflejan tendencias conductuales del momento presente, no etiquetas permanentes.</p>
            </Section>

            <Section title="3. Planes y suscripciones">
                <p><strong>Argo One:</strong> compra puntual de perfiles individuales. Sin suscripción. El informe se entrega por email. No incluye acceso al dashboard.</p>
                <p><strong>Planes institucionales (PRO, Academy, Enterprise):</strong> suscripciones mensuales o anuales que incluyen acceso al dashboard, jugadores activos según el plan contratado, y consultor IA incluido.</p>
                <p><strong>Trial:</strong> periodo de prueba gratuito de 14 días con hasta 8 jugadores activos y funcionalidades limitadas. Al vencer el trial, el dashboard pasa a solo lectura. Los perfiles no se eliminan.</p>
            </Section>

            <Section title="4. Modelo de roster">
                <p>Los planes institucionales funcionan con un modelo de "roster" (capacidad de jugadores activos). Cada plan tiene un límite de jugadores activos simultáneos. Perfilar y re-perfilar jugadores está incluido en la suscripción.</p>
                <p>El re-perfilamiento de un jugador está disponible cada 6 meses desde su último perfilamiento. Los jugadores pueden ser archivados para liberar lugar en el roster, sin perder sus datos.</p>
            </Section>

            <Section title="5. Consultor IA y política de uso justo">
                <p>El Consultor IA está incluido en todos los planes institucionales. Su uso está sujeto a una política de uso justo que contempla hasta 500 consultas mensuales en el plan PRO y hasta 1000 en el plan Academy.</p>
                <p>Argo Method se reserva el derecho de contactar a usuarios que excedan consistentemente estos límites para ofrecerles un plan más adecuado a su volumen de uso.</p>
                <p>El Consultor IA proporciona orientaciones basadas en la metodología Argo y los perfiles registrados. Las respuestas son orientativas y no reemplazan el criterio profesional del entrenador o adulto responsable.</p>
            </Section>

            <Section title="6. Uso aceptable">
                <p>Te comprometes a utilizar la Plataforma únicamente para fines legítimos relacionados con el perfilamiento conductual deportivo juvenil. Queda prohibido:</p>
                <p>Utilizar los perfiles para discriminar, etiquetar negativamente o excluir a un deportista. Compartir informes con terceros sin consentimiento del adulto responsable. Intentar acceder a datos de otros tenants. Usar la Plataforma de forma automatizada (bots, scraping).</p>
            </Section>

            <Section title="7. Propiedad intelectual">
                <p>La metodología Argo, los arquetipos, el contenido de los informes, y el diseño de la Plataforma son propiedad de Argo Method. Los datos de los deportistas perfilados son propiedad del adulto responsable y del tenant que los registró.</p>
            </Section>

            <Section title="8. Cancelación y reembolsos">
                <p>Las suscripciones pueden cancelarse en cualquier momento. La cancelación toma efecto al final del periodo facturado. No se realizan reembolsos por periodos parciales.</p>
                <p>Las compras de Argo One son finales y no reembolsables una vez que el link de juego ha sido utilizado.</p>
            </Section>

            <Section title="9. Limitación de responsabilidad">
                <p>Argo Method se proporciona "tal cual". No garantizamos que los informes serán exactos, completos o adecuados para decisiones específicas. El uso de los informes es responsabilidad del adulto que los recibe.</p>
            </Section>

            <Section title="10. Modificaciones">
                <p>Podemos modificar estos términos en cualquier momento. Los cambios se comunicarán por email a los usuarios con suscripción activa y entrarán en vigencia 30 días después de la notificación.</p>
            </Section>

            <Section title="11. Contacto">
                <p>Para consultas sobre estos términos: hola@argomethod.com</p>
            </Section>

            <div className="mt-12 pt-6 border-t border-argo-border">
                <Link to="/" className="text-sm text-argo-grey hover:text-argo-navy transition-colors">
                    Volver al inicio
                </Link>
            </div>
        </div>
    </div>
);
