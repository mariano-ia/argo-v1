import { supabase } from './supabase';

export interface BlogPost {
    id: string;
    slug: string;
    title: string;
    seo_title: string | null;
    meta_description: string | null;
    content: string;
    lang: string;
    status: 'draft' | 'published';
    category: string | null;
    tags: string[];
    featured_image: string | null;
    reading_time: number | null;
    generated_by: 'human' | 'ai-cron' | 'ai-demand';
    topic_id: string | null;
    published_at: string;
    created_at: string;
}

export interface BlogTopic {
    id: string;
    title: string;
    description: string | null;
    pillar: string;
    audience: string;
    format: string;
    archetype_ref: string | null;
    relevance_score: number;
    status: 'pending' | 'generating' | 'generated' | 'published' | 'skipped';
    lang: string;
    source: string;
    post_id: string | null;
    created_at: string;
    generated_at: string | null;
    published_at: string | null;
}

// ─── Public queries ──────────────────────────────────────────────────────────

export async function fetchPosts(lang = 'es') {
    const { data, error } = await supabase
        .from('blog_posts')
        .select('id, slug, title, meta_description, lang, status, published_at, created_at')
        .eq('status', 'published')
        .eq('lang', lang)
        .order('published_at', { ascending: false });

    if (error) throw error;
    return data as Omit<BlogPost, 'content'>[];
}

export async function fetchPostBySlug(slug: string) {
    const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();

    if (error) throw error;
    return data as BlogPost | null;
}

// ─── Admin queries ───────────────────────────────────────────────────────────

export async function fetchAllPosts(statusFilter?: 'draft' | 'published') {
    let query = supabase
        .from('blog_posts')
        .select('id, slug, title, meta_description, lang, status, published_at, created_at')
        .order('created_at', { ascending: false });

    if (statusFilter) query = query.eq('status', statusFilter);

    const { data, error } = await query;
    if (error) throw error;
    return data as Omit<BlogPost, 'content'>[];
}

export async function fetchPostById(id: string) {
    const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data as BlogPost;
}

export async function createPost(post: Omit<BlogPost, 'id' | 'created_at'>) {
    const { data, error } = await supabase
        .from('blog_posts')
        .insert(post)
        .select()
        .single();

    if (error) throw error;
    return data as BlogPost;
}

export async function updatePost(id: string, updates: Partial<Omit<BlogPost, 'id' | 'created_at'>>) {
    const { data, error } = await supabase
        .from('blog_posts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as BlogPost;
}

export async function deletePost(id: string) {
    const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

export function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

// ─── Topic queries ──────────────────────────────────────────────────────────

export async function fetchTopics(statusFilter?: BlogTopic['status']) {
    let query = supabase
        .from('blog_topics')
        .select('*')
        .order('relevance_score', { ascending: false });

    if (statusFilter) query = query.eq('status', statusFilter);

    const { data, error } = await query;
    if (error) throw error;
    return data as BlogTopic[];
}

export async function skipTopic(id: string) {
    const { error } = await supabase
        .from('blog_topics')
        .update({ status: 'skipped' })
        .eq('id', id);
    if (error) throw error;
}

export async function deleteTopic(id: string) {
    const { error } = await supabase
        .from('blog_topics')
        .delete()
        .eq('id', id);
    if (error) throw error;
}

// ─── On-demand generation ───────────────────────────────────────────────────

export async function generateFromIdea(idea: string, lang = 'es'): Promise<{ post_id: string; slug: string; title: string; status: string }> {
    const res = await fetch('/api/blog-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea, lang }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.error || 'Generation failed');
    }
    return res.json();
}
