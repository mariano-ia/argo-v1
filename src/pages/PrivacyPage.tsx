import React from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../context/LangContext';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-8">
        <h2 className="text-lg font-bold text-argo-navy tracking-tight mb-3">{title}</h2>
        <div className="text-sm text-argo-secondary leading-relaxed space-y-3">{children}</div>
    </div>
);

// ─── Content ────────────────────────────────────────────────────────────────
//
// Content is defined as JSX per language. Keeping it inline (vs a separate
// translation file) because privacy policies are long, legally dense, and
// benefit from having paragraph structure visible next to the markup. When
// the content is revised, editors work with one file instead of jumping
// between a translations map and a rendering component.

const LAST_UPDATED = {
    es: 'Última actualización: 15 de abril de 2026',
    en: 'Last updated: April 15, 2026',
    pt: 'Última atualização: 15 de abril de 2026',
};

// eslint-disable-next-line react/display-name
const ContentES: React.FC = () => (
    <>
        <Section title="1. Quiénes somos y alcance">
            <p>Argo Method es una herramienta de perfilamiento conductual diseñada para deportistas de 8 a 16 años. Esta política explica qué datos recopilamos, cómo los usamos, cómo los protegemos, y qué derechos tienes sobre ellos.</p>
            <p>Al utilizar Argo Method aceptas esta política. Si no estás de acuerdo, no utilices la Plataforma.</p>
            <p>Si tienes entre 8 y 12 años, no puedes usar Argo Method directamente. Solo puedes participar en la experiencia si un adulto responsable (padre, madre o tutor legal) ha completado el registro y la verificación parental previa.</p>
        </Section>

        <Section title="2. Datos que recopilamos">
            <p><strong>Del adulto responsable:</strong> nombre, dirección de email, y rol en la institución (si aplica). Para suscriptores, también datos de facturación procesados por nuestros proveedores de pago.</p>
            <p><strong>Del deportista:</strong> nombre (habitualmente solo el primero), edad, deporte practicado, y respuestas a las 12 preguntas gamificadas de la experiencia interactiva. Registramos tiempos de respuesta y métricas de tres mini-juegos incluidos en la experiencia. <strong>No recopilamos</strong> datos biométricos, imágenes, grabaciones, voz, ni información de geolocalización precisa.</p>
            <p><strong>Del tenant (institución):</strong> nombre, tipo, país, ciudad, logo, y datos de suscripción.</p>
            <p><strong>Auditoría de consentimiento:</strong> cuando se recopilan datos de un menor de 13 años, almacenamos el timestamp, dirección IP y user agent del adulto responsable al confirmar el consentimiento, como exige COPPA.</p>
        </Section>

        <Section title="3. Cómo usamos los datos">
            <p>Los datos del deportista se utilizan <strong>exclusivamente</strong> para generar el informe de perfil conductual basado en la metodología DISC + Motor de Argo Method. Los datos del adulto se utilizan para entregar el informe, gestionar la cuenta, y comunicarnos sobre el servicio.</p>
            <p><strong>No vendemos, alquilamos ni cedemos datos a terceros con fines publicitarios.</strong> No utilizamos los datos de menores para publicidad bajo ninguna circunstancia.</p>
            <p>Las respuestas del deportista se procesan mediante inteligencia artificial (Google Gemini) para personalizar las secciones narrativas del informe. Antes de enviar cualquier dato al proveedor de IA, eliminamos o anonimizamos la información identificable del menor (reemplazamos su nombre por un marcador genérico). El proveedor de IA procesa los datos de forma transitoria y no los almacena.</p>
        </Section>

        <Section title="4. Consentimiento parental verificable (COPPA)">
            <p>Argo Method cumple con la Children's Online Privacy Protection Act (COPPA) de los Estados Unidos, 15 U.S.C. § 6501 et seq.</p>
            <p>Cuando un adulto registra a un menor de 13 años, enviamos un correo al email proporcionado con un link único de confirmación. El registro no avanza, ni se crea ninguna sesión de juego, ni se envía ningún dato del menor a nuestros servicios de inteligencia artificial, hasta que el adulto confirma su identidad clickeando ese link.</p>
            <p>El link expira en 24 horas. Si no se usa a tiempo, el intento de registro se descarta y debe reiniciarse. Cada token de consentimiento es de un solo uso: una vez que se ha creado la sesión del menor, el token queda inutilizable.</p>
            <p>Durante la confirmación registramos la dirección IP y el user agent del adulto como prueba del consentimiento, conforme al reglamento de la FTC.</p>
        </Section>

        <Section title="5. Servicios de terceros">
            <p>Utilizamos los siguientes proveedores para operar la Plataforma. Cada uno tiene su propia política de privacidad y procesa los datos únicamente para los servicios descritos:</p>
            <p><strong>Supabase</strong> (base de datos PostgreSQL y autenticación) · <strong>Google Gemini</strong> (generación de texto narrativo, con datos anonimizados) · <strong>Resend</strong> (envío de emails transaccionales desde hola@argomethod.com) · <strong>Vercel</strong> (hosting, funciones serverless y analítica de sitio privacy-first) · <strong>Stripe</strong> y <strong>MercadoPago</strong> (procesamiento de pagos de suscripciones y compras únicas).</p>
            <p>La analítica de sitio (Vercel Analytics) se ejecuta únicamente en rutas de marketing (landing, blog, precios, términos, privacidad, dashboard). <strong>Las rutas del juego no ejecutan ninguna herramienta de analítica</strong>. No utilizamos cookies de terceros ni herramientas de tracking publicitario.</p>
        </Section>

        <Section title="6. Almacenamiento y seguridad">
            <p>Los datos se almacenan en Supabase (PostgreSQL). Las comunicaciones entre el cliente y el servidor utilizan HTTPS. El acceso a la base de datos está protegido por Row Level Security y claves de servicio que nunca se exponen al cliente. El personal de Argo Method solo accede a datos individuales cuando es necesario para soporte técnico o para responder a una solicitud del usuario.</p>
            <p>Los backups automáticos de la base de datos se retienen por un máximo de 30 días y se purgan según una rotación automática.</p>
        </Section>

        <Section title="7. Retención de datos">
            <p><strong>Perfiles activos:</strong> los perfiles de deportistas se conservan mientras el tenant mantenga una suscripción activa y el adulto responsable no haya solicitado su eliminación.</p>
            <p><strong>Perfiles archivados:</strong> los tenants pueden archivar perfiles para liberar lugar en el equipo activo. Los perfiles archivados se conservan por un máximo de 2 años desde la última actualización y se eliminan automáticamente después de ese plazo.</p>
            <p><strong>Argo One (compra puntual):</strong> los datos de una sesión Argo One se conservan por un máximo de 2 años desde la fecha de compra y se eliminan automáticamente.</p>
            <p><strong>Tokens de consentimiento expirados:</strong> los tokens no confirmados se eliminan pasadas 24 horas. Los tokens confirmados pero no utilizados se eliminan pasadas 48 horas.</p>
        </Section>

        <Section title="8. Derechos del adulto responsable y del menor">
            <p>Como adulto responsable de un menor perfilado con Argo Method, tienes derecho a:</p>
            <p><strong>Acceder</strong> a todos los datos que hemos recopilado sobre el menor. <strong>Corregir</strong> datos incorrectos. <strong>Eliminar</strong> permanentemente todos los datos del menor de nuestros sistemas. <strong>Exportar</strong> los datos en formato estándar legible. <strong>Retirar</strong> el consentimiento en cualquier momento, lo cual detiene inmediatamente cualquier recopilación futura.</p>
            <p><strong>Eliminación autoservicio:</strong> puedes solicitar la eliminación permanente desde <Link to="/delete" className="underline text-argo-indigo">esta página</Link>. Te enviaremos un email con un enlace de confirmación (válido por 1 hora) y al clickearlo eliminamos todos los datos asociados sin intervención manual. Para cualquier otro derecho, escribe a <strong>hola@argomethod.com</strong> desde la dirección de email que usaste para registrarte. Procesamos las solicitudes en un máximo de 10 días hábiles.</p>
            <p>Cuando solicitas la eliminación de los datos de un menor, eliminamos de forma permanente todos los registros asociados al perfil: respuestas, reporte generado, metadatos de IA, audit log de consentimiento, y cualquier dato derivado. La eliminación no es reversible.</p>
        </Section>

        <Section title="9. Notificación de incidentes">
            <p>Si detectamos un acceso no autorizado a datos personales, notificaremos por email a los usuarios afectados dentro de las 72 horas siguientes al descubrimiento del incidente, conforme a las mejores prácticas de la industria y la regulación aplicable.</p>
        </Section>

        <Section title="10. Cambios a esta política">
            <p>Podemos actualizar esta política periódicamente. Los cambios significativos se comunicarán por email a los usuarios con cuenta activa con al menos 30 días de antelación, y el uso continuado de la Plataforma tras esa fecha implica aceptación de los nuevos términos.</p>
        </Section>

        <Section title="11. Contacto">
            <p>Para consultas sobre privacidad y protección de datos, o para ejercer cualquiera de los derechos descritos en esta política: <strong>hola@argomethod.com</strong>.</p>
            <p>Argo Method no tiene presencia física en Estados Unidos. Para consultas específicas de COPPA, escribe al mismo email con "COPPA" en el asunto y te responderemos dentro de 10 días hábiles.</p>
        </Section>
    </>
);

