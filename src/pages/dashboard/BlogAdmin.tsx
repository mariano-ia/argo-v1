import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Eye, EyeOff, Sparkles, Send, Loader2, ListTodo, SkipForward, Tag } from 'lucide-react';
import { fetchAllPosts, deletePost, updatePost, fetchTopics, skipTopic, deleteTopic, generateFromIdea, type BlogPost, type BlogTopic } from '../../lib/blog';

type PostSummary = Omit<BlogPost, 'content'>;

const PILLAR_LABELS: Record<string, string> = {
    arquetipos: 'Arquetipos',
    coaching: 'Coaching',
    padres: 'Padres',
    disc: 'DISC',
    deporte: 'Deporte',
    motivacion: 'Motivacion',
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pendiente', color: 'bg-blue-50 text-blue-700' },
    generating: { label: 'Generando', color: 'bg-amber-50 text-amber-700' },
    generated: { label: 'Generado', color: 'bg-green-50 text-green-700' },
    published: { label: 'Publicado', color: 'bg-green-50 text-green-700' },
    skipped: { label: 'Omitido', color: 'bg-gray-50 text-gray-500' },
};

export const BlogAdmin: React.FC = () => {
    const navigate = useNavigate();
    const [tab, setTab] = useState<'posts' | 'topics' | 'generate'>('posts');

    // Posts state
    const [posts, setPosts] = useState<PostSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'draft' | 'published'>('all');
    const [deleting, setDeleting] = useState<string | null>(null);

    // Topics state
    const [topics, setTopics] = useState<BlogTopic[]>([]);
    const [topicsLoading, setTopicsLoading] = useState(false);

    // Generate state
    const [idea, setIdea] = useState('');
    const [generating, setGenerating] = useState(false);
    const [genResults, setGenResults] = useState<{ lang: string; title: string; slug: string }[]>([]);
    const [genError, setGenError] = useState<string | null>(null);

    // ─── Posts ───────────────────────────────────────────────────────────────

    const loadPosts = () => {
        setLoading(true);
        fetchAllPosts(filter === 'all' ? undefined : filter)
            .then(setPosts)
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadPosts(); }, [filter]);

    const handleDelete = async (id: string) => {
        if (!confirm('Eliminar este articulo?')) return;
        setDeleting(id);
        await deletePost(id);
        setPosts(p => p.filter(x => x.id !== id));
        setDeleting(null);
    };

    const handleToggleStatus = async (post: PostSummary) => {
        const newStatus = post.status === 'published' ? 'draft' : 'published';
        await updatePost(post.id, {
            status: newStatus,
            ...(newStatus === 'published' ? { published_at: new Date().toISOString() } : {}),
        });
        setPosts(p => p.map(x => x.id === post.id ? { ...x, status: newStatus } : x));
    };

    // ─── Topics ─────────────────────────────────────────────────────────────

    const loadTopics = () => {
        setTopicsLoading(true);
        fetchTopics()
            .then(setTopics)
            .finally(() => setTopicsLoading(false));
    };

    useEffect(() => { if (tab === 'topics') loadTopics(); }, [tab]);

    const handleSkipTopic = async (id: string) => {
        await skipTopic(id);
        setTopics(t => t.map(x => x.id === id ? { ...x, status: 'skipped' as const } : x));
    };

    const handleDeleteTopic = async (id: string) => {
        if (!confirm('Eliminar este tema?')) return;
        await deleteTopic(id);
        setTopics(t => t.filter(x => x.id !== id));
    };

    // ─── Generate ───────────────────────────────────────────────────────────

    const handleGenerate = async () => {
        if (!idea.trim()) return;
        setGenerating(true);
        setGenResults([]);
        setGenError(null);
        try {
            const data = await generateFromIdea(idea.trim());
            setGenResults(data.results.map(r => ({ lang: r.lang, title: r.title, slug: r.slug })));
            setIdea('');
            loadPosts();
        } catch (err) {
            setGenError((err as Error).message);
        } finally {
            setGenerating(false);
        }
    };

    // ─── Helpers ────────────────────────────────────────────────────────────

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

    const POST_FILTERS = [
        { key: 'all' as const, label: 'Todos' },
        { key: 'published' as const, label: 'Publicados' },
        { key: 'draft' as const, label: 'Borradores' },
    ];

    const TABS = [
        { key: 'posts' as const, label: 'Posts', icon: <Eye size={14} /> },
        { key: 'generate' as const, label: 'Generar con IA', icon: <Sparkles size={14} /> },
        { key: 'topics' as const, label: 'Cola de temas', icon: <ListTodo size={14} /> },
    ];

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-bold text-argo-navy tracking-tight">Blog</h1>
                <button
                    onClick={() => navigate('/admin/blog/new')}
                    className="flex items-center gap-2 px-4 py-2 bg-argo-indigo text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
                >
                    <Plus size={15} /> Nuevo post
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 border-b border-argo-border pb-3">
                {TABS.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                            tab === t.key
                                ? 'bg-argo-indigo text-white'
                                : 'text-argo-grey hover:text-argo-navy hover:bg-argo-neutral'
                        }`}
                    >
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {/* ═══ POSTS TAB ═══ */}
            {tab === 'posts' && (
                <>
                    {/* Filters */}
                    <div className="flex gap-1 mb-6">
                        {POST_FILTERS.map(f => (
                            <button
                                key={f.key}
                                onClick={() => setFilter(f.key)}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                    filter === f.key
                                        ? 'bg-argo-navy text-white'
                                        : 'text-argo-grey hover:text-argo-navy hover:bg-argo-neutral'
                                }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-6 h-6 rounded-full border-2 border-argo-indigo border-t-transparent animate-spin" />
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-argo-grey text-sm mb-4">No hay articulos{filter !== 'all' ? ` con estado "${filter}"` : ''}.</p>
                            <button
                                onClick={() => navigate('/admin/blog/new')}
                                className="text-argo-indigo text-sm font-semibold hover:underline"
                            >
                                Crear el primero
                            </button>
                        </div>
                    ) : (
                        <div className="bg-white border border-argo-border rounded-xl overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-argo-border text-left">
                                        <th className="px-4 py-3 font-semibold text-argo-grey text-xs uppercase tracking-wider">Titulo</th>
                                        <th className="px-4 py-3 font-semibold text-argo-grey text-xs uppercase tracking-wider w-12">Lang</th>
                                        <th className="px-4 py-3 font-semibold text-argo-grey text-xs uppercase tracking-wider w-20">Origen</th>
                                        <th className="px-4 py-3 font-semibold text-argo-grey text-xs uppercase tracking-wider w-24">Estado</th>
                                        <th className="px-4 py-3 font-semibold text-argo-grey text-xs uppercase tracking-wider w-28">Fecha</th>
                                        <th className="px-4 py-3 font-semibold text-argo-grey text-xs uppercase tracking-wider w-32 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {posts.map(post => (
                                        <tr key={post.id} className="border-b border-argo-border last:border-0 hover:bg-argo-neutral/50 transition-colors">
                                            <td className="px-4 py-3">
                                                <span className="font-medium text-argo-navy">{post.title}</span>
                                                <span className="block text-xs text-argo-grey mt-0.5">/{post.slug}</span>
                                                {post.tags && post.tags.length > 0 && (
                                                    <div className="flex gap-1 mt-1">
                                                        {post.tags.slice(0, 3).map(tag => (
                                                            <span key={tag} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-argo-neutral text-argo-grey">
                                                                <Tag size={8} />{tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-argo-neutral text-argo-secondary">
                                                    {post.lang}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                                    post.generated_by === 'human' ? 'text-argo-grey' : 'text-argo-violet-500'
                                                }`}>
                                                    {post.generated_by === 'human' ? 'Manual' : post.generated_by === 'ai-cron' ? 'Auto' : 'On-demand'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                    post.status === 'published'
                                                        ? 'bg-green-50 text-green-700'
                                                        : 'bg-yellow-50 text-yellow-700'
                                                }`}>
                                                    {post.status === 'published' ? 'Publicado' : 'Borrador'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-argo-grey text-xs">
                                                {formatDate(post.published_at)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => handleToggleStatus(post)}
                                                        title={post.status === 'published' ? 'Pasar a borrador' : 'Publicar'}
                                                        className="p-1.5 rounded-lg text-argo-grey hover:text-argo-navy hover:bg-argo-neutral transition-all"
                                                    >
                                                        {post.status === 'published' ? <EyeOff size={14} /> : <Eye size={14} />}
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/admin/blog/edit/${post.id}`)}
                                                        title="Editar"
                                                        className="p-1.5 rounded-lg text-argo-grey hover:text-argo-navy hover:bg-argo-neutral transition-all"
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(post.id)}
                                                        disabled={deleting === post.id}
                                                        title="Eliminar"
                                                        className="p-1.5 rounded-lg text-argo-grey hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-40"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* ═══ GENERATE TAB ═══ */}
            {tab === 'generate' && (
                <div className="max-w-2xl">
                    <div className="bg-white border border-argo-border rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles size={16} className="text-argo-violet-500" />
                            <h2 className="text-sm font-bold text-argo-navy">Generar desde una idea</h2>
                        </div>
                        <p className="text-xs text-argo-grey mb-4">
                            Escribe una idea en lenguaje natural. El sistema genera 3 versiones (ES, EN, PT), las humaniza y las publica.
                        </p>
                        <textarea
                            value={idea}
                            onChange={e => setIdea(e.target.value)}
                            placeholder="Ej: Como un entrenador puede usar los perfiles DISC para mejorar la comunicacion con sus jugadores..."
                            rows={3}
                            disabled={generating}
                            className="w-full px-3 py-2 text-sm border border-argo-border rounded-lg bg-white text-argo-navy placeholder:text-argo-grey/50 focus:outline-none focus:ring-2 focus:ring-argo-violet-200 focus:border-argo-violet-400 transition-all resize-y disabled:opacity-50"
                        />
                        <div className="flex items-center justify-between mt-3">
                            <span className="text-[10px] text-argo-grey uppercase tracking-wider">
                                Se publica directamente
                            </span>
                            <button
                                onClick={handleGenerate}
                                disabled={generating || idea.trim().length < 5}
                                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-argo-violet-500 text-white hover:bg-argo-violet-600 transition-all disabled:opacity-40"
                            >
                                {generating ? (
                                    <><Loader2 size={14} className="animate-spin" /> Generando...</>
                                ) : (
                                    <><Send size={14} /> Generar y publicar</>
                                )}
                            </button>
                        </div>

                        {genResults.length > 0 && (
                            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg space-y-2">
                                <p className="text-sm text-green-800 font-medium">Publicado en {genResults.length} idiomas:</p>
                                {genResults.map(r => (
                                    <div key={r.lang} className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-green-700 w-5">{r.lang}</span>
                                        <a
                                            href={`/blog/${r.slug}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-green-600 hover:underline truncate"
                                        >
                                            {r.title}
                                        </a>
                                    </div>
                                ))}
                            </div>
                        )}

                        {genError && (
                            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-800">Error: {genError}</p>
                            </div>
                        )}
                    </div>

                    {/* Info card */}
                    <div className="mt-4 bg-argo-neutral border border-argo-border rounded-xl p-4">
                        <h3 className="text-xs font-bold text-argo-navy uppercase tracking-wider mb-2">Proceso automatico</h3>
                        <div className="space-y-1.5 text-xs text-argo-secondary">
                            <p>1. Gemini genera el articulo en ES, EN y PT con voz Argo</p>
                            <p>2. Un segundo paso humaniza cada version (elimina patrones de IA)</p>
                            <p>3. Se inyectan links internos y se vinculan las 3 versiones (hreflang)</p>
                            <p>4. Se publican con meta description, tags y schema markup</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ TOPICS TAB ═══ */}
            {tab === 'topics' && (
                <div>
                    <p className="text-xs text-argo-grey mb-4">
                        Cola de temas generados por el motor de contenido. El cron selecciona el tema con mayor relevancia y publica automaticamente (lunes y jueves 10 AM).
                    </p>

                    {topicsLoading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-6 h-6 rounded-full border-2 border-argo-indigo border-t-transparent animate-spin" />
                        </div>
                    ) : topics.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-argo-grey text-sm">No hay temas en cola. El cron los genera automaticamente.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {topics.map(topic => (
                                <div key={topic.id} className="bg-white border border-argo-border rounded-xl p-4 flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                STATUS_LABELS[topic.status]?.color ?? 'bg-gray-50 text-gray-500'
                                            }`}>
                                                {STATUS_LABELS[topic.status]?.label ?? topic.status}
                                            </span>
                                            <span className="text-[10px] text-argo-grey font-semibold uppercase tracking-wider">
                                                {PILLAR_LABELS[topic.pillar] ?? topic.pillar}
                                            </span>
                                            <span className="text-[10px] text-argo-light">
                                                Relevancia: {topic.relevance_score}
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium text-argo-navy truncate">{topic.title}</p>
                                        {topic.description && (
                                            <p className="text-xs text-argo-grey mt-0.5 truncate">{topic.description}</p>
                                        )}
                                        <div className="flex items-center gap-3 mt-1 text-[10px] text-argo-light">
                                            <span>Audiencia: {topic.audience}</span>
                                            <span>Formato: {topic.format}</span>
                                            {topic.archetype_ref && <span>Arquetipo: {topic.archetype_ref.replace('_', ' ')}</span>}
                                        </div>
                                    </div>
                                    {topic.status === 'pending' && (
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                onClick={() => handleSkipTopic(topic.id)}
                                                title="Omitir"
                                                className="p-1.5 rounded-lg text-argo-grey hover:text-amber-600 hover:bg-amber-50 transition-all"
                                            >
                                                <SkipForward size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTopic(topic.id)}
                                                title="Eliminar"
                                                className="p-1.5 rounded-lg text-argo-grey hover:text-red-500 hover:bg-red-50 transition-all"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    )}
                                    {topic.post_id && (
                                        <a
                                            href={`/admin/blog/edit/${topic.post_id}`}
                                            className="text-xs text-argo-indigo hover:underline shrink-0"
                                        >
                                            Ver post
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
