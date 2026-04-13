# Whisper Transcription Service — AWS Lambda Deployment Guide

## Overview
This service receives a video URL, transcribes the audio using `faster-whisper`, and POSTs the result back to the LMS webhook.

---

## Step 1: Prerequisites
```bash
# Install AWS CLI
brew install awscli
aws configure  # Enter your AWS credentials

# Install Docker (required to build the container image)
# https://docs.docker.com/desktop/mac/install/
```

---

## Step 2: Create ECR Repository
```bash
# Replace with your AWS account ID and region
AWS_ACCOUNT_ID=123456789012
AWS_REGION=ap-south-1
ECR_REPO=whisper-transcription-service

aws ecr create-repository \
  --repository-name $ECR_REPO \
  --region $AWS_REGION
```

---

## Step 3: Build & Push Docker Image
```bash
cd whisper-service

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build the image (bakes in the Whisper 'base' model)
docker build -t $ECR_REPO .

# Tag and push to ECR
docker tag $ECR_REPO:latest \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest

docker push \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest
```

---

## Step 4: Create Lambda Function
```bash
# Create an execution role for Lambda first (in IAM console or via CLI)
# Attach policy: AWSLambdaBasicExecutionRole

aws lambda create-function \
  --function-name whisper-transcription \
  --package-type Image \
  --code ImageUri=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest \
  --role arn:aws:iam::$AWS_ACCOUNT_ID:role/lambda-execution-role \
  --memory-size 4096 \
  --timeout 900 \
  --region $AWS_REGION
```

> ⚠️ Set **Memory** to at least 4096 MB and **Timeout** to 900 seconds (15 min) — the maximum Lambda allows.

---

## Step 5: Add API Gateway HTTP Trigger
1. Go to **AWS Console → Lambda → whisper-transcription**
2. Click **Add Trigger → API Gateway**
3. Select **HTTP API** (cheaper than REST API)
4. Set **Authorization** to None (our security is the secret URL)
5. Copy the generated **Invoke URL** — it will look like:
   `https://xxxxxx.execute-api.ap-south-1.amazonaws.com/transcribe`

---

## Step 6: Configure in LMS Super Admin
1. Go to `/admin/settings`  
2. Under **AI Integrations**, paste your Lambda URL into the **Whisper Lambda URL** field
3. Save

That's it! From now on, every VIDEO lesson upload automatically:
- Sets status → **⏳ Generating Transcript...**
- Fires Lambda in the background
- Lambda transcribes and calls back
- Status updates to → **✅ Transcript Ready**

---

## Cost Estimate
| Component | Cost |
|---|---|
| Lambda execution (4GB × 900s max) | ~$0.06 per video max |
| API Gateway | ~$0.001 per request |
| ECR Storage | ~$0.10/GB/month |
| **Real-world avg (5-min video)** | **~$0.01–0.02 per video** |