// eslint-disable-next-line react/display-name
const ContentEN: React.FC = () => (
    <>
        <Section title="1. Who we are and scope">
            <p>Argo Method is a behavioral profiling tool designed for youth athletes aged 8 to 16. This policy explains what data we collect, how we use it, how we protect it, and what rights you have over it.</p>
            <p>By using Argo Method, you accept this policy. If you do not agree, please do not use the Platform.</p>
            <p>If you are between 8 and 12 years old, you cannot use Argo Method directly. You can only participate in the experience if a responsible adult (parent or legal guardian) has completed the registration and parental verification process first.</p>
        </Section>

        <Section title="2. Data we collect">
            <p><strong>From the responsible adult:</strong> name, email address, and role at the institution (if applicable). For subscribers, billing information processed by our payment providers.</p>
            <p><strong>From the athlete:</strong> first name (typically first name only), age, sport practiced, and answers to the 12 gamified questions of the interactive experience. We record response times and metrics from three mini-games built into the experience. <strong>We do not collect</strong> biometric data, images, recordings, voice, or precise geolocation.</p>
            <p><strong>From the tenant (institution):</strong> name, type, country, city, logo, and subscription data.</p>
            <p><strong>Consent audit trail:</strong> when we collect data from a child under 13, we store the timestamp, IP address, and user agent of the responsible adult at the moment they confirm consent, as required by COPPA.</p>
        </Section>

        <Section title="3. How we use the data">
            <p>Athlete data is used <strong>exclusively</strong> to generate the behavioral profile report based on Argo Method's DISC + Motor methodology. Adult data is used to deliver the report, manage the account, and communicate about the service.</p>
            <p><strong>We do not sell, rent, or share data with third parties for advertising purposes.</strong> We never use children's data for advertising under any circumstances.</p>
            <p>Athlete answers are processed by artificial intelligence (Google Gemini) to personalize the narrative sections of the report. Before sending any data to the AI provider, we strip or anonymize identifying information about the child (we replace their name with a generic placeholder). The AI provider processes the data transiently and does not store it.</p>
        </Section>

        <Section title="4. Verifiable Parental Consent (COPPA)">
            <p>Argo Method complies with the Children's Online Privacy Protection Act (COPPA), 15 U.S.C. § 6501 et seq.</p>
            <p>When an adult registers a child under 13, we send an email to the provided address with a unique confirmation link. The registration does not proceed, no game session is created, and no child data is sent to our AI services, until the adult confirms their identity by clicking that link.</p>
            <p>The link expires in 24 hours. If not used in time, the registration attempt is discarded and must be restarted. Each consent token is single-use: once a child's session has been created, the token cannot be reused.</p>
            <p>During confirmation, we record the adult's IP address and user agent as proof of consent, in line with FTC regulation.</p>
        </Section>

        <Section title="5. Third-party services">
            <p>We use the following providers to operate the Platform. Each has its own privacy policy and processes data only for the services described:</p>
            <p><strong>Supabase</strong> (PostgreSQL database and authentication) · <strong>Google Gemini</strong> (narrative text generation, with anonymized data) · <strong>Resend</strong> (transactional email delivery from hola@argomethod.com) · <strong>Vercel</strong> (hosting, serverless functions, and privacy-first site analytics) · <strong>Stripe</strong> and <strong>MercadoPago</strong> (subscription and one-time payment processing).</p>
            <p>Site analytics (Vercel Analytics) runs only on marketing routes (landing, blog, pricing, terms, privacy, dashboard). <strong>Game routes run no analytics at all.</strong> We do not use third-party cookies or advertising tracking tools.</p>
        </Section>

        <Section title="6. Storage and security">
            <p>Data is stored in Supabase (PostgreSQL). Client-server communication uses HTTPS. Database access is protected by Row Level Security and service keys that are never exposed to the client. Argo Method staff access individual data only when required for technical support or to respond to a user request.</p>
            <p>Automatic database backups are retained for a maximum of 30 days and purged via automatic rotation.</p>
        </Section>

        <Section title="7. Data retention">
            <p><strong>Active profiles:</strong> athlete profiles are retained while the tenant maintains an active subscription and the responsible adult has not requested their deletion.</p>
            <p><strong>Archived profiles:</strong> tenants can archive profiles to free up roster space. Archived profiles are retained for up to 2 years from the last update and automatically deleted after that period.</p>
            <p><strong>Argo One (one-time purchase):</strong> Argo One session data is retained for up to 2 years from the purchase date and automatically deleted.</p>
            <p><strong>Expired consent tokens:</strong> unconfirmed tokens are deleted after 24 hours. Confirmed but unused tokens are deleted after 48 hours.</p>
        </Section>

        <Section title="8. Rights of the responsible adult and the child">
            <p>As the adult responsible for a child profiled with Argo Method, you have the right to:</p>
            <p><strong>Access</strong> all data we have collected about the child. <strong>Correct</strong> inaccurate data. <strong>Delete</strong> all child data from our systems permanently. <strong>Export</strong> the data in a standard readable format. <strong>Withdraw</strong> consent at any time, which immediately stops any future collection.</p>
            <p><strong>Self-service deletion:</strong> you can request permanent deletion from <Link to="/delete" className="underline text-argo-indigo">this page</Link>. We will email you a confirmation link (valid for 1 hour) and on click we delete all associated data without manual intervention. For any other right, email <strong>hola@argomethod.com</strong> from the email address you used to register. We process requests within a maximum of 10 business days.</p>
            <p>When you request deletion of a child's data, we permanently delete all records associated with the profile: answers, generated report, AI metadata, consent audit log, and any derived data. Deletion is not reversible.</p>
        </Section>

        <Section title="9. Breach notification">
            <p>If we detect unauthorized access to personal data, we will notify affected users by email within 72 hours of discovery, consistent with industry best practices and applicable regulation.</p>
        </Section>

        <Section title="10. Changes to this policy">
            <p>We may update this policy from time to time. Significant changes will be communicated by email to users with active accounts at least 30 days in advance, and continued use of the Platform after that date implies acceptance of the new terms.</p>
        </Section>

        <Section title="11. Contact">
            <p>For privacy and data protection inquiries, or to exercise any of the rights described in this policy: <strong>hola@argomethod.com</strong>.</p>
            <p>Argo Method does not have a physical presence in the United States. For COPPA-specific inquiries, email the same address with "COPPA" in the subject line and we will respond within 10 business days.</p>
        </Section>
    </>
);

