import { prisma } from './prisma';
import { ECSClient, RunTaskCommand } from "@aws-sdk/client-ecs";

/**
 * Invokes the AWS Lambda Whisper service asynchronously (fire-and-forget).
 * The Lambda will call back our webhook at /api/transcript-callback when done.
 *
 * This replaces the direct OpenAI Whisper API call for production.
 * In development (no WHISPER_LAMBDA_URL set), it gracefully skips.
 */
export async function transcribeMedia(lessonId: string, mediaUrl: string) {
    // Get the Lambda URL from PlatformSettings (set by Super Admin) or env var
    const setting = await prisma.platformSetting.findUnique({
        where: { key: 'WHISPER_LAMBDA_URL' }
    });

    const lambdaUrl = setting?.value || process.env.WHISPER_LAMBDA_URL;

    // 1. Resolve Tenant and Check Credits
    const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
            module: {
                include: {
                    course: {
                        select: { tenantId: true }
                    }
                }
            }
        }
    });

    const tenantId = lesson?.module?.course?.tenantId;
    if (!tenantId) {
        console.error(`[AI] Could not find tenant for lesson ${lessonId}`);
        return;
    }

    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { aiCredits: true }
    });

    if (!tenant || (tenant.aiCredits || 0) <= 0) {
        console.warn(`[AI] Tenant ${tenantId} has no transcription credits remaining. Skipping AI transcription.`);
        await prisma.lesson.update({
            where: { id: lessonId },
            data: { transcriptStatus: 'FAILED' }
        });
        return;
    }

    if (!lambdaUrl) {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[AI] No WHISPER_LAMBDA_URL set. SIMULATING transcription locally for lesson ${lessonId}...`);
            await prisma.lesson.update({
                where: { id: lessonId },
                data: { transcriptStatus: 'PROCESSING' }
            });

            // Simulate the delay of a real transcription (15 seconds)
            setTimeout(async () => {
                try {
                    console.log(`[AI] Simulation complete for lesson ${lessonId}. Updating to READY.`);
                    await prisma.lesson.update({
                        where: { id: lessonId },
                        data: {
                            transcriptStatus: 'READY',
                            transcript: "This is a simulated transcript for local development. In production, your AWS Lambda will provide the real audio-to-text here.",
                            hasCaptions: true
                        }
                    });
                    // Add a mock subtitle resource
                    await prisma.resource.create({
                        data: {
                            name: 'Auto-Generated Subtitles (Mock)',
                            url: 'data:text/vtt;base64,V0VCVlRUCjEKMDA6MDA6MDAuMDAwIC0tPiAwMDowMDoxMC4wMDAKVGhpcyBpcyBhIHNpbXVsYXRlZCBjYXB0aW9uIGZvciBsb2NhbCB0ZXN0aW5nLg==',
                            type: 'SUBTITLE',
                            lessonId,
                        }
                    });
                } catch (e) {
                    console.error("[AI] Simulation error:", e);
                }
            }, 15000);
            return;
        }

        console.warn('[AI] No WHISPER_LAMBDA_URL set. Skipping transcription. Set it in Super Admin → Platform Settings or in .env');
        return;
    }

    // The callback URL ECS will POST results back to
    const appUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://lebra.ai';
    const callbackUrl = `${appUrl}/api/transcript-callback`;

    try {
        // 2. Deduct 1 Credit immediately
        await prisma.tenant.update({
            where: { id: tenantId },
            data: { aiCredits: { decrement: 1 } }
        });

        // Mark lesson as PROCESSING immediately
        await prisma.lesson.update({
            where: { id: lessonId },
            data: { transcriptStatus: 'PROCESSING' }
        });

        // 3. Trigger ECS Task On-Demand
        const clusterName = process.env.WHISPER_CLUSTER_NAME;
        const serviceName = process.env.WHISPER_SERVICE_NAME; // In SST, the service name is often used as the task definition

        if (!clusterName || !serviceName) {
            throw new Error("Missing WHISPER_CLUSTER_NAME or WHISPER_SERVICE_NAME in environment");
        }

        const ecs = new ECSClient({ region: "ap-southeast-1" });
        const command = new RunTaskCommand({
            cluster: clusterName,
            taskDefinition: serviceName, // SST maps the service name to the task def
            launchType: "FARGATE",
            networkConfiguration: {
                awsvpcConfiguration: {
                    subnets: [], // We will leave this empty as SST handles the VPC link typically, or we inject them
                    assignPublicIp: "ENABLED",
                }
            },
            overrides: {
                containerOverrides: [
                    {
                        name: "WhisperService", // Must match the name in Docker/SST
                        environment: [
                            { name: "LESSON_ID", value: lessonId },
                            { name: "VIDEO_URL", value: mediaUrl },
                            { name: "CALLBACK_URL", value: callbackUrl },
                        ]
                    }
                ]
            }
        });

        await ecs.send(command);
        console.log(`[AI] Fired ECS on-demand transcription for lesson ${lessonId}.`);

    } catch (error) {
        console.error(`[AI] Error starting transcription for lesson ${lessonId}:`, error);
        await prisma.lesson.update({
            where: { id: lessonId },
            data: { transcriptStatus: 'FAILED' }
        });
    }
}
