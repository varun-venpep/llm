import { prisma } from './prisma';
import OpenAI from 'openai';

/**
 * Hierarchical Translation Logic:
 * 1. Primary: Tenant's Custom OpenAI Key (from settings)
 * 2. Fallback: Platform's TranslateGemma Service (internal URL)
 * 3. Last Resort: Platform's Global OpenAI Key (from env)
 */
export async function translateText(text: string, targetLocale: string, tenantId: string) {
    if (!text || !targetLocale) return text;

    // 1. Get Tenant and check for custom OpenAI key
    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { openaiKey: true }
    });

    if (tenant?.openaiKey) {
        console.log(`[Translate] Using Tenant-Specific OpenAI Key for ${targetLocale}`);
        return translateWithOpenAI(text, targetLocale, tenant.openaiKey);
    }

    // 2. Fallback to System TranslateGemma (Internal/DeepMind engine)
    const gemmaSetting = await prisma.platformSetting.findUnique({
        where: { key: 'TRANSLATE_GEMMA_URL' }
    });
    const gemmaUrl = gemmaSetting?.value || process.env.TRANSLATE_GEMMA_URL;

    if (gemmaUrl) {
        console.log(`[Translate] Using Fallback TranslateGemma Engine for ${targetLocale}`);
        return translateWithGemma(text, targetLocale, gemmaUrl);
    }

    // 3. Last Resort: Platform Global OpenAI Key
    if (process.env.OPENAI_API_KEY) {
        console.log(`[Translate] Using Platform-Global OpenAI Key for ${targetLocale}`);
        return translateWithOpenAI(text, targetLocale, process.env.OPENAI_API_KEY);
    }

    console.warn(`[Translate] No translation engine available for Tenant ${tenantId}.`);
    return text; // Return original if no engine exists
}

async function translateWithOpenAI(text: string, locale: string, apiKey: string) {
    try {
        const openai = new OpenAI({ apiKey });
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { 
                    role: 'system', 
                    content: `You are a professional LMS content translator. Translate the following text to ${locale}. 
                    - Maintain formatting and tone. 
                    - Do not add quotes or explanation. 
                    - Return ONLY the translated string.` 
                },
                { role: 'user', content: text }
            ]
        });
        return response.choices[0]?.message?.content?.trim() || text;
    } catch (error: any) {
        console.error('[Translate] OpenAI error:', error.message);
        throw error;
    }
}

async function translateWithGemma(text: string, locale: string, url: string) {
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                text, 
                target_lang: locale,
                task: 'translation'
            })
        });

        if (!res.ok) throw new Error(`TranslateGemma API returned ${res.status}`);

        const data = await res.json();
        return data.translated_text || data.translation || text;
    } catch (error: any) {
        console.error('[Translate] TranslateGemma error:', error.message);
        return text; // Fallback to original or throw
    }
}
