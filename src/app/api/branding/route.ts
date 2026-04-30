import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const settings = await prisma.platformSetting.findMany({
            where: {
                key: {
                    in: [
                        'PLATFORM_NAME',
                        'PLATFORM_LOGO_PRIMARY',
                        'PLATFORM_LOGO_LIGHT',
                        'PLATFORM_LOGO_DARK',
                        'PLATFORM_FAVICON',
                        'PLATFORM_PRIMARY_COLOR'
                    ]
                }
            }
        });

        const branding = {
            name: settings.find(s => s.key === 'PLATFORM_NAME')?.value || 'Libra.AI',
            logoPrimary: settings.find(s => s.key === 'PLATFORM_LOGO_PRIMARY')?.value || '/libra_ai_logo_exact.png',
            logoLight: settings.find(s => s.key === 'PLATFORM_LOGO_LIGHT')?.value || '/libra_ai_logo_exact.png',
            logoDark: settings.find(s => s.key === 'PLATFORM_LOGO_DARK')?.value || '/libra_ai_logo_exact.png',
            favicon: settings.find(s => s.key === 'PLATFORM_FAVICON')?.value || '/favicon.ico',
            primaryColor: settings.find(s => s.key === 'PLATFORM_PRIMARY_COLOR')?.value || '#3b82f6', // Default blue-500
        };

        return NextResponse.json(branding);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch branding' }, { status: 500 });
    }
}
