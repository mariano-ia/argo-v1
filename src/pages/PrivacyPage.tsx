import React from 'react';
import { Link } from 'react-router-dom';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-8">
        <h2 className="text-lg font-bold text-argo-navy tracking-tight mb-3">{title}</h2>
        <div className="text-sm text-argo-secondary leading-relaxed space-y-3">{children}</div>
    </div>
);

export const PrivacyPage: React.FC = () => (
    <div className="min-h-screen bg-argo-neutral">
        <div className="max-w-[720px] mx-auto px-6 py-16">
            {/* Header */}
            <div className="mb-12">
                <Link to="/" className="inline-flex items-center gap-1.5 mb-8">
                    <span style={{ fontSize: '17px', letterSpacing: '-0.02em', color: '#1D1D1F' }}>
                        <span style={{ fontWeight: 800 }}>Argo</span><span style={{ fontWeight: 200, color: '#86868B' }}> Method</span>
                    </span>
                </Link>
                <h1 className="text-2xl font-bold text-argo-navy tracking-tight">Política de Privacidad</h1>
                <p className="text-sm text-argo-grey mt-2">Última actualización: 30 de marzo de 2026</p>
            </div>

            <Section title="1. Datos que recopilamos">
                <p><strong>Del adulto responsable (padre, madre, tutor o entrenador):</strong> nombre, dirección de email, rol en la institución (si aplica).</p>
                <p><strong>Del deportista:</strong> nombre, edad, deporte practicado, y respuestas a la experiencia interactiva (12 preguntas de selección múltiple con tiempos de respuesta). No recopilamos datos biométricos, imágenes ni grabaciones.</p>
                <p><strong>Del tenant (institución):</strong> nombre de la institución, tipo, país, ciudad, logo, datos de suscripción.</p>
            </Section>

            <Section title="2. Cómo usamos los datos">
                <p>Los datos del deportista se utilizan exclusivamente para generar el informe de perfil conductual basado en la metodología DISC. Los datos del adulto se utilizan para entregar el informe y gestionar la cuenta en la Plataforma.</p>
                <p>Las respuestas del deportista se procesan mediante inteligencia artificial (Google Gemini) para personalizar las secciones narrativas del informe. Los datos enviados al servicio de IA no incluyen el apellido del deportista y se procesan de forma transitoria (no se almacenan en los servidores del proveedor de IA).</p>
            </Section>

            <Section title="3. Almacenamiento y seguridad">
                <p>Los datos se almacenan en Supabase (PostgreSQL), con servidores en la región configurada por el proyecto. Las comunicaciones se realizan mediante HTTPS. El acceso a la base de datos está protegido por Row Level Security (RLS) y claves de servicio que nunca se exponen al cliente.</p>
                <p>Los emails se envían a través de Resend desde el dominio noreply@argomethod.com.</p>
            </Section>

            <Section title="4. Servicios de terceros">
                <p>Utilizamos los siguientes servicios de terceros para operar la Plataforma:</p>
                <p><strong>Supabase:</strong> base de datos y autenticación. <strong>Google Gemini:</strong> generación de texto personalizado para informes y consultor IA. <strong>Resend:</strong> envío de emails transaccionales. <strong>Vercel:</strong> hosting y funciones serverless.</p>
                <p>Cada servicio tiene su propia política de privacidad y procesamiento de datos.</p>
            </Section>

            <Section title="5. Datos de menores">
                <p>Argo Method está diseñado para perfilar deportistas de 8 a 16 años. La experiencia interactiva siempre es supervisada y autorizada por un adulto responsable que completa el registro previo y acepta los términos.</p>
                <p>No recopilamos datos de menores sin el consentimiento explícito del adulto responsable. No utilizamos los datos de menores con fines publicitarios ni los compartimos con terceros salvo los servicios necesarios para operar la Plataforma.</p>
            </Section>

            <Section title="6. Retención de datos">
                <p>Los perfiles de deportistas se conservan mientras el tenant mantenga una suscripción activa o mientras el adulto responsable no solicite su eliminación. Los perfiles archivados se conservan pero no ocupan lugar en el equipo activo.</p>
                <p>Los datos de Argo One (compra puntual) se conservan indefinidamente asociados al email del adulto responsable, salvo solicitud de eliminación.</p>
            </Section>

            <Section title="7. Derechos del usuario">
                <p>Tienes derecho a: acceder a tus datos y los de los deportistas bajo tu responsabilidad; solicitar la corrección de datos incorrectos; solicitar la eliminación de perfiles; exportar tus datos en formato estándar.</p>
                <p>Para ejercer estos derechos, contacta a hola@argomethod.com.</p>
            </Section>

            <Section title="8. Cookies">
                <p>Argo Method utiliza localStorage del navegador para persistir preferencias (idioma, sesión de autenticación). No utilizamos cookies de terceros ni herramientas de tracking publicitario.</p>
            </Section>

            <Section title="9. Modificaciones">
                <p>Podemos actualizar esta política periódicamente. Los cambios significativos se comunicarán por email a los usuarios con cuenta activa.</p>
            </Section>

            <Section title="10. Contacto">
                <p>Para consultas sobre privacidad y protección de datos: hola@argomethod.com</p>
            </Section>

            <div className="mt-12 pt-6 border-t border-argo-border">
                <Link to="/" className="text-sm text-argo-grey hover:text-argo-navy transition-colors">
                    Volver al inicio
                </Link>
            </div>
        </div>
    </div>
);