// eslint-disable-next-line react/display-name
const ContentPT: React.FC = () => (
    <>
        <Section title="1. Quem somos e escopo">
            <p>Argo Method é uma ferramenta de perfilamento comportamental desenhada para atletas jovens de 8 a 16 anos. Esta política explica quais dados coletamos, como os usamos, como os protegemos e quais direitos você tem sobre eles.</p>
            <p>Ao usar o Argo Method você aceita esta política. Se não concorda, não utilize a Plataforma.</p>
            <p>Se você tem entre 8 e 12 anos, não pode usar o Argo Method diretamente. Só pode participar se um adulto responsável (pai, mãe ou responsável legal) tiver completado o registro e a verificação parental prévia.</p>
        </Section>

        <Section title="2. Dados que coletamos">
            <p><strong>Do adulto responsável:</strong> nome, endereço de email e função na instituição (se aplicável). Para assinantes, dados de faturação processados por nossos provedores de pagamento.</p>
            <p><strong>Do atleta:</strong> nome (geralmente apenas o primeiro), idade, esporte praticado e respostas às 12 perguntas gamificadas da experiência interativa. Registramos tempos de resposta e métricas de três mini-jogos incluídos na experiência. <strong>Não coletamos</strong> dados biométricos, imagens, gravações, voz, nem informação de geolocalização precisa.</p>
            <p><strong>Do tenant (instituição):</strong> nome, tipo, país, cidade, logo e dados de assinatura.</p>
            <p><strong>Auditoria de consentimento:</strong> quando coletamos dados de um menor de 13 anos, armazenamos o timestamp, endereço IP e user agent do adulto responsável no momento em que confirma o consentimento, conforme exige a COPPA.</p>
        </Section>

        <Section title="3. Como usamos os dados">
            <p>Os dados do atleta são usados <strong>exclusivamente</strong> para gerar o relatório de perfil comportamental baseado na metodologia DISC + Motor do Argo Method. Os dados do adulto são usados para entregar o relatório, gerenciar a conta e comunicar sobre o serviço.</p>
            <p><strong>Não vendemos, alugamos nem compartilhamos dados com terceiros para fins publicitários.</strong> Nunca usamos dados de menores para publicidade sob nenhuma circunstância.</p>
            <p>As respostas do atleta são processadas por inteligência artificial (Google Gemini) para personalizar as seções narrativas do relatório. Antes de enviar qualquer dado ao provedor de IA, removemos ou anonimizamos a informação identificável do menor (substituímos seu nome por um marcador genérico). O provedor de IA processa os dados de forma transitória e não os armazena.</p>
        </Section>

        <Section title="4. Consentimento parental verificável (COPPA)">
            <p>O Argo Method cumpre com a Children's Online Privacy Protection Act (COPPA) dos Estados Unidos, 15 U.S.C. § 6501 et seq.</p>
            <p>Quando um adulto registra um menor de 13 anos, enviamos um email ao endereço fornecido com um link único de confirmação. O registro não avança, nenhuma sessão de jogo é criada, e nenhum dado do menor é enviado aos nossos serviços de inteligência artificial, até que o adulto confirme sua identidade clicando nesse link.</p>
            <p>O link expira em 24 horas. Se não for usado a tempo, a tentativa de registro é descartada e deve ser reiniciada. Cada token de consentimento é de uso único: uma vez criada a sessão do menor, o token não pode ser reutilizado.</p>
            <p>Durante a confirmação registramos o endereço IP e o user agent do adulto como prova do consentimento, conforme a regulamentação da FTC.</p>
        </Section>

        <Section title="5. Serviços de terceiros">
            <p>Usamos os seguintes provedores para operar a Plataforma. Cada um tem sua própria política de privacidade e processa os dados apenas para os serviços descritos:</p>
            <p><strong>Supabase</strong> (banco de dados PostgreSQL e autenticação) · <strong>Google Gemini</strong> (geração de texto narrativo, com dados anonimizados) · <strong>Resend</strong> (envio de emails transacionais a partir de hola@argomethod.com) · <strong>Vercel</strong> (hosting, funções serverless e analytics privacy-first do site) · <strong>Stripe</strong> e <strong>MercadoPago</strong> (processamento de pagamentos de assinaturas e compras únicas).</p>
            <p>A analítica do site (Vercel Analytics) roda apenas em rotas de marketing (landing, blog, preços, termos, privacidade, dashboard). <strong>As rotas do jogo não executam nenhuma ferramenta de analítica.</strong> Não usamos cookies de terceiros nem ferramentas de tracking publicitário.</p>
        </Section>

        <Section title="6. Armazenamento e segurança">
            <p>Os dados são armazenados no Supabase (PostgreSQL). A comunicação cliente-servidor utiliza HTTPS. O acesso ao banco de dados está protegido por Row Level Security e chaves de serviço que nunca são expostas ao cliente. A equipe do Argo Method só acessa dados individuais quando necessário para suporte técnico ou para responder a uma solicitação do usuário.</p>
            <p>Os backups automáticos do banco são retidos por no máximo 30 dias e purgados via rotação automática.</p>
        </Section>

        <Section title="7. Retenção de dados">
            <p><strong>Perfis ativos:</strong> os perfis de atletas são conservados enquanto o tenant mantiver uma assinatura ativa e o adulto responsável não tiver solicitado sua eliminação.</p>
            <p><strong>Perfis arquivados:</strong> os tenants podem arquivar perfis para liberar espaço no equipe ativo. Os perfis arquivados são conservados por no máximo 2 anos desde a última atualização e eliminados automaticamente após esse prazo.</p>
            <p><strong>Argo One (compra única):</strong> os dados de uma sessão Argo One são conservados por no máximo 2 anos desde a data de compra e eliminados automaticamente.</p>
            <p><strong>Tokens de consentimento expirados:</strong> tokens não confirmados são eliminados após 24 horas. Tokens confirmados mas não utilizados são eliminados após 48 horas.</p>
        </Section>

        <Section title="8. Direitos do adulto responsável e do menor">
            <p>Como adulto responsável por um menor perfilado com o Argo Method, você tem direito a:</p>
            <p><strong>Acessar</strong> todos os dados que coletamos sobre o menor. <strong>Corrigir</strong> dados incorretos. <strong>Eliminar</strong> permanentemente todos os dados do menor de nossos sistemas. <strong>Exportar</strong> os dados em formato padrão legível. <strong>Retirar</strong> o consentimento a qualquer momento, o que detém imediatamente qualquer coleta futura.</p>
            <p><strong>Exclusão em autoatendimento:</strong> você pode solicitar a exclusão permanente a partir <Link to="/delete" className="underline text-argo-indigo">desta página</Link>. Enviaremos um email com um link de confirmação (válido por 1 hora) e ao clicar excluímos todos os dados associados sem intervenção manual. Para qualquer outro direito, escreva para <strong>hola@argomethod.com</strong> a partir do email que você usou para registrar-se. Processamos as solicitações em no máximo 10 dias úteis.</p>
            <p>Quando você solicita a eliminação dos dados de um menor, eliminamos permanentemente todos os registros associados ao perfil: respostas, relatório gerado, metadados de IA, audit log de consentimento e qualquer dado derivado. A eliminação não é reversível.</p>
        </Section>

        <Section title="9. Notificação de incidentes">
            <p>Se detectarmos acesso não autorizado a dados pessoais, notificaremos por email os usuários afetados dentro das 72 horas seguintes à descoberta do incidente, conforme as melhores práticas da indústria e a regulamentação aplicável.</p>
        </Section>

        <Section title="10. Mudanças nesta política">
            <p>Podemos atualizar esta política periodicamente. Mudanças significativas serão comunicadas por email aos usuários com conta ativa com pelo menos 30 dias de antecedência, e o uso contínuo da Plataforma após essa data implica aceitação dos novos termos.</p>
        </Section>

        <Section title="11. Contato">
            <p>Para consultas sobre privacidade e proteção de dados, ou para exercer qualquer dos direitos descritos nesta política: <strong>hola@argomethod.com</strong>.</p>
            <p>O Argo Method não tem presença física nos Estados Unidos. Para consultas específicas de COPPA, escreva ao mesmo email com "COPPA" no assunto e responderemos em até 10 dias úteis.</p>
        </Section>
    </>
);

