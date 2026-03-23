import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/transcript-callback
 *
 * Webhook endpoint called by the AWS Lambda Whisper service
 * when transcription is complete (or fails).
 *
 * Payload: { lessonId, transcript?, vttContent?, languageDetected?, status }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { lessonId, transcript, vttContent, status, error } = body;

        if (!lessonId || !status) {
            return NextResponse.json({ error: 'Missing lessonId or status' }, { status: 400 });
        }

        if (status === 'READY' && transcript) {
            // Save the plain text transcript and update status
            await prisma.lesson.update({
                where: { id: lessonId },
                data: {
                    transcript,
                    hasCaptions: !!vttContent,
                    transcriptStatus: 'READY',
                }
            });

            // If we got a VTT file, save it as a SUBTITLE resource
            if (vttContent) {
                // Remove any existing auto-generated subtitle resource first
                await prisma.resource.deleteMany({
                    where: { lessonId, type: 'SUBTITLE', name: 'Auto-Generated Subtitles' }
                });

                // Save new VTT as base64 data URL so the video player can use it inline
                const vttDataUrl = `data:text/vtt;base64,${Buffer.from(vttContent).toString('base64')}`;
                await prisma.resource.create({
                    data: {
                        name: 'Auto-Generated Subtitles',
                        url: vttDataUrl,
                        type: 'SUBTITLE',
                        lessonId,
                    }
                });
            }
        } else if (status === 'FAILED') {
            // Mark the lesson transcript as failed
            await prisma.lesson.update({
                where: { id: lessonId },
                data: { transcriptStatus: 'FAILED' }
            });
            console.error(`[Transcript Callback] Transcription FAILED for lesson ${lessonId}: ${error}`);
        }

        return NextResponse.json({ ok: true });
    } catch (err: any) {
        console.error('[Transcript Callback] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
