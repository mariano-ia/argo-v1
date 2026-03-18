import { supabase } from './supabase';

export interface BlogPost {
    id: string;
    slug: string;
    title: string;
    meta_description: string | null;
    content: string;
    lang: string;
    status: 'draft' | 'published';
    published_at: string;
    created_at: string;
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
