import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const DEFAULT_PLANS = [
    {
        id: 'starter',
        name: 'Starter',
        description: 'Perfect for small teams getting started with a branded academy.',
        currency: 'SGD',
        price: '799',
        note: 'per workspace / month',
        features: ['Up to 500 learners', 'Course builder', 'Basic analytics', 'Standard certificates', 'Email support'],
        userLimit: 500,
        courseCreateLimit: 5,
        aiQuizGeneration: false,
        featured: false
    },
    {
        id: 'professional',
        name: 'Professional',
        description: 'For growing learning teams that need AI, branding, and team controls.',
        currency: 'SGD',
        price: '1,499',
        note: 'per workspace / month',
        features: ['Up to 5,000 learners', 'AI quiz generation', 'Custom branding and domain', 'Teams and roles', 'Priority support'],
        userLimit: 5000,
        courseCreateLimit: 50,
        aiQuizGeneration: true,
        featured: true
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        description: 'For large organizations, franchises, and multi-tenant learning businesses.',
        currency: 'SGD',
        price: 'Custom',
        note: 'tailored agreement',
        features: ['Unlimited tenant strategy', 'Custom onboarding', 'Advanced governance', 'Dedicated success support', 'Custom integrations'],
        userLimit: 0, // 0 = Unlimited
        courseCreateLimit: 0, // 0 = Unlimited
        aiQuizGeneration: true,
        featured: false
    }
];

export async function GET() {
    try {
        const setting = await prisma.platformSetting.findUnique({
            where: { key: 'subscription_plans' }
        });

        if (!setting) {
            return NextResponse.json(DEFAULT_PLANS);
        }

        try {
            const plans = JSON.parse(setting.value);
            return NextResponse.json(plans);
        } catch {
            return NextResponse.json(DEFAULT_PLANS);
        }
    } catch (error) {
        console.error('Failed to get pricing plans:', error);
        return NextResponse.json({ error: 'Failed to retrieve plans' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const plans = await req.json();
        
        if (!Array.isArray(plans)) {
            return NextResponse.json({ error: 'Invalid data format. Expected an array of plans.' }, { status: 400 });
        }

        const setting = await prisma.platformSetting.upsert({
            where: { key: 'subscription_plans' },
            update: { value: JSON.stringify(plans) },
            create: { key: 'subscription_plans', value: JSON.stringify(plans) }
        });

        return NextResponse.json(plans);
    } catch (error) {
        console.error('Failed to update pricing plans:', error);
        return NextResponse.json({ error: 'Failed to update plans' }, { status: 500 });
    }
}
