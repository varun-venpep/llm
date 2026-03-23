# Standard Python runtime for Render Web Service
FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=10000

# Install system dependencies needed for faster-whisper and PyAV
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    pkg-config \
    gcc \
    python3-dev \
    libavformat-dev \
    libavcodec-dev \
    libavdevice-dev \
    libavfilter-dev \
    libswresample-dev \
    libswscale-dev \
    libavutil-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Pre-download the Whisper model at IMAGE BUILD TIME
ARG WHISPER_MODEL_SIZE=base
ENV WHISPER_MODEL_SIZE=${WHISPER_MODEL_SIZE}
RUN python -c "from faster_whisper import WhisperModel; WhisperModel('${WHISPER_MODEL_SIZE}', device='cpu', compute_type='int8')"

# Copy the application code
COPY main.py .

# Standard uvicorn entry point for Render Web Service
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