// ─── Page ───────────────────────────────────────────────────────────────────

const TITLES = {
    es: 'Política de Privacidad',
    en: 'Privacy Policy',
    pt: 'Política de Privacidade',
};

const BACK = {
    es: 'Volver al inicio',
    en: 'Back to home',
    pt: 'Voltar ao início',
};

export const PrivacyPage: React.FC = () => {
    const { lang } = useLang();

    return (
        <div className="min-h-screen bg-argo-neutral">
            <div className="max-w-[720px] mx-auto px-6 py-16">
                <div className="mb-12">
                    <Link to="/" className="inline-flex items-center gap-1.5 mb-8">
                        <span style={{ fontSize: '17px', letterSpacing: '-0.02em', color: '#1D1D1F' }}>
                            <span style={{ fontWeight: 800 }}>Argo</span><span style={{ fontWeight: 200, color: '#86868B' }}> Method</span>
                        </span>
                    </Link>
                    <h1 className="text-2xl font-bold text-argo-navy tracking-tight">{TITLES[lang]}</h1>
                    <p className="text-sm text-argo-grey mt-2">{LAST_UPDATED[lang]}</p>
                </div>

                {lang === 'en' ? <ContentEN /> : lang === 'pt' ? <ContentPT /> : <ContentES />}

                <div className="mt-12 pt-6 border-t border-argo-border">
                    <Link to="/" className="text-sm text-argo-grey hover:text-argo-navy transition-colors">
                        {BACK[lang]}
                    </Link>
                </div>
            </div>
        </div>
    );
};
