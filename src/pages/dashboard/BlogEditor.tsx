import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Send } from 'lucide-react';
import { createPost, updatePost, fetchPostById, slugify } from '../../lib/blog';

export const BlogEditor: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isEditing = Boolean(id);

    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [metaDescription, setMetaDescription] = useState('');
    const [content, setContent] = useState('');
    const [lang, setLang] = useState('es');
    const [status, setStatus] = useState<'draft' | 'published'>('draft');
    const [loading, setLoading] = useState(isEditing);
    const [saving, setSaving] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [slugManual, setSlugManual] = useState(false);

    useEffect(() => {
        if (!id) return;
        fetchPostById(id).then(post => {
            setTitle(post.title);
            setSlug(post.slug);
            setMetaDescription(post.meta_description ?? '');
            setContent(post.content);
            setLang(post.lang);
            setStatus(post.status);
            setSlugManual(true);
        }).finally(() => setLoading(false));
    }, [id]);

    // Auto-generate slug from title unless manually edited
    useEffect(() => {
        if (!slugManual) setSlug(slugify(title));
    }, [title, slugManual]);

    const handleSave = async (publishStatus?: 'draft' | 'published') => {
        const finalStatus = publishStatus ?? status;
        setSaving(true);
        try {
            const data = {
                title, slug, content, lang,
                meta_description: metaDescription || null,
                status: finalStatus,
                published_at: finalStatus === 'published' ? new Date().toISOString() : new Date().toISOString(),
            };
            if (isEditing && id) {
                await updatePost(id, data);
            } else {
                await createPost(data as Parameters<typeof createPost>[0]);
            }
            navigate('/admin/blog');
        } catch (err) {
            alert('Error al guardar: ' + (err as Error).message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <div className="w-6 h-6 rounded-full border-2 border-argo-indigo border-t-transparent animate-spin" />
            </div>
        );
    }

    const inputClass = 'w-full px-3 py-2 text-sm border border-argo-border rounded-lg bg-white text-argo-navy placeholder:text-argo-grey/50 focus:outline-none focus:ring-2 focus:ring-argo-indigo/20 focus:border-argo-indigo transition-all';
    const labelClass = 'block text-xs font-semibold text-argo-grey uppercase tracking-wider mb-1.5';

    return (
        <div className="max-w-4xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/admin/blog')}
                        className="p-1.5 rounded-lg text-argo-grey hover:text-argo-navy hover:bg-argo-neutral transition-all"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <h1 className="text-xl font-bold text-argo-navy tracking-tight">
                        {isEditing ? 'Editar artículo' : 'Nuevo artículo'}
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowPreview(p => !p)}
                        className="px-3 py-2 text-xs font-semibold rounded-lg text-argo-grey hover:text-argo-navy hover:bg-argo-neutral transition-all"
                    >
                        {showPreview ? 'Editor' : 'Preview'}
                    </button>
                    <button
                        onClick={() => handleSave('draft')}
                        disabled={saving || !title || !content}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg border border-argo-border text-argo-navy hover:bg-argo-neutral transition-all disabled:opacity-40"
                    >
                        <Save size={14} /> Guardar borrador
                    </button>
                    <button
                        onClick={() => handleSave('published')}
                        disabled={saving || !title || !content}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg bg-argo-indigo text-white hover:opacity-90 transition-opacity disabled:opacity-40"
                    >
                        <Send size={14} /> Publicar
                    </button>
                </div>
            </div>

            {showPreview ? (
                /* ── Preview ── */
                <div className="bg-white border border-argo-border rounded-xl p-8">
                    <span className="text-xs text-argo-grey font-semibold uppercase tracking-wider">Preview</span>
                    <h1 style={{ fontWeight: 300, fontSize: '2rem', lineHeight: 1.1, letterSpacing: '-0.03em' }}
                        className="text-argo-navy mt-4 mb-6">
                        {title || 'Sin título'}
                    </h1>
                    {metaDescription && (
                        <p className="text-sm text-argo-grey mb-6 italic">{metaDescription}</p>
                    )}
                    <div
                        className="blog-content"
                        style={{ fontSize: '16px', lineHeight: 1.8, color: '#424245' }}
                        dangerouslySetInnerHTML={{ __html: content }}
                    />
                </div>
            ) : (
                /* ── Editor ── */
                <div className="space-y-5">
                    {/* Title */}
                    <div>
                        <label className={labelClass}>Título</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="El título del artículo"
                            className={inputClass}
                            style={{ fontSize: '16px', fontWeight: 500 }}
                        />
                    </div>

                    {/* Slug */}
                    <div>
                        <label className={labelClass}>Slug (URL)</label>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-argo-grey">/blog/</span>
                            <input
                                type="text"
                                value={slug}
                                onChange={e => { setSlug(e.target.value); setSlugManual(true); }}
                                placeholder="slug-del-articulo"
                                className={inputClass}
                            />
                        </div>
                    </div>

                    {/* Meta description */}
                    <div>
                        <label className={labelClass}>
                            Meta descripción
                            <span className="text-argo-grey/50 font-normal normal-case ml-1">({metaDescription.length}/160)</span>
                        </label>
                        <input
                            type="text"
                            value={metaDescription}
                            onChange={e => setMetaDescription(e.target.value)}
                            placeholder="Descripción para buscadores (150-160 caracteres)"
                            maxLength={200}
                            className={inputClass}
                        />
                    </div>

                    {/* Row: Lang + Status */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Idioma</label>
                            <select value={lang} onChange={e => setLang(e.target.value)} className={inputClass}>
                                <option value="es">Español</option>
                                <option value="en">English</option>
                                <option value="pt">Português</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Estado</label>
                            <select value={status} onChange={e => setStatus(e.target.value as 'draft' | 'published')} className={inputClass}>
                                <option value="draft">Borrador</option>
                                <option value="published">Publicado</option>
                            </select>
                        </div>
                    </div>

                    {/* Content */}
                    <div>
                        <label className={labelClass}>Contenido (HTML)</label>
                        <textarea
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            placeholder="<h2>Subtítulo</h2><p>Contenido del artículo...</p>"
                            rows={20}
                            className={`${inputClass} font-mono text-xs leading-relaxed resize-y`}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
