import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');
        const tenantIdParam = searchParams.get('tenantId');

        // Build Date Filters
        const dateFilter: any = {};
        if (startDateParam) dateFilter.gte = new Date(startDateParam);
        if (endDateParam) dateFilter.lte = new Date(endDateParam);
        const hasDateFilter = Object.keys(dateFilter).length > 0;

        // Build Tenant Filter
        const tenantFilter = tenantIdParam ? { id: tenantIdParam } : {};
        const tenantRelFilter = tenantIdParam ? { tenantId: tenantIdParam } : {};

        // 1. High-Level KPIs
        const totalTenantsFilter = hasDateFilter ? { createdAt: dateFilter, ...tenantFilter } : tenantFilter;
        const totalUsersFilter = hasDateFilter ? { createdAt: dateFilter, ...tenantRelFilter } : tenantRelFilter;
        
        const [totalTenants, activeTenants, totalUsers, totalRevenueAgg, storageAgg, aiCreditsAgg, totalCourses] = await Promise.all([
            prisma.tenant.count({ where: totalTenantsFilter }),
            prisma.tenant.count({ where: { ...totalTenantsFilter, isActive: true } }),
            prisma.user.count({ where: totalUsersFilter }),
            prisma.tenant.aggregate({
                where: tenantFilter,
                _sum: { customRevenue: true }
            }),
            prisma.resource.aggregate({
                where: hasDateFilter ? { createdAt: dateFilter, course: { tenantId: tenantIdParam || undefined } } : { course: { tenantId: tenantIdParam || undefined } },
                _sum: { size: true }
            }),
            prisma.tenant.aggregate({
                where: tenantFilter,
                _sum: { aiCredits: true }
            }),
            prisma.course.count({ where: hasDateFilter ? { createdAt: dateFilter, ...tenantRelFilter } : tenantRelFilter })
        ]);

        const totalRevenue = totalRevenueAgg._sum.customRevenue || 0;

        const totalStorageBytes = storageAgg._sum.size || 0;
        const totalStorageMB = Math.round(totalStorageBytes / (1024 * 1024));
        const totalAiCreditsAllocated = aiCreditsAgg._sum.aiCredits || 0;

        // 2. Transcriptions Used
        const transcriptionsUsed = await prisma.lesson.count({
            where: {
                hasCaptions: true,
                module: { course: { tenantId: tenantIdParam || undefined } },
                ...(hasDateFilter ? { updatedAt: dateFilter } : {})
            }
        });

        // 3. Demographics (Users by Role)
        const usersByRoleRaw = await prisma.user.groupBy({
            by: ['role'],
            where: totalUsersFilter,
            _count: { id: true }
        });
        const usersByRole = usersByRoleRaw.map((r: any) => ({
            name: r.role,
            value: r._count.id
        }));

        // 4. Time Series Trend: Users joined (last 6 months or based on range - simplified to group by month for all time if no dates, or just raw data points)
        // Prisma doesn't do native date grouping well across DBs without raw SQL, so we fetch and group in memory for safe cross-db compatibility (assuming <10k users for V1).
        const usersForTrend = await prisma.user.findMany({
            where: totalUsersFilter,
            select: { createdAt: true },
            orderBy: { createdAt: 'asc' }
        });
        
        const monthlyJoins: Record<string, number> = {};
        usersForTrend.forEach((u: any) => {
            const m = u.createdAt.toLocaleString('default', { month: 'short', year: '2-digit' });
            monthlyJoins[m] = (monthlyJoins[m] || 0) + 1;
        });
        
        const userRegistrationTrend = Object.entries(monthlyJoins).map(([date, count]) => ({
            date,
            users: count
        }));

        // 5. Tenant Leaderboards (Only run if no specific tenant is selected)
        let topTenantsByRevenue: any[] = [];
        let topTenantsByUsers: any[] = [];
        
        if (!tenantIdParam) {
            const tenantsRaw = await prisma.tenant.findMany({
                where: totalTenantsFilter,
                select: {
                    id: true,
                    name: true,
                    customRevenue: true,
                    customRevenueCurrency: true,
                    _count: { select: { users: true } }
                },
                orderBy: { customRevenue: 'desc' },
                take: 5
            });
            
            topTenantsByRevenue = tenantsRaw.map((t: any) => ({ 
                name: t.name, 
                revenue: t.customRevenue,
                currency: t.customRevenueCurrency
            }));
            
            const tenantsUsersRaw = await prisma.tenant.findMany({
                where: totalTenantsFilter,
                select: { name: true, _count: { select: { users: true } } },
                orderBy: { users: { _count: 'desc' } },
                take: 5
            });
            
            topTenantsByUsers = tenantsUsersRaw.map((t: any) => ({ name: t.name, users: t._count.users }));
        }

        return NextResponse.json({
            kpis: {
                totalTenants,
                activeTenants,
                totalUsers,
                totalRevenue,
                totalStorageMB,
                totalAiCreditsAllocated,
                transcriptionsUsed,
                totalCourses
            },
            charts: {
                usersByRole,
                userRegistrationTrend
            },
            leaderboards: {
                topTenantsByRevenue,
                topTenantsByUsers
            }
        });

    } catch (error) {
        console.error('Reports Error:', error);
        return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
    }
}
