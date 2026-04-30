import { prisma } from './prisma';

export async function getGlobalBranding() {
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

        return {
            name: settings.find(s => s.key === 'PLATFORM_NAME')?.value || 'Libra.AI',
            logoPrimary: settings.find(s => s.key === 'PLATFORM_LOGO_PRIMARY')?.value || '/libra_ai_logo_exact.png',
            logoLight: settings.find(s => s.key === 'PLATFORM_LOGO_LIGHT')?.value || '/libra_ai_logo_exact.png',
            logoDark: settings.find(s => s.key === 'PLATFORM_LOGO_DARK')?.value || '/libra_ai_logo_exact.png',
            favicon: settings.find(s => s.key === 'PLATFORM_FAVICON')?.value || '/favicon.ico',
            primaryColor: settings.find(s => s.key === 'PLATFORM_PRIMARY_COLOR')?.value || '#3b82f6',
        };
    } catch (error) {
        return {
            name: 'Libra.AI',
            logoPrimary: '/libra_ai_logo_exact.png',
            logoLight: '/libra_ai_logo_exact.png',
            logoDark: '/libra_ai_logo_exact.png',
            favicon: '/favicon.ico',
            primaryColor: '#3b82f6',
        };
    }
}
