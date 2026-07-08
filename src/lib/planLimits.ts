import { prisma } from './prisma';

interface Plan {
    id: string;
    name: string;
    userLimit: number; // 0 means unlimited
    price: string;
}

const DEFAULT_PLANS: Plan[] = [
    {
        id: 'starter',
        name: 'Starter',
        userLimit: 500,
        price: '799',
    },
    {
        id: 'professional',
        name: 'Professional',
        userLimit: 5000,
        price: '1,499',
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        userLimit: 0,
        price: 'Custom',
    }
];

export async function getTenantLearnerLimit(tenantId: string): Promise<{ userLimit: number; planName: string }> {
    // 1. Get the tenant plan
    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { plan: true }
    });

    if (!tenant) {
        return { userLimit: 500, planName: 'Starter' }; // fallback default
    }

    // 2. Fetch platform subscription plans
    let plans = DEFAULT_PLANS;
    try {
        const setting = await prisma.platformSetting.findUnique({
            where: { key: 'subscription_plans' }
        });
        if (setting) {
            plans = JSON.parse(setting.value);
        }
    } catch (e) {
        console.error('Error fetching subscription plans settings:', e);
    }

    // 3. Find matching plan limit (case-insensitive)
    const matchingPlan = plans.find(p => p.id.toLowerCase() === tenant.plan.toLowerCase());
    if (matchingPlan) {
        return {
            userLimit: matchingPlan.userLimit,
            planName: matchingPlan.name
        };
    }

    // Fallbacks matching standard enums
    if (tenant.plan === 'PROFESSIONAL') {
        return { userLimit: 5000, planName: 'Professional' };
    } else if (tenant.plan === 'ENTERPRISE') {
        return { userLimit: 0, planName: 'Enterprise' };
    }

    return { userLimit: 500, planName: 'Starter' };
}

export async function checkLearnerLimit(tenantId: string, additionalCount: number = 1): Promise<{ allowed: boolean; currentCount: number; limit: number; planName: string }> {
    const { userLimit, planName } = await getTenantLearnerLimit(tenantId);
    
    // Count current active learners in this tenant
    const currentCount = await prisma.user.count({
        where: {
            tenantId,
            role: 'LEARNER'
        }
    });

    // If unlimited
    if (userLimit === 0) {
        return { allowed: true, currentCount, limit: 0, planName };
    }

    if (currentCount + additionalCount > userLimit) {
        return {
            allowed: false,
            currentCount,
            limit: userLimit,
            planName
        };
    }

    return {
        allowed: true,
        currentCount,
        limit: userLimit,
        planName
    };
}
