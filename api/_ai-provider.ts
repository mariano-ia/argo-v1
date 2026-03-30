/**
 * Shared AI provider abstraction.
 * Supports OpenAI and Google Gemini via AI_PROVIDER env var.
 * Default: 'gemini' (cheaper, comparable quality for coaching use case).
 */

export interface AIMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface AIResponse {
    content: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
}

// ─── Pricing constants ──────────────────────────────────────────────────────

const PRICING = {
    openai: {
        inputPerToken: 0.15 / 1_000_000,   // gpt-4o-mini
        outputPerToken: 0.60 / 1_000_000,
    },
    gemini: {
        inputPerToken: 0.15 / 1_000_000,   // gemini-2.5-flash
        outputPerToken: 0.60 / 1_000_000,
    },
};

export function getProvider(): 'openai' | 'gemini' {
    const prov = process.env.AI_PROVIDER?.toLowerCase();
    if (prov === 'openai') return 'openai';
    return 'gemini'; // default
}

export function getCostUsd(response: AIResponse): number {
    const p = PRICING[getProvider()];
    return response.inputTokens * p.inputPerToken + response.outputTokens * p.outputPerToken;
}

// ─── OpenAI call ────────────────────────────────────────────────────────────

async function callOpenAI(messages: AIMessage[], opts: { temperature: number; maxTokens: number }): Promise<AIResponse> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('Missing OPENAI_API_KEY');

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: messages.map(m => ({ role: m.role, content: m.content })),
            temperature: opts.temperature,
            max_tokens: opts.maxTokens,
        }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`OpenAI error ${res.status}: ${JSON.stringify(err)}`);
    }

    const data = await res.json();
    return {
        content: data.choices?.[0]?.message?.content ?? '',
        inputTokens: data.usage?.prompt_tokens ?? 0,
        outputTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0,
    };
}

// ─── Gemini call ────────────────────────────────────────────────────────────

async function callGemini(messages: AIMessage[], opts: { temperature: number; maxTokens: number }): Promise<AIResponse> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('Missing GEMINI_API_KEY');

    // Separate system message from conversation
    const systemMsg = messages.find(m => m.role === 'system');
    const conversationMsgs = messages.filter(m => m.role !== 'system');

    // Convert to Gemini format (role: 'user' | 'model')
    const contents = conversationMsgs.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
    }));

    const body: Record<string, unknown> = {
        contents,
        generationConfig: {
            temperature: opts.temperature,
            maxOutputTokens: opts.maxTokens,
        },
    };

    if (systemMsg) {
        body.systemInstruction = { parts: [{ text: systemMsg.content }] };
    }

    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        },
    );

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Gemini error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const usage = data.usageMetadata ?? {};

    return {
        content,
        inputTokens: usage.promptTokenCount ?? 0,
        outputTokens: usage.candidatesTokenCount ?? 0,
        totalTokens: usage.totalTokenCount ?? 0,
    };
}

// ─── Unified call ───────────────────────────────────────────────────────────

export async function callAI(
    messages: AIMessage[],
    opts: { temperature?: number; maxTokens?: number } = {},
): Promise<AIResponse> {
    const provider = getProvider();
    const temperature = opts.temperature ?? 0.7;
    const maxTokens = opts.maxTokens ?? 3000;

    if (provider === 'openai') {
        return callOpenAI(messages, { temperature, maxTokens });
    }
    return callGemini(messages, { temperature, maxTokens });
}
