"""
Whisper FastAPI Service for AWS Lambda
---------------------------------------
Receives a video/audio URL + lessonId, transcribes it with faster-whisper,
then POSTs the result back to the LMS webhook endpoint.

This runs as a Lambda container (async invocation via InvocationType='Event').
"""

import json
import os
import tempfile
import urllib.request
from fastapi import FastAPI, BackgroundTasks
from mangum import Mangum
from faster_whisper import WhisperModel
import httpx

app = FastAPI()

@app.get("/")
def health_check():
    """Health check for AWS ALB Target Group."""
    return {"status": "ok"}

# Load model once on cold start.
# 'base' is fast & fits Lambda memory. Use 'small' for better accuracy.
MODEL_SIZE = os.environ.get("WHISPER_MODEL_SIZE", "base")
model = WhisperModel(MODEL_SIZE, device="cpu", compute_type="int8")


def segments_to_vtt(segments) -> str:
    """Convert faster-whisper segments into a .vtt string."""
    lines = ["WEBVTT", ""]
    for i, segment in enumerate(segments):
        start = format_timestamp(segment.start)
        end = format_timestamp(segment.end)
        lines.append(f"{i + 1}")
        lines.append(f"{start} --> {end}")
        lines.append(segment.text.strip())
        lines.append("")
    return "\n".join(lines)


def format_timestamp(seconds: float) -> str:
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    return f"{hours:02}:{minutes:02}:{secs:02}.{millis:03}"


async def run_transcription(lesson_id: str, media_url: str, callback_url: str):
    """The heavy transcription workload that runs asynchronously in the background."""
    try:
        # 1. Download the media file to a temp location
        suffix = ".mp4" if ".mp4" in media_url.lower() else ".audio"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp_file:
            tmp_path = tmp_file.name
            urllib.request.urlretrieve(media_url, tmp_path)

        # 2. Transcribe with faster-whisper
        segments, info = model.transcribe(tmp_path, beam_size=5)
        segments = list(segments)  # consume generator

        # 3. Build transcript text + VTT
        plain_text = " ".join(s.text.strip() for s in segments)
        vtt_content = segments_to_vtt(segments)

        # 4. POST results back to the LMS webhook
        async with httpx.AsyncClient() as client:
            await client.post(callback_url, json={
                "lessonId": lesson_id,
                "transcript": plain_text,
                "vttContent": vtt_content,
                "languageDetected": info.language,
                "status": "READY"
            }, timeout=30.0)

        # Clean up temp file
        os.unlink(tmp_path)

    except Exception as e:
        # Notify LMS of failure
        try:
            async with httpx.AsyncClient() as client:
                await client.post(callback_url, json={
                    "lessonId": lesson_id,
                    "status": "FAILED",
                    "error": str(e)
                }, timeout=10.0)
        except Exception:
            pass


@app.post("/transcribe")
async def transcribe(payload: dict, bg_tasks: BackgroundTasks):
    """
    Main transcription endpoint.
    Expected payload: { lessonId, mediaUrl, callbackUrl }
    """
    lesson_id = payload.get("lessonId")
    media_url = payload.get("mediaUrl")
    callback_url = payload.get("callbackUrl")

    if not lesson_id or not media_url or not callback_url:
        return {"error": "Missing required fields: lessonId, mediaUrl, callbackUrl"}

    # Execute the heavy ML processing in the background
    bg_tasks.add_task(run_transcription, lesson_id, media_url, callback_url)

    # Return immediately to avoid Load Balancer HTTP Idle timeouts
    return {"status": "PROCESSING", "lessonId": lesson_id}


# Entry point for AWS Lambda via Mangum ASGI adapter
handler = Mangum(app, lifespan="off")

if __name__ == "__main__":
    # Allow running as a standalone script (ECS Task Mode)
    import asyncio
    
    video_url = os.environ.get("VIDEO_URL")
    lesson_id = os.environ.get("LESSON_ID")
    callback_url = os.environ.get("CALLBACK_URL")

    if video_url and lesson_id and callback_url:
        print(f"Starting standalone transcription for Lesson: {lesson_id}")
        asyncio.run(transcribe({
            "lessonId": lesson_id,
            "mediaUrl": video_url,
            "callbackUrl": callback_url
        }))
    else:
        # Standard uvicorn start if no job env vars found
        import uvicorn
        port = int(os.environ.get("PORT", 10000))
        uvicorn.run(app, host="0.0.0.0", port=port)
