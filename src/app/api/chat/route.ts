import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const sessionId = req.cookies.get('session-token')?.value;

        if (!sessionId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: sessionId },
            select: { id: true, role: true, tenantId: true }
        });

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { message, lessonId } = body;

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        const { id: userId, role, tenantId } = user;

        // 1. Get the Proprietary Endpoint URL
        const setting = await prisma.platformSetting.findUnique({
            where: { key: 'CHATBOT_API_URL' }
        });

        const lambdaUrl = setting?.value || process.env.CHATBOT_API_URL;

        if (!lambdaUrl) {
            // Provide a friendly fallback if they haven't configured their self-hosted LLM yet
            return NextResponse.json({
                reply: "Hello! I am ready to be your AI assistant. My cognitive engine is currently offline. Please ask the Super Admin to configure the `CHATBOT_API_URL` in Platform Settings to connect me to our proprietary LLM cluster."
            });
        }

        // 2. Build Role-Specific Context
        let systemContext = "";

        if (role === 'SUPER_ADMIN') {
            const [tenants, users, revenueRaw] = await Promise.all([
                prisma.tenant.count({ where: { isActive: true } }),
                prisma.user.count(),
                prisma.tenant.aggregate({ _sum: { customRevenue: true } })
            ]);

            systemContext = `You are the Super Admin Assistant for Lebra.Ai.
Current Platform Metrics:
- Active Tenants: ${tenants}
- Global Users: ${users}
- Offline MRR Value: $${revenueRaw._sum.customRevenue || 0}
Answer questions concisely to help the Super Admin analyze business outcomes.`;
        }

        else if (role === 'TENANT_ADMIN') {
            if (!tenantId) throw new Error("Missing tenant ID");

            const [users, courses, enrollments] = await Promise.all([
                prisma.user.count({ where: { tenantId } }),
                prisma.course.count({ where: { tenantId } }),
                prisma.enrollment.count({ where: { course: { tenantId } } })
            ]);

            systemContext = `You are a Tenant Admin Assistant. 
Your Workspace Metrics:
- Total Learners/Users: ${users}
- Active Courses: ${courses}
- Total Enrollments: ${enrollments}
Help the admin analyze learner progress and course metrics within their isolated workspace.`;
        }

        else if (role === 'LEARNER') {
            if (!tenantId) throw new Error("Missing tenant ID");

            systemContext = `You are a friendly Study Assistant. Your goal is to help the learner learn the material effectively. Do not give away quiz answers, but guide them to the right concepts.`;

            // If the learner is asking a question inside a specific lesson player, inject the Whisper transcript!
            if (lessonId) {
                const lesson = await prisma.lesson.findUnique({
                    where: { id: lessonId }
                });

                if (lesson?.transcript) {
                    systemContext += `\n\nYou are currently helping the learner with the lesson titled "${lesson.title}".\nHere is the exact video transcript:\n"${lesson.transcript}"\n\nOnly answer questions based on this transcript material.`;
                } else if (lesson?.content) {
                    systemContext += `\n\nYou are currently helping the learner with the lesson titled "${lesson.title}".\nHere is the lesson text:\n"${lesson.content}"`;
                }
            }
        }

        // 3. Send Context Payload to Proprietary Endpoint
        try {
            const response = await fetch(lambdaUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: message,
                    system_context: systemContext,
                    role: role,
                    tenantId: tenantId,
                    userId: userId
                })
            });

            if (!response.ok) {
                console.error(`Status: ${response.status}`, await response.text());
                throw new Error("Target LLM API failed to respond properly.");
            }

            const data = await response.json();

            // Assume the proprietary endpoint returns `{ "reply": "The response string" }`
            return NextResponse.json({ reply: data.reply || data.response || data.message || "My engine successfully processed your prompt, but returned an empty format." });

        } catch (fetchError) {
            console.error("Chatbot Error:", fetchError);
            return NextResponse.json({
                reply: `Error communicating with the proprietary LLM backend. Ensure ${lambdaUrl} is reachable and returning a JSON payload with a 'reply' property.`
            });
        }

    } catch (error: any) {
        console.error('Chat API Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to process chat' }, { status: 500 });
    }
}
