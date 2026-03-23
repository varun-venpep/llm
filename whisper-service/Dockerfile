# AWS Lambda Container Image for Whisper Transcription Service
# Base image: official AWS Lambda Python 3.11 image
FROM public.ecr.aws/lambda/python:3.11

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the Whisper model at IMAGE BUILD TIME
# This avoids cold-start model download delays on Lambda
# Switch to 'small' for better accuracy at the cost of ~500MB more image size
ARG WHISPER_MODEL_SIZE=base
ENV WHISPER_MODEL_SIZE=${WHISPER_MODEL_SIZE}

# Download the model during image build so it's baked in
RUN python -c "from faster_whisper import WhisperModel; WhisperModel('${WHISPER_MODEL_SIZE}', device='cpu', compute_type='int8')"

# Copy the application code
COPY main.py .

# Lambda entry point: handler in main.py
CMD ["main.handler"]
