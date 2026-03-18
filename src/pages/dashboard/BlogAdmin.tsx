import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { fetchAllPosts, deletePost, updatePost, type BlogPost } from '../../lib/blog';

type PostSummary = Omit<BlogPost, 'content'>;

export const BlogAdmin: React.FC = () => {
    const navigate = useNavigate();
    const [posts, setPosts] = useState<PostSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'draft' | 'published'>('all');
    const [deleting, setDeleting] = useState<string | null>(null);

    const load = () => {
        setLoading(true);
        fetchAllPosts(filter === 'all' ? undefined : filter)
            .then(setPosts)
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, [filter]);

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar este artículo?')) return;
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

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

    const FILTERS = [
        { key: 'all' as const, label: 'Todos' },
        { key: 'published' as const, label: 'Publicados' },
        { key: 'draft' as const, label: 'Borradores' },
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

            {/* Filters */}
            <div className="flex gap-1 mb-6">
                {FILTERS.map(f => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                            filter === f.key
                                ? 'bg-argo-indigo text-white'
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
                    <p className="text-argo-grey text-sm mb-4">No hay artículos{filter !== 'all' ? ` con estado "${filter}"` : ''}.</p>
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
                                <th className="px-4 py-3 font-semibold text-argo-grey text-xs uppercase tracking-wider">Título</th>
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
        </div>
    );
};
