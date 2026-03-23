import { prisma } from './prisma';

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

    // The callback URL Lambda will POST results back to
    const appUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const callbackUrl = `${appUrl}/api/transcript-callback`;

    try {
        // Mark lesson as PROCESSING immediately
        await prisma.lesson.update({
            where: { id: lessonId },
            data: { transcriptStatus: 'PROCESSING' }
        });

        // Fire Lambda asynchronously — do NOT await the transcription result.
        // Lambda will call our callbackUrl when done.
        // We use AbortSignal with a 5s timeout just for the HTTP handshake.
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        fetch(lambdaUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lessonId, mediaUrl, callbackUrl }),
            signal: controller.signal,
        })
            .catch(err => {
                clearTimeout(timeout);
                // If Lambda returns 202 (async invocation), the fetch may "fail" due to no body — that's OK.
                if (!err?.name?.includes('AbortError')) {
                    console.error(`[AI] Failed to invoke Lambda for lesson ${lessonId}:`, err);
                    prisma.lesson.update({ where: { id: lessonId }, data: { transcriptStatus: 'FAILED' } }).catch(() => { });
                }
            })
            .finally(() => clearTimeout(timeout));

        console.log(`[AI] Fired Lambda transcription job for lesson ${lessonId}. Callback: ${callbackUrl}`);

    } catch (error) {
        console.error(`[AI] Error starting transcription for lesson ${lessonId}:`, error);
        await prisma.lesson.update({
            where: { id: lessonId },
            data: { transcriptStatus: 'FAILED' }
        });
    }
}
