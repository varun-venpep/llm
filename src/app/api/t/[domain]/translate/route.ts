import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { translateText } from '@/lib/translate';
import { checkSession } from '@/lib/auth';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string }> }
) {
    try {
        const { domain } = await params;
        const body = await req.json();
        const { entityId, entityType, field, text } = body;

        if (!entityId || !entityType || !field || !text) {
            return NextResponse.json({ error: 'Missing required translation fields' }, { status: 400 });
        }

        const tenant = await prisma.tenant.findUnique({
            where: { subdomain: domain },
            select: { id: true, availableLocales: true, defaultLocale: true }
        });

        if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

        const targetLocales = tenant.availableLocales.filter(l => l !== tenant.defaultLocale);
        const results = [];

        for (const locale of targetLocales) {
            try {
                // Automated Draft Generation
                const translated = await translateText(text, locale, tenant.id);
                
                const translation = await prisma.translation.upsert({
                    where: {
                        entityId_entityType_field_locale_tenantId: {
                            entityId,
                            entityType,
                            field,
                            locale,
                            tenantId: tenant.id
                        }
                    },
                    update: {
                        value: translated,
                        status: 'PENDING' // AI drafts always require approval
                    },
                    create: {
                        entityId,
                        entityType,
                        field,
                        locale,
                        value: translated,
                        status: 'PENDING',
                        tenantId: tenant.id
                    }
                });
                results.push(translation);
            } catch (err: any) {
                console.error(`[Translate API] Failed for locale ${locale}:`, err.message);
            }
        }

        return NextResponse.json({ success: true, translations: results });

    } catch (error: any) {
        console.error('Translation POST Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string }> }
) {
    try {
        const { domain } = await params;
        const body = await req.json();
        const { translationId, value, status } = body;

        if (!translationId) return NextResponse.json({ error: 'Translation ID required' }, { status: 400 });

        const session = await checkSession(req, domain);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const updated = await prisma.translation.update({
            where: { id: translationId },
            data: {
                ...(value && { value }),
                ...(status && { status }) // e.g., 'APPROVED'
            }
        });

        return NextResponse.json({ success: true, translation: updated });

    } catch (error) {
        return NextResponse.json({ error: 'Failed to update translation' }, { status: 500 });
    }
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string }> }
) {
    try {
        const { domain } = await params;
        const { searchParams } = new URL(req.url);
        const entityId = searchParams.get('entityId');

        if (!entityId) return NextResponse.json({ error: 'Entity ID required' }, { status: 400 });

        const translations = await prisma.translation.findMany({
            where: { entityId },
            orderBy: { locale: 'asc' }
        });

        return NextResponse.json(translations);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch translations' }, { status: 500 });
    }
}
